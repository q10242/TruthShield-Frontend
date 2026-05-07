<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchNewsSearch } from '../lib/api'
import { useI18n } from '../i18n'

const q = ref('')
const domain = ref('')
const finalized = ref('')
const rows = ref([])
const meta = ref(null)
const { t } = useI18n()

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
        <RouterLink class="text-sm text-zinc-400" to="/ranking">{{ t('common.ranking') }}</RouterLink>
      </nav>
      <h1 class="text-3xl font-semibold text-white">{{ t('remaining.newsSearchTitle') }}</h1>
      <form class="mt-5 grid gap-2 md:grid-cols-[1fr_180px_150px_auto]" @submit.prevent="search">
        <input v-model="q" class="min-w-0 flex-1 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-cyan-300" :placeholder="t('remaining.searchUrlTitle')" />
        <input v-model="domain" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-cyan-300" :placeholder="t('remaining.domain')" />
        <select v-model="finalized" class="rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-white outline-none focus:border-cyan-300">
          <option value="">{{ t('remaining.allStatuses') }}</option>
          <option value="0">{{ t('remaining.watching') }}</option>
          <option value="1">{{ t('remaining.finalized') }}</option>
        </select>
        <button class="rounded-md bg-cyan-300 px-4 py-2 font-semibold text-zinc-950">{{ t('remaining.search') }}</button>
      </form>
      <p v-if="meta" class="mt-3 text-xs text-zinc-500">{{ t('evidence.resultMeta', { total: meta.total, limit: meta.limit }) }}</p>
      <div class="mt-5 space-y-2">
        <article v-for="row in rows" :key="row.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p class="font-medium text-white">{{ row.title_snapshot || t('remaining.unnamedNews') }}</p>
          <a :href="row.normalized_url" target="_blank" rel="noreferrer" class="mt-1 block truncate text-sm text-cyan-200">{{ row.normalized_url }}</a>
          <p class="mt-2 text-xs text-zinc-500">{{ t('remaining.votes') }} {{ row.votes_count }} · {{ row.finalized_at ? t('remaining.finalized') : t('remaining.watching') }}</p>
          <RouterLink class="mt-2 inline-block text-xs font-semibold text-cyan-200" :to="`/news/${row.id}`">{{ t('common.details') }}</RouterLink>
        </article>
      </div>
    </section>
  </main>
</template>
