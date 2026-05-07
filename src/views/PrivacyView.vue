<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from '../i18n'

const { t } = useI18n()
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-3xl">
      <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
      <h1 class="mt-8 text-3xl font-semibold text-white">{{ t('remaining.privacyTitle') }}</h1>
      <div class="mt-6 space-y-5 text-sm leading-7 text-zinc-300">
        <p>{{ t('remaining.privacy1') }}</p>
        <p>{{ t('remaining.privacy2') }}</p>
        <p>{{ t('remaining.privacy3') }}</p>
        <RouterLink class="inline-flex rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" to="/data-request">{{ t('remaining.dataRequestLink') }}</RouterLink>
      </div>
    </section>
  </main>
</template>
