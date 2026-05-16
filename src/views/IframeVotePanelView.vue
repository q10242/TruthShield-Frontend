<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  createEvent,
  createEventEntity,
  createEventRelationship,
  createEventTimelineEntry,
  createVote,
  fetchCurrentUser,
  fetchMyVote,
  fetchNewsEvidence,
  fetchNewsStatus,
  fetchTags,
  fetchEvidenceReportReasons,
  fetchOfficialResponses,
  fetchEvents,
  fetchEventTimeline,
  fetchEventGraph,
  fetchProfile,
  recordReadSession,
  recordNewsSnapshot,
  reactToEvidence,
  reactToOfficialResponse,
  reportNewsChange,
  reportEvidence,
  createOfficialResponse,
} from '../lib/api'
import { evidenceUploadConfig, uploadEvidenceImage, validateEvidenceImage } from '../lib/evidenceUpload'
import { trackEvent } from '../lib/traffic'
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
const relatedEvents = ref([])
const eventDetailTab = ref(null) // { eventId, mode: 'timeline'|'graph' }
const eventTimeline = ref([])
const eventGraph = ref({ entities: [], relationships: [] })
const eventDetailLoading = ref(false)
const eventDetailError = ref('')
const pinEventSearch = ref('')
const pinSearchEvents = ref([])
const pinSelectedEventId = ref('')
const pinNewEventName = ref('')
const pinNewEventSummary = ref('')
const pinMode = ref('timeline')
const pinEntryTitle = ref(route.query.title_snapshot || '')
const pinEntrySummary = ref('')
const pinOccurredAt = ref(new Date().toISOString().slice(0, 16))
const pinSourceUrl = ref(route.query.news_url || '')
const pinEntityName = ref('')
const pinEntityType = ref('person')
const pinEventGraph = ref({ entities: [], relationships: [] })
const pinToEntityId = ref('')
const pinRelType = ref('')
const pinRelDesc = ref('')
const pinSubmitting = ref(false)
const pinMessage = ref('')
const pinError = ref('')
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
const evidenceUploadInput = ref(null)
const evidenceUploading = ref(false)
const evidenceUploadMessage = ref('')
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
  { key: 'events', number: 4, label: locale.value === 'en' ? 'Events' : '事件' },
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
const selectedTagCriteria = computed(() => {
  if (!selectedTag.value?.slug) return t('votePanel.tagCriteriaFallback')

  const path = `labelGuide.criteria.${selectedTag.value.slug}`
  const localized = t(path)

  return localized === path
    ? selectedTag.value.description || t('votePanel.tagCriteriaFallback')
    : localized
})
const selectedEvidenceRequirement = computed(() => {
  if (!selectedTag.value) return 'optional'

  return selectedTag.value.evidence_requirement || (selectedTag.value.requires_evidence ? 'strong_evidence' : 'optional')
})
const requiresEvidenceUrl = computed(() => {
  if (!selectedTag.value) return false
  if (typeof selectedTag.value.evidence_url_required === 'boolean') return selectedTag.value.evidence_url_required

  return selectedEvidenceRequirement.value === 'strong_evidence'
})
const requiresEvidenceNote = computed(() => {
  if (!selectedTag.value) return false
  if (typeof selectedTag.value.evidence_note_required === 'boolean') return selectedTag.value.evidence_note_required

  return Boolean(selectedTag.value.requires_evidence)
})
const selectedEvidenceGuidance = computed(() => {
  const key = `votePanel.evidenceRequirement.${selectedEvidenceRequirement.value}`
  const localized = t(key)

  return localized === key ? t('votePanel.evidenceRequirement.optional') : localized
})
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
const unlockedAchievements = computed(() => (profile.value?.achievements || []).filter((achievement) => achievement.unlocked))
const featuredAchievements = computed(() => unlockedAchievements.value.slice(0, 3))
const nextAchievement = computed(() => (profile.value?.achievements || []).find((achievement) => !achievement.unlocked) || null)
const userDisplayName = computed(() => user.value?.display_name || user.value?.name || user.value?.email || '')
const userTitle = computed(() => profile.value?.title?.name || t('profile.observer'))
const achievementCount = computed(() => profile.value?.achievement_summary?.unlocked_count || unlockedAchievements.value.length || 0)
const achievementTotal = computed(() => profile.value?.achievement_summary?.total_count || profile.value?.achievements?.length || 0)
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
    const height = collapsed.value
      ? Math.ceil(document.body.getBoundingClientRect().height || document.documentElement.scrollHeight)
      : document.documentElement.scrollHeight

    window.parent?.postMessage(
      {
        type: 'TRUTH_SHIELD_VOTE_PANEL_RESIZE',
        height,
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
      fetchEvents({ news_url: newsUrl.value, limit: 5 }).catch(() => ({ data: [] })),
    ]

    if (token.value) {
      requests.push(fetchMyVote(token.value, newsUrl.value).catch(() => ({ vote: null })))
    }

    const [statusPayload, tagPayload, evidencePayload, reportReasonsPayload, officialResponsesPayload, eventPayload, myVotePayload] = await Promise.all(requests)

    status.value = statusPayload
    tags.value = tagPayload
    evidence.value = evidencePayload
    reportReasons.value = reportReasonsPayload
    officialResponses.value = officialResponsesPayload
    relatedEvents.value = eventPayload?.data || []
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

function notifyVoteUpdated() {
  window.parent?.postMessage({
    type: 'TRUTH_SHIELD_VOTE_UPDATED',
    url: newsUrl.value,
    status: status.value,
  }, '*')
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
    trackEvent('official_response_submitted', { feature: 'official_response', url: newsUrl.value })
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
  trackEvent('login_opened', { feature: 'auth', url: newsUrl.value })
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

  if (requiresEvidenceUrl.value && !evidenceUrl.value.trim()) {
    voteError.value = t('votePanel.evidenceRequiredError')
    notifyHeight()
    return
  }

  if (requiresEvidenceNote.value && !evidenceNote.value.trim()) {
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
    trackEvent('vote_completed', {
      feature: 'vote',
      url: newsUrl.value,
      metadata: {
        tag_id: selectedTagId.value,
        has_evidence: Boolean(evidenceUrl.value.trim()),
      },
    })
    if (evidenceUrl.value.trim()) {
      trackEvent('evidence_submitted', { feature: 'evidence', url: newsUrl.value })
    }
    activeTab.value = 'results'
    evidenceUrl.value = ''
    evidenceNote.value = ''
    await loadData()
    notifyVoteUpdated()
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

function openEvidenceUploadPicker() {
  evidenceUploadMessage.value = ''
  voteError.value = ''

  if (!evidenceUploadConfig.enabled) {
    evidenceUploadMessage.value = t('votePanel.uploadNotConfigured')
    notifyHeight()
    return
  }

  evidenceUploadInput.value?.click()
}

async function handleEvidenceFileChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  evidenceUploadMessage.value = ''
  voteError.value = ''

  if (!file) return

  const validation = validateEvidenceImage(file)
  if (!validation.ok) {
    voteError.value = validation.reason === 'size'
      ? t('votePanel.uploadTooLarge', { size: evidenceUploadConfig.maxSizeMb })
      : t('votePanel.uploadImageOnly')
    notifyHeight()
    return
  }

  evidenceUploading.value = true
  notifyHeight()

  try {
    evidenceUrl.value = await uploadEvidenceImage(file)
    evidenceUploadMessage.value = t('votePanel.uploadSuccess')
    trackEvent('evidence_upload_completed', { feature: 'evidence_upload', url: newsUrl.value, metadata: { provider: evidenceUploadConfig.provider } })
  } catch (err) {
    voteError.value = err.reason === 'size'
      ? t('votePanel.uploadTooLarge', { size: evidenceUploadConfig.maxSizeMb })
      : err.reason === 'type'
        ? t('votePanel.uploadImageOnly')
        : err.message || t('votePanel.uploadFailed')
  } finally {
    evidenceUploading.value = false
    notifyHeight()
  }
}

function openExternalEvidenceTarget(url) {
  window.open(url, '_blank', 'noopener,noreferrer')
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
    trackEvent('evidence_report_completed', { feature: 'evidence_report', url: newsUrl.value })
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
    trackEvent('news_change_report_completed', { feature: 'news_change_report', url: newsUrl.value, metadata: { report_type: reportType } })
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
    trackEvent('evidence_reaction_completed', { feature: 'evidence_reaction', url: newsUrl.value, metadata: { helpful } })
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

async function openEventDetail(ev, mode) {
  if (eventDetailTab.value?.eventId === ev.id && eventDetailTab.value?.mode === mode) {
    eventDetailTab.value = null
    notifyHeight()
    return
  }
  eventDetailTab.value = { eventId: ev.id, mode }
  eventDetailLoading.value = true
  eventDetailError.value = ''
  notifyHeight()
  try {
    if (mode === 'timeline') {
      eventTimeline.value = await fetchEventTimeline(ev.id)
    } else {
      eventGraph.value = await fetchEventGraph(ev.id)
    }
  } catch (err) {
    eventDetailError.value = err.message || (locale.value === 'en' ? 'Failed to load' : '載入失敗')
  } finally {
    eventDetailLoading.value = false
    notifyHeight()
  }
}

async function searchPinEvents() {
  try {
    const payload = await fetchEvents({ q: pinEventSearch.value, limit: 20 })
    pinSearchEvents.value = payload.data || []
  } catch {
    // silent
  } finally {
    notifyHeight()
  }
}

async function loadPinEventGraph(eventId) {
  if (!eventId) { pinEventGraph.value = { entities: [], relationships: [] }; return }
  try {
    pinEventGraph.value = await fetchEventGraph(eventId)
    if (!pinToEntityId.value && pinEventGraph.value.entities?.[0]) {
      pinToEntityId.value = String(pinEventGraph.value.entities[0].id)
    }
  } catch {
    pinEventGraph.value = { entities: [], relationships: [] }
  } finally {
    notifyHeight()
  }
}

async function submitPinEntry() {
  if (!isLoggedIn.value) { openLogin(); return }
  pinError.value = ''
  pinMessage.value = ''
  pinSubmitting.value = true
  try {
    let eventId = pinSelectedEventId.value
    if (!eventId) {
      if (!pinNewEventName.value.trim()) throw new Error(locale.value === 'en' ? 'Enter an event name.' : '請填寫事件名稱。')
      const created = await createEvent(token.value, {
        name: pinNewEventName.value.trim(),
        summary: pinNewEventSummary.value.trim() || undefined,
        news_url: newsUrl.value,
        title_snapshot: route.query.title_snapshot || undefined,
      })
      eventId = created.data?.id
      pinSelectedEventId.value = String(eventId)
    }
    if (pinMode.value === 'graph') {
      if (!pinEntityName.value.trim()) throw new Error(locale.value === 'en' ? 'Enter a person or organization name.' : '請填寫人名或組織名。')
      await loadPinEventGraph(eventId)
      if (!pinEventGraph.value.entities?.length) {
        await createEventEntity(token.value, eventId, {
          name: pinEntityName.value.trim(),
          entity_type: pinEntityType.value,
          description: pinRelDesc.value.trim() || undefined,
          source_url: pinSourceUrl.value.trim() || newsUrl.value,
        })
      } else {
        if (!pinRelType.value.trim()) throw new Error(locale.value === 'en' ? 'Enter a relationship type.' : '請填寫關係類型。')
        await createEventRelationship(token.value, eventId, {
          from_entity_name: pinEntityName.value.trim(),
          from_entity_type: pinEntityType.value,
          to_entity_id: pinToEntityId.value,
          relationship_type: pinRelType.value.trim(),
          description: pinRelDesc.value.trim() || undefined,
          source_type: 'news',
          source_url: pinSourceUrl.value.trim() || newsUrl.value,
          news_url: newsUrl.value,
        })
      }
      pinMessage.value = locale.value === 'en' ? 'Added to graph.' : '已加入關係圖。'
      pinEntityName.value = ''
      pinRelType.value = ''
      pinRelDesc.value = ''
      await loadPinEventGraph(eventId)
    } else {
      await createEventTimelineEntry(token.value, eventId, {
        title: pinEntryTitle.value.trim() || route.query.title_snapshot || newsUrl.value,
        summary: pinEntrySummary.value.trim() || undefined,
        occurred_at: new Date(pinOccurredAt.value).toISOString(),
        source_type: 'news',
        source_url: pinSourceUrl.value.trim() || newsUrl.value,
        news_url: newsUrl.value,
      })
      pinMessage.value = locale.value === 'en' ? 'Pinned to event.' : '已加入事件時間線。'
      pinEntrySummary.value = ''
    }
    pinNewEventName.value = ''
    pinNewEventSummary.value = ''
    await loadData()
    pinSearchEvents.value = relatedEvents.value
  } catch (err) {
    pinError.value = err.message || (locale.value === 'en' ? 'Failed to pin.' : '提交失敗。')
  } finally {
    pinSubmitting.value = false
    notifyHeight()
  }
}

const graphLayout = computed(() => {
  const entities = eventGraph.value.entities || []
  const relationships = eventGraph.value.relationships || []
  const positions = entities.map((entity, index) => {
    const saved = entity.metadata?.graph_position
    if (saved && isFinite(+saved.x) && isFinite(+saved.y)) {
      return { x: +saved.x * 320 / 500, y: +saved.y * 240 / 370 }
    }
    const angle = (Math.PI * 2 * index) / Math.max(entities.length, 1) - Math.PI / 2
    return { x: 160 + Math.cos(angle) * 110, y: 120 + Math.sin(angle) * 85 }
  })
  const degrees = new Map()
  for (const e of entities) degrees.set(e.id, 0)
  for (const rel of relationships) {
    degrees.set(rel.from_entity_id, (degrees.get(rel.from_entity_id) || 0) + 1)
    degrees.set(rel.to_entity_id, (degrees.get(rel.to_entity_id) || 0) + 1)
  }
  const maxDeg = Math.max(1, ...Array.from(degrees.values()))
  const idxMap = new Map(entities.map((e, i) => [e.id, i]))
  const nodeLayouts = entities.map((entity, i) => {
    const { x, y } = positions[i]
    const ratio = (degrees.get(entity.id) || 0) / maxDeg
    const isOrg = entity.entity_type === 'organization'
    const fill = ratio >= 0.75 ? '#be123c' : ratio >= 0.5 ? '#b45309' : ratio >= 0.25 ? '#0f766e' : (isOrg ? '#1e3a5f' : '#27272a')
    const stroke = ratio >= 0.75 ? '#fecdd3' : ratio >= 0.5 ? '#fde68a' : ratio >= 0.25 ? '#99f6e4' : '#67e8f9'
    return { id: entity.id, x, y, r: isOrg ? 22 : 17, fill, stroke, name: entity.name.slice(0, 6), degree: degrees.get(entity.id) || 0 }
  })
  const edgeLayouts = relationships.map((rel) => {
    const fi = idxMap.get(rel.from_entity_id)
    const ti = idxMap.get(rel.to_entity_id)
    if (fi === undefined || ti === undefined) return null
    const from = positions[fi]
    const to = positions[ti]
    const fromR = nodeLayouts[fi].r + 3
    const toR = nodeLayouts[ti].r + 7
    const dx = to.x - from.x
    const dy = to.y - from.y
    const dist = Math.sqrt(dx * dx + dy * dy) || 1
    const mx = (from.x + to.x) / 2
    const my = (from.y + to.y) / 2
    return {
      id: rel.id,
      x1: from.x + (dx / dist) * fromR,
      y1: from.y + (dy / dist) * fromR,
      x2: to.x - (dx / dist) * toR,
      y2: to.y - (dy / dist) * toR,
      mx, my,
      label: String(rel.relationship_type || '').slice(0, 8),
      isRisk: rel.is_high_risk,
    }
  }).filter(Boolean)
  return { nodeLayouts, edgeLayouts }
})

watch(selectedTagId, (tagId) => {
  selectedSecondaryTagIds.value = selectedSecondaryTagIds.value.filter((id) => id !== tagId)
})

watch(activeTab, (tab) => {
  if (tab === 'events') {
    if (!pinSearchEvents.value.length) pinSearchEvents.value = [...relatedEvents.value]
    notifyHeight()
  }
})

watch([pinSelectedEventId, pinMode], ([eventId, mode]) => {
  if (mode === 'graph') loadPinEventGraph(eventId)
})

watch([collapsed, activeTab, selectedTagId, selectedSecondaryTagIds, evidenceUrl, evidenceNote, evidenceUploading, evidenceUploadMessage, voteError, voteMessage, evidenceError, reportMessage, changeReportMessage, officialResponseMessage, officialResponseError, officialResponseText, readSeconds], notifyHeight)

onMounted(async () => {
  trackEvent('vote_panel_open', { source: 'extension', feature: 'vote_panel', url: newsUrl.value })
  await loadAuth()
  await syncSnapshot()
  await loadData()
  window.addEventListener('focus', loadAuth)
  window.addEventListener('storage', loadAuth)
  window.addEventListener('message', async (event) => {
    if (event.data?.type === 'TRUTH_SHIELD_AUTH_UPDATED') {
      const isSameOriginLogin = event.origin === window.location.origin
      const isExtensionHandoff = event.source === window.parent && event.data.source === 'truthshield-extension'

      if ((isSameOriginLogin || isExtensionHandoff) && event.data.token) {
        localStorage.setItem(TOKEN_KEY, event.data.token)
        if (event.data.user) {
          localStorage.setItem(USER_KEY, JSON.stringify(event.data.user))
        }

        window.parent?.postMessage({
          type: 'TRUTH_SHIELD_AUTH_UPDATED',
          token: event.data.token,
          user: event.data.user || null,
        }, '*')
      }

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
  <main class="min-w-0 bg-transparent p-3 text-zinc-100">
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
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <a class="inline-flex min-w-0 items-center gap-2 rounded-md pr-1 hover:text-cyan-100" href="/" target="_blank" rel="noopener noreferrer" title="TruthShield">
              <img class="h-6 w-6 shrink-0" src="/brand/truthshield-mark.svg" alt="" />
              <span class="truncate text-sm font-semibold text-white">TruthShield</span>
            </a>
            <span class="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">{{ statusBadgeText }}</span>
          </div>
          <p class="mt-1 text-[11px] text-zinc-500">{{ nextActionText }}</p>
        </div>
        <button class="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-400 hover:border-cyan-300/50 hover:text-cyan-100" @click="collapsed = true">
          {{ t('votePanel.collapse') }}
        </button>
      </div>

      <div class="grid grid-cols-4 rounded-md border border-white/10 bg-white/[0.03] p-1 text-xs font-semibold">
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

      <div v-if="!isLoggedIn && isVotingOpen" class="mt-3 rounded-md border border-cyan-300/25 bg-cyan-300/[0.06] p-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-cyan-100">{{ t('votePanel.signInCtaTitle') }}</p>
            <p class="mt-1 text-xs leading-5 text-zinc-300">{{ t('votePanel.signInCtaDesc') }}</p>
          </div>
          <button class="shrink-0 rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950" @click="openLogin">
            {{ t('votePanel.signInContinue') }}
          </button>
        </div>
        <div class="mt-3 grid grid-cols-3 gap-2 text-[11px] text-zinc-300">
          <div class="rounded border border-white/10 bg-zinc-950/60 p-2">{{ t('votePanel.unlockVote') }}</div>
          <div class="rounded border border-white/10 bg-zinc-950/60 p-2">{{ t('votePanel.unlockEvidence') }}</div>
          <div class="rounded border border-white/10 bg-zinc-950/60 p-2">{{ t('votePanel.unlockBadges') }}</div>
        </div>
      </div>

      <div v-if="isLoggedIn" class="mt-3 rounded-md border border-white/10 bg-white/[0.03] p-3">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-white">{{ t('votePanel.signedInAs', { name: userDisplayName }) }}</p>
            <p class="mt-1 text-xs text-cyan-200">{{ userTitle }}</p>
            <p class="mt-1 text-[11px] text-zinc-500">
              {{ t('votePanel.trustWeightLine', { score: Number(user?.trust_score || 0).toFixed(2), count: achievementCount, total: achievementTotal }) }}
            </p>
          </div>
          <a class="shrink-0 rounded-md border border-cyan-300/30 px-3 py-2 text-xs font-semibold text-cyan-100 hover:border-cyan-300/70" href="/profile" target="_blank" rel="noopener noreferrer">
            {{ t('votePanel.openProfile') }}
          </a>
        </div>
        <div v-if="featuredAchievements.length" class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="achievement in featuredAchievements"
            :key="achievement.slug"
            class="rounded-full px-2.5 py-1 text-[11px] font-semibold text-zinc-950"
            :style="{ backgroundColor: achievement.color || '#67e8f9' }"
          >
            {{ achievement.name }}
          </span>
        </div>
        <div v-else-if="nextAchievement" class="mt-3 rounded border border-white/10 bg-zinc-950/60 p-2">
          <div class="flex items-center justify-between gap-3 text-[11px]">
            <span class="font-semibold text-zinc-300">{{ t('votePanel.nextBadge', { name: nextAchievement.name }) }}</span>
            <span class="text-zinc-500">{{ nextAchievement.current }} / {{ nextAchievement.target }}</span>
          </div>
          <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div class="h-full rounded-full" :style="{ width: `${nextAchievement.percentage}%`, backgroundColor: nextAchievement.color || '#67e8f9' }"></div>
          </div>
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
          <p class="mt-2 leading-5">{{ selectedTagCriteria }}</p>
          <p class="mt-2 leading-5 text-zinc-500">{{ t('votePanel.evidenceRuleSummary') }}</p>
          <p class="mt-2 leading-5">{{ selectedEvidenceGuidance }}</p>
        </details>

        <label class="block text-xs text-zinc-400">
          {{ t('votePanel.evidenceUrlLabel') }}<span v-if="requiresEvidenceUrl" class="text-amber-200"> *</span>
          <input
            v-model="evidenceUrl"
            class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
            :disabled="!isVotingOpen"
            :placeholder="requiresEvidenceUrl ? t('votePanel.evidenceUrlRequired') : t('votePanel.evidenceUrlOptional')"
          />
        </label>

        <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold text-white">{{ t('votePanel.directUploadTitle') }}</p>
              <p class="mt-1 text-xs leading-5 text-zinc-500">
                {{ evidenceUploadConfig.enabled ? t('votePanel.directUploadReady') : t('votePanel.directUploadFallback') }}
              </p>
            </div>
            <span class="shrink-0 rounded bg-cyan-300/10 px-2 py-1 text-[11px] font-semibold text-cyan-100">
              {{ t('votePanel.noSelfHosting') }}
            </span>
          </div>
          <input
            ref="evidenceUploadInput"
            class="hidden"
            type="file"
            accept="image/*"
            :disabled="!isVotingOpen || evidenceUploading"
            @change="handleEvidenceFileChange"
          />
          <div class="mt-3 grid gap-2 sm:grid-cols-3">
            <button
              type="button"
              class="rounded-md border border-cyan-300/30 px-3 py-2 text-xs font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!isVotingOpen || evidenceUploading"
              @click="openEvidenceUploadPicker"
            >
              {{ evidenceUploading ? t('votePanel.uploading') : t('votePanel.uploadScreenshot') }}
            </button>
            <button
              type="button"
              class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-200"
              @click="openExternalEvidenceTarget(evidenceUploadConfig.openImageHostUrl)"
            >
              {{ t('votePanel.openImageHost') }}
            </button>
            <button
              type="button"
              class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-200"
              @click="openExternalEvidenceTarget(evidenceUploadConfig.openCloudDriveUrl)"
            >
              {{ t('votePanel.openCloudDrive') }}
            </button>
          </div>
          <p v-if="evidenceUploadMessage" class="mt-2 rounded-md border border-emerald-400/30 bg-emerald-500/10 p-2 text-xs text-emerald-100">
            {{ evidenceUploadMessage }}
          </p>
        </div>

        <label class="block text-xs text-zinc-400">
          {{ t('votePanel.evidenceNoteLabel') }}<span v-if="requiresEvidenceNote" class="text-amber-200"> *</span>
          <textarea
            v-model="evidenceNote"
            rows="3"
            class="mt-2 w-full resize-none rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
            :disabled="!isVotingOpen"
            :placeholder="requiresEvidenceNote ? t('votePanel.evidenceNoteRequired') : t('votePanel.optional')"
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

      <section v-else-if="activeTab === 'events'" class="mt-4 space-y-3">
        <div>
          <p class="text-xs font-semibold text-zinc-400">{{ locale === 'en' ? 'Linked events' : '關聯事件' }}</p>
          <div v-if="relatedEvents.length" class="mt-2 space-y-2">
            <div v-for="ev in relatedEvents" :key="ev.id" class="rounded border border-cyan-300/20 bg-zinc-950/70 p-2">
              <div class="flex items-center justify-between gap-2">
                <p class="truncate text-xs font-semibold text-cyan-100">{{ ev.name }}</p>
                <a :href="`/events/${ev.id}`" target="_blank" rel="noopener noreferrer" class="shrink-0 text-[11px] text-zinc-500 hover:text-cyan-100">↗</a>
              </div>
              <p class="mt-0.5 text-[11px] text-zinc-500">{{ locale === 'en' ? 'Timeline' : '時間線' }} {{ ev.counts?.timeline ?? 0 }} · {{ locale === 'en' ? 'Graph' : '關係圖' }} {{ ev.counts?.relationships ?? 0 }}</p>
              <div class="mt-2 flex flex-wrap gap-1.5">
                <button class="rounded px-2 py-1 text-[11px] font-semibold" :class="eventDetailTab?.eventId === ev.id && eventDetailTab?.mode === 'timeline' ? 'bg-cyan-300 text-zinc-950' : 'bg-cyan-300/15 text-cyan-100'" @click="openEventDetail(ev, 'timeline')">{{ locale === 'en' ? 'Timeline' : '時間線' }}</button>
                <button class="rounded px-2 py-1 text-[11px] font-semibold" :class="eventDetailTab?.eventId === ev.id && eventDetailTab?.mode === 'graph' ? 'bg-cyan-300 text-zinc-950' : 'bg-cyan-300/15 text-cyan-100'" @click="openEventDetail(ev, 'graph')">{{ locale === 'en' ? 'Graph' : '關係圖' }}</button>
              </div>
              <div v-if="eventDetailTab?.eventId === ev.id" class="mt-2">
                <div v-if="eventDetailLoading" class="text-[11px] text-zinc-400">{{ locale === 'en' ? 'Loading...' : '載入中...' }}</div>
                <div v-else-if="eventDetailError" class="text-[11px] text-red-300">{{ eventDetailError }}</div>
                <template v-else-if="eventDetailTab.mode === 'timeline'">
                  <div v-if="!eventTimeline.length" class="text-[11px] text-zinc-500">{{ locale === 'en' ? 'No timeline entries yet.' : '尚無時間線資料。' }}</div>
                  <div v-else class="space-y-2 border-l-2 border-cyan-300/20 pl-3">
                    <div v-for="entry in eventTimeline" :key="entry.id">
                      <p class="text-[10px] text-zinc-500">{{ entry.occurred_at ? formatDateTime(entry.occurred_at) : '' }} · {{ entry.source_type }}</p>
                      <p class="text-[11px] font-semibold leading-snug text-zinc-200">{{ entry.title }}</p>
                      <p v-if="entry.summary" class="mt-0.5 text-[11px] leading-relaxed text-zinc-400">{{ entry.summary }}</p>
                      <a v-if="entry.source_url" :href="entry.source_url" target="_blank" rel="noopener noreferrer" class="mt-0.5 block truncate text-[10px] text-cyan-300">{{ entry.source_url }}</a>
                    </div>
                  </div>
                </template>
                <template v-else-if="eventDetailTab.mode === 'graph'">
                  <div v-if="!eventGraph.entities?.length" class="text-[11px] text-zinc-500">{{ locale === 'en' ? 'No nodes yet.' : '尚無節點。' }}</div>
                  <svg v-else viewBox="0 0 320 240" class="w-full rounded border border-white/10" style="background:#09090b">
                    <defs>
                      <marker id="vp-arrow" viewBox="0 0 8 8" refX="6.8" refY="4" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                        <path d="M 0 0 L 8 4 L 0 8 z" fill="#67e8f9" />
                      </marker>
                    </defs>
                    <g v-for="edge in graphLayout.edgeLayouts" :key="edge.id">
                      <line :x1="edge.x1" :y1="edge.y1" :x2="edge.x2" :y2="edge.y2" :stroke="edge.isRisk ? '#f97316' : '#67e8f9'" stroke-width="1.5" opacity="0.65" marker-end="url(#vp-arrow)" />
                      <template v-if="edge.label">
                        <rect :x="edge.mx - edge.label.length * 3.5 - 4" :y="edge.my - 7" :width="edge.label.length * 7 + 8" height="14" rx="3" fill="#09090b" :stroke="edge.isRisk ? '#f97316' : '#155e75'" opacity="0.95" />
                        <text :x="edge.mx" :y="edge.my + 1" text-anchor="middle" dominant-baseline="middle" :fill="edge.isRisk ? '#fed7aa' : '#cffafe'" font-size="8" font-weight="700">{{ edge.label }}</text>
                      </template>
                    </g>
                    <g v-for="node in graphLayout.nodeLayouts" :key="node.id">
                      <circle :cx="node.x" :cy="node.y" :r="node.r" :fill="node.fill" :stroke="node.stroke" stroke-width="1.5" />
                      <text :x="node.x" :y="node.y + 3" text-anchor="middle" fill="#fff" font-size="9" pointer-events="none">{{ node.name }}</text>
                    </g>
                  </svg>
                </template>
              </div>
            </div>
          </div>
          <p v-else class="mt-1 text-[11px] text-zinc-500">{{ locale === 'en' ? 'No events linked to this article yet.' : '此文章尚未關聯任何事件。' }}</p>
        </div>

        <div class="space-y-2 rounded-md border border-cyan-300/20 bg-cyan-300/[0.05] p-3">
          <p class="text-xs font-semibold text-cyan-100">{{ locale === 'en' ? 'Pin this article to an event' : 'Pin 此文章到事件' }}</p>
          <div v-if="!isLoggedIn" class="text-[11px] text-amber-200">{{ locale === 'en' ? 'Sign in to pin articles to events.' : '登入後才能 Pin 文章。' }}</div>

          <div class="flex rounded border border-white/10 bg-zinc-900 p-0.5 text-xs font-semibold">
            <button class="flex-1 rounded py-1.5 transition-colors" :class="pinMode === 'timeline' ? 'bg-cyan-300 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'" @click="pinMode = 'timeline'">{{ locale === 'en' ? 'Timeline' : '時間線' }}</button>
            <button class="flex-1 rounded py-1.5 transition-colors" :class="pinMode === 'graph' ? 'bg-cyan-300 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'" @click="pinMode = 'graph'">{{ locale === 'en' ? 'Graph' : '關係圖' }}</button>
          </div>

          <div class="flex gap-1.5">
            <input v-model="pinEventSearch" class="min-w-0 flex-1 rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="locale === 'en' ? 'Search events...' : '搜尋事件...'" @keydown.enter.prevent="searchPinEvents" />
            <button type="button" class="rounded border border-white/10 px-2 py-1.5 text-xs font-semibold text-zinc-200" @click="searchPinEvents">{{ locale === 'en' ? 'Search' : '搜尋' }}</button>
          </div>
          <select v-model="pinSelectedEventId" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300">
            <option value="">{{ locale === 'en' ? '+ Create new event' : '＋ 建立新事件' }}</option>
            <option v-for="ev in pinSearchEvents" :key="ev.id" :value="String(ev.id)">{{ ev.name }}</option>
          </select>
          <template v-if="!pinSelectedEventId">
            <input v-model="pinNewEventName" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="locale === 'en' ? 'Event name *' : '事件名稱 *'" />
            <textarea v-model="pinNewEventSummary" rows="2" class="w-full resize-none rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="locale === 'en' ? 'Event summary' : '事件摘要'"></textarea>
          </template>

          <template v-if="pinMode === 'timeline'">
            <input v-model="pinEntryTitle" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="locale === 'en' ? 'Entry title *' : '時間線標題 *'" />
            <textarea v-model="pinEntrySummary" rows="2" class="w-full resize-none rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="locale === 'en' ? 'Summary' : '摘要'"></textarea>
            <input v-model="pinOccurredAt" type="datetime-local" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" />
            <input v-model="pinSourceUrl" type="url" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="locale === 'en' ? 'Source URL' : '參考資料 URL'" />
          </template>

          <template v-else>
            <p v-if="pinSelectedEventId && !pinEventGraph.entities?.length" class="rounded border border-cyan-300/20 bg-cyan-300/10 px-2 py-1.5 text-[11px] text-cyan-200">
              {{ locale === 'en' ? 'No nodes yet — this will create the first node.' : '此圖尚無節點，將建立第一個節點。' }}
            </p>
            <input v-model="pinEntityName" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="locale === 'en' ? 'Person or org name *' : '人名或組織名 *'" />
            <select v-model="pinEntityType" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300">
              <option value="person">{{ locale === 'en' ? 'Person' : '人物' }}</option>
              <option value="organization">{{ locale === 'en' ? 'Organization' : '組織' }}</option>
            </select>
            <template v-if="pinEventGraph.entities?.length">
              <select v-model="pinToEntityId" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300">
                <option v-for="e in pinEventGraph.entities" :key="e.id" :value="String(e.id)">{{ e.name }} · {{ e.entity_type }}</option>
              </select>
              <input v-model="pinRelType" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="locale === 'en' ? 'Relationship type * (e.g. works for)' : '關係 *（任職於、指控、隸屬...）'" />
            </template>
            <textarea v-model="pinRelDesc" rows="2" class="w-full resize-none rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="locale === 'en' ? 'Description' : '說明'"></textarea>
            <input v-model="pinSourceUrl" type="url" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="locale === 'en' ? 'Source URL' : '參考資料 URL'" />
          </template>

          <p v-if="pinError" class="text-[11px] text-red-300">{{ pinError }}</p>
          <p v-if="pinMessage" class="text-[11px] text-emerald-300">{{ pinMessage }}</p>
          <button class="w-full rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50" :disabled="pinSubmitting || !isLoggedIn" @click="submitPinEntry">
            {{ pinSubmitting ? (locale === 'en' ? 'Submitting...' : '送出中...') : (locale === 'en' ? 'Submit Pin' : '提交 Pin') }}
          </button>
        </div>
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
