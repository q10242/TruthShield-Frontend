<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchAlgorithm } from '../lib/api'
import { useI18n } from '../i18n'

const payload = ref(null)
const { t } = useI18n()

onMounted(async () => {
  payload.value = await fetchAlgorithm()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-4xl">
      <nav class="mb-8 border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
      </nav>
      <h1 class="text-3xl font-semibold text-white">{{ t('remaining.algorithmTitle') }}</h1>
      <div v-if="payload" class="mt-6 grid gap-4">
        <section class="grid gap-3 md:grid-cols-3">
          <div class="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-4">
            <p class="text-xs font-semibold text-cyan-200">{{ t('remaining.currentVersion') }}</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ payload.version }}</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs font-semibold text-zinc-500">{{ t('remaining.votingWindow') }}</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ payload.summary?.voting_window_hours || 72 }}h</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs font-semibold text-zinc-500">{{ t('remaining.evidenceReactionMin') }}</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ payload.config.evidence_reaction_min_trust_score }}</p>
          </div>
        </section>

        <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="font-semibold text-white">{{ t('remaining.principles') }}</h2>
          <ul class="mt-3 space-y-2 text-sm text-zinc-300">
            <li v-for="item in payload.principles" :key="item">{{ item }}</li>
          </ul>
        </div>

        <section class="grid gap-3 md:grid-cols-2">
          <article v-for="rule in payload.rules || []" :key="rule.key" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs font-semibold text-cyan-300">{{ rule.key }}</p>
            <h2 class="mt-2 text-lg font-semibold text-white">{{ rule.title }}</h2>
            <p class="mt-2 text-sm leading-6 text-zinc-400">{{ rule.description }}</p>
          </article>
        </section>

        <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="font-semibold text-white">{{ t('remaining.currentConfig') }}</h2>
          <pre class="mt-3 overflow-auto text-xs text-zinc-300">{{ JSON.stringify(payload.config, null, 2) }}</pre>
        </div>

        <section class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="font-semibold text-white">{{ t('remaining.algorithmHistory') }}</h2>
          <div class="mt-3 space-y-2">
            <article v-for="item in payload.history || []" :key="item.id" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-semibold text-white">{{ item.version }}</span>
                <span class="rounded bg-white/10 px-2 py-1 text-xs text-zinc-400">{{ item.status }}</span>
              </div>
              <p class="mt-2 text-sm text-zinc-400">{{ item.summary }}</p>
            </article>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>
