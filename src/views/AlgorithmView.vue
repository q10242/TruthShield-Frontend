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
        <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="font-semibold text-white">{{ t('remaining.principles') }}</h2>
          <ul class="mt-3 space-y-2 text-sm text-zinc-300">
            <li v-for="item in payload.principles" :key="item">{{ item }}</li>
          </ul>
        </div>
        <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="font-semibold text-white">{{ t('remaining.currentConfig') }}</h2>
          <pre class="mt-3 overflow-auto text-xs text-zinc-300">{{ JSON.stringify(payload.config, null, 2) }}</pre>
        </div>
      </div>
    </section>
  </main>
</template>
