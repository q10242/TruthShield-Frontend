<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchExtensionCoverage } from '../lib/api'

const rows = ref([])
const eventLabels = {
  tooltip_shown: '提示框顯示',
  banner_shown: '橫幅顯示',
  vote_panel_opened: '投票面板開啟',
  domain_report_opened: '回報頁開啟',
  iframe_failed: '內嵌頁失敗',
  selector_check_failed: '選擇器檢查失敗',
}

function eventLabel(type) {
  return eventLabels[type] || type
}

onMounted(async () => {
  rows.value = await fetchExtensionCoverage()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-6xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <RouterLink class="text-sm text-zinc-400" to="/health">系統健康</RouterLink>
      </nav>
      <h1 class="text-3xl font-semibold text-white">插件覆蓋率</h1>
      <p class="mt-2 text-sm text-zinc-400">依網域追蹤提示框與投票面板相容性。</p>
      <div class="mt-6 grid gap-3">
        <div v-if="rows.length === 0" class="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
          尚無插件事件資料。安裝本機插件並開啟新聞頁後，這裡會顯示網域成功率。
        </div>
        <article v-for="row in rows" :key="row.domain" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="font-semibold text-white">{{ row.domain }}</h2>
          <div class="mt-3 grid gap-2 md:grid-cols-3">
            <div v-for="event in row.events" :key="event.event_type" class="rounded-md border border-white/10 p-3">
              <p class="text-xs text-zinc-500">{{ eventLabel(event.event_type) }}</p>
              <p class="mt-1 text-xl font-semibold text-white">{{ event.success_rate }}%</p>
              <p class="mt-1 text-xs text-zinc-500">{{ event.successes }} / {{ event.total }}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
