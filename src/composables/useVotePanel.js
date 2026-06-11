import { computed, nextTick, onMounted, ref, watch } from 'vue'
import {
  createEvent,
  createEventEntity,
  createEventRelationship,
  createEventTimelineEntry,
  createVote,
  fetchCurrentUser,
  fetchReactionSummary,
  fetchMyVote,
  fetchNewsEvidence,
  fetchNewsStatus,
  fetchTags,
  fetchEvidenceReportReasons,
  fetchOfficialResponses,
  fetchEvents,
  fetchEventOptions,
  fetchEventTimeline,
  fetchEventGraph,
  fetchProfile,
  recordReadSession,
  recordNewsSnapshot,
  reactToEvidence,
  reactToOfficialResponse,
  reportNewsChange,
  reportJournalistMatch,
  reportEvidence,
  createOfficialResponse,
  submitReaderReaction,
} from '../lib/api'
import { evidenceUploadConfig, uploadEvidenceImage, validateEvidenceImage } from '../lib/evidenceUpload'
import { trackEvent } from '../lib/traffic'
import { useI18n } from '../i18n'

const TOKEN_KEY = 'truthshield_api_token'
const USER_KEY = 'truthshield_user'

export function useVotePanel(route) {
  const { locale, t } = useI18n()
  const collapsed = ref(route.query.expanded !== '1')
  const initialTab = ['results', 'reactions', 'vote', 'evidence', 'events'].includes(route.query.tab) ? route.query.tab : 'results'
  const activeTab = ref(initialTab)
  const loading = ref(true)
  const statusLoading = ref(true)
  const hasLoadedStatus = ref(false)
  const error = ref('')
  const voteError = ref('')
  const voteMessage = ref('')
  const achievementToastMessage = ref('')
  const evidenceError = ref('')
  const reportMessage = ref('')
  const changeReportMessage = ref('')
  const readMessage = ref('')
  const status = ref(null)
  const tags = ref([])
  const evidence = ref([])
  const officialResponses = ref([])
  const relatedEvents = ref([])
  const reactionSummary = ref(null)
  const reactionOptions = ref({ feelings: [], needs: [] })
  const reactionLoading = ref(false)
  const reactionSubmitting = ref(false)
  const reactionError = ref('')
  const reactionMessage = ref('')
  const selectedReactionEventId = ref('')
  const selectedFeelings = ref([])
  const selectedNeeds = ref([])
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
  const pinEventOptions = ref({ primary_categories: [], tags: [], progress_statuses: [] })
  const pinNewEventPrimaryCategory = ref('')
  const pinNewEventTags = ref([])
  const pinNewEventProgressStatus = ref('collecting')
  const pinMode = ref('timeline')
  const pinEntryTitle = ref(route.query.title_snapshot || '')
  const pinEntrySummary = ref('')
  const pinOccurredAt = ref(new Date().toISOString().slice(0, 16))
  const pinSourceUrl = ref(route.query.news_url || '')
  const pinEntityName = ref('')
  const pinEntityType = ref('person')
  const pinEventGraph = ref({ entities: [], relationships: [] })
  const pinGraphMode = ref('entity') // 'entity' | 'relationship'
  const pinFromEntityId = ref('')
  const pinToEntityId = ref('')
  const pinRelType = ref('')
  const pinRelDesc = ref('')
  const pinIsBidirectional = ref(false)
  const pinSubmitting = ref(false)
  const pinMessage = ref('')
  const pinError = ref('')
  const lastResizePayload = { height: 0, collapsed: null }
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
  const lastReadSessionSyncSecond = ref(0)
  const advancedMode = ref(false)
  const lastAuthHandoffSignature = ref('')
  const authRefreshInFlight = ref(false)

  const tabSteps = computed(() => [
    { key: 'results', number: 1, label: t('votePanel.tabs.results') },
    { key: 'reactions', number: 2, label: t('votePanel.tabs.reactions') },
    { key: 'vote', number: 3, label: t('votePanel.tabs.vote') },
    { key: 'evidence', number: 4, label: t('votePanel.tabs.evidence') },
    { key: 'events', number: 5, label: t('votePanel.tabs.context') },
  ])
  const visibleTabSteps = computed(() => {
    return tabSteps.value
      .filter((step) => step.key !== 'events' || advancedMode.value || relatedEvents.value.length)
      .map((step, index) => ({ ...step, number: index + 1 }))
  })

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

    return false
  })
  const selectedEvidenceGuidance = computed(() => {
    const key = `votePanel.evidenceRequirement.${selectedEvidenceRequirement.value}`
    const localized = t(key)

    return localized === key ? t('votePanel.evidenceRequirement.optional') : localized
  })
  const selectedEvidenceUrlLabel = computed(() => {
    if (!selectedTag.value) return t('votePanel.evidenceUrlLabel')
    const requirement = selectedEvidenceRequirement.value
    if (requirement === 'context_note') return t('votePanel.contextSourceLabel')
    if (requirement === 'disclosure_note') return t('votePanel.disclosureSourceLabel')
    if (requiresEvidenceUrl.value) return t('votePanel.evidenceUrlLabel')

    return t('votePanel.optionalSourceLabel')
  })
  const selectedEvidenceNoteLabel = computed(() => {
    if (!selectedTag.value) return t('votePanel.evidenceNoteLabel')
    const requirement = selectedEvidenceRequirement.value
    if (requirement === 'context_note') return t('votePanel.contextReasonLabel')
    if (requirement === 'disclosure_note') return t('votePanel.disclosureReasonLabel')

    return t('votePanel.evidenceNoteLabel')
  })
  const selectedEvidenceNotePlaceholder = computed(() => {
    if (!selectedTag.value) return t('votePanel.optional')
    const requirement = selectedEvidenceRequirement.value
    if (requirement === 'context_note') return t('votePanel.contextReasonPlaceholder')
    if (requirement === 'disclosure_note') return t('votePanel.disclosureReasonPlaceholder')
    if (requiresEvidenceNote.value) return t('votePanel.evidenceNoteRequired')

    return t('votePanel.optional')
  })
  const isLoggedIn = computed(() => Boolean(token.value))
  const totalWeight = computed(() => Number(status.value?.total_weight || 0))
  const distribution = computed(() => status.value?.distribution || [])
  const secondaryDistribution = computed(() => status.value?.secondary_distribution || [])
  const evidenceVerdict = computed(() => status.value?.evidence_verdict || null)
  const mediaContext = computed(() => status.value?.media_context || null)
  const journalistContext = computed(() => status.value?.journalist_context || [])
  const evidenceVerdictLabel = computed(() => {
    const direction = evidenceVerdict.value?.direction || 'insufficient_evidence'
    return t(`votePanel.evidenceVerdict.${direction}`)
  })
  const clusterSummary = computed(() => {
    const count = Number(status.value?.cluster_url_count || 0)
    return {
      id: status.value?.cluster_id || null,
      count,
      title: status.value?.canonical_title || '',
      visible: count > 1,
    }
  })
  const evidenceReactionMinTrustScore = computed(() => Number(user.value?.evidence_reaction_min_trust_score ?? 0.5))
  const eventSystemMinTrustScore = computed(() => Number(user.value?.event_system_min_trust_score ?? 1.0))
  const canReactToEvidence = computed(() => {
    if (!isLoggedIn.value) return true
    if (typeof user.value?.can_react_to_evidence === 'boolean') return user.value.can_react_to_evidence

    return Number(user.value?.trust_score || 0) >= evidenceReactionMinTrustScore.value
  })
  const canUseEventSystem = computed(() => {
    if (!isLoggedIn.value) return true
    if (typeof user.value?.can_use_event_system === 'boolean') return user.value.can_use_event_system

    return Boolean(user.value?.is_admin) || Number(user.value?.trust_score ?? 1.0) >= eventSystemMinTrustScore.value
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
  const estimatedVoteWeight = computed(() => {
    if (!isLoggedIn.value) return 0
    const trust = Number(user.value?.trust_score || 0)
    const identity = Number(user.value?.identity_multiplier ?? 1)
    const abuse = Number(user.value?.abuse_multiplier ?? 1)

    return Math.max(0, trust * identity * abuse)
  })
  const isVotingOpen = computed(() => (status.value?.voting_closes_at ? Boolean(status.value?.is_open) : true))
  const hasReadEnough = computed(() => readMinimum.value <= 0 || readSeconds.value >= readMinimum.value || Boolean(myVote.value))
  const cannotVoteReasons = computed(() => {
    const reasons = []
    if (!isVotingOpen.value) reasons.push(t('votePanel.cannotVoteClosed'))
    if (!isLoggedIn.value) reasons.push(t('votePanel.cannotVoteLogin'))
    if (isVotingOpen.value && isLoggedIn.value && !hasReadEnough.value) {
      reasons.push(t('votePanel.cannotVoteRead', { seconds: Math.max(0, readMinimum.value - readSeconds.value) }))
    }
    if (selectedTag.value && requiresEvidenceUrl.value && !evidenceUrl.value.trim()) reasons.push(t('votePanel.cannotVoteEvidenceUrl'))
    if (selectedTag.value && requiresEvidenceNote.value && !evidenceNote.value.trim()) reasons.push(t('votePanel.cannotVoteEvidenceNote'))

    return reasons
  })
  const primaryCannotVoteReason = computed(() => cannotVoteReasons.value[0] || '')
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
  const activeStepNumber = computed(() => visibleTabSteps.value.find((step) => step.key === activeTab.value)?.number || 1)
  const readerReactionRows = computed(() => [
    ...(reactionSummary.value?.summary?.feelings || []),
    ...(reactionSummary.value?.summary?.needs || []),
  ].slice(0, 6))
  const hoverReactionRows = computed(() => reactionSummary.value?.hover_reactions || [])
  const reactionTotalUsers = computed(() => reactionSummary.value?.summary?.total_users || 0)
  const reactionTargetLabel = computed(() => {
    if (selectedReactionEventId.value) {
      const event = relatedEvents.value.find((item) => String(item.id) === String(selectedReactionEventId.value))
      return event?.name || t('votePanel.readerReactionTargetEvent')
    }

    return t('votePanel.readerReactionTargetNews')
  })

  const toneClass = computed(() => {
    const tone = status.value?.tone

    if (tone === 'danger') return 'border-red-400/50 bg-red-500/15 text-red-100'
    if (tone === 'positive') return 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100'
    if (tone === 'warning') return 'border-orange-400/50 bg-orange-500/15 text-orange-100'

    return 'border-white/10 bg-white/[0.04] text-zinc-200'
  })

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
      const bidir = Boolean(rel.is_bidirectional)
      return {
        id: rel.id,
        x1: from.x + (dx / dist) * (bidir ? toR : fromR),
        y1: from.y + (dy / dist) * (bidir ? toR : fromR),
        x2: to.x - (dx / dist) * toR,
        y2: to.y - (dy / dist) * toR,
        mx, my,
        label: String(rel.relationship_type || '').slice(0, 8),
        isRisk: rel.is_high_risk,
        isBidirectional: bidir,
      }
    }).filter(Boolean)
    return { nodeLayouts, edgeLayouts }
  })
  const groupedVotingTags = computed(() => {
    const groups = [
      { key: 'positive', label: t('votePanel.tagGroupPositive'), match: (tag) => tag.severity === 'positive' },
      { key: 'headline', label: t('votePanel.tagGroupHeadline'), match: (tag) => ['clickbait_headline', 'headline_mismatch', 'misleading_headline'].includes(tag.slug) || String(tag.slug || '').includes('headline') || String(tag.name || '').includes('標題') },
      { key: 'context', label: t('votePanel.tagGroupContext'), match: (tag) => ['single_source', 'lack_of_balance', 'missing_context', 'out_of_context', 'hidden_facts'].includes(tag.slug) || tag.evidence_requirement === 'context_note' },
      { key: 'source', label: t('votePanel.tagGroupSource'), match: (tag) => ['unverified_source', 'anonymous_source', 'wrong_source', 'fabricated'].includes(tag.slug) || String(tag.slug || '').includes('source') },
      { key: 'commercial', label: t('votePanel.tagGroupCommercial'), match: (tag) => ['sponsored_content', 'content_farm', 'undisclosed_sponsorship'].includes(tag.slug) || tag.evidence_requirement === 'disclosure_note' },
    ]
    const used = new Set()
    const resolved = groups.map((group) => {
      const items = tags.value.filter((tag) => {
        if (used.has(tag.id)) return false
        const matched = group.match(tag)
        if (matched) used.add(tag.id)
        return matched
      })
      return { key: group.key, label: group.label, tags: items }
    }).filter((group) => group.tags.length)
    const other = tags.value.filter((tag) => !used.has(tag.id))
    if (other.length) resolved.push({ key: 'other', label: t('votePanel.tagGroupOther'), tags: other })

    return resolved
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
      const nextCollapsed = Boolean(collapsed.value)

      if (height === lastResizePayload.height && nextCollapsed === lastResizePayload.collapsed) {
        return
      }

      lastResizePayload.height = height
      lastResizePayload.collapsed = nextCollapsed

      window.parent?.postMessage(
        {
          type: 'TRUTH_SHIELD_VOTE_PANEL_RESIZE',
          height,
          collapsed: nextCollapsed,
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
      readMinimum.value = Number(user.value?.min_read_seconds_before_vote ?? 15)
      localStorage.setItem(USER_KEY, JSON.stringify(user.value))
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        token.value = ''
        user.value = null
        profile.value = null
      }

      return
    }

    profile.value = await fetchProfile(token.value).catch(() => null)
  }

  function requestAuthFromParent() {
    window.parent?.postMessage({
      type: 'TRUTH_SHIELD_AUTH_REQUEST',
      source: 'truthshield-vote-panel',
    }, '*')
  }

  async function handleAuthMessage(event) {
    if (event.data?.type === 'TRUTH_SHIELD_AUTH_UPDATED') {
      const isSameOriginLogin = event.origin === window.location.origin
      const isExtensionHandoff = event.source === window.parent && event.data.source === 'truthshield-extension'
      const authSignature = event.data.token
        ? `${event.data.token}:${JSON.stringify(event.data.user || null)}`
        : ''

      if (authSignature && authSignature === lastAuthHandoffSignature.value && (authRefreshInFlight.value || status.value || statusLoading.value)) {
        return
      }

      lastAuthHandoffSignature.value = authSignature

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

      if (authRefreshInFlight.value) return
      authRefreshInFlight.value = true
      try {
        await loadAuth()
        await syncReadSession()
        await loadData()
      } finally {
        authRefreshInFlight.value = false
        notifyHeight()
      }
    }

    if (event.data?.type === 'TRUTH_SHIELD_AUTH_CLEARED') {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      token.value = ''
      user.value = null
      profile.value = null
      notifyHeight()
    }

    if (event.data?.type === 'TRUTH_SHIELD_ARTICLE_READ_TICK') {
      readSeconds.value = Math.max(readSeconds.value, Number(event.data.secondsRead || 0))
      if (shouldSyncReadSession()) {
        await syncReadSession()
      }
    }
  }

  function shouldSyncReadSession() {
    const seconds = Number(readSeconds.value || 0)
    if (seconds <= 0 || seconds <= lastReadSessionSyncSecond.value) return false

    const crossedReadThreshold = seconds >= readMinimum.value && lastReadSessionSyncSecond.value < readMinimum.value
    return crossedReadThreshold || seconds % 5 === 0
  }

  async function syncReadSession() {
    if (!token.value || !newsUrl.value || document.hidden) return
    lastReadSessionSyncSecond.value = Number(readSeconds.value || 0)

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

      if (shouldSyncReadSession()) {
        syncReadSession()
      }
    }, 1000)
  }

  async function loadData(options = {}) {
    error.value = ''
    evidenceError.value = ''
    statusLoading.value = !hasLoadedStatus.value

    try {
      if (!newsUrl.value) throw new Error('Missing news_url')

      const requests = [
        fetchNewsStatus(newsUrl.value, { fresh: Boolean(options.freshStatus) }),
        fetchTags(),
        fetchNewsEvidence(newsUrl.value),
        fetchEvidenceReportReasons(),
        fetchOfficialResponses(newsUrl.value),
        fetchEvents({ news_url: newsUrl.value, limit: 5 }).catch(() => ({ data: [] })),
        fetchEventOptions().catch(() => ({ primary_categories: [], tags: [], progress_statuses: [] })),
        fetchReactionSummary({ news_url: newsUrl.value }, token.value).catch(() => null),
      ]

      if (token.value) {
        requests.push(fetchMyVote(token.value, newsUrl.value).catch(() => ({ vote: null })))
      }

      const [statusPayload, tagPayload, evidencePayload, reportReasonsPayload, officialResponsesPayload, eventPayload, eventOptionsPayload, reactionPayload, myVotePayload] = await Promise.all(requests)

      status.value = statusPayload
      hasLoadedStatus.value = true
      tags.value = tagPayload
      evidence.value = evidencePayload
      reportReasons.value = reportReasonsPayload
      officialResponses.value = officialResponsesPayload
      relatedEvents.value = eventPayload?.data || []
      pinEventOptions.value = eventOptionsPayload
      applyReactionPayload(reactionPayload)
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
      error.value = friendlyError(err, t('votePanel.unavailable'))
    } finally {
      loading.value = false
      statusLoading.value = false
      notifyHeight()
    }
  }

  function applyReactionPayload(payload) {
    if (!payload) return

    reactionSummary.value = payload
    reactionOptions.value = payload.options || reactionOptions.value
    if (Array.isArray(payload.related_events) && payload.related_events.length) {
      relatedEvents.value = relatedEvents.value.length ? relatedEvents.value : payload.related_events
    }

    selectedFeelings.value = Array.isArray(payload.my_reaction?.feelings) ? [...payload.my_reaction.feelings] : []
    selectedNeeds.value = Array.isArray(payload.my_reaction?.needs) ? [...payload.my_reaction.needs] : []
  }

  async function loadReactionSummary(eventId = selectedReactionEventId.value) {
    reactionLoading.value = true
    reactionError.value = ''
    try {
      const payload = await fetchReactionSummary({
        news_url: newsUrl.value,
        event_id: eventId || undefined,
      }, token.value)
      applyReactionPayload(payload)
    } catch (err) {
      reactionError.value = friendlyError(err, t('votePanel.readerReactionLoadFailed'))
    } finally {
      reactionLoading.value = false
      notifyHeight()
    }
  }

  async function selectReactionEvent(eventId) {
    selectedReactionEventId.value = eventId ? String(eventId) : ''
    await loadReactionSummary(selectedReactionEventId.value)
  }

  function toggleReaderReaction(kind, key) {
    const target = kind === 'need' ? selectedNeeds : selectedFeelings
    const existing = target.value.includes(key)
    reactionError.value = ''

    if (existing) {
      target.value = target.value.filter((item) => item !== key)
      return
    }

    if (target.value.length >= 3) {
      reactionError.value = t('votePanel.readerReactionLimit')
      return
    }

    target.value = [...target.value, key]
  }

  async function submitReaction() {
    if (!isLoggedIn.value) { openLogin(); return }
    if (!selectedFeelings.value.length && !selectedNeeds.value.length) {
      reactionError.value = t('votePanel.readerReactionRequired')
      return
    }

    reactionSubmitting.value = true
    reactionError.value = ''
    reactionMessage.value = ''
    try {
      const currentRelatedEvents = reactionSummary.value?.related_events || relatedEvents.value
      const payload = await submitReaderReaction(token.value, {
        news_url: newsUrl.value,
        event_id: selectedReactionEventId.value || undefined,
        feelings: selectedFeelings.value,
        needs: selectedNeeds.value,
      })
      applyReactionPayload({ ...payload, related_events: currentRelatedEvents })
      reactionMessage.value = t('votePanel.readerReactionSaved')
      trackEvent('reader_reaction_submitted', {
        source: 'extension',
        feature: 'vote_panel',
        url: newsUrl.value,
        metadata: {
          target: payload.target?.subject_type || 'news_url',
          feelings: selectedFeelings.value,
          needs: selectedNeeds.value,
        },
      })
    } catch (err) {
      reactionError.value = friendlyError(err, t('votePanel.readerReactionFailed'))
    } finally {
      reactionSubmitting.value = false
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

  async function shareCurrentResult() {
    const text = status.value?.display_text || t('votePanel.noData')
    const shareUrl = newsUrl.value || window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: 'TruthShield', text, url: shareUrl })
        return
      }
      await navigator.clipboard?.writeText(`${text}\n${shareUrl}`)
      voteMessage.value = t('votePanel.shareCopied')
    } catch {
      voteMessage.value = t('votePanel.shareFallback')
    } finally {
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
    achievementToastMessage.value = ''

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
      const previousAchievementCount = achievementCount.value
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
      await loadData({ freshStatus: true })
      if (achievementCount.value > previousAchievementCount) {
        achievementToastMessage.value = t('votePanel.achievementUnlocked')
      } else if (nextAchievement.value) {
        achievementToastMessage.value = t('votePanel.achievementProgress', { name: nextAchievement.value.name })
      }
      notifyVoteUpdated()
    } catch (err) {
      voteError.value = friendlyError(err, t('votePanel.voteFailed'))
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

  async function reportJournalistMismatch(matchId) {
    if (!matchId) return

    try {
      await reportJournalistMatch(matchId, { reason: '使用者回報作者對應可能有誤。' })
      const rows = Array.isArray(status.value?.journalist_context) ? status.value.journalist_context : []
      status.value = {
        ...status.value,
        journalist_context: rows.map((row) => row.match_id === matchId ? { ...row, review_status: 'reported', included_in_stats: false } : row),
      }
    } catch {
      // Keep this lightweight; users can still report through the main bug form if needed.
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

    if (!canReactToEvidence.value) {
      evidenceError.value = t('votePanel.reactionMinTrust', { score: evidenceReactionMinTrustScore.value.toFixed(2) })
      notifyHeight()
      return
    }

    reactingId.value = item.id

    try {
      const verdict = helpful
        ? { credibility: 4, relevance: 4, direction: 'supports' }
        : { credibility: 2, relevance: 3, direction: 'contextual' }
      await reactToEvidence(token.value, item.id, helpful, verdict)
      evidence.value = await fetchNewsEvidence(newsUrl.value)
      trackEvent('evidence_reaction_completed', { feature: 'evidence_reaction', url: newsUrl.value, metadata: { helpful, direction: verdict.direction } })
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

  function evidenceQualityState(item) {
    const netWeight = Number(item.net_helpful_weight || 0)
    const helpful = Number(item.helpful_count || 0)
    const unhelpful = Number(item.unhelpful_count || 0)
    if (item.is_trusted_evidence || netWeight >= 2) return 'strong'
    if (netWeight < 0 || unhelpful > helpful) return 'disputed'

    return 'pending'
  }

  function evidenceQualityLabel(item) {
    return t(`votePanel.evidenceQuality.${evidenceQualityState(item)}`)
  }

  function evidenceQualityClass(item) {
    const state = evidenceQualityState(item)
    if (state === 'strong') return 'bg-emerald-500/15 text-emerald-200'
    if (state === 'disputed') return 'bg-orange-500/15 text-orange-100'

    return 'bg-zinc-800 text-zinc-400'
  }

  function tagEvidenceRequirement(tag) {
    if (!tag) return 'optional'

    return tag.evidence_requirement || (tag.requires_evidence ? 'strong_evidence' : 'optional')
  }

  function tagEvidenceBadge(tag) {
    const requirement = tagEvidenceRequirement(tag)
    if (tag.evidence_url_required || requirement === 'strong_evidence') return t('votePanel.badgeEvidenceUrl')
    if (tag.evidence_note_required || requirement === 'context_note' || requirement === 'disclosure_note') return t('votePanel.badgeTextReason')

    return t('votePanel.badgeOptional')
  }

  function tagEvidenceBadgeClass(tag) {
    const requirement = tagEvidenceRequirement(tag)
    if (tag.evidence_url_required || requirement === 'strong_evidence') return 'border-amber-300/30 bg-amber-300/10 text-amber-100'
    if (tag.evidence_note_required || requirement === 'context_note' || requirement === 'disclosure_note') return 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100'

    return 'border-white/10 bg-white/5 text-zinc-400'
  }

  function tagPlainHint(tag) {
    if (!tag?.slug) return tag?.description || t('votePanel.tagPlainFallback')
    const path = `labelGuide.criteria.${tag.slug}`
    const localized = t(path)
    const text = localized === path ? tag.description || t('votePanel.tagPlainFallback') : localized

    return text.length > 88 ? `${text.slice(0, 88)}...` : text
  }

  function friendlyError(err, fallback = '') {
    const statusCode = err?.status || err?.payload?.status
    if (statusCode === 401) return t('votePanel.errorUnauthorized')
    if (statusCode === 403) return t('votePanel.errorForbidden')
    if (statusCode === 409) return t('votePanel.voteWindowClosedError')
    if (statusCode === 428) {
      return t('votePanel.readRequiredError', {
        minimum: err.payload?.minimum_read_seconds || readMinimum.value,
        current: err.payload?.seconds_read ?? readSeconds.value,
      })
    }
    if (statusCode === 422) {
      const first = err.errors?.evidence_url?.[0]
        || err.errors?.evidence_note?.[0]
        || err.errors?.tag_id?.[0]
      return first || t('votePanel.errorValidation')
    }
    if (statusCode === 429) return t('votePanel.errorRateLimited')
    if (statusCode >= 500) return t('votePanel.errorServer')
    if (/Failed to fetch|NetworkError|Load failed/i.test(err?.message || '')) return t('votePanel.errorNetwork')

    return err?.message || fallback || t('votePanel.errorUnknown')
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
      const first = pinEventGraph.value.entities?.[0]
      if (first) {
        if (!pinToEntityId.value) pinToEntityId.value = String(first.id)
        if (!pinFromEntityId.value && pinEventGraph.value.entities?.[1]) {
          pinFromEntityId.value = String(pinEventGraph.value.entities[1].id)
        } else if (!pinFromEntityId.value) {
          pinFromEntityId.value = String(first.id)
        }
      }
    } catch {
      pinEventGraph.value = { entities: [], relationships: [] }
    } finally {
      notifyHeight()
    }
  }

  async function submitPinEntry() {
    if (!isLoggedIn.value) { openLogin(); return }
    if (!canUseEventSystem.value) {
      pinError.value = t('votePanel.eventSystemMinTrust', { score: eventSystemMinTrustScore.value.toFixed(2) })
      return
    }
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
          primary_category: pinNewEventPrimaryCategory.value || undefined,
          tags: pinNewEventTags.value,
          progress_status: pinNewEventProgressStatus.value || 'collecting',
        })
        eventId = created.data?.id
        pinSelectedEventId.value = String(eventId)
      }
      if (pinMode.value === 'graph') {
        await loadPinEventGraph(eventId)
        if (pinGraphMode.value === 'relationship') {
          if (!pinFromEntityId.value || !pinToEntityId.value) throw new Error(locale.value === 'en' ? 'Select both entities.' : '請選擇兩個節點。')
          if (!pinRelType.value.trim()) throw new Error(locale.value === 'en' ? 'Enter a relationship type.' : '請填寫關係類型。')
          await createEventRelationship(token.value, eventId, {
            from_entity_id: pinFromEntityId.value,
            to_entity_id: pinToEntityId.value,
            relationship_type: pinRelType.value.trim(),
            description: pinRelDesc.value.trim() || undefined,
            is_bidirectional: pinIsBidirectional.value || undefined,
            source_type: 'news',
            source_url: pinSourceUrl.value.trim() || newsUrl.value,
            news_url: newsUrl.value,
          })
          pinMessage.value = locale.value === 'en' ? 'Relationship added.' : '已加入關係。'
        } else {
          if (!pinEntityName.value.trim()) throw new Error(locale.value === 'en' ? 'Enter a person or organization name.' : '請填寫人名或組織名。')
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
              is_bidirectional: pinIsBidirectional.value || undefined,
              source_type: 'news',
              source_url: pinSourceUrl.value.trim() || newsUrl.value,
              news_url: newsUrl.value,
            })
          }
          pinMessage.value = locale.value === 'en' ? 'Added to graph.' : '已加入關係圖。'
        }
        pinEntityName.value = ''
        pinRelType.value = ''
        pinRelDesc.value = ''
        pinIsBidirectional.value = false
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
        pinMessage.value = locale.value === 'en' ? 'Added to event timeline. Edit log saved.' : '已加入事件時間線，編輯紀錄已保存。'
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

  watch(visibleTabSteps, (steps) => {
    if (!steps.some((step) => step.key === activeTab.value)) {
      activeTab.value = 'results'
    }
  })

  watch([collapsed, activeTab, selectedTagId, selectedSecondaryTagIds, evidenceUrl, evidenceNote, evidenceUploading, evidenceUploadMessage, voteError, voteMessage, achievementToastMessage, evidenceError, reportMessage, changeReportMessage, officialResponseMessage, officialResponseError, officialResponseText, reactionSummary, reactionLoading, reactionError, reactionMessage, selectedFeelings, selectedNeeds], notifyHeight)

  onMounted(async () => {
    trackEvent('vote_panel_open', { source: 'extension', feature: 'vote_panel', url: newsUrl.value })
    window.addEventListener('message', handleAuthMessage)
    requestAuthFromParent()
    await loadAuth()
    await syncSnapshot()
    await loadData()
    window.addEventListener('focus', loadAuth)
    window.addEventListener('storage', loadAuth)
    startReadTracking()
    await syncReadSession()
    notifyHeight()
  })

  return {
    // i18n
    locale,
    t,
    // refs
    collapsed,
    activeTab,
    loading,
    statusLoading,
    error,
    voteError,
    voteMessage,
    achievementToastMessage,
    evidenceError,
    reportMessage,
    changeReportMessage,
    readMessage,
    status,
    hasLoadedStatus,
    tags,
    evidence,
    officialResponses,
    relatedEvents,
    reactionSummary,
    reactionOptions,
    reactionLoading,
    reactionSubmitting,
    reactionError,
    reactionMessage,
    selectedReactionEventId,
    selectedFeelings,
    selectedNeeds,
    eventDetailTab,
    eventTimeline,
    eventGraph,
    eventDetailLoading,
    eventDetailError,
    pinEventSearch,
    pinSearchEvents,
    pinSelectedEventId,
    pinNewEventName,
    pinNewEventSummary,
    pinEventOptions,
    pinNewEventPrimaryCategory,
    pinNewEventTags,
    pinNewEventProgressStatus,
    pinMode,
    pinEntryTitle,
    pinEntrySummary,
    pinOccurredAt,
    pinSourceUrl,
    pinEntityName,
    pinEntityType,
    pinEventGraph,
    pinGraphMode,
    pinFromEntityId,
    pinToEntityId,
    pinRelType,
    pinRelDesc,
    pinIsBidirectional,
    pinSubmitting,
    pinMessage,
    pinError,
    officialResponseText,
    officialResponseEvidenceUrl,
    officialResponseType,
    selectedClaimantId,
    officialResponseMessage,
    officialResponseError,
    profile,
    reportReasons,
    selectedTagId,
    selectedSecondaryTagIds,
    evidenceUrl,
    evidenceNote,
    evidenceUploadInput,
    evidenceUploading,
    evidenceUploadMessage,
    submitting,
    reactingId,
    token,
    user,
    myVote,
    readSeconds,
    readMinimum,
    readSynced,
    readTimer,
    advancedMode,
    // computed
    tabSteps,
    visibleTabSteps,
    newsUrl,
    pageSnapshot,
    selectedTag,
    selectedTagCriteria,
    selectedEvidenceRequirement,
    requiresEvidenceUrl,
    requiresEvidenceNote,
    selectedEvidenceGuidance,
    selectedEvidenceUrlLabel,
    selectedEvidenceNoteLabel,
    selectedEvidenceNotePlaceholder,
    isLoggedIn,
    totalWeight,
    distribution,
    secondaryDistribution,
    evidenceVerdict,
    evidenceVerdictLabel,
    mediaContext,
    journalistContext,
    clusterSummary,
    evidenceReactionMinTrustScore,
    eventSystemMinTrustScore,
    canReactToEvidence,
    canUseEventSystem,
    isWeightLimited,
    approvedClaimants,
    unlockedAchievements,
    featuredAchievements,
    nextAchievement,
    userDisplayName,
    userTitle,
    achievementCount,
    achievementTotal,
    estimatedVoteWeight,
    isVotingOpen,
    hasReadEnough,
    cannotVoteReasons,
    primaryCannotVoteReason,
    readProgress,
    deadlineText,
    finalizedText,
    isClosingSoon,
    statusNote,
    nextActionText,
    statusBadgeText,
    snapshot,
    snapshotAlert,
    activeStepNumber,
    readerReactionRows,
    hoverReactionRows,
    reactionTotalUsers,
    reactionTargetLabel,
    toneClass,
    graphLayout,
    groupedVotingTags,
    // functions
    formatDateTime,
    loadAuth,
    syncReadSession,
    syncSnapshot,
    startReadTracking,
    loadData,
    notifyVoteUpdated,
    shareCurrentResult,
    reportJournalistMismatch,
    submitOfficialResponse,
    reactOfficial,
    openLogin,
    pollForLogin,
    submitVote,
    openEvidenceUploadPicker,
    handleEvidenceFileChange,
    openExternalEvidenceTarget,
    toggleSecondaryTag,
    reportItem,
    submitChangeReport,
    react,
    evidencePreviewUrl,
    evidenceTypeLabel,
    evidenceTrustLabel,
    evidenceQualityState,
    evidenceQualityLabel,
    evidenceQualityClass,
    tagEvidenceRequirement,
    tagEvidenceBadge,
    tagEvidenceBadgeClass,
    tagPlainHint,
    friendlyError,
    openEventDetail,
    loadReactionSummary,
    selectReactionEvent,
    toggleReaderReaction,
    submitReaction,
    searchPinEvents,
    loadPinEventGraph,
    submitPinEntry,
    notifyHeight,
    evidenceUploadConfig,
  }
}
