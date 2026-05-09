<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from '../i18n'
import { legalDocument } from '../legalContent'

const { locale, t } = useI18n()
const doc = legalDocument(locale.value, 'officialResponse')
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-4xl">
      <BrandLink />
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
    </section>
  </main>
</template>
