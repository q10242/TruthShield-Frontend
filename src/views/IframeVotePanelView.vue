<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  createVote,
  fetchCurrentUser,
  fetchMyVote,
  fetchNewsEvidence,
  fetchNewsStatus,
  fetchTags,
  fetchEvidenceReportReasons,
  fetchOfficialResponses,
  fetchProfile,
  recordReadSession,
  recordNewsSnapshot,
  reactToEvidence,
  reactToOfficialResponse,
  reportNewsChange,
  reportEvidence,
  createOfficialResponse,
} from '../lib/api'
import { useI18n } from '../i18n'

const TOKEN_KEY = 'truthshield_api_token'
const USER_KEY = 'truthshield_user'

const route = useRoute()
const { locale, t } = useI18n()
const collapsed = ref(route.query.expanded !== '1')
const activeTab = ref('results')
const loading = ref(true)
const statusLoading = ref(true)
const error = ref('')
const voteError = ref('')
const voteMessage = ref('')
const evidenceError = ref('')
const reportMessage = ref('')
const changeReportMessage = ref('')
const readMessage = ref('')
const status = ref(null)
const tags = ref([])
const evidence = ref([])
const officialResponses = ref([])
const officialResponseText = ref('')
const officialResponseEvidenceUrl = ref('')
const officialResponseType = ref('subject_clarification')
const selectedClaimantId = ref('')
const officialResponseMessage = ref('')
const officialResponseError = ref('')
const profile = ref(null)
const reportReasons = ref([])
const selectedTagId = ref('')
const selectedSecondaryTagIds = ref([])
const evidenceUrl = ref('')
const evidenceNote = ref('')
const submitting = ref(false)
const reactingId = ref(null)
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const user = ref(readStoredUser())
const myVote = ref(null)
const readSeconds = ref(0)
const readMinimum = ref(15)
const readSynced = ref(false)
const readTimer = ref(null)
const tabSteps = computed(() => [
  { key: 'results', number: 1, label: t('votePanel.tabs.results') },
  { key: 'vote', number: 2, label: t('votePanel.tabs.vote') },
  { key: 'evidence', number: 3, label: t('votePanel.tabs.evidence') },
])

const newsUrl = computed(() => route.query.news_url || '')
const pageSnapshot = computed(() => ({
  url: newsUrl.value,
  title_snapshot: route.query.title_snapshot || undefined,
  canonical_url: route.query.canonical_url || undefined,
  description: route.query.description || undefined,
  image_url: route.query.image_url || undefined,
  availability_status: 'available',
}))
const selectedTag = computed(() => tags.value.find((tag) => tag.id === selectedTagId.value))
const isLoggedIn = computed(() => Boolean(token.value && user.value))
const totalWeight = computed(() => Number(status.value?.total_weight || 0))
const distribution = computed(() => status.value?.distribution || [])
const secondaryDistribution = computed(() => status.value?.secondary_distribution || [])
const evidenceReactionMinTrustScore = computed(() => Number(user.value?.evidence_reaction_min_trust_score ?? 0.5))
const canReactToEvidence = computed(() => {
  if (!isLoggedIn.value) return true
  if (typeof user.value?.can_react_to_evidence === 'boolean') return user.value.can_react_to_evidence

  return Number(user.value?.trust_score || 0) >= evidenceReactionMinTrustScore.value
})
const isWeightLimited = computed(() => {
  if (!isLoggedIn.value) return false

  return Number(user.value?.abuse_multiplier ?? 1) < 1
    || ['watched', 'limited', 'suspended_weight', 'restricted'].includes(user.value?.risk_status)
    || Number(user.value?.trust_score || 0) < 0.5
})
const approvedClaimants = computed(() => (profile.value?.verified_claimants || []).filter((claim) => claim.status === 'approved'))
const isVotingOpen = computed(() => (status.value?.voting_closes_at ? Boolean(status.value?.is_open) : true))
const hasReadEnough = computed(() => readMinimum.value <= 0 || readSeconds.value >= readMinimum.value || Boolean(myVote.value))
const readProgress = computed(() => {
  if (readMinimum.value <= 0) return 100
  return Math.min(100, Math.round((readSeconds.value / readMinimum.value) * 100))
})
const deadlineText = computed(() => formatDateTime(status.value?.voting_closes_at))
const finalizedText = computed(() => formatDateTime(status.value?.finalized_at))
const isClosingSoon = computed(() => {
  if (!isVotingOpen.value || !status.value?.voting_closes_at) return false

  const remaining = new Date(status.value.voting_closes_at).getTime() - Date.now()
  return remaining > 0 && remaining <= 6 * 60 * 60 * 1000
})
const statusNote = computed(() => {
  if (status.value?.finalized_at) return t('votePanel.finalizedNote', { time: finalizedText.value })
  if (!isVotingOpen.value) return t('votePanel.closedFinalizing')
  if (isClosingSoon.value && deadlineText.value) return t('votePanel.closingSoon', { time: deadlineText.value })
  if (deadlineText.value) return t('votePanel.editableUntil', { time: deadlineText.value })

  return t('votePanel.editable')
})
const nextActionText = computed(() => {
  if (!isVotingOpen.value) return t('votePanel.resultFinalized')
  if (!isLoggedIn.value) return t('votePanel.loginToVote')
  if (!hasReadEnough.value) return t('votePanel.readMore', { seconds: Math.max(0, readMinimum.value - readSeconds.value) })
  if (myVote.value) return t('votePanel.updateVote')

  return t('votePanel.firstVote')
})
const statusBadgeText = computed(() => {
  if (status.value?.finalized_at) return t('votePanel.finalized')
  if (!isVotingOpen.value) return t('votePanel.closed')
  if (isClosingSoon.value) return t('votePanel.closing')

  return t('votePanel.open')
})
const snapshot = computed(() => status.value?.snapshot || null)
const snapshotAlert = computed(() => {
  const value = snapshot.value
  if (!value) return null

  if (value.availability_status === 'deleted_or_unavailable') {
    return { tone: 'danger', text: t('votePanel.newsUnavailable') }
  }

  if (value.changed_snapshots_count > 0 || value.latest_snapshot?.snapshot_type === 'changed') {
    return { tone: 'warning', text: t('votePanel.newsChanged', { count: value.changed_snapshots_count || 1 }) }
  }

  if (value.pending_change_reports_count > 0) {
    return { tone: 'warning', text: t('votePanel.pendingChangeReports', { count: value.pending_change_reports_count }) }
  }

  return null
})
const activeStepNumber = computed(() => tabSteps.value.find((step) => step.key === activeTab.value)?.number || 1)

const toneClass = computed(() => {
  const tone = status.value?.tone

  if (tone === 'danger') return 'border-red-400/50 bg-red-500/15 text-red-100'
  if (tone === 'positive') return 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100'
  if (tone === 'warning') return 'border-orange-400/50 bg-orange-500/15 text-orange-100'

  return 'border-white/10 bg-white/[0.04] text-zinc-200'
})

function readStoredUser() {
  try {
    const value = localStorage.getItem(USER_KEY)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function notifyHeight() {
  nextTick(() => {
    window.parent?.postMessage(
      {
        type: 'TRUTH_SHIELD_VOTE_PANEL_RESIZE',
        height: document.documentElement.scrollHeight,
        collapsed: collapsed.value,
      },
      '*',
    )
  })
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

async function loadAuth() {
  token.value = localStorage.getItem(TOKEN_KEY) || ''
  user.value = readStoredUser()

  if (!token.value) return

  try {
    user.value = await fetchCurrentUser(token.value)
    profile.value = await fetchProfile(token.value).catch(() => null)
    readMinimum.value = Number(user.value?.min_read_seconds_before_vote ?? 15)
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  } catch {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    token.value = ''
    user.value = null
  }
}

async function syncReadSession() {
  if (!token.value || !newsUrl.value || document.hidden) return

  try {
    const payload = await recordReadSession(token.value, {
      url: newsUrl.value,
      title_snapshot: pageSnapshot.value.title_snapshot || document.title || undefined,
      canonical_url: pageSnapshot.value.canonical_url,
      description: pageSnapshot.value.description,
      image_url: pageSnapshot.value.image_url,
      seconds_read: readSeconds.value,
      visible: !document.hidden,
    })
    readMinimum.value = Number(payload.minimum_seconds ?? readMinimum.value)
    readSynced.value = Boolean(payload.can_vote)
  } catch {
    readSynced.value = false
  } finally {
    notifyHeight()
  }
}

async function syncSnapshot() {
  if (!newsUrl.value) return

  try {
    const payload = await recordNewsSnapshot(pageSnapshot.value)
    if (payload.status) {
      status.value = payload.status
    }
  } catch {
    // Snapshot capture is best-effort and must not block reading or voting.
  }
}

function startReadTracking() {
  window.clearInterval(readTimer.value)
  readTimer.value = window.setInterval(() => {
    if (document.hidden || collapsed.value) return

    readSeconds.value += 1

    if (readSeconds.value % 5 === 0 || readSeconds.value === readMinimum.value) {
      syncReadSession()
    }
  }, 1000)
}

async function loadData() {
  error.value = ''
  evidenceError.value = ''
  statusLoading.value = true

  try {
    if (!newsUrl.value) throw new Error('Missing news_url')

    const requests = [
      fetchNewsStatus(newsUrl.value),
      fetchTags(),
      fetchNewsEvidence(newsUrl.value),
      fetchEvidenceReportReasons(),
      fetchOfficialResponses(newsUrl.value),
    ]

    if (token.value) {
      requests.push(fetchMyVote(token.value, newsUrl.value).catch(() => ({ vote: null })))
    }

    const [statusPayload, tagPayload, evidencePayload, reportReasonsPayload, officialResponsesPayload, myVotePayload] = await Promise.all(requests)

    status.value = statusPayload
    tags.value = tagPayload
    evidence.value = evidencePayload
    reportReasons.value = reportReasonsPayload
    officialResponses.value = officialResponsesPayload
    myVote.value = myVotePayload?.vote || null

    if (myVote.value) {
      selectedTagId.value = myVote.value.tag_id
      selectedSecondaryTagIds.value = Array.isArray(myVote.value.secondary_tag_ids) ? myVote.value.secondary_tag_ids : []
      evidenceUrl.value = myVote.value.evidence_url || ''
      evidenceNote.value = myVote.value.evidence_note || ''
    } else {
      selectedTagId.value ||= statusPayload.top_tag?.id || tagPayload[0]?.id || ''
      selectedSecondaryTagIds.value = []
    }
  } catch (err) {
    error.value = err.message || t('votePanel.unavailable')
  } finally {
    loading.value = false
    statusLoading.value = false
    notifyHeight()
  }
}

async function submitOfficialResponse() {
  officialResponseError.value = ''
  officialResponseMessage.value = ''

  if (!isLoggedIn.value) {
    openLogin()
    return
  }

  if (!selectedClaimantId.value || !officialResponseText.value.trim()) {
    officialResponseError.value = t('votePanel.officialResponseRequired')
    notifyHeight()
    return
  }

  try {
    await createOfficialResponse(token.value, {
      url: newsUrl.value,
      verified_claimant_id: selectedClaimantId.value,
      response_type: officialResponseType.value,
      response_text: officialResponseText.value.trim(),
      evidence_url: officialResponseEvidenceUrl.value.trim() || undefined,
    })
    officialResponseText.value = ''
    officialResponseEvidenceUrl.value = ''
    officialResponseMessage.value = t('votePanel.officialResponseSubmitted')
  } catch (err) {
    officialResponseError.value = err.message || t('votePanel.officialResponseFailed')
  } finally {
    notifyHeight()
  }
}

async function reactOfficial(item, helpful) {
  officialResponseError.value = ''

  if (!isLoggedIn.value) {
    openLogin()
    return
  }

  if (!canReactToEvidence.value) {
    officialResponseError.value = t('votePanel.reactionMinTrust', { score: evidenceReactionMinTrustScore.value.toFixed(2) })
    notifyHeight()
    return
  }

  try {
    await reactToOfficialResponse(token.value, item.id, helpful)
    officialResponses.value = await fetchOfficialResponses(newsUrl.value)
  } catch (err) {
    officialResponseError.value = err.message || t('votePanel.reactionFailed')
  } finally {
    notifyHeight()
  }
}

function openLogin() {
  const loginUrl = new URL('/login', window.location.origin)
  loginUrl.searchParams.set('redirect', window.location.pathname + window.location.search)
  window.open(loginUrl.toString(), 'truthshield-login', 'width=460,height=680')
  pollForLogin()
}

function pollForLogin() {
  let attempts = 0
  const timer = window.setInterval(async () => {
    attempts += 1
    await loadAuth()

    if (isLoggedIn.value || attempts >= 40) {
      window.clearInterval(timer)
      if (isLoggedIn.value) {
        await loadData()
      }
      notifyHeight()
    }
  }, 500)
}

async function submitVote() {
  voteError.value = ''
  voteMessage.value = ''

  if (!isLoggedIn.value) {
    openLogin()
    return
  }

  if (!isVotingOpen.value) {
    voteError.value = t('votePanel.voteWindowClosedError')
    notifyHeight()
    return
  }

  if (!hasReadEnough.value) {
    await syncReadSession()
    voteError.value = t('votePanel.readRequiredError', { minimum: readMinimum.value, current: readSeconds.value })
    notifyHeight()
    return
  }

  if (selectedTag.value?.requires_evidence && !evidenceUrl.value.trim()) {
    voteError.value = t('votePanel.evidenceRequiredError')
    notifyHeight()
    return
  }

  if (selectedTag.value?.requires_evidence && !evidenceNote.value.trim()) {
    voteError.value = t('votePanel.noteRequiredError')
    notifyHeight()
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

    voteMessage.value = t('votePanel.voteSuccess')
    activeTab.value = 'results'
    evidenceUrl.value = ''
    evidenceNote.value = ''
    await loadData()
  } catch (err) {
    voteError.value = err.status === 409
      ? t('votePanel.voteWindowClosedError')
      : err.status === 428
        ? t('votePanel.readRequiredError', { minimum: err.payload?.minimum_read_seconds || readMinimum.value, current: err.payload?.seconds_read ?? readSeconds.value })
        : err.errors?.evidence_url?.[0] || err.errors?.evidence_note?.[0] || err.message || t('votePanel.voteFailed')
  } finally {
    submitting.value = false
    notifyHeight()
  }
}

function toggleSecondaryTag(tagId) {
  if (tagId === selectedTagId.value) {
    selectedSecondaryTagIds.value = selectedSecondaryTagIds.value.filter((id) => id !== tagId)
    return
  }

  if (selectedSecondaryTagIds.value.includes(tagId)) {
    selectedSecondaryTagIds.value = selectedSecondaryTagIds.value.filter((id) => id !== tagId)
    return
  }

  if (selectedSecondaryTagIds.value.length >= 4) {
    voteError.value = t('votePanel.secondaryLimit')
    notifyHeight()
    return
  }

  selectedSecondaryTagIds.value = [...selectedSecondaryTagIds.value, tagId]
}

async function reportItem(item) {
  evidenceError.value = ''
  reportMessage.value = ''

  if (!isLoggedIn.value) {
    openLogin()
    return
  }

  try {
    await reportEvidence(token.value, item.id, {
      reason: 'needs_review',
      note: reportReasons.value.find((reason) => reason.value === 'needs_review')?.label || t('votePanel.reportNote'),
    })
    reportMessage.value = t('votePanel.reportSuccess')
  } catch (err) {
    evidenceError.value = err.message || t('votePanel.reportFailed')
  } finally {
    notifyHeight()
  }
}

async function submitChangeReport(reportType) {
  evidenceError.value = ''
  changeReportMessage.value = ''

  try {
    await reportNewsChange({
      url: newsUrl.value,
      report_type: reportType,
      page_title: pageSnapshot.value.title_snapshot || document.title || undefined,
    })
    changeReportMessage.value = t('votePanel.changeReportSuccess')
    await loadData()
  } catch (err) {
    evidenceError.value = err.message || t('votePanel.changeReportFailed')
  } finally {
    notifyHeight()
  }
}

async function react(item, helpful) {
  evidenceError.value = ''

  if (!isLoggedIn.value) {
    openLogin()
    return
  }

  if (!isVotingOpen.value) {
    evidenceError.value = t('votePanel.reactionClosed')
    notifyHeight()
    return
  }

  if (!canReactToEvidence.value) {
    evidenceError.value = t('votePanel.reactionMinTrust', { score: evidenceReactionMinTrustScore.value.toFixed(2) })
    notifyHeight()
    return
  }

  reactingId.value = item.id

  try {
    await reactToEvidence(token.value, item.id, helpful)
    evidence.value = await fetchNewsEvidence(newsUrl.value)
  } catch (err) {
    evidenceError.value = err.status === 409
      ? t('votePanel.reactionClosed')
      : err.status === 403
        ? t('votePanel.reactionMinTrust', { score: evidenceReactionMinTrustScore.value.toFixed(2) })
        : err.message || t('votePanel.reactionFailed')
  } finally {
    reactingId.value = null
    notifyHeight()
  }
}

function evidencePreviewUrl(item) {
  if (item.evidence_type === 'cloud_drive') {
    return ''
  }

  if (item.preview_url) return item.preview_url
  if (item.evidence_type !== 'image') return ''

  try {
    const url = new URL(item.evidence_url)
    if (url.hostname === 'imgur.com' || url.hostname === 'www.imgur.com') {
      const id = url.pathname.split('/').filter(Boolean).pop()
      return id ? `https://i.imgur.com/${id}.jpg` : item.evidence_url
    }
  } catch {
    return ''
  }

  return item.evidence_url
}

function evidenceTypeLabel(item) {
  if (item.evidence_type === 'cloud_drive') return t('evidence.cloudDrive')
  if (item.evidence_type === 'image') return t('evidence.image')
  if (item.evidence_type === 'link') return t('evidence.link')

  return t('evidence.external')
}

function evidenceTrustLabel(item) {
  return item.is_trusted_evidence ? t('evidence.trustedSource') : t('evidence.communityPending')
}

watch(selectedTagId, (tagId) => {
  selectedSecondaryTagIds.value = selectedSecondaryTagIds.value.filter((id) => id !== tagId)
})

watch([collapsed, activeTab, selectedTagId, selectedSecondaryTagIds, evidenceUrl, evidenceNote, voteError, voteMessage, evidenceError, reportMessage, changeReportMessage, officialResponseMessage, officialResponseError, officialResponseText, readSeconds], notifyHeight)

onMounted(async () => {
  await loadAuth()
  await syncSnapshot()
  await loadData()
  window.addEventListener('focus', loadAuth)
  window.addEventListener('storage', loadAuth)
  window.addEventListener('message', async (event) => {
    if (event.data?.type === 'TRUTH_SHIELD_AUTH_UPDATED') {
      await loadAuth()
      await syncReadSession()
    }

    if (event.data?.type === 'TRUTH_SHIELD_ARTICLE_READ_TICK') {
      readSeconds.value = Math.max(readSeconds.value, Number(event.data.secondsRead || 0))
      if (readSeconds.value % 5 === 0 || readSeconds.value >= readMinimum.value) {
        await syncReadSession()
      }
    }
  })
  startReadTracking()
  await syncReadSession()
  notifyHeight()
})
</script>

<template>
  <main class="min-w-[360px] bg-transparent p-3 text-zinc-100">
    <button
      v-if="collapsed"
      class="ml-auto flex items-center gap-2 rounded-full border border-cyan-300/40 bg-zinc-950 px-4 py-3 text-sm font-semibold text-cyan-100 shadow-2xl shadow-black/40"
      @click="collapsed = false"
    >
      <span class="h-2 w-2 rounded-full bg-cyan-300"></span>
      {{ t('votePanel.shieldRating') }}
    </button>

    <section v-else class="rounded-lg border border-white/10 bg-zinc-950 p-4 shadow-xl shadow-black/30">
      <div class="mb-3 flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <p class="text-xs font-semibold text-cyan-300">TruthShield</p>
            <span class="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">{{ statusBadgeText }}</span>
          </div>
          <p class="mt-1 text-[11px] text-zinc-500">{{ nextActionText }}</p>
        </div>
        <button class="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-400 hover:border-cyan-300/50 hover:text-cyan-100" @click="collapsed = true">
          {{ t('votePanel.collapse') }}
        </button>
      </div>

      <div class="grid grid-cols-3 rounded-md border border-white/10 bg-white/[0.03] p-1 text-xs font-semibold">
        <button
          v-for="step in tabSteps"
          :key="step.key"
          class="rounded px-2 py-2"
          :class="activeTab === step.key ? 'bg-cyan-300 text-zinc-950' : step.number < activeStepNumber ? 'text-cyan-200' : 'text-zinc-400'"
          @click="activeTab = step.key"
        >
          <span class="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px]">{{ step.number }}</span>
          {{ step.label }}
        </button>
      </div>

      <div class="mt-3 w-full rounded-md border p-3 text-left" :class="toneClass">
        <div v-if="statusLoading" class="text-sm text-zinc-300">{{ t('votePanel.checkingNews') }}</div>
        <div v-else-if="error" class="text-sm text-orange-100">{{ t('votePanel.unavailable') }}</div>
        <div v-else class="space-y-1">
          <div class="text-sm font-semibold">{{ status?.display_text || t('votePanel.noData') }}</div>
          <div class="text-xs opacity-80">{{ t('votePanel.totalWeight', { weight: totalWeight.toFixed(2) }) }}</div>
          <div class="text-xs opacity-80">{{ statusNote }}</div>
        </div>
      </div>

      <div
        v-if="snapshotAlert"
        class="mt-3 rounded-md border p-3 text-xs"
        :class="snapshotAlert.tone === 'danger' ? 'border-red-400/40 bg-red-500/10 text-red-100' : 'border-orange-400/40 bg-orange-500/10 text-orange-100'"
      >
        <p class="font-semibold">{{ snapshotAlert.text }}</p>
        <p v-if="snapshot?.latest_snapshot?.captured_at" class="mt-1 opacity-80">
          {{ t('votePanel.lastSnapshotAt', { time: formatDateTime(snapshot.latest_snapshot.captured_at) }) }}
        </p>
        <a v-if="snapshot?.archive_url" class="mt-2 inline-block font-semibold text-cyan-100" :href="snapshot.archive_url" target="_blank" rel="noreferrer">
          {{ t('votePanel.openArchive') }}
        </a>
      </div>

      <div v-if="isVotingOpen" class="mt-3 grid gap-2 rounded-md border border-white/10 bg-white/[0.03] p-3 text-xs text-zinc-300">
        <div class="flex items-center justify-between gap-3">
          <span>{{ t('votePanel.readThreshold') }}</span>
          <span :class="hasReadEnough ? 'text-emerald-300' : 'text-orange-300'">{{ Math.min(readSeconds, readMinimum) }} / {{ readMinimum }} {{ t('votePanel.seconds') }}</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div class="h-full rounded-full bg-cyan-300" :style="{ width: `${readProgress}%` }"></div>
        </div>
      </div>

      <section v-if="activeTab === 'results'" class="mt-4 space-y-3">
        <div v-if="distribution.length === 0" class="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-400">
          {{ t('votePanel.noVotes') }}
        </div>

        <div v-for="row in distribution" :key="row.tag.id" class="space-y-1">
          <div class="flex items-center justify-between gap-3 text-xs">
            <span class="font-semibold text-zinc-100">{{ row.tag.name }}</span>
            <span class="text-zinc-400">{{ t('votePanel.weightedLine', { percentage: row.percentage, weight: Number(row.weight).toFixed(2) }) }}</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-white/10">
            <div class="h-full rounded-full bg-cyan-300" :style="{ width: `${row.percentage}%` }"></div>
          </div>
        </div>

        <div v-if="secondaryDistribution.length" class="rounded-md border border-white/10 bg-white/[0.02] p-3">
          <p class="text-xs font-semibold text-zinc-300">{{ t('votePanel.secondaryDistribution') }}</p>
          <div class="mt-3 space-y-2">
            <div v-for="row in secondaryDistribution" :key="row.tag.id" class="flex items-center justify-between gap-3 text-xs">
              <span class="text-zinc-300">{{ row.tag.name }}</span>
              <span class="text-zinc-500">{{ t('votePanel.weightedLine', { percentage: row.percentage, weight: Number(row.weight).toFixed(2) }) }}</span>
            </div>
          </div>
        </div>

        <button
          class="w-full rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!isVotingOpen"
          @click="activeTab = 'vote'"
        >
          {{ isLoggedIn ? t('votePanel.goVote') : t('common.signIn') }}
        </button>
        <button
          class="w-full rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-300 hover:border-cyan-300/50 hover:text-cyan-100"
          @click="activeTab = 'evidence'"
        >
          {{ t('votePanel.viewEvidence') }}
        </button>
        <div class="grid grid-cols-2 gap-2">
          <button class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-orange-300/50 hover:text-orange-100" @click="submitChangeReport('title_changed')">
            {{ t('votePanel.reportChanged') }}
          </button>
          <button class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-red-300/50 hover:text-red-100" @click="submitChangeReport('deleted')">
            {{ t('votePanel.reportDeleted') }}
          </button>
        </div>
        <p v-if="changeReportMessage" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-2 text-xs text-emerald-100">{{ changeReportMessage }}</p>
      </section>

      <section v-else-if="activeTab === 'vote'" class="mt-4 space-y-3 border-t border-white/10 pt-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-white">{{ t('votePanel.yourRating') }}</p>
            <p class="text-xs text-zinc-500">{{ isLoggedIn ? `${user.email} · ${t('profile.weight')} ${Number(user.trust_score || 1).toFixed(2)}` : t('votePanel.notSignedIn') }}</p>
            <p v-if="myVote" class="mt-1 text-xs text-cyan-300">{{ t('votePanel.existingVote') }}</p>
            <p v-if="isWeightLimited" class="mt-1 rounded border border-orange-400/40 bg-orange-500/10 px-2 py-1 text-xs text-orange-100">
              {{ t('votePanel.weightLimitedNotice') }}
            </p>
            <p class="mt-1 text-xs text-zinc-500">{{ statusNote }}</p>
            <p class="mt-1 text-xs" :class="hasReadEnough ? 'text-emerald-300' : 'text-orange-300'">
              {{ t('votePanel.readThreshold') }} {{ Math.min(readSeconds, readMinimum) }} / {{ readMinimum }} {{ t('votePanel.seconds') }}
            </p>
          </div>
          <button v-if="!isLoggedIn && isVotingOpen" class="rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950" @click="openLogin">
            {{ t('common.signIn') }}
          </button>
        </div>

        <div v-if="!isVotingOpen" class="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-400">
          {{ t('votePanel.voteClosedReadonly') }}
        </div>

        <div v-else class="rounded-md border border-white/10 bg-white/[0.03] p-3">
          <div class="flex items-center justify-between text-xs">
            <span class="font-semibold text-zinc-200">{{ t('votePanel.readConfirm') }}</span>
            <span :class="hasReadEnough ? 'text-emerald-300' : 'text-orange-300'">{{ hasReadEnough ? t('votePanel.readReady') : t('votePanel.reading') }}</span>
          </div>
          <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div class="h-full rounded-full bg-cyan-300" :style="{ width: `${readProgress}%` }"></div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="tag in tags"
            :key="tag.id"
            class="rounded-md border px-3 py-2 text-left text-xs font-semibold"
            :class="selectedTagId === tag.id ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/[0.03] text-zinc-300'"
            :disabled="!isVotingOpen"
            @click="selectedTagId = tag.id"
          >
            {{ tag.name }}
          </button>
        </div>
        <div class="rounded-md border border-white/10 bg-white/[0.03] p-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold text-zinc-200">{{ t('votePanel.secondaryLabels') }}</p>
              <p class="mt-1 text-[11px] text-zinc-500">{{ t('votePanel.secondaryHelp') }}</p>
            </div>
            <span class="text-[11px] text-zinc-500">{{ selectedSecondaryTagIds.length }} / 4</span>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <button
              v-for="tag in tags"
              :key="`secondary-${tag.id}`"
              class="rounded-md border px-3 py-2 text-left text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              :class="selectedSecondaryTagIds.includes(tag.id) ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-zinc-950/70 text-zinc-400'"
              :disabled="!isVotingOpen || selectedTagId === tag.id"
              @click="toggleSecondaryTag(tag.id)"
            >
              {{ tag.name }}
            </button>
          </div>
        </div>
        <details class="rounded-md border border-white/10 bg-zinc-950/70 p-3 text-xs text-zinc-400">
          <summary class="cursor-pointer font-semibold text-cyan-100">{{ t('votePanel.tagCriteria') }}</summary>
          <p class="mt-2 leading-5">{{ selectedTag?.description || t('votePanel.tagCriteriaFallback') }}</p>
          <p class="mt-2 leading-5">{{ selectedTag?.requires_evidence ? t('votePanel.negativeCriteria') : t('votePanel.positiveCriteria') }}</p>
        </details>

        <label class="block text-xs text-zinc-400">
          {{ t('votePanel.evidenceUrlLabel') }}
          <input
            v-model="evidenceUrl"
            class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
            :disabled="!isVotingOpen"
            :placeholder="selectedTag?.requires_evidence ? t('votePanel.evidenceUrlRequired') : t('votePanel.optional')"
          />
        </label>

        <label class="block text-xs text-zinc-400">
          {{ t('votePanel.evidenceNoteLabel') }}
          <textarea
            v-model="evidenceNote"
            rows="3"
            class="mt-2 w-full resize-none rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
            :disabled="!isVotingOpen"
            :placeholder="selectedTag?.requires_evidence ? t('votePanel.evidenceNoteRequired') : t('votePanel.optional')"
          ></textarea>
        </label>

        <p v-if="voteError" class="rounded-md border border-red-400/40 bg-red-500/10 p-2 text-xs text-red-100">{{ voteError }}</p>
        <p v-if="voteMessage" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-2 text-xs text-emerald-100">{{ voteMessage }}</p>

        <button
          class="w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loading || submitting || !selectedTagId || !isVotingOpen"
          @click="submitVote"
        >
          {{ !isVotingOpen ? t('votePanel.voteClosed') : submitting ? t('votePanel.submitting') : isLoggedIn ? (hasReadEnough ? t('votePanel.submitOrUpdate') : t('votePanel.waitRead')) : t('common.signIn') }}
        </button>
      </section>

      <section v-else class="mt-4 space-y-3 border-t border-white/10 pt-4">
        <div class="rounded-md border border-cyan-300/20 bg-cyan-300/[0.05] p-3">
          <div class="flex items-center justify-between gap-3">
            <p class="text-sm font-semibold text-cyan-100">{{ t('votePanel.officialResponses') }}</p>
            <span class="text-xs text-cyan-200/70">{{ officialResponses.length }}</span>
          </div>
          <div v-if="officialResponses.length" class="mt-3 space-y-3">
            <article v-for="item in officialResponses" :key="item.id" class="rounded-md border border-cyan-300/20 bg-zinc-950/80 p-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded bg-cyan-300/15 px-2 py-1 text-[11px] font-semibold text-cyan-100">{{ item.claimant?.claim_type || item.response_type }}</span>
                <span class="text-[11px] text-zinc-500">{{ item.author?.display_name }}</span>
                <span v-if="item.author?.identity_label" class="rounded bg-white/10 px-2 py-1 text-[11px] text-zinc-300">{{ item.author.identity_label }}</span>
              </div>
              <p class="mt-3 text-sm leading-5 text-zinc-100">{{ item.response_text }}</p>
              <a v-if="item.evidence_url" :href="item.evidence_url" target="_blank" rel="noreferrer" class="mt-2 block truncate text-xs font-semibold text-cyan-200">{{ item.evidence_url }}</a>
              <div class="mt-3 flex gap-2">
                <button class="rounded-md border border-emerald-300/30 px-2 py-1 text-xs text-emerald-100 disabled:opacity-50" :disabled="isLoggedIn && !canReactToEvidence" @click="reactOfficial(item, true)">
                  {{ t('votePanel.helpful') }} {{ Number(item.helpful_weight || 0).toFixed(1) }}
                </button>
                <button class="rounded-md border border-red-300/30 px-2 py-1 text-xs text-red-100 disabled:opacity-50" :disabled="isLoggedIn && !canReactToEvidence" @click="reactOfficial(item, false)">
                  {{ t('votePanel.unhelpful') }} {{ Number(item.unhelpful_weight || 0).toFixed(1) }}
                </button>
              </div>
            </article>
          </div>
          <p v-else class="mt-2 text-xs leading-5 text-zinc-400">{{ t('votePanel.noOfficialResponses') }}</p>

          <details v-if="approvedClaimants.length" class="mt-3 rounded-md border border-white/10 bg-zinc-950/70 p-3">
            <summary class="cursor-pointer text-xs font-semibold text-cyan-100">{{ t('votePanel.submitOfficialResponse') }}</summary>
            <div class="mt-3 space-y-3">
              <p class="rounded-md border border-cyan-300/20 bg-cyan-300/[0.05] p-2 text-xs leading-5 text-cyan-100">{{ t('votePanel.officialResponseSeparateRule') }}</p>
              <select v-model="selectedClaimantId" class="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white">
                <option value="">{{ t('votePanel.selectClaimant') }}</option>
                <option v-for="claim in approvedClaimants" :key="claim.id" :value="claim.id">{{ claim.claim_type }} · {{ claim.domain || claim.organization_name || claim.id }}</option>
              </select>
              <select v-model="officialResponseType" class="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white">
                <option value="subject_clarification">{{ t('votePanel.subjectClarification') }}</option>
                <option value="author_clarification">{{ t('votePanel.authorClarification') }}</option>
                <option value="media_statement">{{ t('votePanel.mediaStatement') }}</option>
                <option value="organization_statement">{{ t('votePanel.organizationStatement') }}</option>
                <option value="right_of_reply">{{ t('votePanel.rightOfReply') }}</option>
              </select>
              <textarea v-model="officialResponseText" rows="3" class="w-full resize-none rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white" :placeholder="t('votePanel.officialResponseText')"></textarea>
              <input v-model="officialResponseEvidenceUrl" class="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white" :placeholder="t('votePanel.officialResponseEvidence')" />
              <button class="w-full rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950" @click="submitOfficialResponse">{{ t('votePanel.submitOfficialResponse') }}</button>
            </div>
          </details>
          <p v-if="officialResponseError" class="mt-2 rounded-md border border-red-400/40 bg-red-500/10 p-2 text-xs text-red-100">{{ officialResponseError }}</p>
          <p v-if="officialResponseMessage" class="mt-2 rounded-md border border-emerald-400/40 bg-emerald-500/10 p-2 text-xs text-emerald-100">{{ officialResponseMessage }}</p>
        </div>

        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-white">{{ t('votePanel.communityEvidence') }}</p>
          <span class="text-xs text-zinc-500">{{ t('votePanel.evidenceCount', { count: evidence.length }) }}</span>
        </div>

        <p v-if="isLoggedIn && !canReactToEvidence" class="rounded-md border border-orange-400/40 bg-orange-500/10 p-2 text-xs text-orange-100">
          {{ t('votePanel.lowTrustCannotReact', { score: evidenceReactionMinTrustScore.toFixed(2) }) }}
        </p>

        <p v-if="evidenceError" class="rounded-md border border-red-400/40 bg-red-500/10 p-2 text-xs text-red-100">{{ evidenceError }}</p>
        <p v-if="reportMessage" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-2 text-xs text-emerald-100">{{ reportMessage }}</p>

        <div v-if="evidence.length === 0" class="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-400">
          {{ t('votePanel.noEvidence') }}
        </div>

        <article v-for="item in evidence" :key="item.id" class="space-y-3 rounded-md border border-white/10 bg-zinc-900/80 p-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded bg-white/10 px-2 py-1 text-[11px] font-semibold text-zinc-200">{{ item.tag.name }}</span>
            <span class="rounded px-2 py-1 text-[11px] font-semibold" :class="item.is_trusted_evidence ? 'bg-emerald-500/15 text-emerald-200' : 'bg-zinc-800 text-zinc-400'">
              {{ evidenceTrustLabel(item) }}
            </span>
            <span class="ml-auto text-[11px] text-zinc-500">{{ t('evidence.netHelpfulWeight') }} {{ Number(item.net_helpful_weight).toFixed(2) }}</span>
          </div>

          <img v-if="evidencePreviewUrl(item)" :src="evidencePreviewUrl(item)" alt="" class="max-h-36 w-full rounded-md border border-white/10 object-cover" />

          <p class="text-sm leading-5 text-zinc-200">{{ item.evidence_note || t('evidence.noNote') }}</p>

          <div class="rounded-md border border-white/10 bg-white/[0.03] p-2">
            <p class="text-[11px] text-zinc-500">{{ evidenceTypeLabel(item) }}</p>
            <a :href="item.evidence_url" target="_blank" rel="noreferrer" class="mt-1 block truncate text-xs font-semibold text-cyan-200">
              {{ item.evidence_host || item.evidence_url }}
            </a>
          </div>

          <div class="flex items-center gap-2">
            <button class="rounded-md border border-emerald-300/30 px-2 py-1 text-xs text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50" :disabled="reactingId === item.id || !isVotingOpen || (isLoggedIn && !canReactToEvidence)" @click="react(item, true)">
              {{ t('votePanel.helpful') }} {{ item.helpful_count }}
            </button>
            <button class="rounded-md border border-red-300/30 px-2 py-1 text-xs text-red-100 disabled:cursor-not-allowed disabled:opacity-50" :disabled="reactingId === item.id || !isVotingOpen || (isLoggedIn && !canReactToEvidence)" @click="react(item, false)">
              {{ t('votePanel.unhelpful') }} {{ item.unhelpful_count }}
            </button>
            <button class="ml-auto rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-300" @click="reportItem(item)">
              {{ t('votePanel.report') }}
            </button>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>
