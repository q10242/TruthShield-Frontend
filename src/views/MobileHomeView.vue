<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { fetchCurrentUser, fetchNewsSearch } from '../lib/api'
import { trackEvent } from '../lib/traffic'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

const TOKEN_KEY = 'truthshield_api_token'

const router = useRouter()
const { t } = useI18n()
const url = ref('')
const user = ref(null)
const recent = ref([])
const error = ref('')
const token = computed(() => localStorage.getItem(TOKEN_KEY) || '')

function submit() {
  error.value = ''

  try {
    const normalized = new URL(url.value.trim())
    router.push({ name: 'mobile-check', query: { url: normalized.toString() } })
  } catch {
    error.value = t('mobile.invalidUrl')
  }
}

onMounted(async () => {
  trackEvent('mobile_home_open', { source: 'mobile_pwa', feature: 'mobile_home' })

  if (token.value) {
    user.value = await fetchCurrentUser(token.value).catch(() => null)
  }

  recent.value = (await fetchNewsSearch({ finalized: '', limit: 5 }).catch(() => ({ data: [] }))).data || []
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 pb-24 text-zinc-100">
    <section class="px-4 pb-6 pt-5">
      <AppNav>
        <RouterLink
          :to="token ? '/profile' : '/login?redirect=/mobile'"
          class="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-cyan-100"
        >
          {{ token ? t('mobile.profile') : t('common.signIn') }}
        </RouterLink>
      </AppNav>

      <div class="mt-8">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">{{ t('mobile.eyebrow') }}</p>
        <h1 class="mt-3 text-3xl font-semibold leading-tight text-white">{{ t('mobile.title') }}</h1>
        <p class="mt-3 text-sm leading-6 text-zinc-400">{{ t('mobile.intro') }}</p>
      </div>

      <form class="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-xl shadow-black/20" @submit.prevent="submit">
        <label class="text-xs font-semibold text-zinc-300" for="mobile-url">{{ t('mobile.urlLabel') }}</label>
        <textarea
          id="mobile-url"
          v-model="url"
          class="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/10 bg-zinc-950 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300"
          :placeholder="t('mobile.urlPlaceholder')"
        ></textarea>
        <p v-if="error" class="mt-2 text-xs text-orange-200">{{ error }}</p>
        <button class="mt-3 w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-zinc-950" type="submit">
          {{ t('mobile.checkNow') }}
        </button>
      </form>

      <div class="mt-5 grid grid-cols-2 gap-3">
        <RouterLink class="rounded-xl border border-white/10 bg-white/[0.03] p-4" to="/evidence-library">
          <p class="text-sm font-semibold text-white">{{ t('common.evidenceLibrary') }}</p>
          <p class="mt-1 text-xs leading-5 text-zinc-500">{{ t('mobile.evidenceShortcut') }}</p>
        </RouterLink>
        <RouterLink class="rounded-xl border border-white/10 bg-white/[0.03] p-4" to="/community-tasks">
          <p class="text-sm font-semibold text-white">{{ t('common.communityTasks') }}</p>
          <p class="mt-1 text-xs leading-5 text-zinc-500">{{ t('mobile.tasksShortcut') }}</p>
        </RouterLink>
        <RouterLink class="rounded-xl border border-white/10 bg-white/[0.03] p-4" to="/extension-install">
          <p class="text-sm font-semibold text-white">{{ t('common.extensionInstall') }}</p>
          <p class="mt-1 text-xs leading-5 text-zinc-500">{{ t('mobile.extensionShortcut') }}</p>
        </RouterLink>
        <RouterLink class="rounded-xl border border-white/10 bg-white/[0.03] p-4" to="/user-guide">
          <p class="text-sm font-semibold text-white">{{ t('common.userGuide') }}</p>
          <p class="mt-1 text-xs leading-5 text-zinc-500">{{ t('mobile.guideShortcut') }}</p>
        </RouterLink>
      </div>

      <section class="mt-7">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-white">{{ t('mobile.recent') }}</h2>
          <RouterLink class="text-xs font-semibold text-cyan-200" to="/news-search">{{ t('mobile.more') }}</RouterLink>
        </div>
        <div class="mt-3 space-y-3">
          <RouterLink
            v-for="row in recent"
            :key="row.id"
            :to="{ name: 'mobile-check', query: { url: row.normalized_url } }"
            class="block rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <p class="line-clamp-2 text-sm font-semibold leading-5 text-white">{{ row.title_snapshot || t('remaining.unnamedNews') }}</p>
            <p class="mt-2 truncate text-xs text-zinc-500">{{ row.normalized_url }}</p>
          </RouterLink>
          <p v-if="!recent.length" class="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-500">{{ t('mobile.noRecent') }}</p>
        </div>
      </section>
    </section>

    <nav class="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/95 px-3 py-2 backdrop-blur">
      <div class="grid grid-cols-4 text-center text-[11px] font-semibold text-zinc-400">
        <RouterLink class="rounded-lg px-2 py-2 text-cyan-200" to="/mobile">{{ t('mobile.navCheck') }}</RouterLink>
        <RouterLink class="rounded-lg px-2 py-2" to="/evidence-library">{{ t('mobile.navEvidence') }}</RouterLink>
        <RouterLink class="rounded-lg px-2 py-2" to="/community-tasks">{{ t('mobile.navTasks') }}</RouterLink>
        <RouterLink class="rounded-lg px-2 py-2" :to="token ? '/profile' : '/login?redirect=/mobile'">{{ t('mobile.navMe') }}</RouterLink>
      </div>
    </nav>
  </main>
</template>
