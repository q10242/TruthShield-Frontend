<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchRateLimitPolicies, fetchSelectorChecks, fetchTrustedEvidenceSources } from '../lib/api'

const sources = ref([])
const policies = ref([])
const checks = ref(null)
const releaseCommands = [
  'php artisan truthshield:check-production-env',
  'php artisan migrate --force',
  'php artisan truthshield:ensure-algorithm-version',
  'php artisan truthshield:seed-launch-policies',
  'php artisan truthshield:warm-cache',
  'php artisan truthshield:expire-pending-donations --hours=24',
]
const exportLinks = [
  { href: '/api/exports/news.csv', label: '新聞 CSV' },
  { href: '/api/exports/evidence.csv', label: '證據 CSV' },
  { href: '/api/exports/donations.csv', label: '捐款 CSV' },
  { href: '/api/exports/user-data-requests.csv', label: '資料請求 CSV' },
]

onMounted(async () => {
  const [sourceRows, policyRows, checkRows] = await Promise.all([
    fetchTrustedEvidenceSources(),
    fetchRateLimitPolicies(),
    fetchSelectorChecks(),
  ])

  sources.value = sourceRows
  policies.value = policyRows
  checks.value = checkRows
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-6xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <RouterLink class="text-sm text-zinc-400" to="/transparency">透明儀表板</RouterLink>
      </nav>

      <h1 class="text-3xl font-semibold text-white">上線營運控制台</h1>
      <section class="mt-6 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-4">
        <h2 class="text-lg font-semibold text-white">發布前命令</h2>
        <div class="mt-3 grid gap-2 md:grid-cols-2">
          <code v-for="command in releaseCommands" :key="command" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">{{ command }}</code>
        </div>
      </section>
      <section class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <h2 class="text-lg font-semibold text-white">營運匯出</h2>
        <div class="mt-3 flex flex-wrap gap-2">
          <a v-for="link in exportLinks" :key="link.href" class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100" :href="link.href" target="_blank" rel="noreferrer">
            {{ link.label }}
          </a>
        </div>
      </section>
      <div class="mt-6 grid gap-6 lg:grid-cols-3">
        <section class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="text-lg font-semibold text-white">可信證據來源</h2>
          <div class="mt-3 space-y-2">
            <div v-for="source in sources" :key="source.host" class="rounded border border-white/10 p-3">
              <p class="text-sm font-semibold text-white">{{ source.host }}</p>
              <p class="mt-1 text-xs text-zinc-500">{{ source.source_type }} · 加成 {{ source.trust_bonus }}</p>
            </div>
          </div>
        </section>

        <section class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="text-lg font-semibold text-white">限流政策</h2>
          <div class="mt-3 space-y-2">
            <div v-for="policy in policies" :key="policy.name" class="rounded border border-white/10 p-3">
              <p class="text-sm font-semibold text-white">{{ policy.name }}</p>
              <p class="mt-1 text-xs text-zinc-500">{{ policy.max_attempts }} / {{ policy.decay_seconds }} 秒 · 低信任 x{{ policy.low_trust_multiplier }}</p>
            </div>
          </div>
        </section>

        <section class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="text-lg font-semibold text-white">選擇器檢查</h2>
          <p class="mt-2 text-sm text-zinc-400">失敗 24h：{{ checks?.summary?.failed_24h ?? 0 }}</p>
          <div class="mt-3 max-h-[420px] space-y-2 overflow-auto">
            <div v-for="check in checks?.data || []" :key="check.id" class="rounded border border-white/10 p-3">
              <div class="flex items-center justify-between gap-3">
                <p class="truncate text-sm font-semibold text-white">{{ check.domain }}</p>
                <span :class="check.success ? 'text-emerald-300' : 'text-red-300'" class="text-xs font-semibold">{{ check.success ? '正常' : '失敗' }}</span>
              </div>
              <p class="mt-1 text-xs text-zinc-500">{{ check.check_type }} · {{ check.selector || '備援規則' }}</p>
            </div>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>
