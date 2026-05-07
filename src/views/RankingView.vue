<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchMediaLeaderboard } from '../lib/api'

const rankings = ref([])
const loading = ref(true)
const riskLabels = {
  high: '高',
  medium: '中',
  low: '低',
}

onMounted(async () => {
  try {
    rankings.value = await fetchMediaLeaderboard()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="mb-10 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold tracking-wide text-white" to="/">TruthShield</RouterLink>
        <div class="flex gap-4 text-sm text-zinc-400">
          <RouterLink to="/evidence-library">證據庫</RouterLink>
          <RouterLink to="/transparency">透明儀表板</RouterLink>
        </div>
      </nav>

      <div class="mb-8">
        <h1 class="text-4xl font-semibold text-white">媒體信用排行榜</h1>
        <p class="mt-3 max-w-2xl text-zinc-400">依媒體旗下新聞的加權正負標籤比例計算。分數不是審查結果，而是社群對新聞連結的累積評價。</p>
        <div class="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="font-semibold text-white">分數</p>
            <p class="mt-1 text-zinc-500">正向與負向權重的相對結果。</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="font-semibold text-white">權重</p>
            <p class="mt-1 text-zinc-500">投票會受使用者信用與風險狀態影響。</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="font-semibold text-white">風險</p>
            <p class="mt-1 text-zinc-500">協助讀者判斷是否需要更多證據。</p>
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-lg border border-white/10">
        <table class="w-full border-collapse text-left">
          <thead class="bg-white/[0.04] text-sm text-zinc-400">
            <tr>
              <th class="px-5 py-4 font-medium">媒體</th>
              <th class="px-5 py-4 font-medium">分數</th>
              <th class="px-5 py-4 font-medium">正向權重</th>
              <th class="px-5 py-4 font-medium">負向權重</th>
              <th class="px-5 py-4 font-medium">風險</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="border-t border-white/10">
              <td class="px-5 py-5 text-zinc-400" colspan="5">讀取中...</td>
            </tr>
            <tr v-else-if="rankings.length === 0" class="border-t border-white/10">
              <td class="px-5 py-5 text-zinc-400" colspan="5">尚無足夠投票資料產生排行榜。</td>
            </tr>
            <tr v-for="item in rankings" :key="item.id" class="border-t border-white/10">
              <td class="px-5 py-4 font-medium text-white">{{ item.name }}</td>
              <td class="px-5 py-4">{{ item.score }}</td>
              <td class="px-5 py-4 text-emerald-300">{{ Number(item.positive_weight).toFixed(2) }}</td>
              <td class="px-5 py-4 text-red-300">{{ Number(item.negative_weight).toFixed(2) }}</td>
              <td class="px-5 py-4">
                <span class="rounded px-2 py-1 text-xs font-semibold" :class="item.risk === 'high' ? 'bg-red-500/20 text-red-200' : item.risk === 'medium' ? 'bg-orange-500/20 text-orange-200' : 'bg-emerald-500/20 text-emerald-200'">
                  {{ riskLabels[item.risk] || item.risk }}
                </span>
                <RouterLink class="ml-3 text-xs font-semibold text-cyan-200" :to="`/media/${item.slug}`">詳情</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
