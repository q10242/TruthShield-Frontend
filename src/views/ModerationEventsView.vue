<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchModerationEvents } from '../lib/api'

const rows = ref([])

onMounted(async () => {
  rows.value = await fetchModerationEvents()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <RouterLink class="text-sm text-zinc-400" to="/transparency">透明儀表板</RouterLink>
      </nav>
      <h1 class="text-3xl font-semibold text-white">透明審核紀錄</h1>
      <p class="mt-2 text-sm text-zinc-400">公開審核摘要，不包含私人資料。</p>
      <div class="mt-6 space-y-3">
        <article v-for="row in rows" :key="row.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div class="flex items-center justify-between">
            <span class="rounded bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">{{ row.event_type }}</span>
            <span class="text-xs text-zinc-500">{{ new Date(row.created_at).toLocaleString('zh-TW') }}</span>
          </div>
          <p class="mt-3 text-sm text-zinc-200">{{ row.public_reason }}</p>
        </article>
      </div>
    </section>
  </main>
</template>
