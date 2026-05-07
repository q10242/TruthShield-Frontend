<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchMediaLeaderboard } from '../lib/api'
import { useI18n } from '../i18n'

const rankings = ref([])
const loading = ref(true)
const { t } = useI18n()

function riskLabel(risk) {
  const labels = {
    high: t('ranking.riskHigh'),
    medium: t('ranking.riskMedium'),
    low: t('ranking.riskLow'),
  }
  return labels[risk] || risk
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
          <RouterLink to="/evidence-library">{{ t('common.evidenceLibrary') }}</RouterLink>
          <RouterLink to="/transparency">{{ t('common.transparency') }}</RouterLink>
        </div>
      </nav>

      <div class="mb-8">
        <h1 class="text-4xl font-semibold text-white">{{ t('ranking.title') }}</h1>
        <p class="mt-3 max-w-2xl text-zinc-400">{{ t('ranking.intro') }}</p>
        <div class="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="font-semibold text-white">{{ t('ranking.score') }}</p>
            <p class="mt-1 text-zinc-500">{{ t('ranking.scoreDesc') }}</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="font-semibold text-white">{{ t('ranking.weight') }}</p>
            <p class="mt-1 text-zinc-500">{{ t('ranking.weightDesc') }}</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="font-semibold text-white">{{ t('ranking.risk') }}</p>
            <p class="mt-1 text-zinc-500">{{ t('ranking.riskDesc') }}</p>
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-lg border border-white/10">
        <table class="w-full border-collapse text-left">
          <thead class="bg-white/[0.04] text-sm text-zinc-400">
            <tr>
              <th class="px-5 py-4 font-medium">{{ t('ranking.media') }}</th>
              <th class="px-5 py-4 font-medium">{{ t('ranking.score') }}</th>
              <th class="px-5 py-4 font-medium">{{ t('ranking.positiveWeight') }}</th>
              <th class="px-5 py-4 font-medium">{{ t('ranking.negativeWeight') }}</th>
              <th class="px-5 py-4 font-medium">{{ t('ranking.risk') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading" class="border-t border-white/10">
              <td class="px-5 py-5 text-zinc-400" colspan="5">{{ t('common.loading') }}</td>
            </tr>
            <tr v-else-if="rankings.length === 0" class="border-t border-white/10">
              <td class="px-5 py-5 text-zinc-400" colspan="5">{{ t('ranking.empty') }}</td>
            </tr>
            <tr v-for="item in rankings" :key="item.id" class="border-t border-white/10">
              <td class="px-5 py-4 font-medium text-white">{{ item.name }}</td>
              <td class="px-5 py-4">{{ item.score }}</td>
              <td class="px-5 py-4 text-emerald-300">{{ Number(item.positive_weight).toFixed(2) }}</td>
              <td class="px-5 py-4 text-red-300">{{ Number(item.negative_weight).toFixed(2) }}</td>
              <td class="px-5 py-4">
                <span class="rounded px-2 py-1 text-xs font-semibold" :class="item.risk === 'high' ? 'bg-red-500/20 text-red-200' : item.risk === 'medium' ? 'bg-orange-500/20 text-orange-200' : 'bg-emerald-500/20 text-emerald-200'">
                  {{ riskLabel(item.risk) }}
                </span>
                <RouterLink class="ml-3 text-xs font-semibold text-cyan-200" :to="`/media/${item.slug}`">{{ t('common.details') }}</RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
