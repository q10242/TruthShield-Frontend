<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchMyDataExport, fetchProfile, logout, markAllNotificationsRead } from '../lib/api'

const TOKEN_KEY = 'truthshield_api_token'
const USER_KEY = 'truthshield_user'
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const profile = ref(null)
const loading = ref(false)
const exportMessage = ref('')

async function signOut() {
  if (token.value) await logout(token.value).catch(() => null)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  token.value = ''
  profile.value = null
}

async function loadProfile() {
  if (!token.value) return
  loading.value = true
  try {
    profile.value = await fetchProfile(token.value)
  } finally {
    loading.value = false
  }
}

async function markNotificationsRead() {
  if (!token.value) return
  await markAllNotificationsRead(token.value)
  await loadProfile()
}

async function exportMyData() {
  exportMessage.value = ''
  const payload = await fetchMyDataExport(token.value)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'truthshield-my-data.json'
  anchor.click()
  URL.revokeObjectURL(url)
  exportMessage.value = '已產生你的資料匯出檔。'
}

onMounted(async () => {
  await loadProfile()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-4xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <button v-if="token" class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300" @click="signOut">登出</button>
      </nav>

      <div v-if="!token" class="rounded-lg border border-white/10 p-5 text-zinc-400">尚未登入。</div>
      <div v-else-if="loading" class="rounded-lg border border-white/10 p-5 text-zinc-400">讀取中...</div>

      <template v-else-if="profile">
        <h1 class="text-3xl font-semibold text-white">{{ profile.user.name }}</h1>
        <div class="mt-2 flex flex-wrap items-center gap-3 text-zinc-400">
          <span>{{ profile.user.email }} · 信用 {{ Number(profile.user.trust_score).toFixed(2) }}</span>
          <button class="rounded-md border border-cyan-300/30 px-3 py-1.5 text-xs font-semibold text-cyan-100" @click="exportMyData">匯出我的資料</button>
          <RouterLink class="rounded-md border border-cyan-300/30 px-3 py-1.5 text-xs font-semibold text-cyan-100" to="/appeals">提出申訴</RouterLink>
        </div>
        <p v-if="exportMessage" class="mt-3 rounded-md border border-emerald-400/40 bg-emerald-500/10 p-2 text-xs text-emerald-100">{{ exportMessage }}</p>

        <div v-if="profile.badges?.length" class="mt-4 flex flex-wrap gap-2">
          <span v-for="badge in profile.badges" :key="badge.id" class="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
            {{ badge.name }}
          </span>
        </div>

        <div class="mt-6 grid gap-3 sm:grid-cols-4">
          <div v-for="(value, key) in profile.stats" :key="key" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs text-zinc-500">{{ key }}</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ value }}</p>
          </div>
        </div>

        <div class="mt-8 grid gap-6 lg:grid-cols-2">
          <section>
            <div class="mb-3 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-white">通知</h2>
              <button class="rounded-md border border-white/10 px-3 py-2 text-xs text-zinc-300" @click="markNotificationsRead">全部已讀</button>
            </div>
            <div class="space-y-2">
              <div v-for="item in profile.notifications" :key="item.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4" :class="item.read_at ? 'opacity-60' : ''">
                <div class="flex items-center justify-between gap-3">
                  <p class="text-sm font-semibold text-white">{{ item.title }}</p>
                  <span v-if="!item.read_at" class="rounded-full bg-cyan-300 px-2 py-0.5 text-[11px] font-semibold text-zinc-950">new</span>
                </div>
                <p class="mt-1 text-xs leading-5 text-zinc-400">{{ item.body }}</p>
                <a v-if="item.action_url" :href="item.action_url" target="_blank" rel="noreferrer" class="mt-2 block truncate text-xs font-semibold text-cyan-200">{{ item.action_url }}</a>
              </div>
              <div v-if="!profile.notifications?.length" class="rounded-lg border border-white/10 p-4 text-sm text-zinc-500">尚無通知。</div>
            </div>
          </section>

          <section>
            <h2 class="mb-3 text-xl font-semibold text-white">近期投票</h2>
            <div class="space-y-2">
              <div v-for="vote in profile.recent_votes" :key="vote.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div class="flex items-center justify-between gap-3">
                  <span class="rounded bg-white/10 px-2 py-1 text-xs font-semibold text-zinc-200">{{ vote.tag?.name }}</span>
                  <span class="text-xs text-zinc-500">權重 {{ Number(vote.weight_score || 0).toFixed(2) }}</span>
                </div>
                <p class="mt-2 truncate text-sm text-zinc-300">{{ vote.news_url?.title_snapshot || vote.news_url?.normalized_url }}</p>
                <p v-if="vote.evidence_note" class="mt-1 text-xs leading-5 text-zinc-500">{{ vote.evidence_note }}</p>
              </div>
              <div v-if="!profile.recent_votes?.length" class="rounded-lg border border-white/10 p-4 text-sm text-zinc-500">尚無投票。</div>
            </div>
          </section>
        </div>

        <h2 class="mt-8 text-xl font-semibold text-white">信用分歷史</h2>
        <div class="mt-3 space-y-2">
          <div v-for="row in profile.trust_history" :key="row.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-zinc-300">{{ row.reason }}</span>
              <span :class="Number(row.delta) >= 0 ? 'text-emerald-300' : 'text-red-300'">{{ Number(row.delta).toFixed(4) }}</span>
            </div>
            <p class="mt-1 text-xs text-zinc-500">{{ row.details }}</p>
          </div>
        </div>
      </template>
    </section>
  </main>
</template>
