<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchAlgorithm } from '../lib/api'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

const payload = ref(null)
const { locale, t } = useI18n()

const zhPrinciples = {
  'TruthShield does not remove news articles.': 'TruthShield 不刪除新聞文章。',
  'Votes are weighted by user trust score, identity multiplier, and abuse multiplier.': '投票不是只看人數，會依信用分、身份狀態與濫用風險加權。',
  'Evidence usefulness can affect future trust score.': '新聞定案結算時，證據是否被評為有幫助，會納入信用分調整。',
  'The initial vote consensus is snapshotted after the voting window closes; later evidence ratings can still update the evidence verdict.': '投票窗口結束後會保存當時的投票共識；後續證據評分仍可更新證據面向的判讀。',
}

const zhRules = {
  voting_window: {
    title: '72 小時初步共識',
    description: '一篇新聞首次被收錄後，約 72 小時內開放加權投票。時間到後，當時的投票共識會保存成快照；之後仍可補證據、評證據有沒有幫助，頁面不是被永久封死。',
  },
  vote_weight: {
    title: '投票會加權，不是單純比票數',
    description: '每一票會乘上使用者信用分、身份狀態與濫用風險。新帳號或高風險帳號仍可參與，但影響力會比較小。',
  },
  evidence_quality: {
    title: '證據比口號重要',
    description: '強證據型負面標籤必須附公開來源；其他標籤可依情況補說明。使用者可以評證據是否有幫助、是否相關，這會影響證據判讀，並在定案結算時回饋到貢獻者信用。',
  },
  anti_abuse: {
    title: '可疑操作先降低影響力',
    description: '短時間同向投票、重複貼同一份證據、未閱讀就大量操作等行為，會降低權重或進入審核。TruthShield 優先降低操縱效果，不是直接刪除意見。',
  },
  article_snapshots: {
    title: '只保存必要紀錄，不複製全文',
    description: '系統保存網址、標題、中繼資料、可用性與變更紀錄，方便追蹤新聞是否被修改或下架；不把媒體全文搬到 TruthShield。',
  },
}

const configLabels = {
  evidence_reaction_min_trust_score: {
    zh: ['證據評分門檻', '有效票重達到這個值，才能替別人的證據評「有幫助／沒幫助」。這是避免新帳號大量左右證據品質。'],
    en: ['Evidence rating threshold', 'Trust score required before a user can rate whether evidence is helpful.'],
  },
  event_system_min_trust_score: {
    zh: ['事件系統門檻', '信用分達到這個值，才能新增或編輯事件時間線與關係圖，降低亂建事件或亂改脈絡。'],
    en: ['Event system threshold', 'Trust score required to create or edit event timelines and relationship graphs.'],
  },
  low_trust_vote_cap: {
    zh: ['低信用投票上限', '新帳號或低信用帳號仍可投票，但單票影響力會被限制，直到累積可信貢獻。'],
    en: ['Low-trust vote cap', 'New or low-trust accounts can vote, but their influence is capped until they earn trust.'],
  },
  algorithm_version: {
    zh: ['演算法版本', '新聞快照會記錄當時使用的版本，方便之後追溯規則是否改過。'],
    en: ['Algorithm version', 'Finalized snapshots keep the version used at the time for later audit.'],
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

const configItems = computed(() => Object.entries(payload.value?.config || {}).map(([key, value]) => {
  const labels = configLabels[key]?.[locale.value === 'zh-TW' ? 'zh' : 'en']

  return {
    key,
    value,
    title: labels?.[0] || key,
    description: labels?.[1] || '',
  }
}))

onMounted(async () => {
  payload.value = await fetchAlgorithm()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-4xl">
      <AppNav />
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
          <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('algorithmTransparency.configIntro') }}</p>
          <div class="mt-4 grid gap-3 md:grid-cols-2">
            <article v-for="item in configItems" :key="item.key" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h3 class="text-sm font-semibold text-white">{{ item.title }}</h3>
                <span class="rounded bg-white/10 px-2 py-1 text-xs font-semibold text-cyan-100">{{ item.value }}</span>
              </div>
              <p class="mt-2 text-xs leading-5 text-zinc-400">{{ item.description }}</p>
              <p class="mt-2 break-all text-[11px] text-zinc-600">{{ item.key }}</p>
            </article>
          </div>
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
