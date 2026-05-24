<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  createEventEntity,
  createEventRelationship,
  createEventTimelineEntry,
  createGlobalEntity,
  deleteEventEntity,
  deleteEventRelationship,
  deleteEventTimelineEntry,
  fetchEvent,
  fetchEventEditLogs,
  fetchEventGraph,
  fetchEventTimeline,
  mergeEventEntity,
  searchGlobalEntities,
  updateEventEntity,
  updateEventEntityPosition,
  updateEventRelationship,
  updateEventTimelineEntry,
} from '../lib/api'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

const route = useRoute()
const { locale } = useI18n()
const zh = computed(() => locale.value !== 'en')
const token = ref(localStorage.getItem('truthshield_api_token') || '')

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
const loading = ref(true)
const error = ref('')
const graphSvg = ref(null)
const localEntityPositions = ref({})
const draggingEntity = ref(null)
const graphPan = ref({ x: 0, y: 0 })
const graphScale = ref(1)
const isPanning = ref(false)
const panAnchor = ref(null)
const submitting = ref(false)
const formMessage = ref('')
const formError = ref('')
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
const relationshipForm = ref({
  from_entity_name: '',
  from_entity_type: 'person',
  to_entity_id: '',
  relationship_type: '',
  description: '',
  source_type: 'news',
  source_url: '',
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

const tabs = computed(() => [
  { key: 'overview', label: zh.value ? '總覽' : 'Overview' },
  { key: 'timeline', label: zh.value ? '時間線' : 'Timeline' },
  { key: 'graph', label: zh.value ? '人物/組織關係圖' : 'People/Org Graph' },
  { key: 'news', label: zh.value ? '相關新聞' : 'Related News' },
  { key: 'logs', label: zh.value ? '編輯紀錄' : 'Edit Logs' },
])

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
    const [eventPayload, timelinePayload, graphPayload, logPayload] = await Promise.all([
      fetchEvent(id),
      fetchEventTimeline(id),
      fetchEventGraph(id),
      fetchEventEditLogs(id),
    ])
    event.value = eventPayload.data
    setMeta(event.value.name + ' — TruthShield', event.value.summary || event.value.name)
    timeline.value = timelinePayload
    graph.value = graphPayload
    logs.value = logPayload
  } catch (err) {
    error.value = err.message || 'Failed to load event'
  } finally {
    loading.value = false
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
  if (draggingEntity.value) return
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

function startDragEntity(entity, event) {
  if (!token.value) return
  event.stopPropagation()

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

  resetMessages()
  submitting.value = true
  try {
    await createEventRelationship(token.value, route.params.id, relationshipForm.value)
    relationshipForm.value = {
      from_entity_name: '',
      from_entity_type: 'person',
      to_entity_id: '',
      relationship_type: '',
      description: '',
      source_type: 'news',
      source_url: '',
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
        <div class="rounded-lg border border-white/10 bg-white/[0.03] p-6">
          <p class="text-sm font-semibold text-cyan-300">TruthShield Event</p>
          <h1 class="mt-2 text-3xl font-semibold text-white">{{ event.name }}</h1>
          <p class="mt-3 text-sm leading-7 text-zinc-400">{{ event.summary || (zh ? '這個事件還需要社群補充摘要。' : 'This event still needs a community summary.') }}</p>
          <div class="mt-4 flex flex-wrap gap-2 text-xs">
            <span class="rounded bg-cyan-300/10 px-2 py-1 font-semibold text-cyan-100">{{ event.status }}</span>
            <span v-if="event.is_disputed" class="rounded bg-amber-500/10 px-2 py-1 font-semibold text-amber-100">{{ zh ? '爭議中' : 'Disputed' }}</span>
            <span class="rounded bg-white/10 px-2 py-1 text-zinc-300">{{ zh ? '觀看' : 'Views' }} {{ event.view_count ?? 0 }}</span>
            <span class="rounded bg-white/10 px-2 py-1 text-zinc-300">{{ zh ? '最後活動' : 'Last activity' }} {{ fmtDate(event.last_activity_at || event.created_at) }}</span>
          </div>
        </div>

        <div class="mt-6 flex flex-wrap gap-2">
          <button v-for="tab in tabs" :key="tab.key" class="rounded-md border px-3 py-2 text-sm font-semibold" :class="activeTab === tab.key ? 'border-cyan-300 bg-cyan-300 text-zinc-950' : 'border-white/10 text-zinc-300 hover:border-cyan-300/50'" @click="activeTab = tab.key">{{ tab.label }}</button>
        </div>

        <div v-if="formMessage || formError" class="mt-4 rounded-md border p-3 text-sm" :class="formError ? 'border-red-400/40 bg-red-500/10 text-red-100' : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'">
          {{ formError || formMessage }}
        </div>

        <section v-if="activeTab === 'overview'" class="mt-6 grid gap-4 md:grid-cols-4">
          <div v-for="[key, value] in Object.entries(event.counts || {})" :key="key" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs text-zinc-500">{{ key }}</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ value ?? 0 }}</p>
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
          <div class="mb-5 grid gap-4 lg:grid-cols-2">
            <form class="grid gap-3 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-4" @submit.prevent="submitEntity">
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-cyan-100">{{ zh ? '手動新增人物/組織' : 'Add Person/Organization' }}</p>
                  <p class="mt-1 text-xs text-zinc-400">{{ zh ? '先建立節點，再建立節點之間的關係。' : 'Create nodes first, then connect them.' }}</p>
                </div>
                <RouterLink v-if="!token" class="rounded-md border border-cyan-300/40 px-3 py-2 text-xs font-semibold text-cyan-100" to="/login">{{ zh ? '登入' : 'Sign in' }}</RouterLink>
              </div>
              <!-- Global entity search -->
              <div class="relative">
                <div class="flex gap-2">
                  <input v-model="globalEntitySearch" class="min-w-0 flex-1 rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300" :placeholder="zh ? '搜尋全域人物/組織（選填）' : 'Search global entities (optional)'" @keydown.enter.prevent="searchGlobal" />
                  <button type="button" class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300" @click="searchGlobal">{{ globalEntitySearching ? '…' : (zh ? '搜尋' : 'Search') }}</button>
                  <button v-if="entityForm.global_entity_id" type="button" class="rounded-md border border-red-400/30 px-2 py-2 text-xs text-red-300" @click="clearGlobalEntity">✕</button>
                </div>
                <div v-if="globalEntityResults.length" class="absolute z-10 mt-1 w-full rounded-md border border-white/10 bg-zinc-900 shadow-xl">
                  <button v-for="ge in globalEntityResults" :key="ge.id" type="button" class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-white/5" @click="selectGlobalEntity(ge)">
                    <span class="font-semibold text-white">{{ ge.name }}</span>
                    <span class="shrink-0 text-xs text-zinc-500">{{ ge.entity_type }} · {{ ge.event_entities_count ?? 0 }} {{ zh ? '個事件' : 'events' }}</span>
                  </button>
                </div>
                <p v-if="entityForm.global_entity_id" class="mt-1 text-xs text-cyan-300">{{ zh ? '✓ 已連結全域人物' : '✓ Linked to global entity' }} #{{ entityForm.global_entity_id }}</p>
              </div>
              <div class="grid gap-3 md:grid-cols-[1fr_150px]">
                <input v-model="entityForm.name" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300" :placeholder="zh ? '人名或組織名' : 'Name'" required />
                <select v-model="entityForm.entity_type" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300">
                  <option value="person">{{ zh ? '人物' : 'Person' }}</option>
                  <option value="organization">{{ zh ? '組織' : 'Organization' }}</option>
                </select>
              </div>
              <textarea v-model="entityForm.description" class="min-h-16 rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300" :placeholder="zh ? '簡短描述' : 'Short description'"></textarea>
              <input v-model="entityForm.source_url" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300" :placeholder="zh ? '來源 URL（建議填）' : 'Source URL recommended'" />
              <button class="rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50" :disabled="submitting || !token">{{ zh ? '新增節點' : 'Add Node' }}</button>
            </form>

            <form class="grid gap-3 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-4" @submit.prevent="submitRelationship">
              <p class="text-sm font-semibold text-cyan-100">{{ zh ? '手動新增關係' : 'Add Relationship' }}</p>
              <div class="grid gap-3 md:grid-cols-[1fr_150px]">
                <input v-model="relationshipForm.from_entity_name" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300" :placeholder="zh ? '新節點名稱' : 'New node name'" required />
                <select v-model="relationshipForm.from_entity_type" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300">
                  <option value="person">{{ zh ? '人物' : 'Person' }}</option>
                  <option value="organization">{{ zh ? '組織' : 'Organization' }}</option>
                </select>
              </div>
              <select v-model="relationshipForm.to_entity_id" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300" required>
                <option value="">{{ zh ? '跟哪個既有節點有關' : 'Related existing node' }}</option>
                <option v-for="entity in graph.entities || []" :key="entity.id" :value="entity.id">{{ entity.name }} · {{ entity.entity_type }}</option>
              </select>
              <input v-model="relationshipForm.relationship_type" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300" :placeholder="zh ? '關係類型，例如監督、任職、澄清' : 'Relationship type'" required />
              <textarea v-model="relationshipForm.description" class="min-h-16 rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300" :placeholder="zh ? '關係說明' : 'Description'"></textarea>
              <div class="grid gap-3 md:grid-cols-[180px_1fr]">
                <select v-model="relationshipForm.source_type" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300">
                  <option value="news">news</option>
                  <option value="evidence">evidence</option>
                  <option value="official_response">official_response</option>
                  <option value="external">external</option>
                </select>
                <input v-model="relationshipForm.source_url" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300" :placeholder="zh ? '參考資料 URL' : 'Reference URL'" required />
              </div>
              <button class="rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50" :disabled="submitting || !token || !(graph.entities || []).length">{{ zh ? '新增關係' : 'Add Relationship' }}</button>
            </form>
          </div>

          <div v-if="(graph.entities || []).length === 0" class="text-sm text-zinc-400">{{ zh ? '尚無人物/組織節點。可從新聞右鍵 Pin 進來。' : 'No people or organization nodes yet. Pin one from a news page.' }}</div>
          <div v-else class="grid gap-5 lg:grid-cols-[620px_1fr]">
            <div class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-zinc-200">{{ zh ? '關係圖' : 'Relationship Graph' }}</p>
                <div class="flex gap-2">
                  <button class="rounded-md border border-cyan-300/40 px-3 py-2 text-xs font-semibold text-cyan-100 hover:border-cyan-300/80" @click="downloadGraphImage('png')">
                    {{ zh ? '下載 PNG' : 'Download PNG' }}
                  </button>
                  <button class="rounded-md border border-cyan-300/40 px-3 py-2 text-xs font-semibold text-cyan-100 hover:border-cyan-300/80" @click="downloadGraphImage('jpeg')">
                    {{ zh ? '下載 JPEG' : 'Download JPEG' }}
                  </button>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 rounded-md border border-white/10 bg-zinc-950/70 p-2 text-xs text-zinc-400">
                <span class="font-semibold text-zinc-300">{{ zh ? '角色連結度' : 'Actor connectivity' }}</span>
                <span v-for="item in entityHeatLegend" :key="item.label" class="inline-flex items-center gap-1">
                  <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: item.color }"></span>
                  {{ item.label }}
                </span>
              </div>
              <svg ref="graphSvg" class="h-[460px] w-full rounded-lg border border-white/10 bg-zinc-950" :class="isPanning ? 'cursor-grabbing' : 'cursor-grab'" viewBox="-30 -30 580 500" role="img" @pointerdown="startGraphPan" @pointermove="handleGraphMove" @pointerup="endGraphInteraction" @pointerleave="endGraphInteraction" @wheel.prevent="handleGraphWheel">
                <rect x="-30" y="-30" width="580" height="500" fill="#09090b" />
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
                <g v-for="(entity, index) in graph.entities" :key="entity.id" :class="token ? 'cursor-move' : 'cursor-default'" @pointerdown.prevent="startDragEntity(entity, $event)">
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
              <div class="mt-1 flex items-center justify-between text-xs text-zinc-600">
                <span>{{ zh ? '滾輪縮放・拖曳平移' : 'Scroll to zoom · drag to pan' }}</span>
                <button class="hover:text-zinc-300" @click="resetGraphView">{{ zh ? '重設視圖' : 'Reset view' }}</button>
              </div>
            </div>
            <div class="space-y-3">
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
                <a class="mt-2 inline-block break-all text-xs text-zinc-500 hover:text-cyan-100" :href="rel.source_url" target="_blank" rel="noopener noreferrer">{{ rel.source_url }}</a>
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
                    <input v-model="relationshipEditForm.source_url" class="rounded-md border border-white/10 bg-black px-3 py-2 text-sm outline-none focus:border-cyan-300" required />
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
