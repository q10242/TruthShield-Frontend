<script setup>
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { createUserDataRequest } from '../lib/api'

const form = reactive({ email: '', request_type: 'deletion', reason: '' })
const message = ref('')
const error = ref('')

async function submit() {
  message.value = ''
  error.value = ''
  try {
    await createUserDataRequest(form)
    message.value = '已送出資料權利請求，管理員會在後台審核。'
  } catch (err) {
    error.value = err.message || '送出失敗'
  }
}
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-2xl">
      <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
      <h1 class="mt-8 text-3xl font-semibold text-white">資料權利請求</h1>
      <form class="mt-6 space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-5" @submit.prevent="submit">
        <input v-model="form.email" required type="email" class="w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white" placeholder="Email" />
        <select v-model="form.request_type" class="w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white">
          <option value="export">資料匯出</option>
          <option value="deletion">資料刪除</option>
          <option value="correction">資料更正</option>
        </select>
        <textarea v-model="form.reason" class="min-h-28 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white" placeholder="請簡短描述請求原因"></textarea>
        <p v-if="message" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{{ message }}</p>
        <p v-if="error" class="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{{ error }}</p>
        <button class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950">送出請求</button>
      </form>
    </section>
  </main>
</template>
