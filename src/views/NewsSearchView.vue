<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchNewsSearch } from '../lib/api'

const q = ref('')
const domain = ref('')
const finalized = ref('')
const rows = ref([])
const meta = ref(null)

async function search() {
  const payload = await fetchNewsSearch({
    q: q.value,
    domain: domain.value,
    finalized: finalized.value,
  })
  rows.value = payload.data || []
  meta.value = payload.meta || null
}

onMounted(search)
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <RouterLink class="text-sm text-zinc-400" to="/ranking">媒體排行</RouterLink>
      </nav>
      <h1 class="text-3xl font-semibold text-white">新聞搜尋</h1>
      <form class="mt-5 grid gap-2 md:grid-cols-[1fr_180px_150px_auto]" @submit.prevent="search">
        <input v-model="q" class="min-w-0 flex-1 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-cyan-300" placeholder="搜尋 URL 或標題" />
        <input v-model="domain" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-cyan-300" placeholder="網域" />
        <select v-model="finalized" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-cyan-300">
          <option value="">全部狀態</option>
          <option value="0">觀察中</option>
          <option value="1">已定案</option>
        </select>
        <button class="rounded-md bg-cyan-300 px-4 py-2 font-semibold text-zinc-950">搜尋</button>
      </form>
      <p v-if="meta" class="mt-3 text-xs text-zinc-500">共 {{ meta.total }} 筆，顯示上限 {{ meta.limit }} 筆</p>
      <div class="mt-5 space-y-2">
        <article v-for="row in rows" :key="row.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p class="font-medium text-white">{{ row.title_snapshot || '未命名新聞' }}</p>
          <a :href="row.normalized_url" target="_blank" rel="noreferrer" class="mt-1 block truncate text-sm text-cyan-200">{{ row.normalized_url }}</a>
          <p class="mt-2 text-xs text-zinc-500">投票 {{ row.votes_count }} · {{ row.finalized_at ? '已定案' : '觀察中' }}</p>
          <RouterLink class="mt-2 inline-block text-xs font-semibold text-cyan-200" :to="`/news/${row.id}`">查看詳情</RouterLink>
        </article>
      </div>
    </section>
  </main>
</template>
