<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchAlgorithm } from '../lib/api'
import { useI18n } from '../i18n'

const payload = ref(null)
const { locale, t } = useI18n()

const zhPrinciples = {
  'TruthShield does not remove news articles.': 'TruthShield 不刪除新聞文章。',
  'Votes are weighted by user trust score, identity multiplier, and abuse multiplier.': '投票會依使用者信用分、身份倍率與濫用風險倍率加權。',
  'Evidence usefulness can affect future trust score.': '證據有用度會影響未來信用分。',
  'Results are finalized after the voting window closes.': '投票窗口截止後，結果會定案並保存快照。',
}

const zhRules = {
  voting_window: {
    title: '72 小時定案窗口',
    description: 'URL 首次收錄後 72 小時內開放加權投票與證據評分。截止後，結果會凍結成快照。',
  },
  vote_weight: {
    title: '加權投票',
    description: '票重由使用者信用分、身份倍率與濫用風險倍率計算。低信用或受限制帳號可被封頂。',
  },
  evidence_quality: {
    title: '證據有用度',
    description: '有用與沒幫助的證據評分會被加權。證據品質可影響後續信用結算。',
  },
  anti_abuse: {
    title: '反操縱防線',
    description: '協同投票、重複證據 URL、低閱讀秒數與新帳號爆量行為，都可能降低後續濫用風險倍率。',
  },
  article_snapshots: {
    title: '不保存全文的新聞快照',
    description: 'TruthShield 保存中繼資料、可用性與變更紀錄，讓被刪除或修改的新聞可稽核，同時不鏡像受版權保護全文。',
  },
}

const principles = computed(() => (payload.value?.principles || []).map((item) => (
  locale.value === 'zh-TW' ? zhPrinciples[item] || item : item
)))

const rules = computed(() => (payload.value?.rules || []).map((rule) => {
  const localized = locale.value === 'zh-TW' ? zhRules[rule.key] : null
  return {
    ...rule,
    title: localized?.title || rule.title,
    description: localized?.description || rule.description,
  }
}))

const antiManipulationPoints = computed(() => [
  { title: t('algorithmDefense.weightedVotesTitle'), description: t('algorithmDefense.weightedVotesDesc') },
  { title: t('algorithmDefense.readingGateTitle'), description: t('algorithmDefense.readingGateDesc') },
  { title: t('algorithmDefense.oneEvidenceTitle'), description: t('algorithmDefense.oneEvidenceDesc') },
  { title: t('algorithmDefense.coordinatedSignalsTitle'), description: t('algorithmDefense.coordinatedSignalsDesc') },
  { title: t('algorithmDefense.freezeWindowTitle'), description: t('algorithmDefense.freezeWindowDesc') },
  { title: t('algorithmDefense.transparentReviewTitle'), description: t('algorithmDefense.transparentReviewDesc') },
])

const publicAntiAbuseRules = computed(() => [
  { title: t('algorithmTransparency.public.weightedVotesTitle'), description: t('algorithmTransparency.public.weightedVotesDesc') },
  { title: t('algorithmTransparency.public.readingGateTitle'), description: t('algorithmTransparency.public.readingGateDesc') },
  { title: t('algorithmTransparency.public.evidenceRequiredTitle'), description: t('algorithmTransparency.public.evidenceRequiredDesc') },
  { title: t('algorithmTransparency.public.oneEntryTitle'), description: t('algorithmTransparency.public.oneEntryDesc') },
  { title: t('algorithmTransparency.public.lowTrustLimitsTitle'), description: t('algorithmTransparency.public.lowTrustLimitsDesc') },
  { title: t('algorithmTransparency.public.reviewFirstTitle'), description: t('algorithmTransparency.public.reviewFirstDesc') },
])

const protectedAntiAbuseDetails = computed(() => [
  t('algorithmTransparency.protected.botRiskWeights'),
  t('algorithmTransparency.protected.challengeThresholds'),
  t('algorithmTransparency.protected.uaPatterns'),
  t('algorithmTransparency.protected.nonceDetails'),
  t('algorithmTransparency.protected.burstThresholds'),
])

const userProtections = computed(() => [
  t('algorithmTransparency.protections.reviewBeforePenalty'),
  t('algorithmTransparency.protections.canStillParticipate'),
  t('algorithmTransparency.protections.governanceRecords'),
  t('algorithmTransparency.protections.appeals'),
])

onMounted(async () => {
  payload.value = await fetchAlgorithm()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-4xl">
      <nav class="mb-8 border-b border-white/10 pb-5">
        <BrandLink />
      </nav>
      <h1 class="text-3xl font-semibold text-white">{{ t('remaining.algorithmTitle') }}</h1>
      <p class="mt-3 text-sm leading-6 text-zinc-400">{{ t('remaining.algorithmIntro') }}</p>
      <div v-if="payload" class="mt-6 grid gap-4">
        <section class="grid gap-3 md:grid-cols-3">
          <div class="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-4">
            <p class="text-xs font-semibold text-cyan-200">{{ t('remaining.currentVersion') }}</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ payload.version }}</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs font-semibold text-zinc-500">{{ t('remaining.votingWindow') }}</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ payload.summary?.voting_window_hours || 72 }}h</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs font-semibold text-zinc-500">{{ t('remaining.evidenceReactionMin') }}</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ payload.config.evidence_reaction_min_trust_score }}</p>
          </div>
        </section>

        <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="font-semibold text-white">{{ t('remaining.principles') }}</h2>
          <ul class="mt-3 space-y-2 text-sm text-zinc-300">
            <li v-for="item in principles" :key="item">{{ item }}</li>
          </ul>
        </div>

        <section class="grid gap-3 md:grid-cols-2">
          <article v-for="rule in rules" :key="rule.key" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs font-semibold text-cyan-300">{{ rule.key }}</p>
            <h2 class="mt-2 text-lg font-semibold text-white">{{ rule.title }}</h2>
            <p class="mt-2 text-sm leading-6 text-zinc-400">{{ rule.description }}</p>
          </article>
        </section>

        <section class="rounded-lg border border-red-300/20 bg-red-500/[0.05] p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-red-200">{{ t('algorithmDefense.eyebrow') }}</p>
          <h2 class="mt-2 text-xl font-semibold text-white">{{ t('algorithmDefense.title') }}</h2>
          <p class="mt-2 text-sm leading-6 text-zinc-300">{{ t('algorithmDefense.intro') }}</p>
          <div class="mt-4 grid gap-3 md:grid-cols-2">
            <article v-for="point in antiManipulationPoints" :key="point.title" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <h3 class="text-sm font-semibold text-white">{{ point.title }}</h3>
              <p class="mt-2 text-xs leading-5 text-zinc-400">{{ point.description }}</p>
            </article>
          </div>
        </section>

        <section class="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-4">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{{ t('algorithmTransparency.eyebrow') }}</p>
          <h2 class="mt-2 text-xl font-semibold text-white">{{ t('algorithmTransparency.title') }}</h2>
          <p class="mt-2 text-sm leading-6 text-zinc-300">{{ t('algorithmTransparency.intro') }}</p>

          <div class="mt-4 grid gap-3 lg:grid-cols-3">
            <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <h3 class="text-sm font-semibold text-white">{{ t('algorithmTransparency.publicTitle') }}</h3>
              <div class="mt-3 space-y-3">
                <article v-for="rule in publicAntiAbuseRules" :key="rule.title">
                  <p class="text-xs font-semibold text-cyan-100">{{ rule.title }}</p>
                  <p class="mt-1 text-xs leading-5 text-zinc-400">{{ rule.description }}</p>
                </article>
              </div>
            </div>

            <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <h3 class="text-sm font-semibold text-white">{{ t('algorithmTransparency.protectedTitle') }}</h3>
              <p class="mt-2 text-xs leading-5 text-zinc-500">{{ t('algorithmTransparency.protectedIntro') }}</p>
              <ul class="mt-3 space-y-2 text-xs leading-5 text-zinc-400">
                <li v-for="item in protectedAntiAbuseDetails" :key="item">{{ item }}</li>
              </ul>
            </div>

            <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <h3 class="text-sm font-semibold text-white">{{ t('algorithmTransparency.protectionsTitle') }}</h3>
              <ul class="mt-3 space-y-2 text-xs leading-5 text-zinc-400">
                <li v-for="item in userProtections" :key="item">{{ item }}</li>
              </ul>
            </div>
          </div>
        </section>

        <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="font-semibold text-white">{{ t('remaining.currentConfig') }}</h2>
          <pre class="mt-3 overflow-auto text-xs text-zinc-300">{{ JSON.stringify(payload.config, null, 2) }}</pre>
        </div>

        <section class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="font-semibold text-white">{{ t('remaining.algorithmHistory') }}</h2>
          <div class="mt-3 space-y-2">
            <article v-for="item in payload.history || []" :key="item.id" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-semibold text-white">{{ item.version }}</span>
                <span class="rounded bg-white/10 px-2 py-1 text-xs text-zinc-400">{{ item.status }}</span>
              </div>
              <p class="mt-2 text-sm text-zinc-400">{{ item.summary }}</p>
            </article>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>
