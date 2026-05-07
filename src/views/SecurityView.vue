<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchVisionReadiness } from '../lib/api'
import { useI18n } from '../i18n'

const { t } = useI18n()
const flow = ref([])

onMounted(async () => {
  flow.value = (await fetchVisionReadiness()).security_report_flow || []
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-3xl">
      <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
      <h1 class="mt-8 text-3xl font-semibold text-white">{{ t('remaining.securityTitle') }}</h1>
      <div class="mt-6 space-y-5 text-sm leading-7 text-zinc-300">
        <p>{{ t('remaining.security1') }}</p>
        <p>{{ t('remaining.security2') }}</p>
        <p>{{ t('remaining.security3') }}</p>
      </div>
      <section class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-5">
        <h2 class="text-lg font-semibold text-white">{{ t('vision.securityFlow') }}</h2>
        <div class="mt-4 grid gap-3">
          <article v-for="item in flow" :key="item.severity" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-semibold text-white">{{ item.severity }}</p>
              <span class="rounded bg-cyan-300/10 px-2 py-1 text-xs text-cyan-100">{{ item.sla }}</span>
            </div>
            <p class="mt-2 text-xs leading-5 text-zinc-500">{{ item.target }}</p>
          </article>
        </div>
      </section>
    </section>
  </main>
</template>
