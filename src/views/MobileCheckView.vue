<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  createVote,
  fetchCurrentUser,
  fetchMyVote,
  fetchNewsEvidence,
  fetchNewsStatus,
  fetchOfficialResponses,
  fetchTags,
  recordReadSession,
} from '../lib/api'
import { trackEvent } from '../lib/traffic'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

const TOKEN_KEY = 'truthshield_api_token'
const USER_KEY = 'truthshield_user'
const STATUS_CACHE_KEY = 'truthshield_mobile_status_cache'
const READ_SESSION_KEY = 'truthshield_mobile_read_session'
const STATUS_CACHE_TTL = 45 * 1000
const MAX_READ_SECONDS = 10 * 60

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()

const inputUrl = ref(String(route.query.url || ''))
const status = ref(null)
const evidence = ref([])
const officialResponses = ref([])
const tags = ref([])
const myVote = ref(null)
const user = ref(readStoredUser())
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const selectedTagId = ref('')
const selectedSecondaryTagIds = ref([])
const evidenceUrl = ref('')
const evidenceNote = ref('')
const readSeconds = ref(0)
const readMinimum = ref(15)
const readSynced = ref(false)
const loading = ref(false)
const submitting = ref(false)
const error = ref('')
const voteError = ref('')
const voteMessage = ref('')
const cacheStatus = ref('miss')

const newsUrl = computed(() => String(route.query.url || inputUrl.value || '').trim())
const isLoggedIn = computed(() => Boolean(token.value && user.value))
const isVotingOpen = computed(() => (status.value?.voting_closes_at ? Boolean(status.value?.is_open) : true))
const distribution = computed(() => status.value?.distribution || [])
const secondaryDistribution = computed(() => status.value?.secondary_distribution || [])
const totalWeight = computed(() => Number(status.value?.total_weight || 0))
const selectedTag = computed(() => tags.value.find((tag) => String(tag.id) === String(selectedTagId.value)))
const selectedEvidenceRequirement = computed(() => selectedTag.value?.evidence_requirement || (selectedTag.value?.requires_evidence ? 'strong_evidence' : 'optional'))
const requiresEvidenceUrl = computed(() => Boolean(selectedTag.value?.evidence_url_required) || selectedEvidenceRequirement.value === 'strong_evidence')
const requiresEvidenceNote = computed(() => Boolean(selectedTag.value?.evidence_note_required) || Boolean(selectedTag.value?.requires_evidence))
const hasReadEnough = computed(() => readMinimum.value <= 0 || readSeconds.value >= readMinimum.value || Boolean(myVote.value))
const readProgress = computed(() => readMinimum.value <= 0 ? 100 : Math.min(100, Math.round((readSeconds.value / readMinimum.value) * 100)))
const statusText = computed(() => {
  if (status.value?.finalized_at) return t('mobile.finalizedAt', { time: formatDateTime(status.value.finalized_at) })
  if (!isVotingOpen.value) return t('mobile.closed')
  if (status.value?.voting_closes_at) return t('mobile.openUntil', { time: formatDateTime(status.value.voting_closes_at) })
  return t('mobile.open')
})
const readCta = computed(() => {
  if (!isVotingOpen.value) return t('mobile.resultOnly')
  if (!isLoggedIn.value) return t('mobile.loginToVote')
  if (!hasReadEnough.value) return t('mobile.readMore', { seconds: Math.max(0, readMinimum.value - readSeconds.value) })
  return myVote.value ? t('mobile.updateVote') : t('mobile.readyToVote')
})
const cacheStatusLabel = computed(() => cacheStatus.value === 'hit' ? t('mobile.cacheCached') : t('mobile.cacheLive'))
const readGateLabel = computed(() => hasReadEnough.value ? t('mobile.readGateMet') : t('mobile.readGatePending'))
const readSyncLabel = computed(() => readSynced.value ? t('mobile.readSyncedReady') : t('mobile.readSyncedPending'))
const jumpLinks = computed(() => [
  { id: 'result', label: t('mobile.jumpResult') },
  { id: 'vote', label: t('mobile.jumpVote') },
  { id: 'evidence', label: t('mobile.jumpEvidence') },
  { id: 'responses', label: t('mobile.jumpResponses') },
  { id: 'reports', label: t('mobile.jumpReports') },
])

function mobileNavClass(active) {
  return active
    ? 'ts-mobile-nav-link is-active rounded-xl px-2 py-2'
    : 'ts-mobile-nav-link rounded-xl px-2 py-2'
}

function readStoredUser() {
  try {
    const value = localStorage.getItem(USER_KEY)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function statusCacheKey(url) {
  return `${STATUS_CACHE_KEY}:${locale.value}:${url}`
}

function readCachedStatus(url) {
  try {
    const cached = JSON.parse(sessionStorage.getItem(statusCacheKey(url)) || 'null')
    if (!cached || Date.now() - cached.stored_at > STATUS_CACHE_TTL) return null
    return cached.payload
  } catch {
    return null
  }
}

function writeCachedStatus(url, payload) {
  try {
    sessionStorage.setItem(statusCacheKey(url), JSON.stringify({ stored_at: Date.now(), payload }))
  } catch {
    // Mobile private browsing may reject storage; status still works without cache.
  }
}

function formatDateTime(value) {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat(locale.value === 'zh-TW' ? 'zh-TW' : 'en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value))
  } catch {
    return ''
  }
}

function normalizeUrl(value) {
  try {
    return new URL(value).toString()
  } catch {
    return ''
  }
}

function goCheck() {
  const normalized = normalizeUrl(inputUrl.value.trim())
  if (!normalized) {
    error.value = t('mobile.invalidUrl')
    return
  }
  router.replace({ name: 'mobile-check', query: { url: normalized } })
}

function scrollToSection(id) {
  document.getElementById(`mobile-section-${id}`)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

async function loadAuth() {
  token.value = localStorage.getItem(TOKEN_KEY) || ''
  user.value = readStoredUser()

  if (!token.value) return

  try {
    user.value = await fetchCurrentUser(token.value)
    readMinimum.value = Number(user.value?.min_read_seconds_before_vote ?? readMinimum.value)
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  } catch {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    token.value = ''
    user.value = null
  }
}

async function loadData(force = false) {
  if (!newsUrl.value) return

  loading.value = true
  error.value = ''
  voteError.value = ''

  try {
    const cachedStatus = force ? null : readCachedStatus(newsUrl.value)
    cacheStatus.value = cachedStatus ? 'hit' : 'miss'

    const statusPayload = cachedStatus || await fetchNewsStatus(newsUrl.value)
    const [evidencePayload, officialPayload, tagPayload, votePayload] = await Promise.all([
      fetchNewsEvidence(newsUrl.value).catch(() => []),
      fetchOfficialResponses(newsUrl.value).catch(() => []),
      fetchTags().catch(() => []),
      token.value ? fetchMyVote(token.value, newsUrl.value).catch(() => ({ vote: null })) : Promise.resolve({ vote: null }),
    ])
    status.value = statusPayload
    evidence.value = evidencePayload
    officialResponses.value = officialPayload
    tags.value = tagPayload
    myVote.value = votePayload?.vote || null

    if (!cachedStatus) writeCachedStatus(newsUrl.value, statusPayload)

    if (myVote.value) {
      selectedTagId.value = myVote.value.tag_id
      selectedSecondaryTagIds.value = Array.isArray(myVote.value.secondary_tag_ids) ? myVote.value.secondary_tag_ids : []
      evidenceUrl.value = myVote.value.evidence_url || ''
      evidenceNote.value = myVote.value.evidence_note || ''
    } else {
      selectedTagId.value ||= statusPayload.top_tag?.id || tagPayload[0]?.id || ''
    }

    trackEvent('mobile_check_loaded', {
      source: 'mobile_pwa',
      feature: 'mobile_check',
      url: newsUrl.value,
      cache_status: cacheStatus.value,
    })
  } catch (err) {
      status.value = null
      error.value = err.message === 'Failed to fetch' ? t('mobile.loadFailed') : err.message || t('mobile.loadFailed')
  } finally {
    loading.value = false
  }
}

function openOriginal() {
  if (!newsUrl.value) return

  localStorage.setItem(READ_SESSION_KEY, JSON.stringify({
    url: newsUrl.value,
    opened_at: Date.now(),
  }))
  trackEvent('mobile_original_opened', { source: 'mobile_pwa', feature: 'mobile_read', url: newsUrl.value })
  window.open(newsUrl.value, '_blank', 'noopener,noreferrer')
}

async function syncReadFromReturn() {
  if (!newsUrl.value) return

  try {
    const session = JSON.parse(localStorage.getItem(READ_SESSION_KEY) || 'null')
    if (!session || session.url !== newsUrl.value || !session.opened_at) return

    const elapsed = Math.max(0, Math.min(MAX_READ_SECONDS, Math.floor((Date.now() - Number(session.opened_at)) / 1000)))
    readSeconds.value = Math.max(readSeconds.value, elapsed)
  } catch {
    return
  }

  if (!token.value || !readSeconds.value) return

  try {
    const payload = await recordReadSession(token.value, {
      url: newsUrl.value,
      title_snapshot: route.query.title || undefined,
      seconds_read: readSeconds.value,
      visible: true,
    })
    readMinimum.value = Number(payload.minimum_seconds ?? readMinimum.value)
    readSynced.value = Boolean(payload.can_vote)
  } catch {
    readSynced.value = false
  }
}

async function submitVote() {
  voteError.value = ''
  voteMessage.value = ''

  if (!isLoggedIn.value) {
    router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }

  if (!isVotingOpen.value) {
    voteError.value = t('mobile.voteClosed')
    return
  }

  await syncReadFromReturn()

  if (!hasReadEnough.value) {
    voteError.value = t('mobile.readRequired', { minimum: readMinimum.value, current: readSeconds.value })
    return
  }

  if (requiresEvidenceUrl.value && !evidenceUrl.value.trim()) {
    voteError.value = t('mobile.evidenceUrlRequired')
    return
  }

  if (requiresEvidenceNote.value && !evidenceNote.value.trim()) {
    voteError.value = t('mobile.evidenceNoteRequired')
    return
  }

  submitting.value = true

  try {
    await createVote(token.value, {
      url: newsUrl.value,
      tag_id: selectedTagId.value,
      secondary_tag_ids: selectedSecondaryTagIds.value,
      evidence_url: evidenceUrl.value.trim() || undefined,
      evidence_note: evidenceNote.value.trim() || undefined,
    })
    voteMessage.value = t('mobile.voteSuccess')
    sessionStorage.removeItem(statusCacheKey(newsUrl.value))
    await loadData(true)
    trackEvent('mobile_vote_completed', { source: 'mobile_pwa', feature: 'mobile_vote', url: newsUrl.value })
  } catch (err) {
    voteError.value = err.status === 428
      ? t('mobile.readRequired', { minimum: err.payload?.minimum_read_seconds || readMinimum.value, current: err.payload?.seconds_read ?? readSeconds.value })
      : err.status === 409
        ? t('mobile.voteClosed')
        : err.errors?.evidence_url?.[0] || err.errors?.evidence_note?.[0] || err.message || t('mobile.voteFailed')
  } finally {
    submitting.value = false
  }
}

function toggleSecondaryTag(tagId) {
  if (String(tagId) === String(selectedTagId.value)) return

  if (selectedSecondaryTagIds.value.includes(tagId)) {
    selectedSecondaryTagIds.value = selectedSecondaryTagIds.value.filter((id) => id !== tagId)
    return
  }

  if (selectedSecondaryTagIds.value.length >= 4) {
    voteError.value = t('mobile.secondaryLimit')
    return
  }

  selectedSecondaryTagIds.value = [...selectedSecondaryTagIds.value, tagId]
}

function reportLinks() {
  return {
    domain: { path: '/report-domain', query: { url: newsUrl.value } },
    classification: { path: '/report-domain', query: { url: newsUrl.value, tab: 'classification' } },
    youtube: { path: '/report-domain', query: { youtube_url: newsUrl.value } },
  }
}

watch(() => route.query.url, async (value) => {
  inputUrl.value = String(value || '')
  await loadData()
})

watch(selectedTagId, (tagId) => {
  selectedSecondaryTagIds.value = selectedSecondaryTagIds.value.filter((id) => String(id) !== String(tagId))
})

onMounted(async () => {
  await loadAuth()
  await syncReadFromReturn()
  await loadData()
  window.addEventListener('focus', syncReadFromReturn)
  window.addEventListener('pageshow', syncReadFromReturn)
})

onUnmounted(() => {
  window.removeEventListener('focus', syncReadFromReturn)
  window.removeEventListener('pageshow', syncReadFromReturn)
})
</script>

<template>
  <main class="ts-app-shell min-h-screen bg-zinc-950 pb-24 text-zinc-100">
    <section class="px-4 pb-6 pt-5">
      <AppNav>
        <RouterLink class="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-100" to="/mobile">
          {{ t('mobile.mobileHome') }}
        </RouterLink>
      </AppNav>

      <form class="mt-5 flex gap-2" @submit.prevent="goCheck">
        <input
          v-model="inputUrl"
          class="min-w-0 flex-1 rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
          :placeholder="t('mobile.urlPlaceholder')"
        />
        <button class="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-zinc-950" type="submit">{{ t('mobile.check') }}</button>
      </form>

      <p v-if="error" class="mt-3 rounded-xl border border-orange-300/30 bg-orange-500/10 p-3 text-sm text-orange-100">{{ error }}</p>

      <template v-if="newsUrl && !error">
        <div class="sticky top-3 z-20 mt-4 overflow-x-auto pb-1">
          <div class="ts-mobile-section-rail inline-flex min-w-full gap-2 rounded-2xl px-2 py-2">
            <span class="px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{{ t('mobile.jumpTo') }}</span>
            <button
              v-for="item in jumpLinks"
              :key="item.id"
              class="ts-mobile-section-chip rounded-full px-3 py-2 text-xs font-semibold whitespace-nowrap"
              type="button"
              @click="scrollToSection(item.id)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <section id="mobile-section-result" class="ts-surface mt-5 scroll-mt-24 rounded-3xl p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{{ t('mobile.currentResult') }}</p>
              <h1 class="mt-2 text-xl font-semibold leading-7 text-white">{{ status?.display_text || t('votePanel.noData') }}</h1>
            </div>
            <span class="ts-pill shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold">{{ cacheStatusLabel }}</span>
          </div>
          <p class="mt-3 break-all text-xs leading-5 text-zinc-500">{{ newsUrl }}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <span class="ts-pill rounded-full px-3 py-1.5 text-[11px] font-medium">{{ readGateLabel }}</span>
            <span class="ts-pill rounded-full px-3 py-1.5 text-[11px] font-medium">{{ t('mobile.evidenceCount', { count: evidence.length }) }}</span>
            <span class="ts-pill rounded-full px-3 py-1.5 text-[11px] font-medium">{{ t('mobile.officialCount', { count: officialResponses.length }) }}</span>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
              <p class="text-zinc-500">{{ t('votePanel.totalWeight', { weight: totalWeight.toFixed(2) }) }}</p>
              <p class="mt-1 font-semibold text-white">{{ statusText }}</p>
            </div>
            <div class="rounded-xl border border-white/10 bg-zinc-950/60 p-3">
              <p class="text-zinc-500">{{ t('mobile.readThreshold') }}</p>
              <p class="mt-1 font-semibold text-white">{{ readSeconds }} / {{ readMinimum }} {{ t('votePanel.seconds') }}</p>
              <p class="mt-1 text-[11px] text-zinc-500">{{ readSyncLabel }}</p>
            </div>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-2">
            <button class="rounded-xl border border-cyan-300/40 bg-cyan-300/10 px-4 py-3 text-sm font-bold text-cyan-100" @click="openOriginal">
              {{ t('mobile.openOriginal') }}
            </button>
            <button class="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-white" type="button" @click="scrollToSection('vote')">
              {{ t('mobile.jumpToVote') }}
            </button>
          </div>
        </section>

        <section class="ts-surface-muted mt-5 scroll-mt-24 rounded-2xl p-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-white">{{ t('mobile.weightedResult') }}</h2>
            <span class="text-xs text-zinc-500">{{ loading ? t('common.loading') : statusText }}</span>
          </div>
          <div v-if="distribution.length" class="mt-4 space-y-3">
            <div v-for="row in distribution" :key="row.tag.id">
              <div class="flex items-center justify-between gap-3 text-xs">
                <span class="font-semibold text-zinc-200">{{ row.tag.name }}</span>
                <span class="text-zinc-500">{{ row.percentage }}%</span>
              </div>
              <div class="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                <div class="h-full rounded-full bg-cyan-300" :style="{ width: `${row.percentage}%` }"></div>
              </div>
            </div>
          </div>
          <p v-else class="mt-3 text-sm leading-6 text-zinc-500">{{ t('votePanel.noVotes') }}</p>
          <div v-if="secondaryDistribution.length" class="mt-4 flex flex-wrap gap-2">
            <span v-for="row in secondaryDistribution" :key="row.tag.id" class="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-300">
              {{ row.tag.name }} {{ row.percentage }}%
            </span>
          </div>
        </section>

        <section id="mobile-section-vote" class="ts-surface-muted mt-5 scroll-mt-24 rounded-2xl p-4">
          <h2 class="text-lg font-semibold text-white">{{ t('mobile.voteAfterReading') }}</h2>
          <p class="mt-2 text-sm leading-6 text-zinc-400">{{ readCta }}</p>
          <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div class="h-full rounded-full bg-emerald-300" :style="{ width: `${readProgress}%` }"></div>
          </div>

          <RouterLink
            v-if="!isLoggedIn"
            class="mt-4 block rounded-xl bg-cyan-300 px-4 py-3 text-center text-sm font-bold text-zinc-950"
            :to="{ path: '/login', query: { redirect: route.fullPath } }"
          >
            {{ t('mobile.loginToVote') }}
          </RouterLink>

          <form v-else class="mt-4 space-y-4" @submit.prevent="submitVote">
            <fieldset :disabled="!isVotingOpen || submitting" class="space-y-3">
              <div>
                <label class="text-xs font-semibold text-zinc-300">{{ t('mobile.primaryTag') }}</label>
                <select v-model="selectedTagId" class="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300">
                  <option v-for="tag in tags" :key="tag.id" :value="tag.id">{{ tag.name }}</option>
                </select>
                <p class="mt-2 text-xs leading-5 text-zinc-500">{{ selectedTag?.description || t('votePanel.tagCriteriaFallback') }}</p>
              </div>

              <div>
                <p class="text-xs font-semibold text-zinc-300">{{ t('mobile.secondaryTags') }}</p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button
                    v-for="tag in tags"
                    :key="tag.id"
                    type="button"
                    class="rounded-full border px-3 py-1.5 text-xs font-semibold"
                    :class="selectedSecondaryTagIds.includes(tag.id) ? 'border-cyan-300 bg-cyan-300 text-zinc-950' : 'border-white/10 bg-white/[0.03] text-zinc-300'"
                    @click="toggleSecondaryTag(tag.id)"
                  >
                    {{ tag.name }}
                  </button>
                </div>
              </div>

              <div>
                <label class="text-xs font-semibold text-zinc-300">{{ requiresEvidenceUrl ? t('votePanel.evidenceUrlRequired') : t('votePanel.evidenceUrlOptional') }}</label>
                <input v-model="evidenceUrl" class="mt-2 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300" placeholder="https://" />
              </div>

              <div>
                <label class="text-xs font-semibold text-zinc-300">{{ requiresEvidenceNote ? t('votePanel.evidenceNoteRequired') : t('votePanel.evidenceNoteLabel') }}</label>
                <textarea v-model="evidenceNote" class="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/10 bg-zinc-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300" :placeholder="t('mobile.notePlaceholder')"></textarea>
              </div>

              <button class="w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50" :disabled="submitting || !isVotingOpen || !hasReadEnough">
                {{ submitting ? t('votePanel.submitting') : myVote ? t('mobile.updateVote') : t('mobile.submitVote') }}
              </button>
            </fieldset>
          </form>

          <p v-if="voteError" class="mt-3 rounded-xl border border-orange-300/30 bg-orange-500/10 p-3 text-sm text-orange-100">{{ voteError }}</p>
          <p v-if="voteMessage" class="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{{ voteMessage }}</p>
        </section>

        <section id="mobile-section-responses" class="ts-surface-muted mt-5 scroll-mt-24 rounded-2xl p-4">
          <h2 class="text-lg font-semibold text-white">{{ t('mobile.officialResponses') }}</h2>
          <article v-for="item in officialResponses" :key="item.id" class="mt-3 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.05] p-3">
            <p class="text-xs font-semibold text-cyan-100">{{ item.claimant?.claim_type || item.response_type }}</p>
            <p class="mt-2 text-sm leading-6 text-zinc-200">{{ item.response_text }}</p>
          </article>
          <p v-if="!officialResponses.length" class="mt-3 text-sm text-zinc-500">{{ t('votePanel.noOfficialResponses') }}</p>
        </section>

        <section id="mobile-section-evidence" class="ts-surface-muted mt-5 scroll-mt-24 rounded-2xl p-4">
          <h2 class="text-lg font-semibold text-white">{{ t('mobile.communityEvidence') }}</h2>
          <article v-for="item in evidence" :key="item.id" class="mt-3 rounded-xl border border-white/10 bg-zinc-950/60 p-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-zinc-200">{{ item.tag?.name }}</span>
              <span class="text-xs text-zinc-500">{{ item.quality_score ?? 0 }}</span>
            </div>
            <p v-if="item.evidence_note" class="mt-2 text-sm leading-6 text-zinc-300">{{ item.evidence_note }}</p>
            <a v-if="item.evidence_url" :href="item.evidence_url" target="_blank" rel="noreferrer" class="mt-2 block break-all text-xs text-cyan-200">{{ item.evidence_url }}</a>
          </article>
          <p v-if="!evidence.length" class="mt-3 text-sm text-zinc-500">{{ t('votePanel.noEvidence') }}</p>
        </section>

        <section id="mobile-section-reports" class="ts-surface-muted mt-5 scroll-mt-24 rounded-2xl p-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-white">{{ t('mobile.communityReports') }}</h2>
            <button class="text-xs font-semibold text-cyan-200" type="button" @click="scrollToSection('result')">{{ t('mobile.backToTop') }}</button>
          </div>
          <div class="mt-3 grid gap-2">
            <RouterLink class="rounded-xl border border-white/10 bg-zinc-950/60 p-3 text-sm font-semibold text-cyan-100" :to="reportLinks().classification">{{ t('mobile.reportNotArticle') }}</RouterLink>
            <RouterLink class="rounded-xl border border-white/10 bg-zinc-950/60 p-3 text-sm font-semibold text-cyan-100" :to="reportLinks().domain">{{ t('mobile.reportMissingSite') }}</RouterLink>
            <RouterLink class="rounded-xl border border-white/10 bg-zinc-950/60 p-3 text-sm font-semibold text-cyan-100" :to="reportLinks().youtube">{{ t('mobile.reportYoutube') }}</RouterLink>
          </div>
        </section>
      </template>
    </section>

    <nav class="ts-mobile-nav fixed inset-x-0 bottom-0 z-40 border-t border-white/10 px-3 py-2">
      <div class="grid grid-cols-4 text-center text-[11px] font-semibold text-zinc-400">
        <RouterLink :class="mobileNavClass(route.path.startsWith('/mobile'))" to="/mobile">{{ t('mobile.navCheck') }}</RouterLink>
        <RouterLink :class="mobileNavClass(route.path.startsWith('/evidence-library'))" to="/evidence-library">{{ t('mobile.navEvidence') }}</RouterLink>
        <RouterLink :class="mobileNavClass(route.path.startsWith('/community-tasks'))" to="/community-tasks">{{ t('mobile.navTasks') }}</RouterLink>
        <RouterLink :class="mobileNavClass(route.path.startsWith('/profile') || route.path.startsWith('/login'))" :to="isLoggedIn ? '/profile' : '/login?redirect=/mobile'">{{ t('mobile.navMe') }}</RouterLink>
      </div>
    </nav>
  </main>
</template>
