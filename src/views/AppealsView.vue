<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { createAppeal, fetchMyAppeals } from '../lib/api'

const TOKEN_KEY = 'truthshield_api_token'
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const rows = ref([])
const form = ref({ subject_type: 'trust', subject_id: 1, reason: '', statement: '' })
const message = ref('')
const error = ref('')

async function load() {
  if (!token.value) return
  rows.value = await fetchMyAppeals(token.value)
}

async function submit() {
  message.value = ''
  error.value = ''
  try {
    await createAppeal(token.value, form.value)
    message.value = '申訴已送出。'
    form.value.reason = ''
    form.value.statement = ''
    await load()
  } catch (err) {
    error.value = err.message || '申訴失敗'
  }
}

onMounted(load)
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <RouterLink class="text-sm text-zinc-400" to="/profile">我的信用</RouterLink>
      </nav>

      <h1 class="text-3xl font-semibold text-white">申訴中心</h1>
      <p class="mt-2 text-sm text-zinc-400">針對證據隱藏、信用調整或帳號權重限制提出申訴。</p>

      <div v-if="!token" class="mt-6 rounded-lg border border-white/10 p-4 text-zinc-400">請先登入。</div>

      <form v-else class="mt-6 grid gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4" @submit.prevent="submit">
        <select v-model="form.subject_type" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-white">
          <option value="trust">信用分</option>
          <option value="evidence">證據審核</option>
          <option value="user_restriction">帳號權重限制</option>
        </select>
        <input v-model.number="form.subject_id" type="number" min="1" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-white" placeholder="關聯 ID" />
        <input v-model="form.reason" required class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-white" placeholder="申訴原因" />
        <textarea v-model="form.statement" required rows="5" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-white" placeholder="說明你的理由"></textarea>
        <p v-if="message" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-2 text-sm text-emerald-100">{{ message }}</p>
        <p v-if="error" class="rounded-md border border-red-400/40 bg-red-500/10 p-2 text-sm text-red-100">{{ error }}</p>
        <button class="rounded-md bg-cyan-300 px-4 py-2 font-semibold text-zinc-950">送出申訴</button>
      </form>

      <div class="mt-8 space-y-3">
        <article v-for="row in rows" :key="row.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div class="flex items-center justify-between">
            <span class="rounded bg-white/10 px-2 py-1 text-xs font-semibold">{{ row.subject_type }}</span>
            <span class="text-xs text-zinc-400">{{ row.status }}</span>
          </div>
          <p class="mt-3 text-sm text-white">{{ row.reason }}</p>
          <p class="mt-1 text-xs text-zinc-500">{{ row.statement }}</p>
        </article>
      </div>
    </section>
  </main>
</template>
