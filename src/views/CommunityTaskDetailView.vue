<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchCommunityTask, sendCommunityTaskSignal } from '../lib/api'
import { useI18n } from '../i18n'

const TOKEN_KEY = 'truthshield_api_token'
const route = useRoute()
const { t } = useI18n()
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const detail = ref(null)
const loading = ref(true)
const error = ref('')
const submitting = ref('')
const note = ref('')
const message = ref('')

const task = computed(() => detail.value?.task || null)
const summaryRows = computed(() => Object.entries(detail.value?.summary || {}))
const snapshotRows = computed(() => Object.entries(task.value?.generation_snapshot?.metrics || {}).slice(0, 6))
const canSignal = computed(() => Boolean(token.value && detail.value?.actions?.length && task.value?.status !== 'resolved'))

async function load() {
  loading.value = true
  error.value = ''
  try {
    detail.value = await fetchCommunityTask(route.params.id)
  } catch (err) {
    error.value = err.message || t('communityTasks.loadFailed')
  } finally {
    loading.value = false
  }
}

async function signal(action) {
  if (!token.value) {
    message.value = t('communityTasks.signInRequired')
    return
  }

  submitting.value = action.value
  message.value = ''
  try {
    detail.value = (await sendCommunityTaskSignal(token.value, route.params.id, {
      value: action.value,
      note: note.value,
    })).detail
    note.value = ''
    message.value = t('communityTasks.signalSaved')
  } catch (err) {
    message.value = err.message || t('communityTasks.signalFailed')
  } finally {
    submitting.value = ''
  }
}

onMounted(load)
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/community-tasks">{{ t('common.communityTasks') }}</RouterLink>
        <RouterLink class="text-sm text-zinc-400 hover:text-cyan-100" to="/moderation-events">{{ t('common.moderationEvents') }}</RouterLink>
      </nav>

      <div v-if="error" class="rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">{{ error }}</div>
      <div v-else-if="loading" class="rounded-lg border border-white/10 p-4 text-sm text-zinc-400">{{ t('common.loading') }}</div>

      <template v-else-if="task">
        <div class="rounded-lg border border-cyan-300/20 bg-white/[0.03] p-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div class="flex flex-wrap gap-2">
                <span class="rounded bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">{{ task.type }}</span>
                <span class="rounded bg-white/10 px-2 py-1 text-xs font-semibold text-zinc-300">{{ task.status }}</span>
                <span class="rounded bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-100">{{ t('communityTasks.priority') }} {{ task.priority }}</span>
              </div>
              <h1 class="mt-4 text-3xl font-semibold text-white">{{ task.title }}</h1>
              <p class="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">{{ task.description }}</p>
              <p class="mt-3 break-all text-xs text-zinc-600">{{ task.subject_key }}</p>
            </div>
            <RouterLink v-if="task.action_url?.startsWith('/')" class="rounded-md border border-cyan-300/40 px-3 py-2 text-sm font-semibold text-cyan-100" :to="task.action_url">
              {{ t('communityTasks.openAction') }}
            </RouterLink>
            <RouterLink class="rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-300 hover:border-cyan-300/40 hover:text-cyan-100" :to="`/appeals?subject_type=community_task&subject_id=${task.id}`">
              {{ t('profile.appeal') }}
            </RouterLink>
          </div>
        </div>

        <section class="mt-6 grid gap-4 md:grid-cols-2">
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <h2 class="text-lg font-semibold text-white">{{ t('communityTasks.consensusGap') }}</h2>
            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div class="rounded-md border border-white/10 bg-zinc-950/70 p-4">
                <p class="text-xs text-zinc-500">{{ t('communityTasks.remainingUsers') }}</p>
                <p class="mt-2 text-2xl font-semibold text-white">{{ detail.gap.remaining_users }}</p>
              </div>
              <div class="rounded-md border border-white/10 bg-zinc-950/70 p-4">
                <p class="text-xs text-zinc-500">{{ t('communityTasks.remainingScore') }}</p>
                <p class="mt-2 text-2xl font-semibold text-white">{{ Number(detail.gap.remaining_score || 0).toFixed(2) }}</p>
              </div>
            </div>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <h2 class="text-lg font-semibold text-white">{{ t('communityTasks.signalSummary') }}</h2>
            <div class="mt-4 grid gap-2 sm:grid-cols-2">
              <div v-for="[key, value] in summaryRows" :key="key" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
                <p class="text-xs text-zinc-500">{{ key }}</p>
                <p class="mt-1 text-sm font-semibold text-white">{{ value }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-white">{{ t('communityTasks.contribute') }}</h2>
              <p class="mt-1 text-sm text-zinc-500">{{ t('communityTasks.contributeDesc') }}</p>
            </div>
            <RouterLink v-if="!token" class="rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-zinc-950" :to="`/login?redirect=/community-tasks/${task.id}`">{{ t('common.signIn') }}</RouterLink>
          </div>
          <textarea v-model="note" class="mt-4 min-h-20 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" :placeholder="t('communityTasks.notePlaceholder')"></textarea>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="action in detail.actions"
              :key="action.value"
              class="rounded-md border border-cyan-300/40 px-3 py-2 text-sm font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!canSignal || submitting"
              @click="signal(action)"
            >
              {{ submitting === action.value ? t('communityTasks.submitting') : action.label }}
            </button>
          </div>
          <p v-if="message" class="mt-3 rounded-md border border-white/10 bg-zinc-950/70 p-3 text-sm text-zinc-300">{{ message }}</p>
        </section>

        <section class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 class="text-lg font-semibold text-white">{{ t('communityTasks.generationSnapshot') }}</h2>
          <p class="mt-2 text-sm text-zinc-500">{{ task.generation_snapshot?.reason || task.description }}</p>
          <div v-if="snapshotRows.length" class="mt-4 grid gap-2 sm:grid-cols-3">
            <div v-for="[key, value] in snapshotRows" :key="key" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <p class="text-xs text-zinc-500">{{ key }}</p>
              <p class="mt-1 text-sm font-semibold text-white">{{ value }}</p>
            </div>
          </div>
        </section>
      </template>
    </section>
  </main>
</template>
