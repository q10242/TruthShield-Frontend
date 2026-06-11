<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { createCommunityTask, fetchCommunityTasks, fetchCommunityTaskStats } from '../lib/api'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

const { t } = useI18n()
const TOKEN_KEY = 'truthshield_api_token'
const loading = ref(true)
const error = ref('')
const tasks = ref([])
const meta = ref(null)
const stats = ref(null)
const proposalSubmitting = ref(false)
const proposalMessage = ref('')
const proposalError = ref('')
const filters = ref({
  q: '',
  status: 'open',
  type: '',
  priority: '',
})
const proposal = ref({
  type: 'fact_check_request',
  source_url: '',
  title: '',
  description: '',
  note: '',
})

const typeOptions = [
  { value: '', labelKey: 'communityTasks.allTypes' },
  { value: 'domain_candidate', labelKey: 'communityTasks.typeDomain' },
  { value: 'url_rule_candidate', labelKey: 'communityTasks.typeUrlRule' },
  { value: 'trusted_source_candidate', labelKey: 'communityTasks.typeTrustedSource' },
  { value: 'evidence_quality_review', labelKey: 'communityTasks.typeEvidence' },
  { value: 'timeline_source_review', labelKey: 'communityTasks.typeTimelineSource' },
  { value: 'official_source_request', labelKey: 'communityTasks.typeOfficialSource' },
  { value: 'entity_relationship_review', labelKey: 'communityTasks.typeEntityRelationship' },
  { value: 'news_cluster_review', labelKey: 'communityTasks.typeNewsCluster' },
  { value: 'controversial_news', labelKey: 'communityTasks.typeControversy' },
  { value: 'needs_official_response', labelKey: 'communityTasks.typeOfficialResponse' },
  { value: 'fact_check_request', labelKey: 'communityTasks.typeFactCheck' },
  { value: 'event_creation_request', labelKey: 'communityTasks.typeEventCreation' },
]

const proposalTypeOptions = [
  { value: 'fact_check_request', labelKey: 'communityTasks.typeFactCheck' },
  { value: 'event_creation_request', labelKey: 'communityTasks.typeEventCreation' },
  { value: 'needs_official_response', labelKey: 'communityTasks.typeOfficialResponse' },
  { value: 'official_source_request', labelKey: 'communityTasks.typeOfficialSource' },
  { value: 'timeline_source_review', labelKey: 'communityTasks.typeTimelineSource' },
  { value: 'entity_relationship_review', labelKey: 'communityTasks.typeEntityRelationship' },
  { value: 'controversial_news', labelKey: 'communityTasks.typeControversy' },
]

const statusOptions = [
  { value: 'open', labelKey: 'communityTasks.statusOpen' },
  { value: 'escalated', labelKey: 'communityTasks.statusEscalated' },
  { value: 'resolved', labelKey: 'communityTasks.statusResolved' },
]

const statCards = computed(() => [
  { key: 'open_tasks', label: t('communityTasks.openTasks'), value: stats.value?.open_tasks ?? 0 },
  { key: 'escalated_tasks', label: t('communityTasks.escalatedTasks'), value: stats.value?.escalated_tasks ?? 0 },
  { key: 'authenticated_signals', label: t('communityTasks.authSignals'), value: stats.value?.authenticated_signals ?? 0 },
  { key: 'community_demoted_evidence', label: t('communityTasks.demotedEvidence'), value: stats.value?.community_demoted_evidence ?? 0 },
  { key: 'official_response_tasks', label: t('communityTasks.officialResponseTasks'), value: stats.value?.official_response_tasks ?? 0 },
])

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [taskPayload, statsPayload] = await Promise.all([
      fetchCommunityTasks({
        q: filters.value.q,
        status: filters.value.status,
        type: filters.value.type,
        priority: filters.value.priority,
      }),
      fetchCommunityTaskStats(),
    ])
    tasks.value = taskPayload.data || []
    meta.value = taskPayload.meta || null
    stats.value = statsPayload
  } catch (err) {
    error.value = err.message || t('communityTasks.loadFailed')
  } finally {
    loading.value = false
  }
}

function priorityClass(priority) {
  if (priority >= 85) return 'border-red-300/40 bg-red-500/10 text-red-100'
  if (priority >= 70) return 'border-amber-300/40 bg-amber-500/10 text-amber-100'
  return 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100'
}

function metricRows(metrics) {
  return Object.entries(metrics || {}).slice(0, 4)
}

function typeLabel(type) {
  const match = typeOptions.find((option) => option.value === type)
  return match ? t(match.labelKey) : type
}

function actionLabel(task) {
  const map = {
    domain_candidate: t('communityTasks.actionDomain'),
    url_rule_candidate: t('communityTasks.actionUrlRule'),
    trusted_source_candidate: t('communityTasks.actionTrustedSource'),
    evidence_quality_review: t('communityTasks.actionEvidence'),
    timeline_source_review: t('communityTasks.actionTimelineSource'),
    official_source_request: t('communityTasks.actionOfficialSource'),
    entity_relationship_review: t('communityTasks.actionEntityRelationship'),
    news_cluster_review: t('communityTasks.actionNewsCluster'),
    controversial_news: t('communityTasks.actionControversy'),
    needs_official_response: t('communityTasks.actionOfficialResponse'),
    fact_check_request: t('communityTasks.actionFactCheck'),
    event_creation_request: t('communityTasks.actionEventCreation'),
  }

  return map[task.type] || t('communityTasks.openDetail')
}

function taskImpact(task) {
  const map = {
    domain_candidate: t('communityTasks.impactDomain'),
    url_rule_candidate: t('communityTasks.impactUrlRule'),
    trusted_source_candidate: t('communityTasks.impactTrustedSource'),
    evidence_quality_review: t('communityTasks.impactEvidence'),
    timeline_source_review: t('communityTasks.impactTimelineSource'),
    official_source_request: t('communityTasks.impactOfficialSource'),
    entity_relationship_review: t('communityTasks.impactEntityRelationship'),
    news_cluster_review: t('communityTasks.impactNewsCluster'),
    controversial_news: t('communityTasks.impactControversy'),
    needs_official_response: t('communityTasks.impactOfficialResponse'),
    fact_check_request: t('communityTasks.impactFactCheck'),
    event_creation_request: t('communityTasks.impactEventCreation'),
  }

  return map[task.type] || t('communityTasks.impactDefault')
}

async function submitProposal() {
  proposalMessage.value = ''
  proposalError.value = ''
  const token = localStorage.getItem(TOKEN_KEY) || ''
  if (!token) {
    proposalError.value = t('communityTasks.proposalSignInRequired')
    return
  }

  proposalSubmitting.value = true
  try {
    await createCommunityTask(token, proposal.value)
    proposalMessage.value = t('communityTasks.proposalSaved')
    proposal.value = {
      type: 'fact_check_request',
      source_url: '',
      title: '',
      description: '',
      note: '',
    }
    filters.value.status = 'open'
    await load()
  } catch (err) {
    proposalError.value = err.message || t('communityTasks.proposalFailed')
  } finally {
    proposalSubmitting.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-6xl">
      <AppNav>
        <RouterLink class="text-zinc-400 hover:text-cyan-100" to="/report-domain">{{ t('common.reportDomain') }}</RouterLink>
        <RouterLink class="text-zinc-400 hover:text-cyan-100" to="/transparency">{{ t('common.transparency') }}</RouterLink>
      </AppNav>

      <div class="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        <div>
          <p class="text-sm font-semibold text-cyan-300">{{ t('communityTasks.eyebrow') }}</p>
          <h1 class="mt-2 text-3xl font-semibold text-white">{{ t('communityTasks.title') }}</h1>
          <p class="mt-3 text-sm leading-6 text-zinc-400">{{ t('communityTasks.intro') }}</p>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div v-for="card in statCards" :key="card.key" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs text-zinc-500">{{ card.label }}</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ card.value }}</p>
          </div>
        </div>
      </div>

      <form class="mt-6 grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 lg:grid-cols-[minmax(220px,1fr)_180px_220px_160px_auto]" @submit.prevent="load">
        <input v-model="filters.q" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" type="search" :aria-label="t('communityTasks.search')" :placeholder="t('communityTasks.searchPlaceholder')" />
        <select v-model="filters.status" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" :aria-label="t('communityTasks.statusFilter')">
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ t(option.labelKey) }}</option>
        </select>
        <select v-model="filters.type" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" :aria-label="t('communityTasks.typeFilter')">
          <option v-for="option in typeOptions" :key="option.value" :value="option.value">{{ t(option.labelKey) }}</option>
        </select>
        <input v-model="filters.priority" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" type="number" min="0" max="100" :aria-label="t('communityTasks.priorityFloor')" :placeholder="t('communityTasks.priorityFloor')" />
        <button type="submit" class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950">{{ t('communityTasks.apply') }}</button>
      </form>

      <p v-if="meta" class="mt-3 text-xs text-zinc-500">{{ t('communityTasks.resultMeta', { total: meta.total, limit: meta.limit }) }}</p>

      <section class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div class="grid gap-4 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
          <div>
            <h2 class="text-lg font-semibold text-white">{{ t('communityTasks.proposalTitle') }}</h2>
            <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('communityTasks.proposalIntro') }}</p>
            <p class="mt-3 text-xs leading-5 text-zinc-500">{{ t('communityTasks.proposalPolicyNote') }}</p>
          </div>
          <form class="grid gap-3" @submit.prevent="submitProposal">
            <div class="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
              <select v-model="proposal.type" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" :aria-label="t('communityTasks.proposalType')">
                <option v-for="option in proposalTypeOptions" :key="option.value" :value="option.value">{{ t(option.labelKey) }}</option>
              </select>
              <input v-model="proposal.source_url" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" type="url" :placeholder="t('communityTasks.proposalSourceUrl')" />
            </div>
            <input v-model="proposal.title" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" required maxlength="160" :placeholder="t('communityTasks.proposalTitlePlaceholder')" />
            <textarea v-model="proposal.description" class="min-h-24 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" required maxlength="1000" :placeholder="t('communityTasks.proposalDescriptionPlaceholder')"></textarea>
            <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input v-model="proposal.note" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" maxlength="500" :placeholder="t('communityTasks.proposalNotePlaceholder')" />
              <button type="submit" class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" :disabled="proposalSubmitting">
                {{ proposalSubmitting ? t('communityTasks.proposalSubmitting') : t('communityTasks.proposalSubmit') }}
              </button>
            </div>
            <p v-if="proposalMessage" class="text-sm text-emerald-200">{{ proposalMessage }}</p>
            <p v-if="proposalError" class="text-sm text-red-200">{{ proposalError }}</p>
          </form>
        </div>
      </section>

      <div v-if="error" class="mt-6 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">{{ error }}</div>
      <div v-else-if="loading" class="mt-6 rounded-lg border border-white/10 p-4 text-sm text-zinc-400">{{ t('common.loading') }}</div>

      <div v-else class="mt-6 grid gap-3">
        <div v-if="tasks.length === 0" class="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
          {{ t('communityTasks.empty') }}
        </div>
        <article v-for="task in tasks" :key="task.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded border px-2 py-1 text-xs font-semibold" :class="priorityClass(task.priority)">{{ t('communityTasks.priority') }} {{ task.priority }}</span>
                <span class="rounded bg-white/10 px-2 py-1 text-xs font-semibold text-zinc-300">{{ typeLabel(task.type) }}</span>
                <span class="rounded bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-400">{{ task.status }}</span>
              </div>
              <h2 class="mt-3 text-lg font-semibold text-white">{{ task.title }}</h2>
              <p class="mt-2 text-sm leading-6 text-zinc-400">{{ task.description }}</p>
              <p class="mt-2 text-xs leading-5 text-cyan-100/80">{{ taskImpact(task) }}</p>
              <p class="mt-2 break-all text-xs text-zinc-600">{{ task.subject_key }}</p>
            </div>
            <RouterLink class="rounded-md border border-cyan-300/40 px-3 py-2 text-sm font-semibold text-cyan-100" :to="`/community-tasks/${task.id}`">
              {{ actionLabel(task) }}
            </RouterLink>
          </div>
          <div v-if="metricRows(task.metrics).length" class="mt-4 grid gap-2 sm:grid-cols-4">
            <div v-for="[key, value] in metricRows(task.metrics)" :key="key" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <p class="text-xs text-zinc-500">{{ key }}</p>
              <p class="mt-1 text-sm font-semibold text-white">{{ value }}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
