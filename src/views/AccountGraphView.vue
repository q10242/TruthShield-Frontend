<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchAccountGraphSummary } from '../lib/api'

const TOKEN_KEY = 'truthshield_api_token'
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const summary = ref(null)
const error = ref('')

onMounted(async () => {
  if (!token.value) return
  try {
    summary.value = await fetchAccountGraphSummary(token.value)
  } catch (err) {
    error.value = err.message
  }
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <RouterLink class="text-sm text-zinc-400" to="/health">系統健康</RouterLink>
      </nav>

      <h1 class="text-3xl font-semibold text-white">帳號關聯風險</h1>
      <p class="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">以雜湊訊號觀察協同行為，只顯示不可逆摘要與風險分數。</p>

      <div v-if="!token" class="mt-6 rounded-lg border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-100">
        請先登入後查看帳號關聯摘要。
      </div>
      <div v-else-if="error" class="mt-6 rounded-lg border border-red-300/30 bg-red-500/10 p-4 text-sm text-red-100">{{ error }}</div>

      <template v-else-if="summary">
        <div class="mt-6 grid gap-3 sm:grid-cols-3">
          <div v-for="key in ['signals_7d', 'edges', 'high_risk_edges']" :key="key" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs uppercase text-zinc-500">{{ key }}</p>
            <p class="mt-2 text-3xl font-semibold text-white">{{ summary[key] }}</p>
          </div>
        </div>

        <section class="mt-8">
          <h2 class="text-xl font-semibold text-white">最高風險關聯</h2>
          <div class="mt-3 space-y-2">
            <div v-for="edge in summary.top_edges" :key="edge.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <span class="rounded bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">{{ edge.edge_type }}</span>
                <span class="text-sm font-semibold text-white">分數 {{ Number(edge.score || 0).toFixed(2) }}</span>
              </div>
              <p class="mt-2 text-xs text-zinc-500">使用者 {{ edge.source_user_id }} -> 使用者 {{ edge.target_user_id }}</p>
            </div>
            <div v-if="!summary.top_edges?.length" class="rounded-lg border border-white/10 p-4 text-sm text-zinc-500">尚無關聯資料。</div>
          </div>
        </section>
      </template>
    </section>
  </main>
</template>
