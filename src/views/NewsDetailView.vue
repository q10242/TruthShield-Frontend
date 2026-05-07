<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchNewsDetail } from '../lib/api'
import { useI18n } from '../i18n'

const route = useRoute()
const payload = ref(null)
const { t } = useI18n()

onMounted(async () => {
  payload.value = await fetchNewsDetail(route.params.id)
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/news-search">{{ t('remaining.newsSearchTitle') }}</RouterLink>
        <RouterLink class="text-sm text-zinc-400" to="/evidence-library">{{ t('common.evidenceLibrary') }}</RouterLink>
      </nav>

      <template v-if="payload">
        <h1 class="text-3xl font-semibold text-white">{{ payload.news.title_snapshot || t('remaining.unnamedNews') }}</h1>
        <a :href="payload.news.normalized_url" target="_blank" rel="noreferrer" class="mt-2 block truncate text-sm text-cyan-200">{{ payload.news.normalized_url }}</a>

        <div class="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p class="font-semibold text-white">{{ payload.status.display_text }}</p>
          <p class="mt-1 text-sm text-zinc-400">{{ t('remaining.totalWeight') }} {{ Number(payload.status.total_weight).toFixed(2) }}</p>
        </div>

        <h2 class="mt-8 text-xl font-semibold text-white">{{ t('remaining.evidence') }}</h2>
        <article v-for="item in payload.evidence" :key="item.id" class="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <span class="rounded bg-white/10 px-2 py-1 text-xs">{{ item.tag.name }}</span>
          <p class="mt-3 text-sm text-zinc-300">{{ item.evidence_note }}</p>
          <a :href="item.evidence_url" target="_blank" rel="noreferrer" class="mt-2 block truncate text-sm text-cyan-200">{{ item.evidence_url }}</a>
        </article>
      </template>
    </section>
  </main>
</template>
