<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchVisionReadiness } from '../lib/api'
import { useI18n } from '../i18n'
import { legalDocument } from '../legalContent'

const { locale, t } = useI18n()
const doc = legalDocument(locale.value, 'security')
const flow = ref([])

onMounted(async () => {
  flow.value = (await fetchVisionReadiness()).security_report_flow || []
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-4xl">
      <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
      <p class="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{{ doc.subtitle }}</p>
      <h1 class="mt-3 text-3xl font-semibold text-white">{{ doc.title }}</h1>
      <p class="mt-2 text-xs text-zinc-500">{{ t('remaining.effectiveDate') }} {{ doc.effectiveDate }}</p>
      <p class="mt-5 text-sm leading-7 text-zinc-300">{{ doc.intro }}</p>
      <div class="mt-8 space-y-6">
        <section v-for="section in doc.sections" :key="section.title" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 class="text-lg font-semibold text-white">{{ section.title }}</h2>
          <ul class="mt-3 space-y-2 text-sm leading-7 text-zinc-300">
            <li v-for="item in section.body" :key="item">{{ item }}</li>
          </ul>
        </section>
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
