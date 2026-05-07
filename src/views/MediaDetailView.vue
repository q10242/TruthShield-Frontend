<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchMediaOutlet } from '../lib/api'
import { useI18n } from '../i18n'

const route = useRoute()
const payload = ref(null)
const { t } = useI18n()

onMounted(async () => {
  payload.value = await fetchMediaOutlet(route.params.slug)
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/ranking">{{ t('common.ranking') }}</RouterLink>
        <RouterLink class="text-sm text-zinc-400" to="/evidence-library">{{ t('common.evidenceLibrary') }}</RouterLink>
      </nav>

      <template v-if="payload">
        <h1 class="text-3xl font-semibold text-white">{{ payload.media.name }}</h1>
        <p class="mt-2 text-sm text-zinc-400">{{ payload.media.type || t('remaining.news') }} · {{ payload.media.region || t('remaining.unknown') }}</p>

        <div class="mt-6 grid gap-3 sm:grid-cols-3">
          <div v-for="row in payload.tag_weights" :key="row.slug" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-sm text-zinc-300">{{ row.name }}</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ Number(row.weight).toFixed(2) }}</p>
          </div>
        </div>

        <h2 class="mt-8 text-xl font-semibold text-white">{{ t('remaining.recentNews') }}</h2>
        <div class="mt-3 space-y-2">
          <article v-for="item in payload.recent_news" :key="item.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="font-medium text-white">{{ item.title_snapshot || t('remaining.unnamedNews') }}</p>
            <a :href="item.normalized_url" target="_blank" rel="noreferrer" class="mt-1 block truncate text-sm text-cyan-200">{{ item.normalized_url }}</a>
            <p class="mt-2 text-xs text-zinc-500">{{ t('remaining.votes') }} {{ item.votes_count }} · {{ item.finalized_at ? t('remaining.finalized') : t('remaining.watching') }}</p>
          </article>
        </div>
      </template>
    </section>
  </main>
</template>
