<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { beginOauth, devLogin, oauthCallback } from '../lib/api'
import { trackEvent, trackPageView } from '../lib/traffic'
import { useI18n } from '../i18n'

const TOKEN_KEY = 'truthshield_api_token'
const USER_KEY = 'truthshield_user'

const route = useRoute()
const { t } = useI18n()
const name = ref(t('auth.defaultName'))
const email = ref('checker@example.com')
const fbId = ref('')
const loading = ref(false)
const error = ref('')
const done = ref(false)

const redirectPath = computed(() => route.query.redirect || '/')
const isLocalMode = computed(() => ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname) || window.location.hostname.endsWith('.localhost'))
const demoAccounts = computed(() => [
  { label: t('auth.normalTester'), name: t('auth.defaultName'), email: 'checker@example.com' },
  { label: t('auth.seededTester'), name: t('auth.seededName'), email: 'tester@truthshield.local' },
])

function decodeBase64Url(value) {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=')
  const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))

  return new TextDecoder().decode(bytes)
}

function useDemoAccount(account) {
  name.value = account.name
  email.value = account.email
  fbId.value = ''
}

async function persistLogin(payload) {
  localStorage.setItem(TOKEN_KEY, payload.token)
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
  window.opener?.postMessage({
    type: 'TRUTH_SHIELD_AUTH_UPDATED',
    token: payload.token,
    user: payload.user,
  }, window.location.origin)
  done.value = true

  window.setTimeout(() => {
    if (window.opener) {
      window.close()
      return
    }

    window.location.assign(String(redirectPath.value))
  }, 600)
}

onMounted(async () => {
  trackPageView('login')
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))

  if (hash.get('oauth_error')) {
    error.value = hash.get('oauth_error')
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    return
  }

  if (hash.get('truthshield_oauth') !== '1') return

  const token = hash.get('token')
  const encodedUser = hash.get('user')
  if (!token || !encodedUser) {
    error.value = t('auth.loginFailed')
    return
  }

  try {
    await persistLogin({
      token,
      user: JSON.parse(decodeBase64Url(encodedUser)),
    })
    trackEvent('login_completed', { feature: 'auth', metadata: { provider: 'oauth_redirect' } })
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  } catch (err) {
    error.value = err.message || t('auth.loginFailed')
  }
})

async function submit() {
  loading.value = true
  error.value = ''

  try {
    const payload = await devLogin({
      name: name.value,
      email: email.value,
      fb_id: fbId.value || undefined,
    })
    await persistLogin(payload)
    trackEvent('login_completed', { feature: 'auth', metadata: { provider: 'dev' } })
  } catch (err) {
    error.value = err.message || t('auth.loginFailed')
  } finally {
    loading.value = false
  }
}

async function providerLogin(provider) {
  loading.value = true
  error.value = ''

  try {
    const payload = await oauthCallback(provider, {
      provider_user_id: `${provider}-${email.value}`,
      name: name.value,
      email: email.value,
    })
    await persistLogin(payload)
    trackEvent('login_completed', { feature: 'auth', metadata: { provider } })
  } catch (err) {
    error.value = err.message || t('auth.loginFailed')
  } finally {
    loading.value = false
  }
}

async function realProviderLogin(provider) {
  loading.value = true
  error.value = ''

  try {
    const payload = await beginOauth(provider, {
      redirect_url: window.location.href,
    })
    trackEvent('oauth_begin', { feature: 'auth', metadata: { provider } })
    window.location.assign(payload.auth_url)
  } catch (err) {
    error.value = err.message || t('auth.oauthNotConfigured')
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_420px]">
      <div class="rounded-lg border border-white/10 bg-white/[0.03] p-6">
        <BrandLink />
        <h1 class="mt-8 text-3xl font-semibold text-white">{{ t('auth.title') }}</h1>
        <p class="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
          {{ t('auth.intro') }}
        </p>

        <div class="mt-6 grid gap-3 sm:grid-cols-3">
          <div class="rounded-md border border-white/10 bg-zinc-900 p-4">
            <p class="text-sm font-semibold text-white">{{ t('auth.vote') }}</p>
            <p class="mt-2 text-xs leading-5 text-zinc-500">{{ t('auth.voteDesc') }}</p>
          </div>
          <div class="rounded-md border border-white/10 bg-zinc-900 p-4">
            <p class="text-sm font-semibold text-white">{{ t('auth.evidence') }}</p>
            <p class="mt-2 text-xs leading-5 text-zinc-500">{{ t('auth.evidenceDesc') }}</p>
          </div>
          <div class="rounded-md border border-white/10 bg-zinc-900 p-4">
            <p class="text-sm font-semibold text-white">{{ t('auth.trust') }}</p>
            <p class="mt-2 text-xs leading-5 text-zinc-500">{{ t('auth.trustDesc') }}</p>
          </div>
        </div>
      </div>

      <section class="rounded-lg border border-white/10 bg-zinc-900 p-6">
        <div class="mb-6">
          <p class="text-sm font-semibold text-cyan-300">{{ t('auth.identityEntry') }}</p>
          <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('auth.chooseMethod') }}</h2>
          <p class="mt-2 text-sm leading-6 text-zinc-400">
            {{ t('auth.oauthNote') }}
          </p>
        </div>

        <div class="mb-5 grid gap-2">
          <button class="rounded-md border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300/70" :disabled="loading" @click="realProviderLogin('facebook')">Facebook</button>
          <button class="rounded-md border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300/70" :disabled="loading" @click="realProviderLogin('google')">Google</button>
          <button class="rounded-md border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300/70" :disabled="loading" @click="realProviderLogin('github')">GitHub</button>
          <button v-if="isLocalMode" class="rounded-md border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-cyan-300/50" :disabled="loading" @click="providerLogin('google')">{{ t('auth.localOauth') }}</button>
        </div>

        <div v-if="isLocalMode" class="mb-5 rounded-md border border-white/10 bg-white/[0.03] p-3">
          <p class="text-xs font-semibold text-zinc-400">{{ t('auth.demoAccounts') }}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <button
              v-for="account in demoAccounts"
              :key="account.email"
              class="rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100"
              type="button"
              @click="useDemoAccount(account)"
            >
              {{ account.label }}
            </button>
          </div>
        </div>

        <form v-if="isLocalMode" class="space-y-4 border-t border-white/10 pt-5" @submit.prevent="submit">
          <label class="block text-sm">
            <span class="text-zinc-300">{{ t('auth.testName') }}</span>
            <input v-model="name" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-300" />
          </label>
          <label class="block text-sm">
            <span class="text-zinc-300">{{ t('auth.testEmail') }}</span>
            <input v-model="email" type="email" required class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-300" />
          </label>
          <label class="block text-sm">
            <span class="text-zinc-300">{{ t('auth.fbPlaceholder') }}</span>
            <input v-model="fbId" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-300" />
          </label>

          <p v-if="error" class="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{{ error }}</p>
          <p v-if="done" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{{ t('auth.signedInReturning') }}</p>

          <button type="submit" class="w-full rounded-md bg-cyan-300 px-4 py-2 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading">
            {{ loading ? t('auth.signingIn') : t('auth.localLogin') }}
          </button>
        </form>
        <p v-else-if="error" class="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{{ error }}</p>
      </section>
    </section>
  </main>
</template>
