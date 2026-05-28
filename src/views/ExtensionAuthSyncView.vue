<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../i18n'

const TOKEN_KEY = 'truthshield_api_token'
const USER_KEY = 'truthshield_user'
const route = useRoute()
const { t } = useI18n()
const done = ref(false)
const redirecting = ref(false)

const syncRedirect = computed(() => {
  const params = new URLSearchParams({ redirect: '/extension-auth-sync?close=1' })
  return `/login?${params.toString()}`
})

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

onMounted(() => {
  if (route.query.action === 'logout') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    window.postMessage({ type: 'TRUTH_SHIELD_AUTH_CLEARED' }, window.location.origin)
    done.value = true
  } else {
    const token = localStorage.getItem(TOKEN_KEY) || ''
    if (token) {
      window.postMessage({
        type: 'TRUTH_SHIELD_AUTH_UPDATED',
        token,
        user: readUser(),
      }, window.location.origin)
      done.value = true
    } else {
      redirecting.value = true
      window.setTimeout(() => window.location.assign(syncRedirect.value), 300)
    }
  }

  if (done.value && route.query.close === '1') {
    window.setTimeout(() => window.close(), 650)
  }
})
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
    <section class="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.04] p-6 text-center">
      <img class="mx-auto h-12 w-12" src="/brand/truthshield-mark.svg" alt="" />
      <h1 class="mt-4 text-lg font-semibold text-white">{{ done ? t('extensionAuthSync.doneTitle') : t('common.loading') }}</h1>
      <p class="mt-2 text-sm leading-6 text-zinc-400">
        {{ redirecting ? t('extensionAuthSync.redirectDesc') : t('extensionAuthSync.doneDesc') }}
      </p>
    </section>
  </main>
</template>
