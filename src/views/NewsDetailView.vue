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

        <div class="mt-5 rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="font-semibold text-white">{{ t('remaining.snapshotHistory') }}</h2>
            <span class="rounded bg-white/10 px-2 py-1 text-xs text-zinc-300">{{ payload.status.snapshot?.availability_status || 'unknown' }}</span>
          </div>
          <p class="mt-2 text-sm text-zinc-400">
            {{ t('remaining.snapshotSummary', {
              count: payload.status.snapshot?.snapshots_count || 0,
              changes: payload.status.snapshot?.changed_snapshots_count || 0,
              reports: payload.status.snapshot?.pending_change_reports_count || 0,
            }) }}
          </p>
          <a v-if="payload.status.snapshot?.archive_url" :href="payload.status.snapshot.archive_url" target="_blank" rel="noreferrer" class="mt-2 inline-block text-sm font-semibold text-cyan-200">
            {{ t('votePanel.openArchive') }}
          </a>
          <div class="mt-4 border-l border-cyan-300/30 pl-4">
            <article v-for="snapshot in payload.news.snapshots || []" :key="snapshot.id" class="relative mb-3 rounded-md border border-white/10 bg-zinc-900 p-3">
              <span class="absolute -left-[22px] top-4 h-3 w-3 rounded-full border border-cyan-300 bg-zinc-950"></span>
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="rounded bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">{{ snapshot.snapshot_type }}</span>
                  <span class="rounded bg-white/10 px-2 py-1 text-xs text-zinc-400">{{ snapshot.availability_status }}</span>
                </div>
                <span class="text-xs text-zinc-500">{{ snapshot.captured_at }}</span>
              </div>
              <p class="mt-2 text-sm text-zinc-200">{{ snapshot.title || t('remaining.unnamedNews') }}</p>
              <div v-if="snapshot.change_summary?.length" class="mt-2 space-y-1">
                <p class="text-xs font-semibold text-orange-200">{{ t('remaining.detectedChanges') }} {{ snapshot.change_summary.length }}</p>
                <div v-for="change in snapshot.change_summary" :key="`${snapshot.id}-${change.type}`" class="rounded border border-orange-300/20 bg-orange-500/10 p-2 text-xs text-orange-100">
                  <p class="font-semibold">{{ change.type }}</p>
                  <p class="mt-1 truncate opacity-75">{{ change.from }}</p>
                  <p class="mt-1 truncate">{{ change.to }}</p>
                </div>
              </div>
            </article>
          </div>
        </div>

        <h2 class="mt-8 text-xl font-semibold text-white">{{ t('votePanel.officialResponses') }}</h2>
        <div v-if="!payload.official_responses?.length" class="mt-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-500">
          {{ t('votePanel.noOfficialResponses') }}
        </div>
        <article v-for="item in payload.official_responses || []" :key="item.id" class="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-4">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded bg-cyan-300/15 px-2 py-1 text-xs font-semibold text-cyan-100">{{ item.claimant?.claim_type || item.response_type }}</span>
            <span class="text-sm font-semibold text-white">{{ item.author?.display_name }}</span>
            <span v-if="item.author?.identity_label" class="rounded bg-white/10 px-2 py-1 text-xs text-zinc-300">{{ item.author.identity_label }}</span>
          </div>
          <p class="mt-3 text-sm leading-6 text-zinc-200">{{ item.response_text }}</p>
          <a v-if="item.evidence_url" :href="item.evidence_url" target="_blank" rel="noreferrer" class="mt-2 block truncate text-sm text-cyan-200">{{ item.evidence_url }}</a>
        </article>

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
