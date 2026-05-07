<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
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
const demoAccounts = [
  { label: '一般測試者', name: 'Truth Checker', email: 'checker@example.com' },
  { label: 'Seed 測試者', name: 'TruthShield Tester', email: 'tester@truthshield.local' },
]

function useDemoAccount(account) {
  name.value = account.name
  email.value = account.email
  fbId.value = ''
}

async function persistLogin(payload) {
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
}

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
    await persistLogin(payload)
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
    error.value = err.message || '目前本機尚未設定正式 OAuth，請使用本機測試登入。'
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_420px]">
      <div class="rounded-lg border border-white/10 bg-white/[0.03] p-6">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <h1 class="mt-8 text-3xl font-semibold text-white">登入後參與加權查證</h1>
        <p class="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
          登入後可以投票、提交證據、評分證據有用程度，這些互動會影響你的信用權重與社群排序。
        </p>

        <div class="mt-6 grid gap-3 sm:grid-cols-3">
          <div class="rounded-md border border-white/10 bg-zinc-900 p-4">
            <p class="text-sm font-semibold text-white">投票</p>
            <p class="mt-2 text-xs leading-5 text-zinc-500">閱讀新聞後選擇最符合的標籤。</p>
          </div>
          <div class="rounded-md border border-white/10 bg-zinc-900 p-4">
            <p class="text-sm font-semibold text-white">證據</p>
            <p class="mt-2 text-xs leading-5 text-zinc-500">提供外部圖床、雲端硬碟或澄清連結。</p>
          </div>
          <div class="rounded-md border border-white/10 bg-zinc-900 p-4">
            <p class="text-sm font-semibold text-white">信用</p>
            <p class="mt-2 text-xs leading-5 text-zinc-500">高品質參與會提高後續權重。</p>
          </div>
        </div>
      </div>

      <section class="rounded-lg border border-white/10 bg-zinc-900 p-6">
        <div class="mb-6">
          <p class="text-sm font-semibold text-cyan-300">身份入口</p>
          <h2 class="mt-2 text-2xl font-semibold text-white">選擇登入方式</h2>
          <p class="mt-2 text-sm leading-6 text-zinc-400">
            本機環境可使用測試登入。正式 OAuth 會在 production 設定完成後啟用。
          </p>
        </div>

        <div class="mb-5 grid gap-2">
          <button class="rounded-md border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300/70" :disabled="loading" @click="realProviderLogin('facebook')">Facebook</button>
          <button class="rounded-md border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300/70" :disabled="loading" @click="realProviderLogin('google')">Google</button>
          <button class="rounded-md border border-cyan-300/30 px-4 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300/70" :disabled="loading" @click="realProviderLogin('github')">GitHub</button>
          <button class="rounded-md border border-white/10 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-cyan-300/50" :disabled="loading" @click="providerLogin('google')">本機 OAuth stub</button>
        </div>

        <div class="mb-5 rounded-md border border-white/10 bg-white/[0.03] p-3">
          <p class="text-xs font-semibold text-zinc-400">本機測試帳號</p>
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

        <form class="space-y-4 border-t border-white/10 pt-5" @submit.prevent="submit">
          <label class="block text-sm">
            <span class="text-zinc-300">測試名稱</span>
            <input v-model="name" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-300" />
          </label>
          <label class="block text-sm">
            <span class="text-zinc-300">測試 Email</span>
            <input v-model="email" type="email" required class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-300" />
          </label>
          <label class="block text-sm">
            <span class="text-zinc-300">FB ID placeholder</span>
            <input v-model="fbId" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-300" />
          </label>

          <p v-if="error" class="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{{ error }}</p>
          <p v-if="done" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">已登入，正在返回。</p>

          <button class="w-full rounded-md bg-cyan-300 px-4 py-2 font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading">
            {{ loading ? '登入中...' : '使用本機測試帳號登入' }}
          </button>
        </form>
      </section>
    </section>
  </main>
</template>
