<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { beginOauth, devLogin, oauthCallback } from '../lib/api'

const TOKEN_KEY = 'truthshield_api_token'
const USER_KEY = 'truthshield_user'

const route = useRoute()
const name = ref('Truth Checker')
const email = ref('checker@example.com')
const fbId = ref('')
const loading = ref(false)
const error = ref('')
const done = ref(false)

const redirectPath = computed(() => route.query.redirect || '/')

async function submit() {
  loading.value = true
  error.value = ''

  try {
    const payload = await devLogin({
      name: name.value,
      email: email.value,
      fb_id: fbId.value || undefined,
    })

    localStorage.setItem(TOKEN_KEY, payload.token)
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
    window.opener?.postMessage({ type: 'TRUTH_SHIELD_AUTH_UPDATED' }, window.location.origin)
    done.value = true

    window.setTimeout(() => {
      if (window.opener) {
        window.close()
        return
      }

      window.location.assign(String(redirectPath.value))
    }, 600)
  } catch (err) {
    error.value = err.message || '登入失敗'
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

    localStorage.setItem(TOKEN_KEY, payload.token)
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
    window.opener?.postMessage({ type: 'TRUTH_SHIELD_AUTH_UPDATED' }, window.location.origin)
    done.value = true

    window.setTimeout(() => {
      if (window.opener) {
        window.close()
        return
      }

      window.location.assign(String(redirectPath.value))
    }, 600)
  } catch (err) {
    error.value = err.message || '登入失敗'
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
    window.location.assign(payload.auth_url)
  } catch (err) {
    error.value = err.message || '無法啟動正式 OAuth'
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-md rounded-lg border border-white/10 bg-zinc-900 p-6">
      <div class="mb-6">
        <p class="text-sm font-semibold text-cyan-300">TruthShield</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">開發期登入</h1>
        <p class="mt-2 text-sm leading-6 text-zinc-400">
          正式登入入口已保留 Facebook、Google、GitHub 身份信號；目前本機環境使用 mock callback 完成 token flow。
        </p>
      </div>

      <div class="mb-5 grid gap-2">
        <button class="rounded-md border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300/70" :disabled="loading" @click="realProviderLogin('facebook')">Facebook OAuth</button>
        <button class="rounded-md border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300/70" :disabled="loading" @click="realProviderLogin('google')">Google OAuth</button>
        <button class="rounded-md border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300/70" :disabled="loading" @click="realProviderLogin('github')">GitHub OAuth</button>
        <button class="rounded-md border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-cyan-300/50" :disabled="loading" @click="providerLogin('google')">本機 OAuth stub</button>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <label class="block text-sm">
          <span class="text-zinc-300">名稱</span>
          <input v-model="name" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-300" />
        </label>
        <label class="block text-sm">
          <span class="text-zinc-300">Email</span>
          <input v-model="email" type="email" required class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-300" />
        </label>
        <label class="block text-sm">
          <span class="text-zinc-300">FB ID placeholder</span>
          <input v-model="fbId" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-300" />
        </label>

        <p v-if="error" class="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{{ error }}</p>
        <p v-if="done" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">已登入，正在返回插件。</p>

        <button class="w-full rounded-md bg-cyan-300 px-4 py-2 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading">
          {{ loading ? '登入中...' : '登入並簽發 Token' }}
        </button>
      </form>
    </section>
  </main>
</template>
