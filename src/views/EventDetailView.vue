<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  createEventEntity,
  createEventRelationship,
  createEventTimelineEntry,
  fetchCurrentUser,
  createGlobalEntity,
  deleteEventEntity,
  deleteEventRelationship,
  deleteEventTimelineEntry,
  fetchEvent,
  fetchEventEditLogs,
  fetchEventOptions,
  fetchEventGraph,
  fetchReactionSummary,
  fetchEventTimeline,
  mergeEventEntity,
  searchGlobalEntities,
  submitReaderReaction,
  updateEventEntity,
  updateEventEntityPosition,
  updateEvent,
  updateEventRelationship,
  updateEventTimelineEntry,
} from '../lib/api'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'
import { dismissOnboardingSurface, loadOnboarding, markOnboardingStep } from '../lib/onboarding'

const route = useRoute()
const { locale } = useI18n()
const zh = computed(() => locale.value !== 'en')
const token = ref(localStorage.getItem('truthshield_api_token') || '')
const currentUser = ref(null)
const eventOptions = ref({ primary_categories: [], tags: [], progress_statuses: [] })

const sourceTypes = computed(() => [
  { value: 'news', label: zh.value ? '新聞' : 'News' },
  { value: 'evidence', label: zh.value ? '佐證資料' : 'Evidence' },
  { value: 'official_response', label: zh.value ? '官方回應' : 'Official response' },
  { value: 'external', label: zh.value ? '外部來源' : 'External' },
])
const activeTab = ref(route.query.tab || 'overview')
const event = ref(null)
const timeline = ref([])
const graph = ref({ entities: [], relationships: [] })
const logs = ref([])
const reactionSummary = ref(null)
const reactionSubmitting = ref(false)
const reactionMessage = ref('')
const reactionError = ref('')
const selectedFeelings = ref([])
const selectedNeeds = ref([])
const loading = ref(true)
const error = ref('')
const graphSvg = ref(null)
const localEntityPositions = ref({})
const draggingEntity = ref(null)
const graphPan = ref({ x: 0, y: 0 })
const graphScale = ref(1)
const nodeManagementOpen = ref(false)
const isPanning = ref(false)
const panAnchor = ref(null)
const submitting = ref(false)
const formMessage = ref('')
const formError = ref('')
const eventGraphCoachDismissed = ref(false)
const metadataEditOpen = ref(false)
const metadataForm = ref({
  primary_category: '',
  tags: [],
  progress_status: 'collecting',
})
const graphContextMenu = ref({
  open: false,
  x: 0,
  y: 0,
  graphX: 260,
  graphY: 220,
  entity: null,
})
const quickGraphPanel = ref({
  open: false,
  mode: 'entity',
  x: 0,
  y: 0,
  graphX: 260,
  graphY: 220,
  anchorEntityId: '',
})
const quickEntityForm = ref({
  name: '',
  entity_type: 'person',
  description: '',
  source_url: '',
  global_entity_id: null,
})
const quickGlobalEntitySearch = ref('')
const quickGlobalEntityResults = ref([])
const quickGlobalEntitySearching = ref(false)
const quickGlobalEntitySearched = ref(false)
const quickRelationshipForm = ref({
  from_entity_id: '',
  to_entity_id: '',
  relationship_type: '',
  description: '',
  source_type: 'news',
  source_url: '',
  is_bidirectional: false,
})
const timelineForm = ref({
  title: '',
  summary: '',
  occurred_at: '',
  source_type: 'news',
  source_url: '',
})
const entityForm = ref({
  name: '',
  entity_type: 'person',
  description: '',
  source_url: '',
  global_entity_id: null,
})
const globalEntitySearch = ref('')
const globalEntityResults = ref([])
const globalEntitySearching = ref(false)

async function searchGlobal() {
  if (!globalEntitySearch.value.trim()) { globalEntityResults.value = []; return }
  globalEntitySearching.value = true
  try {
    const payload = await searchGlobalEntities({ q: globalEntitySearch.value, limit: 10 })
    globalEntityResults.value = payload.data || []
  } catch {
    globalEntityResults.value = []
  } finally {
    globalEntitySearching.value = false
  }
}

function selectGlobalEntity(ge) {
  entityForm.value.global_entity_id = ge.id
  entityForm.value.name = ge.name
  entityForm.value.entity_type = ge.entity_type
  entityForm.value.description = entityForm.value.description || ge.description || ''
  globalEntityResults.value = []
  globalEntitySearch.value = ge.name
}

function clearGlobalEntity() {
  entityForm.value.global_entity_id = null
  globalEntitySearch.value = ''
  globalEntityResults.value = []
}

async function searchQuickGlobal() {
  quickGlobalEntitySearched.value = true
  if (!quickGlobalEntitySearch.value.trim()) { quickGlobalEntityResults.value = []; return }
  quickGlobalEntitySearching.value = true
  try {
    const payload = await searchGlobalEntities({ q: quickGlobalEntitySearch.value, limit: 10 })
    quickGlobalEntityResults.value = payload.data || []
  } catch {
    quickGlobalEntityResults.value = []
  } finally {
    quickGlobalEntitySearching.value = false
  }
}

function selectQuickGlobalEntity(ge) {
  quickEntityForm.value.global_entity_id = ge.id
  quickEntityForm.value.name = ge.name
  quickEntityForm.value.entity_type = ge.entity_type
  quickEntityForm.value.description = quickEntityForm.value.description || ge.description || ''
  quickGlobalEntityResults.value = []
  quickGlobalEntitySearch.value = ge.name
}

function clearQuickGlobalEntity() {
  quickEntityForm.value.global_entity_id = null
  quickGlobalEntitySearch.value = ''
  quickGlobalEntityResults.value = []
  quickGlobalEntitySearched.value = false
}
const relationshipForm = ref({
  from_entity_id: '',
  to_entity_id: '',
  relationship_type: '',
  description: '',
  source_type: 'news',
  source_url: '',
  is_bidirectional: false,
})
const timelineEditId = ref('')
const timelineEditForm = ref({ title: '', summary: '', occurred_at: '', source_type: 'news', source_url: '' })
const entityEditId = ref('')
const entityEditForm = ref({ name: '', entity_type: 'person', description: '', source_url: '' })
const mergeTargetEntityId = ref('')
const relationshipEditId = ref('')
const relationshipEditForm = ref({
  from_entity_id: '',
  to_entity_id: '',
  relationship_type: '',
  description: '',
  source_type: 'news',
  source_url: '',
})
const entityFilter = ref('all')
const canUseEventSystem = computed(() => {
  if (!token.value) return false
  if (!currentUser.value) return false
  if (typeof currentUser.value?.can_use_event_system === 'boolean') return currentUser.value.can_use_event_system

  return Boolean(currentUser.value?.is_admin) || Number(currentUser.value?.trust_score ?? 1.0) >= Number(currentUser.value?.event_system_min_trust_score ?? 1.0)
})
const currentUserName = computed(() => currentUser.value?.display_name || currentUser.value?.name || currentUser.value?.email || '')

const tabs = computed(() => [
  { key: 'overview', label: zh.value ? '總覽' : 'Overview' },
  { key: 'timeline', label: zh.value ? '時間線' : 'Timeline' },
  { key: 'graph', label: zh.value ? '人物/組織關係圖' : 'People/Org Graph' },
  { key: 'news', label: zh.value ? '相關新聞' : 'Related News' },
  { key: 'logs', label: zh.value ? '編輯紀錄' : 'Edit Logs' },
])

const overviewStats = computed(() => {
  const counts = event.value?.counts || {}
  return [
    { key: 'items', label: zh.value ? '事件資料' : 'Items', value: counts.items ?? 0, tab: 'news', tone: 'border-cyan-300/20 bg-cyan-300/5 text-cyan-100' },
    { key: 'timeline', label: zh.value ? '時間線節點' : 'Timeline entries', value: counts.timeline ?? 0, tab: 'timeline', tone: 'border-white/10 bg-white/[0.03] text-white' },
    { key: 'relationships', label: zh.value ? '關係連線' : 'Relationships', value: counts.relationships ?? 0, tab: 'graph', tone: 'border-white/10 bg-white/[0.03] text-white' },
    { key: 'entities', label: zh.value ? '人物與組織' : 'People and orgs', value: counts.entities ?? 0, tab: 'graph', tone: 'border-white/10 bg-white/[0.03] text-white' },
  ]
})
const eventReactionRows = computed(() => [
  ...(reactionSummary.value?.summary?.feelings || []),
  ...(reactionSummary.value?.summary?.needs || []),
].slice(0, 8))
const eventReactionTop = computed(() => reactionSummary.value?.hover_reactions || [])
const reactionOptions = computed(() => reactionSummary.value?.options || { feelings: [], needs: [] })
const eventReactionSourceUrl = computed(() => {
  const primaryUrl = event.value?.primary_news?.normalized_url
  if (primaryUrl) return primaryUrl

  const item = (event.value?.items || []).find((row) => row.news_url?.normalized_url || row.source_url)
  return item?.news_url?.normalized_url || item?.source_url || ''
})

function setMeta(title, description) {
  document.title = title
  for (const [attr, name, content] of [
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:type', 'article'],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
    ['name', 'description', description],
  ]) {
    let el = document.querySelector(`meta[${attr}="${name}"]`)
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el) }
    el.setAttribute('content', content)
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const id = route.params.id
    const [eventPayload, timelinePayload, graphPayload, logPayload, reactionPayload, optionsPayload, userPayload] = await Promise.all([
      fetchEvent(id),
      fetchEventTimeline(id),
      fetchEventGraph(id),
      fetchEventEditLogs(id),
      fetchReactionSummary({ event_id: id }).catch(() => null),
      fetchEventOptions().catch(() => ({ primary_categories: [], tags: [], progress_statuses: [] })),
      token.value ? fetchCurrentUser(token.value).catch(() => null) : Promise.resolve(null),
    ])
    event.value = eventPayload.data
    metadataForm.value = {
      primary_category: event.value.primary_category || '',
      tags: event.value.tags || [],
      progress_status: event.value.progress_status || 'collecting',
    }
    setMeta(event.value.name + ' — TruthShield', event.value.summary || event.value.name)
    timeline.value = timelinePayload
    graph.value = graphPayload
    logs.value = logPayload
    reactionSummary.value = reactionPayload
    selectedFeelings.value = Array.isArray(reactionPayload?.my_reaction?.feelings) ? [...reactionPayload.my_reaction.feelings] : []
    selectedNeeds.value = Array.isArray(reactionPayload?.my_reaction?.needs) ? [...reactionPayload.my_reaction.needs] : []
    eventOptions.value = optionsPayload
    currentUser.value = userPayload
    markOnboardingStep('open_event_context', token.value).catch(() => null)
    loadOnboarding(token.value).then((summary) => {
      eventGraphCoachDismissed.value = Boolean(summary.dismissed_surfaces?.includes('event_graph_coach'))
    }).catch(() => null)
  } catch (err) {
    error.value = err.message || 'Failed to load event'
  } finally {
    loading.value = false
  }
}

async function dismissEventGraphCoach() {
  eventGraphCoachDismissed.value = true
  await dismissOnboardingSurface('event_graph_coach', token.value).catch(() => null)
}

async function saveEventMetadata() {
  if (!token.value || !canUseEventSystem.value) {
    formError.value = zh.value ? '登入且信用分數達標後才能編輯事件分類與進度。' : 'Sign in with enough trust score to edit event classification and progress.'
    return
  }

  resetMessages()
  submitting.value = true
  try {
    const payload = await updateEvent(token.value, route.params.id, {
      primary_category: metadataForm.value.primary_category || null,
      tags: metadataForm.value.tags || [],
      progress_status: metadataForm.value.progress_status || 'collecting',
    })
    event.value = payload.data
    metadataForm.value = {
      primary_category: event.value.primary_category || '',
      tags: event.value.tags || [],
      progress_status: event.value.progress_status || 'collecting',
    }
    metadataEditOpen.value = false
    formMessage.value = zh.value ? '事件分類與進度已更新，編輯紀錄已保存。' : 'Event classification and progress updated and logged.'
    await load()
  } catch (err) {
    formError.value = err.message || (zh.value ? '更新事件分類失敗。' : 'Failed to update event metadata.')
  } finally {
    submitting.value = false
  }
}

function nodePosition(index, total) {
  const angle = (Math.PI * 2 * index) / Math.max(total, 1) - Math.PI / 2
  return {
    x: 260 + Math.cos(angle) * 180,
    y: 220 + Math.sin(angle) * 145,
  }
}

function entityPosition(id) {
  const local = localEntityPositions.value[id]
  if (local) return local

  const entity = (graph.value.entities || []).find((item) => item.id === id)
  const saved = entity?.metadata?.graph_position
  if (saved && Number.isFinite(Number(saved.x)) && Number.isFinite(Number(saved.y))) {
    return { x: Number(saved.x), y: Number(saved.y) }
  }

  const index = (graph.value.entities || []).findIndex((entity) => entity.id === id)
  return nodePosition(Math.max(index, 0), graph.value.entities?.length || 1)
}

function clampGraphPosition(point, radius = 34) {
  return {
    x: Math.min(500 - radius, Math.max(20 + radius, point.x)),
    y: Math.min(420 - radius, Math.max(20 + radius, point.y)),
  }
}

function svgRootPoint(event) {
  if (!graphSvg.value) return { x: 0, y: 0 }
  const pt = graphSvg.value.createSVGPoint()
  pt.x = event.clientX
  pt.y = event.clientY
  return pt.matrixTransform(graphSvg.value.getScreenCTM().inverse())
}

function graphPoint(event) {
  const svgP = svgRootPoint(event)
  return {
    x: (svgP.x - graphPan.value.x) / graphScale.value,
    y: (svgP.y - graphPan.value.y) / graphScale.value,
  }
}

function handleGraphWheel(event) {
  event.preventDefault()
  const factor = event.deltaY > 0 ? 0.85 : 1.18
  const newScale = Math.min(6, Math.max(0.15, graphScale.value * factor))
  const svgP = svgRootPoint(event)
  graphPan.value = {
    x: svgP.x - (svgP.x - graphPan.value.x) * newScale / graphScale.value,
    y: svgP.y - (svgP.y - graphPan.value.y) * newScale / graphScale.value,
  }
  graphScale.value = newScale
}

function startGraphPan(event) {
  if (event.button !== 0) return
  if (draggingEntity.value) return
  closeGraphContextMenu()
  const isBackground = event.target === graphSvg.value || event.target.tagName === 'rect'
  if (!isBackground) return
  isPanning.value = true
  const svgP = svgRootPoint(event)
  panAnchor.value = { svgX: svgP.x, svgY: svgP.y, panX: graphPan.value.x, panY: graphPan.value.y }
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function handleGraphMove(event) {
  if (draggingEntity.value) { dragEntity(event); return }
  if (!isPanning.value || !panAnchor.value) return
  const svgP = svgRootPoint(event)
  graphPan.value = {
    x: panAnchor.value.panX + (svgP.x - panAnchor.value.svgX),
    y: panAnchor.value.panY + (svgP.y - panAnchor.value.svgY),
  }
}

function endGraphInteraction(event) {
  if (draggingEntity.value) endDragEntity(event)
  isPanning.value = false
  panAnchor.value = null
}

function resetGraphView() {
  graphPan.value = { x: 0, y: 0 }
  graphScale.value = 1
}

function zoomGraph(factor) {
  graphScale.value = Math.min(6, Math.max(0.15, graphScale.value * factor))
}

function closeGraphContextMenu() {
  graphContextMenu.value = { ...graphContextMenu.value, open: false, entity: null }
}

function closeQuickGraphPanel() {
  quickGraphPanel.value = { ...quickGraphPanel.value, open: false, anchorEntityId: '' }
  quickEntityForm.value = { name: '', entity_type: 'person', description: '', source_url: '', global_entity_id: null }
  clearQuickGlobalEntity()
  quickRelationshipForm.value = {
    from_entity_id: '',
    to_entity_id: '',
    relationship_type: '',
    description: '',
    source_type: 'news',
    source_url: '',
    is_bidirectional: false,
  }
}

function clampMenuPosition(event) {
  const container = graphSvg.value?.getBoundingClientRect()
  if (!container) return { x: 16, y: 16 }

  return {
    x: Math.min(Math.max(event.clientX - container.left, 12), container.width - 280),
    y: Math.min(Math.max(event.clientY - container.top, 12), container.height - 220),
  }
}

function openGraphContextMenu(event, entity = null) {
  event.preventDefault()
  event.stopPropagation()
  const point = clampGraphPosition(graphPoint(event), entity ? entityRadius(entity.id) : 34)
  const menu = clampMenuPosition(event)
  graphContextMenu.value = {
    open: true,
    x: menu.x,
    y: menu.y,
    graphX: point.x,
    graphY: point.y,
    entity,
  }
}

function openQuickEntityPanel(entityType = 'person') {
  const menu = graphContextMenu.value
  quickEntityForm.value = { name: '', entity_type: entityType, description: '', source_url: '', global_entity_id: null }
  clearQuickGlobalEntity()
  quickGraphPanel.value = {
    open: true,
    mode: 'entity',
    x: menu.x,
    y: menu.y,
    graphX: menu.graphX,
    graphY: menu.graphY,
    anchorEntityId: menu.entity?.id || '',
  }
  closeGraphContextMenu()
}

function openQuickRelationshipPanel(direction = 'from') {
  const menu = graphContextMenu.value
  const anchorId = menu.entity?.id || ''
  quickRelationshipForm.value = {
    from_entity_id: direction === 'from' ? anchorId : '',
    to_entity_id: direction === 'to' ? anchorId : '',
    relationship_type: '',
    description: '',
    source_type: 'news',
    source_url: '',
    is_bidirectional: false,
  }
  quickGraphPanel.value = {
    open: true,
    mode: 'relationship',
    x: menu.x,
    y: menu.y,
    graphX: menu.graphX,
    graphY: menu.graphY,
    anchorEntityId: anchorId,
  }
  closeGraphContextMenu()
}

function requireGraphAuth() {
  if (token.value) return true
  formError.value = zh.value ? '登入後才能編輯關係圖。' : 'Sign in to edit the graph.'
  closeGraphContextMenu()
  return false
}

function startDragEntity(entity, event) {
  if (event.button !== 0) return
  if (!token.value) return
  event.stopPropagation()
  closeGraphContextMenu()

  const position = entityPosition(entity.id)
  const point = graphPoint(event)
  draggingEntity.value = {
    id: entity.id,
    offsetX: point.x - position.x,
    offsetY: point.y - position.y,
  }
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function dragEntity(event) {
  if (!draggingEntity.value) return

  const point = graphPoint(event)
  const id = draggingEntity.value.id
  const position = clampGraphPosition({
    x: point.x - draggingEntity.value.offsetX,
    y: point.y - draggingEntity.value.offsetY,
  }, entityRadius(id))

  localEntityPositions.value = {
    ...localEntityPositions.value,
    [id]: position,
  }
}

async function endDragEntity() {
  if (!draggingEntity.value) return

  const id = draggingEntity.value.id
  draggingEntity.value = null
  const position = localEntityPositions.value[id]
  if (!token.value || !position) return

  try {
    const updated = await updateEventEntityPosition(token.value, route.params.id, id, position)
    // Patch only the affected entity in graph.value so we avoid a full page reload
    const entities = graph.value.entities || []
    const idx = entities.findIndex((e) => String(e.id) === String(id))
    if (idx !== -1 && updated?.data) {
      graph.value = {
        ...graph.value,
        entities: entities.map((e, i) => (i === idx ? { ...e, metadata: updated.data.metadata } : e)),
      }
    }
  } catch (err) {
    formError.value = err.message || (zh.value ? '位置保存失敗。' : 'Failed to save position.')
  }
}

function entityRadius(id) {
  const entity = (graph.value.entities || []).find((item) => item.id === id)
  const heat = entityHeat(entity)
  const base = entity?.entity_type === 'organization' ? 32 : 27
  return base + heat.level * 3
}

const entityDegrees = computed(() => {
  const counts = new Map()

  for (const entity of graph.value.entities || []) {
    counts.set(entity.id, 0)
  }

  for (const rel of graph.value.relationships || []) {
    counts.set(rel.from_entity_id, (counts.get(rel.from_entity_id) || 0) + 1)
    counts.set(rel.to_entity_id, (counts.get(rel.to_entity_id) || 0) + 1)
  }

  return counts
})

const maxEntityDegree = computed(() => Math.max(1, ...Array.from(entityDegrees.value.values())))

const entityHeatLegend = computed(() => [
  { label: zh.value ? '低連結' : 'Low', color: '#1e3a5f' },
  { label: zh.value ? '中連結' : 'Medium', color: '#0f766e' },
  { label: zh.value ? '高連結' : 'High', color: '#b45309' },
  { label: zh.value ? '核心角色' : 'Core', color: '#be123c' },
])

const entityFilters = computed(() => [
  { key: 'all', label: zh.value ? '全部' : 'All', count: (graph.value.entities || []).length },
  { key: 'person', label: zh.value ? '人物' : 'People', count: (graph.value.entities || []).filter((entity) => entity.entity_type === 'person').length },
  { key: 'organization', label: zh.value ? '組織' : 'Organizations', count: (graph.value.entities || []).filter((entity) => entity.entity_type === 'organization').length },
  { key: 'core', label: zh.value ? '高連結' : 'Highly connected', count: (graph.value.entities || []).filter((entity) => entityHeat(entity).level >= 2).length },
])

const visibleEntities = computed(() => {
  const entities = graph.value.entities || []
  if (entityFilter.value === 'person') return entities.filter((entity) => entity.entity_type === 'person')
  if (entityFilter.value === 'organization') return entities.filter((entity) => entity.entity_type === 'organization')
  if (entityFilter.value === 'core') return entities.filter((entity) => entityHeat(entity).level >= 2)

  return entities
})

function entityDegree(entity) {
  return entity ? (entityDegrees.value.get(entity.id) || 0) : 0
}

function entityHeat(entity) {
  const ratio = entityDegree(entity) / maxEntityDegree.value
  if (ratio >= 0.75) return { level: 3, color: '#be123c', stroke: '#fecdd3', label: zh.value ? '核心角色' : 'Core actor' }
  if (ratio >= 0.5) return { level: 2, color: '#b45309', stroke: '#fde68a', label: zh.value ? '高連結' : 'Highly connected' }
  if (ratio >= 0.25) return { level: 1, color: '#0f766e', stroke: '#99f6e4', label: zh.value ? '中連結' : 'Connected' }
  return { level: 0, color: entity?.entity_type === 'organization' ? '#1e3a5f' : '#27272a', stroke: '#67e8f9', label: zh.value ? '低連結' : 'Low connection' }
}

function relationshipSiblings(rel) {
  return (graph.value.relationships || []).filter((item) => {
    const sameDirection = item.from_entity_id === rel.from_entity_id && item.to_entity_id === rel.to_entity_id
    const reverseDirection = item.from_entity_id === rel.to_entity_id && item.to_entity_id === rel.from_entity_id

    return sameDirection || reverseDirection
  })
}

function baseRelationshipCurve(rel) {
  const from = entityPosition(rel.from_entity_id)
  const to = entityPosition(rel.to_entity_id)
  const dx = to.x - from.x
  const dy = to.y - from.y
  const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1)
  const startOffset = entityRadius(rel.from_entity_id) + 4
  const endOffset = entityRadius(rel.to_entity_id) + 8

  const siblings = relationshipSiblings(rel)
  const siblingIndex = Math.max(siblings.findIndex((item) => item.id === rel.id), 0)
  const centerOffset = siblingIndex - (siblings.length - 1) / 2
  const distanceFactor = Math.min(1, Math.max(0.35, distance / 240))
  const curveOffset = siblings.length > 1 ? centerOffset * 44 * distanceFactor : 16 * distanceFactor
  const normalX = -dy / distance
  const normalY = dx / distance
  const x1 = from.x + (dx / distance) * startOffset
  const y1 = from.y + (dy / distance) * startOffset
  const x2 = to.x - (dx / distance) * endOffset
  const y2 = to.y - (dy / distance) * endOffset
  const controlX = from.x + dx * 0.5 + normalX * curveOffset
  const controlY = from.y + dy * 0.5 + normalY * curveOffset
  const labelPoint = quadraticPoint({ x1, y1, controlX, controlY, x2, y2 }, 0.5)

  return {
    x1,
    y1,
    x2,
    y2,
    controlX,
    controlY,
    normalX,
    normalY,
    tangentX: dx / distance,
    tangentY: dy / distance,
    path: `M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`,
    labelX: labelPoint.x,
    labelY: labelPoint.y,
    labelT: 0.5,
  }
}

function quadraticPoint(layout, t) {
  const mt = 1 - t

  return {
    x: mt * mt * layout.x1 + 2 * mt * t * layout.controlX + t * t * layout.x2,
    y: mt * mt * layout.y1 + 2 * mt * t * layout.controlY + t * t * layout.y2,
  }
}

const relationshipLayouts = computed(() => {
  const layouts = new Map()
  const placed = []
  const nodeBoxes = (graph.value.entities || []).map((entity, index) => {
    const position = entityPosition(entity.id) || nodePosition(index, graph.value.entities.length)
    return {
      x: position.x,
      y: position.y,
      r: entityRadius(entity.id) + 10,
    }
  })

  const hitsLabel = (layout, labelWidth) => {
    const labelHeight = 26
    const hitsPlacedLabel = placed.some((box) => (
      Math.abs(box.x - layout.labelX) < (box.width + labelWidth) / 2 + 14
      && Math.abs(box.y - layout.labelY) < (box.height + labelHeight) / 2 + 8
    ))
    const hitsNode = nodeBoxes.some((box) => (
      Math.abs(box.x - layout.labelX) < labelWidth / 2 + box.r
      && Math.abs(box.y - layout.labelY) < labelHeight / 2 + box.r
    ))

    return hitsPlacedLabel || hitsNode
  }

  for (const rel of graph.value.relationships || []) {
    const layout = { ...baseRelationshipCurve(rel) }
    const labelWidth = relationshipLabelWidth(rel)

    const candidates = [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74]
    for (const t of candidates) {
      const point = quadraticPoint(layout, t)
      layout.labelX = point.x
      layout.labelY = point.y
      layout.labelT = t
      if (!hitsLabel(layout, labelWidth)) break
    }

    placed.push({ x: layout.labelX, y: layout.labelY, width: labelWidth, height: 26 })
    layouts.set(rel.id, layout)
  }

  return layouts
})

function relationshipCurve(rel) {
  return relationshipLayouts.value.get(rel.id) || baseRelationshipCurve(rel)
}

function relationshipLabel(rel) {
  return String(rel.relationship_type || '').slice(0, 12)
}

function relationshipLabelWidth(rel) {
  return Math.min(150, Math.max(56, relationshipLabel(rel).length * 12 + 18))
}

function safeEventFileName() {
  return String(event.value?.name || 'truthshield-event')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

function serializedGraphSvg() {
  if (!graphSvg.value || !event.value) return

  const clone = graphSvg.value.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', '1160')
  clone.setAttribute('height', '1000')

  const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
  title.textContent = `${event.value.name} - TruthShield relationship graph`
  clone.insertBefore(title, clone.firstChild)

  return new XMLSerializer().serializeToString(clone)
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

async function downloadGraphImage(format = 'png') {
  const svg = serializedGraphSvg()
  if (!svg) return

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(svgBlob)
  const image = new Image()

  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = reject
    image.src = url
  })

  const canvas = document.createElement('canvas')
  canvas.width = 1160
  canvas.height = 1000
  const context = canvas.getContext('2d')
  context.fillStyle = '#09090b'
  context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  URL.revokeObjectURL(url)

  const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const extension = format === 'jpeg' ? 'jpg' : 'png'
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.92))
  if (blob) downloadBlob(blob, `${safeEventFileName()}-relationship-graph.${extension}`)
}

function resetMessages() {
  formMessage.value = ''
  formError.value = ''
}

function toggleEventReaction(kind, key) {
  const target = kind === 'need' ? selectedNeeds : selectedFeelings
  const current = target.value
  reactionError.value = ''

  if (current.includes(key)) {
    target.value = current.filter((item) => item !== key)
    return
  }

  if (current.length >= 3) {
    reactionError.value = zh.value ? '同一類最多選 3 個。' : 'Choose up to 3 in each group.'
    return
  }

  target.value = [...current, key]
}

async function submitEventReaction() {
  token.value = localStorage.getItem('truthshield_api_token') || ''
  reactionMessage.value = ''
  reactionError.value = ''

  if (!token.value) {
    reactionError.value = zh.value ? '登入後才能留下脈絡需求。' : 'Sign in to request event context.'
    return
  }

  if (!selectedFeelings.value.length && !selectedNeeds.value.length) {
    reactionError.value = zh.value ? '請至少選一個感受或需求。' : 'Choose at least one signal or need.'
    return
  }

  if (!eventReactionSourceUrl.value) {
    reactionError.value = zh.value ? '這個事件還沒有可作為來源的新聞網址，暫時無法送出脈絡需求。' : 'This event has no source article URL yet, so context requests cannot be submitted.'
    return
  }

  reactionSubmitting.value = true
  try {
    const payload = await submitReaderReaction(token.value, {
      news_url: eventReactionSourceUrl.value,
      event_id: event.value.id,
      feelings: selectedFeelings.value,
      needs: selectedNeeds.value,
    })
    reactionSummary.value = {
      ...(reactionSummary.value || {}),
      ...payload,
      my_reaction: payload.reaction || reactionSummary.value?.my_reaction || null,
    }
    reactionMessage.value = zh.value ? '已更新你的脈絡需求。' : 'Your context request was updated.'
  } catch (err) {
    reactionError.value = err.message || (zh.value ? '脈絡需求送出失敗。' : 'Failed to submit context request.')
  } finally {
    reactionSubmitting.value = false
  }
}

function toDatetimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16).replace(' ', 'T')
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function fmtDate(value, opts = {}) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10)
  return date.toLocaleString(zh.value ? 'zh-TW' : 'en', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
    ...opts,
  })
}

function startEditTimeline(entry) {
  timelineEditId.value = String(entry.id)
  timelineEditForm.value = {
    title: entry.title || '',
    summary: entry.summary || '',
    occurred_at: toDatetimeLocal(entry.occurred_at),
    source_type: entry.source_type || 'news',
    source_url: entry.source_url || '',
  }
}

function cancelEditTimeline() {
  timelineEditId.value = ''
  timelineEditForm.value = { title: '', summary: '', occurred_at: '', source_type: 'news', source_url: '' }
}

function startEditEntity(entity) {
  entityEditId.value = String(entity.id)
  mergeTargetEntityId.value = ''
  entityEditForm.value = {
    name: entity.name || '',
    entity_type: entity.entity_type || 'person',
    description: entity.description || '',
    source_url: entity.source_url || '',
  }
}

function cancelEditEntity() {
  entityEditId.value = ''
  mergeTargetEntityId.value = ''
  entityEditForm.value = { name: '', entity_type: 'person', description: '', source_url: '' }
}

function startEditRelationship(rel) {
  relationshipEditId.value = String(rel.id)
  relationshipEditForm.value = {
    from_entity_id: rel.from_entity_id || '',
    to_entity_id: rel.to_entity_id || '',
    relationship_type: rel.relationship_type || '',
    description: rel.description || '',
    source_type: rel.source_type || 'news',
    source_url: rel.source_url || '',
  }
}

function cancelEditRelationship() {
  relationshipEditId.value = ''
  relationshipEditForm.value = { from_entity_id: '', to_entity_id: '', relationship_type: '', description: '', source_type: 'news', source_url: '' }
}

async function submitQuickEntity() {
  if (!requireGraphAuth()) return

  resetMessages()
  submitting.value = true
  try {
    const created = await createEventEntity(token.value, route.params.id, quickEntityForm.value)
    const entityId = created?.data?.id
    if (entityId) {
      await updateEventEntityPosition(token.value, route.params.id, entityId, {
        x: quickGraphPanel.value.graphX,
        y: quickGraphPanel.value.graphY,
      })
    }
    closeQuickGraphPanel()
    formMessage.value = zh.value ? '節點已從圖上新增，位置與編輯紀錄已保存。' : 'Node added on the graph; position and edit log saved.'
    await load()
    activeTab.value = 'graph'
  } catch (err) {
    formError.value = err.message || (zh.value ? '新增失敗。' : 'Failed to add node.')
  } finally {
    submitting.value = false
  }
}

async function submitQuickRelationship() {
  if (!requireGraphAuth()) return
  if (String(quickRelationshipForm.value.from_entity_id) === String(quickRelationshipForm.value.to_entity_id)) {
    formError.value = zh.value ? '關係兩端不能選同一個節點。' : 'A relationship needs two different nodes.'
    return
  }

  resetMessages()
  submitting.value = true
  try {
    await createEventRelationship(token.value, route.params.id, quickRelationshipForm.value)
    closeQuickGraphPanel()
    formMessage.value = zh.value ? '關係已從圖上新增，編輯紀錄已保存。' : 'Relationship added from the graph and logged.'
    await load()
    activeTab.value = 'graph'
  } catch (err) {
    formError.value = err.message || (zh.value ? '新增失敗。' : 'Failed to add relationship.')
  } finally {
    submitting.value = false
  }
}

async function submitTimeline() {
  if (!token.value) {
    formError.value = zh.value ? '登入後才能新增時間線項目。' : 'Sign in to add timeline entries.'
    return
  }

  resetMessages()
  submitting.value = true
  try {
    await createEventTimelineEntry(token.value, route.params.id, timelineForm.value)
    timelineForm.value = { title: '', summary: '', occurred_at: '', source_type: 'news', source_url: '' }
    formMessage.value = zh.value ? '時間線項目已新增，編輯紀錄也已保存。' : 'Timeline entry added and logged.'
    await load()
    activeTab.value = 'timeline'
  } catch (err) {
    formError.value = err.message || (zh.value ? '新增失敗。' : 'Failed to add entry.')
  } finally {
    submitting.value = false
  }
}

async function submitTimelineEdit() {
  if (!token.value || !timelineEditId.value) return

  resetMessages()
  submitting.value = true
  try {
    await updateEventTimelineEntry(token.value, route.params.id, timelineEditId.value, timelineEditForm.value)
    cancelEditTimeline()
    formMessage.value = zh.value ? '時間線項目已更新，編輯紀錄也已保存。' : 'Timeline entry updated and logged.'
    await load()
    activeTab.value = 'timeline'
  } catch (err) {
    formError.value = err.message || (zh.value ? '更新失敗。' : 'Failed to update entry.')
  } finally {
    submitting.value = false
  }
}

async function removeTimelineEntry(entry) {
  if (!token.value) {
    formError.value = zh.value ? '登入後才能刪除時間線項目。' : 'Sign in to delete timeline entries.'
    return
  }
  if (!window.confirm(zh.value ? `刪除時間線項目「${entry.title}」？此動作會留下公開紀錄。` : `Delete timeline entry "${entry.title}"? This will be publicly logged.`)) return

  resetMessages()
  submitting.value = true
  try {
    await deleteEventTimelineEntry(token.value, route.params.id, entry.id)
    if (timelineEditId.value === String(entry.id)) cancelEditTimeline()
    formMessage.value = zh.value ? '時間線項目已刪除，刪除紀錄已保存。' : 'Timeline entry deleted and logged.'
    await load()
    activeTab.value = 'timeline'
  } catch (err) {
    formError.value = err.message || (zh.value ? '刪除失敗。' : 'Failed to delete entry.')
  } finally {
    submitting.value = false
  }
}

async function submitEntity() {
  if (!token.value) {
    formError.value = zh.value ? '登入後才能新增人物或組織節點。' : 'Sign in to add people or organizations.'
    return
  }

  resetMessages()
  submitting.value = true
  try {
    await createEventEntity(token.value, route.params.id, entityForm.value)
    entityForm.value = { name: '', entity_type: 'person', description: '', source_url: '', global_entity_id: null }
    clearGlobalEntity()
    formMessage.value = zh.value ? '節點已新增，編輯紀錄也已保存。' : 'Node added and logged.'
    await load()
    activeTab.value = 'graph'
  } catch (err) {
    formError.value = err.message || (zh.value ? '新增失敗。' : 'Failed to add node.')
  } finally {
    submitting.value = false
  }
}

async function submitEntityEdit() {
  if (!token.value || !entityEditId.value) return

  resetMessages()
  submitting.value = true
  try {
    await updateEventEntity(token.value, route.params.id, entityEditId.value, entityEditForm.value)
    cancelEditEntity()
    formMessage.value = zh.value ? '節點已更新，編輯紀錄也已保存。' : 'Node updated and logged.'
    await load()
    activeTab.value = 'graph'
  } catch (err) {
    formError.value = err.message || (zh.value ? '更新失敗。' : 'Failed to update node.')
  } finally {
    submitting.value = false
  }
}

async function removeEntity(entity) {
  if (!token.value) {
    formError.value = zh.value ? '登入後才能刪除節點。' : 'Sign in to delete nodes.'
    return
  }
  if (!window.confirm(zh.value ? `刪除節點「${entity.name}」？相關關係也會刪除並留下紀錄。` : `Delete node "${entity.name}"? Related relationships will also be deleted and logged.`)) return

  resetMessages()
  submitting.value = true
  try {
    await deleteEventEntity(token.value, route.params.id, entity.id)
    if (entityEditId.value === String(entity.id)) cancelEditEntity()
    formMessage.value = zh.value ? '節點已刪除，刪除紀錄已保存。' : 'Node deleted and logged.'
    await load()
    activeTab.value = 'graph'
  } catch (err) {
    formError.value = err.message || (zh.value ? '刪除失敗。' : 'Failed to delete node.')
  } finally {
    submitting.value = false
  }
}

async function submitEntityMerge() {
  if (!token.value || !entityEditId.value || !mergeTargetEntityId.value) return

  resetMessages()
  submitting.value = true
  try {
    await mergeEventEntity(token.value, route.params.id, entityEditId.value, {
      target_entity_id: mergeTargetEntityId.value,
      reason: zh.value ? '社群合併重複節點' : 'Community merged duplicate node',
    })
    cancelEditEntity()
    formMessage.value = zh.value ? '節點已合併，關係已移轉，編輯紀錄也已保存。' : 'Node merged, relationships moved, and edit logs saved.'
    await load()
    activeTab.value = 'graph'
  } catch (err) {
    formError.value = err.message || (zh.value ? '合併失敗。' : 'Failed to merge node.')
  } finally {
    submitting.value = false
  }
}

async function submitRelationship() {
  if (!token.value) {
    formError.value = zh.value ? '登入後才能新增人物或組織關係。' : 'Sign in to add relationships.'
    return
  }
  if (String(relationshipForm.value.from_entity_id) === String(relationshipForm.value.to_entity_id)) {
    formError.value = zh.value ? '關係兩端不能選同一個節點。' : 'A relationship needs two different nodes.'
    return
  }

  resetMessages()
  submitting.value = true
  try {
    await createEventRelationship(token.value, route.params.id, relationshipForm.value)
    relationshipForm.value = {
      from_entity_id: '',
      to_entity_id: '',
      relationship_type: '',
      description: '',
      source_type: 'news',
      source_url: '',
      is_bidirectional: false,
    }
    formMessage.value = zh.value ? '關係已新增，編輯紀錄也已保存。' : 'Relationship added and logged.'
    await load()
    activeTab.value = 'graph'
  } catch (err) {
    formError.value = err.message || (zh.value ? '新增失敗。' : 'Failed to add relationship.')
  } finally {
    submitting.value = false
  }
}

async function submitRelationshipEdit() {
  if (!token.value || !relationshipEditId.value) return

  resetMessages()
  submitting.value = true
  try {
    await updateEventRelationship(token.value, route.params.id, relationshipEditId.value, relationshipEditForm.value)
    cancelEditRelationship()
    formMessage.value = zh.value ? '關係已更新，編輯紀錄也已保存。' : 'Relationship updated and logged.'
    await load()
    activeTab.value = 'graph'
  } catch (err) {
    formError.value = err.message || (zh.value ? '更新失敗。' : 'Failed to update relationship.')
  } finally {
    submitting.value = false
  }
}

async function removeRelationship(rel) {
  if (!token.value) {
    formError.value = zh.value ? '登入後才能刪除關係。' : 'Sign in to delete relationships.'
    return
  }
  if (!window.confirm(zh.value ? `刪除「${rel.from_entity?.name} → ${rel.to_entity?.name}」這條關係？此動作會留下公開紀錄。` : `Delete this relationship? This will be publicly logged.`)) return

  resetMessages()
  submitting.value = true
  try {
    await deleteEventRelationship(token.value, route.params.id, rel.id)
    if (relationshipEditId.value === String(rel.id)) cancelEditRelationship()
    formMessage.value = zh.value ? '關係已刪除，刪除紀錄已保存。' : 'Relationship deleted and logged.'
    await load()
    activeTab.value = 'graph'
  } catch (err) {
    formError.value = err.message || (zh.value ? '刪除失敗。' : 'Failed to delete relationship.')
  } finally {
    submitting.value = false
  }
}

onMounted(load)
onUnmounted(() => { document.title = 'TruthShield' })
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-6xl">
      <AppNav>
        <RouterLink class="text-zinc-400 hover:text-cyan-100" to="/community-tasks">{{ zh ? '社群任務' : 'Community Tasks' }}</RouterLink>
      </AppNav>

      <div v-if="error" class="rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">{{ error }}</div>
      <div v-else-if="loading" class="rounded-lg border border-white/10 p-4 text-sm text-zinc-400">{{ zh ? '載入中...' : 'Loading...' }}</div>
      <template v-else-if="event">
        <div class="rounded-3xl border border-cyan-300/15 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.14),transparent_38%),linear-gradient(150deg,rgba(8,145,178,0.1),rgba(24,24,27,0.92)_44%,rgba(9,9,11,0.98))] p-6 shadow-2xl shadow-cyan-950/20">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p class="text-sm font-semibold text-cyan-300">TruthShield Event</p>
              <h1 class="mt-2 text-3xl font-semibold text-white md:text-4xl">{{ event.name }}</h1>
            </div>
            <div class="shrink-0 rounded-2xl border border-white/10 bg-zinc-950/70 p-4 text-sm shadow-lg shadow-black/20 lg:min-w-64">
              <template v-if="currentUser">
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{{ zh ? '目前身份' : 'Current identity' }}</p>
                <RouterLink class="mt-2 block truncate font-semibold text-cyan-100 hover:text-cyan-50" to="/profile">{{ currentUserName }}</RouterLink>
                <p class="mt-1 text-xs text-zinc-500">{{ currentUser.email }}</p>
                <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span class="rounded-full border border-white/10 px-2.5 py-1 text-zinc-300">{{ zh ? '信用' : 'Trust' }} {{ Number(currentUser.trust_score ?? 0).toFixed(2) }}</span>
                  <span class="rounded-full px-2.5 py-1 font-semibold" :class="canUseEventSystem ? 'bg-emerald-300/10 text-emerald-100' : 'bg-zinc-800 text-zinc-300'">
                    {{ canUseEventSystem ? (zh ? '可編輯事件' : 'Can edit events') : (zh ? '可閱讀/補需求' : 'Read/request context') }}
                  </span>
                </div>
              </template>
              <template v-else>
                <p class="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{{ zh ? '目前身份' : 'Current identity' }}</p>
                <p class="mt-2 text-sm font-semibold text-white">{{ zh ? '尚未登入' : 'Not signed in' }}</p>
                <p class="mt-1 text-xs leading-5 text-zinc-500">{{ zh ? '登入後可以補脈絡需求、時間線來源與人物/組織關係。' : 'Sign in to request context, add timeline sources, and review people/organization relationships.' }}</p>
                <RouterLink class="mt-3 inline-flex rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950" :to="{ path: '/login', query: { redirect: route.fullPath } }">{{ zh ? '登入' : 'Sign in' }}</RouterLink>
              </template>
            </div>
          </div>
          <p class="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">{{ event.summary || (zh ? '這個事件還需要社群補充摘要。' : 'This event still needs a community summary.') }}</p>
          <div class="mt-4 flex flex-wrap gap-2 text-xs">
            <RouterLink v-if="event.primary_category_label" class="rounded-full bg-cyan-300/10 px-3 py-1 font-semibold text-cyan-100 hover:bg-cyan-300/20" :to="{ path: '/events', query: { primary_category: event.primary_category } }">{{ event.primary_category_label }}</RouterLink>
            <RouterLink class="rounded-full bg-emerald-300/10 px-3 py-1 font-semibold text-emerald-100 hover:bg-emerald-300/20" :to="{ path: '/events', query: { progress_status: event.progress_status || 'collecting' } }">{{ event.progress_status_label || event.progress_status }}</RouterLink>
            <RouterLink v-for="(label, index) in event.tag_labels || []" :key="label" class="rounded-full border border-white/10 px-3 py-1 text-zinc-300 hover:border-cyan-300/40 hover:text-cyan-100" :to="{ path: '/events', query: { tag: event.tags?.[index] || label } }">{{ label }}</RouterLink>
            <span v-if="event.is_disputed" class="rounded-full bg-amber-500/10 px-3 py-1 font-semibold text-amber-100">{{ zh ? '爭議中' : 'Disputed' }}</span>
            <span class="rounded-full bg-white/10 px-3 py-1 text-zinc-300">{{ zh ? '觀看' : 'Views' }} {{ (event.view_count ?? 0).toLocaleString() }}</span>
            <span class="rounded-full bg-white/10 px-3 py-1 text-zinc-300">{{ zh ? '最後活動' : 'Last activity' }} {{ fmtDate(event.last_activity_at || event.created_at) }}</span>
            <button
              v-if="canUseEventSystem"
              type="button"
              class="rounded-full border border-cyan-300/40 px-3 py-1 font-semibold text-cyan-100 hover:border-cyan-300/80"
              @click="metadataEditOpen = !metadataEditOpen"
            >
              {{ zh ? '編輯分類/進度' : 'Edit classification' }}
            </button>
          </div>
          <form v-if="metadataEditOpen" class="mt-4 grid gap-3 rounded-2xl border border-cyan-300/20 bg-zinc-950/60 p-4 md:grid-cols-3" @submit.prevent="saveEventMetadata">
            <label class="grid gap-1.5 text-sm">
              <span class="text-zinc-400">{{ zh ? '主分類' : 'Primary category' }}</span>
              <select v-model="metadataForm.primary_category" class="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-cyan-300">
                <option value="">{{ zh ? '未分類' : 'Uncategorized' }}</option>
                <option v-for="option in eventOptions.primary_categories" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <label class="grid gap-1.5 text-sm">
              <span class="text-zinc-400">{{ zh ? '進度狀態' : 'Progress' }}</span>
              <select v-model="metadataForm.progress_status" class="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-cyan-300">
                <option v-for="option in eventOptions.progress_statuses" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <label class="grid gap-1.5 text-sm">
              <span class="text-zinc-400">{{ zh ? '補充標籤' : 'Tags' }}</span>
              <select v-model="metadataForm.tags" multiple size="4" class="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-cyan-300">
                <option v-for="option in eventOptions.tags" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
            <div class="flex gap-2 md:col-span-3">
              <button class="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-60" :disabled="submitting" type="submit">{{ zh ? '儲存' : 'Save' }}</button>
              <button class="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300" type="button" @click="metadataEditOpen = false">{{ zh ? '取消' : 'Cancel' }}</button>
            </div>
          </form>
        </div>

        <div class="mt-6 overflow-x-auto pb-1">
          <div class="flex min-w-max gap-2">
            <button v-for="tab in tabs" :key="tab.key" class="rounded-full border px-4 py-2 text-sm font-semibold whitespace-nowrap" :class="activeTab === tab.key ? 'border-cyan-300 bg-cyan-300 text-zinc-950' : 'border-white/10 text-zinc-300 hover:border-cyan-300/50'" @click="activeTab = tab.key">{{ tab.label }}</button>
          </div>
        </div>

        <div v-if="formMessage || formError" class="mt-4 rounded-md border p-3 text-sm" :class="formError ? 'border-red-400/40 bg-red-500/10 text-red-100' : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'">
          {{ formError || formMessage }}
        </div>

        <section v-if="activeTab === 'overview'" class="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div class="space-y-4">
            <div class="grid gap-4 sm:grid-cols-2">
              <button
                v-for="stat in overviewStats"
                :key="stat.key"
                type="button"
                class="rounded-2xl border p-5 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-cyan-300/10 focus:outline-none focus:ring-2 focus:ring-cyan-300/50"
                :class="stat.tone"
                @click="activeTab = stat.tab"
              >
                <p class="text-xs uppercase tracking-[0.18em] text-zinc-500">{{ stat.label }}</p>
                <p class="mt-3 text-3xl font-semibold">{{ stat.value }}</p>
              </button>
            </div>
            <div class="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.04] p-5">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{{ zh ? '可完成任務' : 'Actionable tasks' }}</p>
              <h2 class="mt-3 text-lg font-semibold text-white">{{ zh ? '把隱形編輯變成可累積貢獻' : 'Turn hidden editing into visible contribution' }}</h2>
              <p class="mt-2 text-sm leading-6 text-zinc-400">{{ zh ? '補時間線、官方來源、人物/組織關係與證據評價都會進入社群任務與個人貢獻紀錄。' : 'Timeline sources, official sources, entity relationships, and evidence ratings flow into community tasks and profile contribution records.' }}</p>
              <div class="mt-4 grid gap-2 sm:grid-cols-2">
                <RouterLink class="rounded-md border border-cyan-300/30 px-3 py-2 text-center text-xs font-semibold text-cyan-100 hover:border-cyan-300/70" :to="{ path: '/community-tasks', query: { type: 'timeline_source_review' } }">{{ zh ? '補時間線來源' : 'Timeline sources' }}</RouterLink>
                <RouterLink class="rounded-md border border-cyan-300/30 px-3 py-2 text-center text-xs font-semibold text-cyan-100 hover:border-cyan-300/70" :to="{ path: '/community-tasks', query: { type: 'official_source_request' } }">{{ zh ? '補官方來源' : 'Official sources' }}</RouterLink>
                <RouterLink class="rounded-md border border-white/10 px-3 py-2 text-center text-xs font-semibold text-zinc-300 hover:border-cyan-300/50 hover:text-cyan-100" :to="{ path: '/community-tasks', query: { type: 'entity_relationship_review' } }">{{ zh ? '確認人物/組織' : 'Review relationships' }}</RouterLink>
                <button class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-cyan-300/50 hover:text-cyan-100" type="button" @click="activeTab = 'timeline'">{{ zh ? '直接新增時間線' : 'Add timeline entry' }}</button>
              </div>
            </div>
            <div class="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.04] p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">{{ zh ? '事件需求雷達' : 'Context Request Radar' }}</p>
                  <h2 class="mt-3 text-lg font-semibold text-white">{{ zh ? '讀者想補哪些脈絡' : 'What context readers want next' }}</h2>
                </div>
                <span class="rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold text-zinc-300">
                  {{ reactionSummary?.summary?.total_users || 0 }} {{ zh ? '人' : 'people' }}
                </span>
              </div>
              <div v-if="eventReactionTop.length" class="mt-4 flex flex-wrap gap-2">
                <span v-for="row in eventReactionTop" :key="`top-${row.key}`" class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-zinc-950 text-xl" :title="`${row.label} · ${row.count}`">{{ row.emoji }}</span>
              </div>
              <div v-if="eventReactionRows.length" class="mt-4 grid gap-2 sm:grid-cols-2">
                <div v-for="row in eventReactionRows" :key="row.key" class="flex items-center justify-between gap-3 rounded border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm">
                  <span class="min-w-0 truncate text-zinc-200"><span class="mr-2">{{ row.emoji }}</span>{{ row.label }}</span>
                  <span class="shrink-0 text-xs font-semibold text-emerald-200">{{ row.count }}</span>
                </div>
              </div>
              <p v-else class="mt-4 text-sm text-zinc-500">{{ zh ? '尚無事件需求訊號。你可以直接在這裡留下想看的補充。' : 'No context requests yet. You can leave one here.' }}</p>

              <div class="mt-5 space-y-4 rounded-xl border border-white/10 bg-zinc-950/70 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-emerald-100">{{ zh ? '留下你的脈絡需求' : 'Request event context' }}</p>
                    <p class="mt-1 text-xs leading-5 text-zinc-500">{{ zh ? '這不會取代可信度投票，只用來聚合社群想補的脈絡與任務方向。' : 'This does not replace credibility voting; it aggregates what context and tasks readers want next.' }}</p>
                  </div>
                  <RouterLink v-if="!token" class="shrink-0 rounded-md border border-emerald-300/40 px-3 py-2 text-xs font-semibold text-emerald-100" :to="{ path: '/login', query: { redirect: route.fullPath } }">{{ zh ? '登入' : 'Sign in' }}</RouterLink>
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-semibold text-zinc-300">{{ zh ? '你的感受' : 'Your signal' }}</p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="option in reactionOptions.feelings"
                      :key="option.key"
                      type="button"
                      class="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                      :class="selectedFeelings.includes(option.key) ? 'border-emerald-200 bg-emerald-300 text-zinc-950' : 'border-white/10 bg-zinc-950 text-zinc-300 hover:border-emerald-300/50 hover:text-emerald-100'"
                      @click="toggleEventReaction('feeling', option.key)"
                    >
                      <span class="mr-1 text-sm">{{ option.emoji }}</span>{{ option.label }}
                    </button>
                  </div>
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-semibold text-zinc-300">{{ zh ? '想看的補充' : 'Context requests' }}</p>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="option in reactionOptions.needs"
                      :key="option.key"
                      type="button"
                      class="rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors"
                      :class="selectedNeeds.includes(option.key) ? 'border-cyan-200 bg-cyan-300 text-zinc-950' : 'border-white/10 bg-zinc-950 text-zinc-300 hover:border-cyan-300/50 hover:text-cyan-100'"
                      @click="toggleEventReaction('need', option.key)"
                    >
                      <span class="mr-1 text-sm">{{ option.emoji }}</span>{{ option.label }}
                    </button>
                  </div>
                </div>

                <p v-if="reactionError" class="text-xs text-red-300">{{ reactionError }}</p>
                <p v-if="reactionMessage" class="text-xs text-emerald-300">{{ reactionMessage }}</p>
                <button
                  type="button"
                  class="w-full rounded-md bg-emerald-300 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50"
                  :disabled="reactionSubmitting || !token || !eventReactionSourceUrl"
                  @click="submitEventReaction"
                >
                  {{ reactionSubmitting ? (zh ? '送出中...' : 'Submitting...') : (zh ? '送出脈絡需求' : 'Submit context request') }}
                </button>
              </div>
            </div>
          </div>
          <div class="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{{ zh ? '事件說明' : 'How to use this event' }}</p>
            <h2 class="mt-3 text-lg font-semibold text-white">{{ zh ? '把脈絡、關係與編輯紀錄放在一起' : 'Context, relationships, and edit history stay together' }}</h2>
            <p class="mt-3 text-sm leading-7 text-zinc-400">
              {{ zh ? '先看總覽掌握規模，再切到時間線與關係圖查看證據脈絡。若需要修正，所有新增與編輯都會留下可追溯紀錄。' : 'Start with the overview, then use the timeline and graph tabs to inspect evidence context. New entries and edits stay publicly traceable.' }}
            </p>
          </div>
        </section>

        <section v-if="activeTab === 'timeline'" class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <form class="mb-5 grid gap-3 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-4" @submit.prevent="submitTimeline">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-cyan-100">{{ zh ? '手動新增時間線項目' : 'Add Timeline Entry' }}</p>
                <p class="mt-1 text-xs text-zinc-400">{{ zh ? '每次新增都會留下公開編輯紀錄，方便社群追蹤脈絡。' : 'Every addition creates a public edit log.' }}</p>
              </div>
              <RouterLink v-if="!token" class="rounded-md border border-cyan-300/40 px-3 py-2 text-xs font-semibold text-cyan-100" to="/login">{{ zh ? '登入' : 'Sign in' }}</RouterLink>
            </div>
            <div class="grid gap-3 md:grid-cols-2">
              <input v-model="timelineForm.title" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300" :placeholder="zh ? '事件標題' : 'Entry title'" required />
              <input v-model="timelineForm.occurred_at" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300" type="datetime-local" required />
            </div>
            <textarea v-model="timelineForm.summary" class="min-h-20 rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300" :placeholder="zh ? '摘要：發生了什麼，為什麼重要' : 'Summary: what happened and why it matters'" required></textarea>
            <div class="grid gap-3 md:grid-cols-[180px_1fr]">
              <select v-model="timelineForm.source_type" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300">
                <option v-for="st in sourceTypes" :key="st.value" :value="st.value">{{ st.label }}</option>
              </select>
              <input v-model="timelineForm.source_url" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300" :placeholder="zh ? '來源 URL' : 'Source URL'" required />
            </div>
            <button class="rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50" :disabled="submitting || !token">{{ submitting ? (zh ? '新增中...' : 'Adding...') : (zh ? '新增時間線' : 'Add Entry') }}</button>
          </form>

          <div v-if="timeline.length === 0" class="text-sm text-zinc-400">{{ zh ? '尚無時間線項目。可從新聞右鍵 Pin 進來。' : 'No timeline entries yet. Pin one from a news page.' }}</div>
          <div v-else class="relative space-y-5 before:absolute before:left-3 before:top-1 before:h-full before:w-px before:bg-cyan-300/30">
            <article v-for="entry in timeline" :key="entry.id" class="relative pl-10">
              <span class="absolute left-0 top-1 h-6 w-6 rounded-full border border-cyan-300/50 bg-zinc-950"></span>
              <p class="text-xs text-zinc-500">{{ fmtDate(entry.occurred_at) }} · {{ sourceTypes.find(s => s.value === entry.source_type)?.label ?? entry.source_type }}</p>
              <h2 class="mt-1 text-lg font-semibold text-white">{{ entry.title }}</h2>
              <p class="mt-1 text-sm leading-6 text-zinc-400">{{ entry.summary }}</p>
              <a v-if="entry.source_url" class="mt-2 inline-block break-all text-xs text-cyan-200 hover:text-cyan-100" :href="entry.source_url" target="_blank" rel="noopener noreferrer">{{ entry.source_url }}</a>
              <div v-if="token" class="mt-3 flex flex-wrap gap-2">
                <button class="rounded-md border border-white/10 px-2 py-1 text-xs font-semibold text-zinc-300 hover:border-cyan-300/60" :disabled="!token" @click="startEditTimeline(entry)">{{ zh ? '編輯' : 'Edit' }}</button>
                <button class="rounded-md border border-red-400/30 px-2 py-1 text-xs font-semibold text-red-100 hover:border-red-300/70" :disabled="!token" @click="removeTimelineEntry(entry)">{{ zh ? '刪除' : 'Delete' }}</button>
              </div>
              <RouterLink v-else class="mt-3 inline-flex rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-100" to="/login">{{ zh ? '登入後可編輯' : 'Sign in to edit' }}</RouterLink>
              <form v-if="timelineEditId === String(entry.id)" class="mt-4 grid gap-3 rounded-lg border border-cyan-300/20 bg-zinc-950/80 p-4" @submit.prevent="submitTimelineEdit">
                <div class="grid gap-3 md:grid-cols-2">
                  <input v-model="timelineEditForm.title" class="rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300" :placeholder="zh ? '事件標題' : 'Entry title'" required />
                  <input v-model="timelineEditForm.occurred_at" class="rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300" type="datetime-local" required />
                </div>
                <textarea v-model="timelineEditForm.summary" class="min-h-20 rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300" required></textarea>
                <div class="grid gap-3 md:grid-cols-[180px_1fr]">
                  <select v-model="timelineEditForm.source_type" class="rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300">
                    <option value="news">news</option>
                    <option value="evidence">evidence</option>
                    <option value="official_response">official_response</option>
                    <option value="external">external</option>
                  </select>
                  <input v-model="timelineEditForm.source_url" class="rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300" :placeholder="zh ? '來源 URL' : 'Source URL'" required />
                </div>
                <div class="flex gap-2">
                  <button class="rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-zinc-950" :disabled="submitting">{{ zh ? '儲存編輯' : 'Save Edit' }}</button>
                  <button type="button" class="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-300" @click="cancelEditTimeline">{{ zh ? '取消' : 'Cancel' }}</button>
                </div>
              </form>
            </article>
          </div>
        </section>

        <section v-if="activeTab === 'graph'" class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div class="mb-5 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="text-sm font-semibold text-cyan-100">{{ zh ? '在圖上右鍵編輯' : 'Right-click to edit the graph' }}</p>
                <p class="mt-1 text-xs leading-5 text-zinc-400">
                  {{ zh ? '新增人物、組織、關係線都集中在關係圖右鍵選單；每次新增、修改、刪除都會留下公開編輯紀錄。' : 'Add people, organizations, and relationships from the graph context menu. Every change is publicly logged.' }}
                </p>
              </div>
              <RouterLink v-if="!token" class="rounded-md border border-cyan-300/40 px-3 py-2 text-xs font-semibold text-cyan-100" to="/login">{{ zh ? '登入後編輯' : 'Sign in to edit' }}</RouterLink>
            </div>
          </div>

          <div class="grid gap-5" :class="nodeManagementOpen ? 'lg:grid-cols-[minmax(0,1fr)_360px]' : 'lg:grid-cols-1'">
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-zinc-200">{{ zh ? '關係圖' : 'Relationship Graph' }}</p>
                <div class="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    class="rounded-md border px-3 py-2 text-xs font-semibold"
                    :class="nodeManagementOpen ? 'border-cyan-300 bg-cyan-300 text-zinc-950' : 'border-white/10 text-zinc-300 hover:border-cyan-300/60'"
                    @click="nodeManagementOpen = !nodeManagementOpen"
                  >
                    {{ nodeManagementOpen ? (zh ? '收合節點管理' : 'Hide Node Panel') : (zh ? '節點管理' : 'Node Panel') }}
                  </button>
                  <button class="rounded-md border border-cyan-300/40 px-3 py-2 text-xs font-semibold text-cyan-100 hover:border-cyan-300/80" @click="downloadGraphImage('png')">
                    {{ zh ? '下載 PNG' : 'Download PNG' }}
                  </button>
                  <button class="rounded-md border border-cyan-300/40 px-3 py-2 text-xs font-semibold text-cyan-100 hover:border-cyan-300/80" @click="downloadGraphImage('jpeg')">
                    {{ zh ? '下載 JPEG' : 'Download JPEG' }}
                  </button>
                </div>
              </div>
              <div class="flex flex-wrap items-center justify-between gap-3 rounded-md border border-white/10 bg-zinc-950/70 p-2 text-xs text-zinc-400">
                <span>{{ zh ? '右鍵新增節點與關係線，左鍵拖曳節點或平移畫面。' : 'Right-click to add nodes and edges. Drag nodes or pan with left click.' }}</span>
                <div class="flex items-center gap-1">
                  <button type="button" class="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-base font-semibold text-zinc-100 hover:border-cyan-300/60" :aria-label="zh ? '縮小' : 'Zoom out'" @click="zoomGraph(0.85)">−</button>
                  <span class="min-w-14 text-center tabular-nums text-zinc-300">{{ Math.round(graphScale * 100) }}%</span>
                  <button type="button" class="grid h-8 w-8 place-items-center rounded-md border border-white/10 text-base font-semibold text-zinc-100 hover:border-cyan-300/60" :aria-label="zh ? '放大' : 'Zoom in'" @click="zoomGraph(1.18)">+</button>
                  <button type="button" class="ml-1 rounded-md border border-white/10 px-2 py-1.5 font-semibold text-zinc-300 hover:border-cyan-300/60" @click="resetGraphView">{{ zh ? '重設' : 'Reset' }}</button>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 rounded-md border border-white/10 bg-zinc-950/70 p-2 text-xs text-zinc-400">
                <span class="font-semibold text-zinc-300">{{ zh ? '角色連結度' : 'Actor connectivity' }}</span>
                <span v-for="item in entityHeatLegend" :key="item.label" class="inline-flex items-center gap-1">
                  <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: item.color }"></span>
                  {{ item.label }}
                </span>
              </div>
              <div class="relative">
              <svg ref="graphSvg" class="w-full rounded-lg border border-white/10 bg-zinc-950" :class="[isPanning ? 'cursor-grabbing' : 'cursor-grab', nodeManagementOpen ? 'h-[520px]' : 'h-[680px]']" viewBox="-30 -30 580 500" role="img" @contextmenu.prevent="openGraphContextMenu($event)" @pointerdown="startGraphPan" @pointermove="handleGraphMove" @pointerup="endGraphInteraction" @pointerleave="endGraphInteraction" @wheel.prevent="handleGraphWheel">
                <rect x="-30" y="-30" width="580" height="500" fill="#09090b" @contextmenu.prevent="openGraphContextMenu($event)" />
                <defs>
                  <marker id="truthshield-arrow-cyan" viewBox="0 0 8 8" refX="6.8" refY="4" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
                    <path d="M 0 0 L 8 4 L 0 8 z" fill="#67e8f9" />
                  </marker>
                  <marker id="truthshield-arrow-orange" viewBox="0 0 8 8" refX="6.8" refY="4" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
                    <path d="M 0 0 L 8 4 L 0 8 z" fill="#f97316" />
                  </marker>
                </defs>
                <g :transform="`translate(${graphPan.x},${graphPan.y}) scale(${graphScale})`">
                <g v-for="rel in graph.relationships" :key="rel.id">
                  <path
                    :d="relationshipCurve(rel).path"
                    fill="none"
                    :stroke="rel.is_high_risk ? '#f97316' : '#67e8f9'"
                    stroke-width="2.5"
                    opacity="0.8"
                    :marker-end="rel.is_high_risk ? 'url(#truthshield-arrow-orange)' : 'url(#truthshield-arrow-cyan)'"
                  />
                  <g :transform="`translate(${relationshipCurve(rel).labelX}, ${relationshipCurve(rel).labelY})`">
                    <rect
                      :x="-relationshipLabelWidth(rel) / 2"
                      y="-13"
                      :width="relationshipLabelWidth(rel)"
                      height="26"
                      rx="6"
                      fill="#09090b"
                      :stroke="rel.is_high_risk ? '#f97316' : '#155e75'"
                      opacity="0.95"
                    />
                    <text text-anchor="middle" dominant-baseline="middle" :fill="rel.is_high_risk ? '#fed7aa' : '#cffafe'" font-size="11" font-weight="700">
                      {{ relationshipLabel(rel) }}
                    </text>
                  </g>
                </g>
                <g v-for="(entity, index) in graph.entities" :key="entity.id" :class="token ? 'cursor-move' : 'cursor-default'" @contextmenu.prevent.stop="openGraphContextMenu($event, entity)" @pointerdown.prevent="startDragEntity(entity, $event)">
                  <title>{{ entity.name }} ({{ entity.entity_type }})</title>
                  <circle
                    :cx="entityPosition(entity.id).x"
                    :cy="entityPosition(entity.id).y"
                    :r="entityRadius(entity.id)"
                    :fill="entityHeat(entity).color"
                    :stroke="entityHeat(entity).stroke"
                    :stroke-width="2 + entityHeat(entity).level"
                  />
                  <text :x="entityPosition(entity.id).x" :y="entityPosition(entity.id).y + 4" text-anchor="middle" fill="#fff" font-size="12" pointer-events="none">{{ entity.name.slice(0, 8) }}</text>
                  <text :x="entityPosition(entity.id).x" :y="entityPosition(entity.id).y + entityRadius(entity.id) + 14" text-anchor="middle" fill="#a1a1aa" font-size="10" pointer-events="none">{{ entityDegree(entity) }}</text>
                  <circle v-if="entity.global_entity_id" :cx="entityPosition(entity.id).x + entityRadius(entity.id) - 4" :cy="entityPosition(entity.id).y - entityRadius(entity.id) + 4" r="5" fill="#67e8f9" stroke="#09090b" stroke-width="1.5" pointer-events="none" />
                </g>
                </g>
              </svg>
              <div
                v-if="(graph.entities || []).length === 0 && !eventGraphCoachDismissed"
                class="pointer-events-none absolute inset-0 grid place-items-center px-6 text-center"
              >
                <div class="pointer-events-auto max-w-sm rounded-lg border border-cyan-300/20 bg-zinc-950/80 p-4 shadow-2xl shadow-black/30">
                  <div class="flex items-start justify-between gap-3">
                    <p class="text-sm font-semibold text-cyan-100">{{ zh ? '這張關係圖還是空的' : 'This graph is empty' }}</p>
                    <button class="rounded border border-white/10 px-1.5 py-0.5 text-xs text-zinc-500 hover:border-cyan-300/60 hover:text-cyan-100" type="button" @click="dismissEventGraphCoach">×</button>
                  </div>
                  <p class="mt-2 text-xs leading-5 text-zinc-400">
                    {{ token ? (zh ? '在空白圖紙上按右鍵，可以直接新增第一個人物或組織節點。' : 'Right-click the blank canvas to add the first person or organization node.') : (zh ? '登入後可在空白圖紙上右鍵新增第一個人物或組織節點。' : 'Sign in, then right-click the blank canvas to add the first person or organization node.') }}
                  </p>
                </div>
              </div>
              <div
                v-if="graphContextMenu.open"
                class="absolute z-20 w-64 rounded-lg border border-cyan-300/20 bg-zinc-950/95 p-2 text-sm shadow-2xl shadow-black/50 backdrop-blur"
                :style="{ left: `${graphContextMenu.x}px`, top: `${graphContextMenu.y}px` }"
                @click.stop
              >
                <template v-if="token">
                  <p class="px-2 py-1 text-xs font-semibold text-cyan-200">
                    {{ graphContextMenu.entity ? graphContextMenu.entity.name : (zh ? '關係圖空白處' : 'Graph canvas') }}
                  </p>
                  <button type="button" class="block w-full rounded-md px-2 py-2 text-left text-zinc-200 hover:bg-white/10" @click="openQuickEntityPanel('person')">{{ zh ? '在這裡新增人物' : 'Add person here' }}</button>
                  <button type="button" class="block w-full rounded-md px-2 py-2 text-left text-zinc-200 hover:bg-white/10" @click="openQuickEntityPanel('organization')">{{ zh ? '在這裡新增組織' : 'Add organization here' }}</button>
                  <button v-if="(graph.entities || []).length >= 2" type="button" class="block w-full rounded-md px-2 py-2 text-left text-zinc-200 hover:bg-white/10" @click="openQuickRelationshipPanel('from')">{{ graphContextMenu.entity ? (zh ? '從此節點新增關係線' : 'Add edge from this node') : (zh ? '新增既有節點關係線' : 'Add edge between existing nodes') }}</button>
                  <button v-if="graphContextMenu.entity && (graph.entities || []).length >= 2" type="button" class="block w-full rounded-md px-2 py-2 text-left text-zinc-200 hover:bg-white/10" @click="openQuickRelationshipPanel('to')">{{ zh ? '新增指向此節點的關係線' : 'Add edge to this node' }}</button>
                  <div v-if="graphContextMenu.entity" class="my-1 border-t border-white/10"></div>
                  <button v-if="graphContextMenu.entity" type="button" class="block w-full rounded-md px-2 py-2 text-left text-zinc-200 hover:bg-white/10" @click="startEditEntity(graphContextMenu.entity); closeGraphContextMenu()">{{ zh ? '編輯節點資料' : 'Edit node details' }}</button>
                  <button v-if="graphContextMenu.entity" type="button" class="block w-full rounded-md px-2 py-2 text-left text-red-200 hover:bg-red-500/10" @click="removeEntity(graphContextMenu.entity); closeGraphContextMenu()">{{ zh ? '刪除節點' : 'Delete node' }}</button>
                </template>
                <template v-else>
                  <p class="px-2 py-2 text-xs leading-5 text-zinc-400">{{ zh ? '登入後可直接在圖上新增人物、組織與關係線。' : 'Sign in to add nodes and relationships directly on the graph.' }}</p>
                  <RouterLink class="block rounded-md border border-cyan-300/40 px-2 py-2 text-center text-xs font-semibold text-cyan-100" to="/login">{{ zh ? '登入' : 'Sign in' }}</RouterLink>
                </template>
                <button type="button" class="mt-1 block w-full rounded-md px-2 py-1.5 text-left text-xs text-zinc-500 hover:bg-white/5" @click="closeGraphContextMenu">{{ zh ? '取消' : 'Cancel' }}</button>
              </div>
              <form
                v-if="quickGraphPanel.open"
                class="absolute z-20 grid w-[min(320px,calc(100%-24px))] gap-2 rounded-lg border border-cyan-300/25 bg-zinc-950/95 p-3 text-sm shadow-2xl shadow-black/50 backdrop-blur"
                :style="{ left: `${quickGraphPanel.x}px`, top: `${quickGraphPanel.y}px` }"
                @submit.prevent="quickGraphPanel.mode === 'entity' ? submitQuickEntity() : submitQuickRelationship()"
              >
                <template v-if="quickGraphPanel.mode === 'entity'">
                  <div class="flex items-center justify-between gap-2">
                    <p class="font-semibold text-cyan-100">{{ zh ? '新增節點' : 'Add node' }}</p>
                    <button type="button" class="text-zinc-500 hover:text-zinc-200" @click="closeQuickGraphPanel">✕</button>
                  </div>
                  <div class="relative">
                    <div class="flex gap-2">
                      <input v-model="quickGlobalEntitySearch" class="min-w-0 flex-1 rounded-md border border-white/10 bg-black px-3 py-2 outline-none focus:border-cyan-300" :placeholder="zh ? '搜尋全域人物/組織（選填）' : 'Search global entity optional'" @keydown.enter.prevent="searchQuickGlobal" />
                      <button type="button" class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300" @click="searchQuickGlobal">{{ quickGlobalEntitySearching ? '…' : (zh ? '搜尋' : 'Search') }}</button>
                      <button v-if="quickEntityForm.global_entity_id" type="button" class="rounded-md border border-red-400/30 px-2 py-2 text-xs text-red-300" @click="clearQuickGlobalEntity">✕</button>
                    </div>
                    <div v-if="quickGlobalEntityResults.length" class="absolute z-30 mt-1 w-full rounded-md border border-white/10 bg-zinc-900 shadow-xl">
                      <button v-for="ge in quickGlobalEntityResults" :key="ge.id" type="button" class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-white/5" @click="selectQuickGlobalEntity(ge)">
                        <span class="font-semibold text-white">{{ ge.name }}</span>
                        <span class="shrink-0 text-xs text-zinc-500">{{ ge.entity_type }} · {{ ge.event_entities_count ?? 0 }} {{ zh ? '個事件' : 'events' }}</span>
                      </button>
                    </div>
                    <p v-else-if="quickGlobalEntitySearching" class="mt-1 text-xs text-zinc-500">{{ zh ? '搜尋中...' : 'Searching...' }}</p>
                    <p v-else-if="quickGlobalEntitySearched && quickGlobalEntitySearch.trim()" class="mt-1 text-xs text-zinc-500">{{ zh ? '沒有找到共用人物/組織，可以直接新增本事件節點。' : 'No shared entity found. You can still add a local event node.' }}</p>
                    <p v-if="quickEntityForm.global_entity_id" class="mt-1 text-xs text-cyan-300">{{ zh ? '已連結全域人物/組織' : 'Linked to global entity' }} #{{ quickEntityForm.global_entity_id }}</p>
                  </div>
                  <div class="grid grid-cols-[1fr_112px] gap-2">
                    <input v-model="quickEntityForm.name" class="rounded-md border border-white/10 bg-black px-3 py-2 outline-none focus:border-cyan-300" :placeholder="zh ? '名稱' : 'Name'" required />
                    <select v-model="quickEntityForm.entity_type" class="rounded-md border border-white/10 bg-black px-2 py-2 outline-none focus:border-cyan-300">
                      <option value="person">{{ zh ? '人物' : 'Person' }}</option>
                      <option value="organization">{{ zh ? '組織' : 'Org' }}</option>
                    </select>
                  </div>
                  <textarea v-model="quickEntityForm.description" class="min-h-16 rounded-md border border-white/10 bg-black px-3 py-2 outline-none focus:border-cyan-300" :placeholder="zh ? '簡短描述' : 'Short description'"></textarea>
                  <input v-model="quickEntityForm.source_url" class="rounded-md border border-white/10 bg-black px-3 py-2 outline-none focus:border-cyan-300" :placeholder="zh ? '來源 URL（選填）' : 'Source URL optional'" />
                </template>
                <template v-else>
                  <div class="flex items-center justify-between gap-2">
                    <p class="font-semibold text-cyan-100">{{ zh ? '新增關係線' : 'Add relationship' }}</p>
                    <button type="button" class="text-zinc-500 hover:text-zinc-200" @click="closeQuickGraphPanel">✕</button>
                  </div>
                  <select v-model="quickRelationshipForm.from_entity_id" class="rounded-md border border-white/10 bg-black px-3 py-2 outline-none focus:border-cyan-300" required>
                    <option value="">{{ zh ? '起點節點' : 'From node' }}</option>
                    <option v-for="entity in graph.entities || []" :key="entity.id" :value="entity.id">{{ entity.name }} · {{ entity.entity_type }}</option>
                  </select>
                  <select v-model="quickRelationshipForm.to_entity_id" class="rounded-md border border-white/10 bg-black px-3 py-2 outline-none focus:border-cyan-300" required>
                    <option value="">{{ zh ? '終點節點' : 'To node' }}</option>
                    <option v-for="entity in graph.entities || []" :key="entity.id" :value="entity.id">{{ entity.name }} · {{ entity.entity_type }}</option>
                  </select>
                  <input v-model="quickRelationshipForm.relationship_type" class="rounded-md border border-white/10 bg-black px-3 py-2 outline-none focus:border-cyan-300" :placeholder="zh ? '關係類型' : 'Relationship type'" required />
                  <textarea v-model="quickRelationshipForm.description" class="min-h-16 rounded-md border border-white/10 bg-black px-3 py-2 outline-none focus:border-cyan-300" :placeholder="zh ? '關係說明' : 'Description'"></textarea>
                  <div class="grid grid-cols-[120px_1fr] gap-2">
                    <select v-model="quickRelationshipForm.source_type" class="rounded-md border border-white/10 bg-black px-2 py-2 outline-none focus:border-cyan-300">
                      <option v-for="st in sourceTypes" :key="st.value" :value="st.value">{{ st.label }}</option>
                    </select>
                    <input v-model="quickRelationshipForm.source_url" class="rounded-md border border-white/10 bg-black px-3 py-2 outline-none focus:border-cyan-300" :placeholder="zh ? '參考資料 URL（選填，高風險關係必填）' : 'Reference URL optional; required for high-risk relationships'" />
                  </div>
                  <label class="inline-flex items-center gap-2 text-xs text-zinc-300">
                    <input v-model="quickRelationshipForm.is_bidirectional" type="checkbox" class="h-4 w-4 rounded border-white/20 bg-black text-cyan-300" />
                    {{ zh ? '雙向關係' : 'Bidirectional' }}
                  </label>
                </template>
                <button class="rounded-md bg-cyan-300 px-3 py-2 font-semibold text-zinc-950 disabled:opacity-50" :disabled="submitting">{{ submitting ? (zh ? '儲存中...' : 'Saving...') : (zh ? '儲存並留下紀錄' : 'Save and log') }}</button>
              </form>
              </div>
              <div class="mt-1 flex items-center justify-between text-xs text-zinc-600">
                <span>{{ zh ? '滾輪縮放・拖曳平移' : 'Scroll to zoom · drag to pan' }}</span>
                <button class="hover:text-zinc-300" @click="resetGraphView">{{ zh ? '重設視圖' : 'Reset view' }}</button>
              </div>
            </div>
            <div v-if="nodeManagementOpen" class="space-y-3">
              <section class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-white">{{ zh ? '節點管理' : 'Node Management' }}</p>
                    <p class="mt-1 text-xs text-zinc-500">{{ zh ? '依人物、組織或高連結角色篩選，避免大型事件一次列出過多節點。' : 'Filter by people, organizations, or highly connected actors for large events.' }}</p>
                  </div>
                  <RouterLink v-if="!token" class="rounded-md border border-cyan-300/30 px-2 py-1 text-xs font-semibold text-cyan-100" to="/login">{{ zh ? '登入後管理' : 'Sign in to manage' }}</RouterLink>
                </div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <button
                    v-for="filter in entityFilters"
                    :key="filter.key"
                    class="rounded-md border px-2 py-1 text-xs font-semibold"
                    :class="entityFilter === filter.key ? 'border-cyan-300 bg-cyan-300 text-zinc-950' : 'border-white/10 text-zinc-300 hover:border-cyan-300/50'"
                    type="button"
                    @click="entityFilter = filter.key"
                  >
                    {{ filter.label }} {{ filter.count }}
                  </button>
                </div>
                <div class="mt-3 grid gap-2">
                  <article v-for="entity in visibleEntities" :key="entity.id" class="rounded-md border border-white/10 bg-black/40 p-3">
                    <div class="flex items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-semibold text-white">{{ entity.name }}</p>
                        <p class="mt-1 text-xs text-zinc-500">{{ entity.entity_type }} · {{ zh ? '連線' : 'degree' }} {{ entityDegree(entity) }} · {{ entityHeat(entity).label }}</p>
                      </div>
                      <div v-if="token" class="flex gap-2">
                        <button class="rounded-md border border-white/10 px-2 py-1 text-xs font-semibold text-zinc-300 hover:border-cyan-300/60" :disabled="!token" @click="startEditEntity(entity)">{{ zh ? '編輯' : 'Edit' }}</button>
                        <button class="rounded-md border border-red-400/30 px-2 py-1 text-xs font-semibold text-red-100 hover:border-red-300/70" :disabled="!token" @click="removeEntity(entity)">{{ zh ? '刪除' : 'Delete' }}</button>
                      </div>
                    </div>
                    <p v-if="entity.description" class="mt-2 text-xs leading-5 text-zinc-400">{{ entity.description }}</p>
                    <div v-if="entity.global_entity" class="mt-2 flex items-center gap-1.5 text-xs text-cyan-300/80">
                      <span class="inline-block h-2 w-2 rounded-full bg-cyan-400"></span>
                      <span>{{ zh ? '共用實體：' : 'Global entity: ' }}{{ entity.global_entity.name }}</span>
                      <a v-if="entity.global_entity.wikipedia_url" :href="entity.global_entity.wikipedia_url" target="_blank" rel="noopener noreferrer" class="ml-1 underline hover:text-cyan-100">Wiki</a>
                    </div>
                    <form v-if="entityEditId === String(entity.id)" class="mt-3 grid gap-2 rounded-md border border-cyan-300/20 bg-zinc-950 p-3" @submit.prevent="submitEntityEdit">
                      <div class="grid gap-2 md:grid-cols-[1fr_130px]">
                        <input v-model="entityEditForm.name" class="rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300" required />
                        <select v-model="entityEditForm.entity_type" class="rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300">
                          <option value="person">{{ zh ? '人物' : 'Person' }}</option>
                          <option value="organization">{{ zh ? '組織' : 'Organization' }}</option>
                        </select>
                      </div>
                      <textarea v-model="entityEditForm.description" class="min-h-16 rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300"></textarea>
                      <input v-model="entityEditForm.source_url" class="rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300" :placeholder="zh ? '來源 URL' : 'Source URL'" />
                      <div class="grid gap-2 md:grid-cols-[1fr_auto]">
                        <select v-model="mergeTargetEntityId" class="rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300">
                          <option value="">{{ zh ? '合併到其他節點' : 'Merge into another node' }}</option>
                          <option v-for="target in graph.entities.filter((item) => item.id !== entity.id)" :key="target.id" :value="target.id">{{ target.name }}</option>
                        </select>
                        <button type="button" class="rounded-md border border-amber-300/40 px-3 py-2 text-sm font-semibold text-amber-100 disabled:opacity-50" :disabled="!mergeTargetEntityId || submitting" @click="submitEntityMerge">{{ zh ? '合併' : 'Merge' }}</button>
                      </div>
                      <div class="flex gap-2">
                        <button class="rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-zinc-950" :disabled="submitting">{{ zh ? '儲存節點' : 'Save Node' }}</button>
                        <button type="button" class="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-300" @click="cancelEditEntity">{{ zh ? '取消' : 'Cancel' }}</button>
                      </div>
                    </form>
                  </article>
                </div>
              </section>
              <article v-for="rel in graph.relationships" :key="rel.id" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
                <div class="flex items-start justify-between gap-3">
                  <p class="text-sm font-semibold text-white">{{ rel.from_entity?.name }} {{ rel.is_bidirectional ? '↔' : '→' }} {{ rel.to_entity?.name }}</p>
                  <div v-if="token" class="flex gap-2">
                    <button class="rounded-md border border-white/10 px-2 py-1 text-xs font-semibold text-zinc-300 hover:border-cyan-300/60" :disabled="!token" @click="startEditRelationship(rel)">{{ zh ? '編輯' : 'Edit' }}</button>
                    <button class="rounded-md border border-red-400/30 px-2 py-1 text-xs font-semibold text-red-100 hover:border-red-300/70" :disabled="!token" @click="removeRelationship(rel)">{{ zh ? '刪除' : 'Delete' }}</button>
                  </div>
                </div>
                <p class="mt-1 text-xs text-cyan-200">{{ rel.relationship_type }} <span v-if="rel.is_high_risk" class="text-amber-200">· {{ zh ? '高風險待確認' : 'High-risk review' }}</span></p>
                <p class="mt-2 text-sm text-zinc-400">{{ rel.description }}</p>
                <a v-if="rel.source_url" class="mt-2 inline-block break-all text-xs text-zinc-500 hover:text-cyan-100" :href="rel.source_url" target="_blank" rel="noopener noreferrer">{{ rel.source_url }}</a>
                <form v-if="relationshipEditId === String(rel.id)" class="mt-3 grid gap-2 rounded-md border border-cyan-300/20 bg-black/40 p-3" @submit.prevent="submitRelationshipEdit">
                  <div class="grid gap-2 md:grid-cols-2">
                    <select v-model="relationshipEditForm.from_entity_id" class="rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300" required>
                      <option v-for="entity in graph.entities" :key="entity.id" :value="entity.id">{{ entity.name }}</option>
                    </select>
                    <select v-model="relationshipEditForm.to_entity_id" class="rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300" required>
                      <option v-for="entity in graph.entities" :key="entity.id" :value="entity.id">{{ entity.name }}</option>
                    </select>
                  </div>
                  <input v-model="relationshipEditForm.relationship_type" class="rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300" required />
                  <textarea v-model="relationshipEditForm.description" class="min-h-16 rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300"></textarea>
                  <div class="grid gap-2 md:grid-cols-[150px_1fr]">
                    <select v-model="relationshipEditForm.source_type" class="rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300">
                      <option v-for="st in sourceTypes" :key="st.value" :value="st.value">{{ st.label }}</option>
                    </select>
                    <input v-model="relationshipEditForm.source_url" class="rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300" :placeholder="zh ? '參考資料 URL（選填，高風險關係必填）' : 'Reference URL optional; required for high-risk relationships'" />
                  </div>
                  <div class="flex gap-2">
                    <button class="rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-zinc-950" :disabled="submitting">{{ zh ? '儲存關係' : 'Save Relationship' }}</button>
                    <button type="button" class="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-300" @click="cancelEditRelationship">{{ zh ? '取消' : 'Cancel' }}</button>
                  </div>
                </form>
              </article>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'news'" class="mt-6 grid gap-3">
          <article v-for="item in event.items || []" :key="item.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs text-zinc-500">{{ item.item_type }}</p>
            <h2 class="mt-1 text-sm font-semibold text-white">{{ item.title || item.news_url?.title_snapshot || item.source_url }}</h2>
            <a v-if="item.source_url || item.news_url?.normalized_url" class="mt-2 inline-block break-all text-xs text-cyan-200" :href="item.source_url || item.news_url?.normalized_url" target="_blank" rel="noopener noreferrer">{{ item.source_url || item.news_url?.normalized_url }}</a>
          </article>
        </section>

        <section v-if="activeTab === 'logs'" class="mt-6 grid gap-3">
          <article v-for="log in logs" :key="log.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div class="flex flex-wrap gap-2 text-xs">
              <span class="rounded bg-white/10 px-2 py-1 text-zinc-300">{{ log.action }}</span>
              <span class="rounded bg-white/10 px-2 py-1 text-zinc-300">{{ log.subject_type }} #{{ log.subject_id }}</span>
              <span class="text-zinc-500">{{ fmtDate(log.created_at) }}</span>
            </div>
            <p class="mt-2 text-sm text-zinc-400">{{ log.reason }}</p>
            <div v-if="log.changes?.length" class="mt-3 grid gap-2">
              <div v-for="change in log.changes" :key="change.field" class="rounded-md border border-white/10 bg-zinc-950/70 p-2 text-xs">
                <p class="font-semibold text-zinc-300">{{ change.field }}</p>
                <p class="mt-1 break-words text-zinc-500">
                  <span v-if="change.before !== null && change.before !== undefined" class="line-through">{{ change.before }}</span>
                  <span v-if="change.before !== null && change.before !== undefined" class="mx-1 text-zinc-600">→</span>
                  <span class="text-zinc-300">{{ change.after ?? 'null' }}</span>
                </p>
              </div>
            </div>
            <p v-if="log.user" class="mt-2 text-xs text-zinc-500">{{ zh ? '編輯者' : 'Editor' }}：{{ log.user.name }} · Trust {{ log.user.trust_score }}</p>
          </article>
        </section>
      </template>
    </section>
  </main>
</template>
