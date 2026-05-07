<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from '../i18n'

const STORAGE_KEY = 'truthshield_local_qa_checked'
const { t } = useI18n()
const checkedIds = ref(readCheckedIds())

const groups = computed(() => [
  {
    title: t('qa.authTitle'),
    items: [
      { id: 'auth-login', text: t('qa.authLogin') },
      { id: 'auth-profile', text: t('qa.authProfile') },
      { id: 'auth-logout', text: t('qa.authLogout') },
    ],
  },
  {
    title: t('qa.voteTitle'),
    items: [
      { id: 'vote-demo', text: t('qa.voteDemo') },
      { id: 'vote-read', text: t('qa.voteRead') },
      { id: 'vote-evidence', text: t('qa.voteEvidence') },
      { id: 'vote-result', text: t('qa.voteResult') },
    ],
  },
  {
    title: t('qa.extensionTitle'),
    items: [
      { id: 'extension-load', text: t('qa.extensionLoad') },
      { id: 'extension-tooltip', text: t('qa.extensionTooltip') },
      { id: 'extension-banner', text: t('qa.extensionBanner') },
      { id: 'extension-popup', text: t('qa.extensionPopup') },
    ],
  },
  {
    title: t('qa.adminTitle'),
    items: [
      { id: 'admin-login', text: t('qa.adminLogin') },
      { id: 'admin-create', text: t('qa.adminCreate') },
      { id: 'admin-review', text: t('qa.adminReview') },
      { id: 'admin-dashboard', text: t('qa.adminDashboard') },
    ],
  },
  {
    title: t('qa.officialTitle'),
    items: [
      { id: 'official-profile', text: t('qa.officialProfile') },
      { id: 'official-admin', text: t('qa.officialAdmin') },
      { id: 'official-submit', text: t('qa.officialSubmit') },
      { id: 'official-reaction', text: t('qa.officialReaction') },
    ],
  },
  {
    title: t('qa.opsTitle'),
    items: [
      { id: 'ops-health', text: t('qa.opsHealth') },
      { id: 'ops-readiness', text: t('qa.opsReadiness') },
      { id: 'ops-exports', text: t('qa.opsExports') },
      { id: 'ops-package', text: t('qa.opsPackage') },
    ],
  },
])
const totalItems = computed(() => groups.value.reduce((sum, group) => sum + group.items.length, 0))
const completedItems = computed(() => checkedIds.value.length)
const progress = computed(() => totalItems.value ? Math.round((completedItems.value / totalItems.value) * 100) : 0)

function readCheckedIds() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

function isChecked(id) {
  return checkedIds.value.includes(id)
}

function toggle(id) {
  checkedIds.value = isChecked(id)
    ? checkedIds.value.filter((checkedId) => checkedId !== id)
    : [...checkedIds.value, id]
}

function resetProgress() {
  checkedIds.value = []
}

watch(checkedIds, (value) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}, { deep: true })
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <RouterLink class="text-sm text-zinc-400" to="/vision-readiness">{{ t('common.visionReadiness') }}</RouterLink>
      </nav>

      <header>
        <p class="text-sm font-semibold text-cyan-300">{{ t('qa.eyebrow') }}</p>
        <h1 class="mt-2 text-3xl font-semibold text-white">{{ t('qa.title') }}</h1>
        <p class="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">{{ t('qa.intro') }}</p>
      </header>

      <section class="mt-6 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm font-semibold text-cyan-100">{{ t('qa.progress', { completed: completedItems, total: totalItems, percentage: progress }) }}</p>
          <button class="rounded-md border border-cyan-300/30 px-3 py-1.5 text-xs font-semibold text-cyan-100" @click="resetProgress">{{ t('qa.resetProgress') }}</button>
        </div>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
          <div class="h-full rounded-full bg-cyan-300" :style="{ width: `${progress}%` }"></div>
        </div>
      </section>

      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <section v-for="group in groups" :key="group.title" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 class="text-lg font-semibold text-white">{{ group.title }}</h2>
          <div class="mt-4 space-y-3">
            <label v-for="item in group.items" :key="item.id" class="flex gap-3 rounded-md border border-white/10 bg-zinc-950/70 p-3 text-sm text-zinc-300">
              <input type="checkbox" class="mt-1 h-4 w-4 accent-cyan-300" :checked="isChecked(item.id)" @change="toggle(item.id)" />
              <span>{{ item.text }}</span>
            </label>
          </div>
        </section>
      </div>

      <section class="mt-6 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-5">
        <h2 class="text-lg font-semibold text-white">{{ t('qa.commands') }}</h2>
        <div class="mt-3 grid gap-2 md:grid-cols-2">
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">php artisan test --filter=TruthShieldApiTest</code>
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">npm run build</code>
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">npm run package:extension</code>
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">php artisan truthshield:check-extension-selectors</code>
        </div>
      </section>
    </section>
  </main>
</template>
