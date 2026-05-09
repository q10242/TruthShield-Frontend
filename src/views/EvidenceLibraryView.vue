<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchEvidenceLibrary } from '../lib/api'
import { useI18n } from '../i18n'

const items = ref([])
const meta = ref(null)
const loading = ref(true)
const q = ref('')
const tag = ref('')
const trusted = ref('')
const sort = ref('helpful')
const focus = ref('')
const { t } = useI18n()

async function load() {
  loading.value = true
  try {
    const payload = await fetchEvidenceLibrary({
      q: q.value,
      tag: tag.value,
      trusted: trusted.value,
      sort: sort.value,
      focus: focus.value,
    })
    items.value = payload.data || []
    meta.value = payload.meta || null
  } finally {
    loading.value = false
  }
}

function evidenceSourceLabel(item) {
  if (item.evidence_type === 'cloud_drive') return t('evidence.cloudDrive')
  if (item.evidence_type === 'image') return t('evidence.image')
  if (item.evidence_type === 'link') return t('evidence.link')

  return t('evidence.external')
}

function previewUrl(item) {
  if (item.type === 'official_response') return ''
  if (item.preview_url) return item.preview_url
  if (item.evidence_type !== 'image') return ''

  return item.evidence_url
}

function isOfficialResponse(item) {
  return item.type === 'official_response'
}

onMounted(load)
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <RouterLink class="text-sm text-zinc-400" to="/ranking">{{ t('common.ranking') }}</RouterLink>
      </nav>

      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-semibold text-white">{{ t('evidence.title') }}</h1>
          <p class="mt-2 text-sm text-zinc-400">{{ t('evidence.intro') }}</p>
        </div>
        <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/news-search">
          {{ t('evidence.submitTest') }}
        </RouterLink>
      </div>

      <form class="mt-6 grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[1fr_150px_150px_150px_170px_auto]" @submit.prevent="load">
        <input v-model="q" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" :placeholder="t('evidence.searchPlaceholder')" />
        <select v-model="tag" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300">
          <option value="">{{ t('evidence.allTags') }}</option>
          <option value="clickbait-title">{{ t('evidence.tags.clickbaitTitle') }}</option>
          <option value="missing-context">{{ t('evidence.tags.missingContext') }}</option>
          <option value="out-of-context">{{ t('evidence.tags.outOfContext') }}</option>
          <option value="accurate-reporting">{{ t('evidence.tags.accurateReporting') }}</option>
        </select>
        <select v-model="trusted" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300">
          <option value="">{{ t('evidence.allSources') }}</option>
          <option value="1">{{ t('evidence.trustedSource') }}</option>
          <option value="0">{{ t('evidence.unverifiedSource') }}</option>
        </select>
        <select v-model="sort" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300">
          <option value="helpful">{{ t('evidence.sortHelpful') }}</option>
          <option value="quality">{{ t('evidence.sortQuality') }}</option>
          <option value="controversial">{{ t('evidence.sortControversial') }}</option>
          <option value="latest">{{ t('evidence.sortLatest') }}</option>
        </select>
        <select v-model="focus" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300">
          <option value="">{{ t('evidence.allEvidence') }}</option>
          <option value="community">{{ t('evidence.communityNeeds') }}</option>
          <option value="official">{{ t('evidence.officialClarifications') }}</option>
        </select>
        <button type="submit" class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950">{{ t('evidence.filter') }}</button>
      </form>

      <p v-if="meta" class="mt-3 text-xs text-zinc-500">{{ t('evidence.resultMeta', { total: meta.total, limit: meta.limit }) }}</p>
      <div class="mt-4 grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-400 md:grid-cols-3">
        <p>{{ t('evidence.sourceGuideCloud') }}</p>
        <p>{{ t('evidence.sourceGuideImage') }}</p>
        <p>{{ t('evidence.sourceGuideLink') }}</p>
      </div>

      <div class="mt-6 grid gap-3">
        <div v-if="loading" class="rounded-lg border border-white/10 p-4 text-zinc-400">{{ t('common.loading') }}</div>
        <div v-else-if="items.length === 0" class="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
          {{ t('evidence.empty') }}
          <RouterLink v-if="focus === 'official'" class="ml-2 font-semibold text-cyan-200 underline" to="/news-search">{{ t('common.newsSearch') }}</RouterLink>
        </div>
        <article v-for="item in items" :key="`${item.type || 'evidence'}-${item.id}`" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <template v-if="isOfficialResponse(item)">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded bg-cyan-300/15 px-2 py-1 text-xs font-semibold text-cyan-100">{{ item.claimant?.claim_type || item.response_type }}</span>
              <span class="rounded bg-white/10 px-2 py-1 text-xs text-zinc-300">{{ t('evidence.officialClarifications') }}</span>
              <span class="ml-auto text-xs text-zinc-500">{{ t('evidence.netHelpfulWeight') }} {{ Number(item.net_helpful_weight || 0).toFixed(2) }}</span>
            </div>
            <p class="mt-3 text-sm leading-6 text-zinc-100">{{ item.response_text }}</p>
            <p class="mt-2 text-xs text-zinc-500">{{ item.author?.display_name || '-' }}</p>
            <a v-if="item.evidence_url" class="mt-2 block truncate text-sm font-semibold text-cyan-200" :href="item.evidence_url" target="_blank" rel="noreferrer">{{ item.evidence_url }}</a>
            <div class="mt-3 rounded-md border border-white/10 bg-white/[0.02] p-3">
              <p class="text-xs font-semibold text-zinc-400">{{ t('evidence.relatedNews') }}</p>
              <p class="mt-1 truncate text-xs text-zinc-500">{{ item.news_url?.title_snapshot || item.news_url?.normalized_url }}</p>
              <RouterLink v-if="item.news_url?.id" class="mt-2 inline-flex text-xs font-semibold text-cyan-200 underline" :to="`/news/${item.news_url.id}`">{{ t('remaining.news') }}</RouterLink>
            </div>
            <div class="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
              <span class="rounded bg-emerald-500/10 px-2 py-1 text-emerald-100">{{ t('votePanel.helpful') }} {{ Number(item.helpful_weight || 0).toFixed(1) }}</span>
              <span class="rounded bg-red-500/10 px-2 py-1 text-red-100">{{ t('votePanel.unhelpful') }} {{ Number(item.unhelpful_weight || 0).toFixed(1) }}</span>
            </div>
          </template>
          <template v-else>
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded bg-white/10 px-2 py-1 text-xs font-semibold">{{ item.tag?.name || '-' }}</span>
            <span class="rounded px-2 py-1 text-xs font-semibold" :class="item.is_trusted_evidence ? 'bg-emerald-500/15 text-emerald-200' : 'bg-zinc-800 text-zinc-400'">
              {{ item.is_trusted_evidence ? t('evidence.trustedSource') : t('evidence.communityPending') }}
            </span>
            <span class="rounded bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">{{ t('evidence.qualityScore') }} {{ Number(item.quality_score || 0).toFixed(2) }}</span>
            <span class="ml-auto text-xs text-zinc-500">{{ t('evidence.netHelpfulWeight') }} {{ Number(item.net_helpful_weight).toFixed(2) }}</span>
          </div>
          <img v-if="previewUrl(item)" :src="previewUrl(item)" alt="" class="mt-3 max-h-52 w-full rounded-md border border-white/10 object-cover" />
          <p class="mt-3 text-sm text-zinc-200">{{ item.evidence_note || t('evidence.noNote') }}</p>
          <div class="mt-3 rounded-md border border-white/10 bg-zinc-950/70 p-3">
            <p class="text-xs text-zinc-500">{{ evidenceSourceLabel(item) }}</p>
            <a class="mt-1 block truncate text-sm font-semibold text-cyan-200" :href="item.evidence_url" target="_blank" rel="noreferrer">{{ item.evidence_url }}</a>
            <a v-if="item.archive_url" class="mt-1 block truncate text-xs font-semibold text-emerald-200" :href="item.archive_url" target="_blank" rel="noreferrer">{{ t('votePanel.openArchive') }}</a>
          </div>
          <div class="mt-3 rounded-md border border-white/10 bg-white/[0.02] p-3">
            <p class="text-xs font-semibold text-zinc-400">{{ t('evidence.relatedNews') }}</p>
            <p class="mt-1 truncate text-xs text-zinc-500">{{ item.news_url?.title_snapshot || item.news_url?.normalized_url }}</p>
            <p v-if="item.news_url?.media_outlet" class="mt-1 text-xs text-zinc-600">{{ item.news_url.media_outlet.name }}</p>
          </div>
          </template>
        </article>
      </div>
    </section>
  </main>
</template>
