<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from '../i18n'

const { t } = useI18n()
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-4xl">
      <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
      <h1 class="mt-8 text-3xl font-semibold text-white">{{ t('remaining.governanceTitle') }}</h1>
      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="font-semibold text-white">{{ t('remaining.auditable') }}</h2>
          <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('remaining.auditableDesc') }}</p>
        </div>
        <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="font-semibold text-white">{{ t('remaining.appealable') }}</h2>
          <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('remaining.appealableDesc') }}</p>
        </div>
        <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="font-semibold text-white">{{ t('remaining.publiclyCheckable') }}</h2>
          <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('remaining.publiclyCheckableDesc') }}</p>
        </div>
      </div>
      <div class="mt-6 flex flex-wrap gap-2">
        <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/transparency">{{ t('common.transparency') }}</RouterLink>
        <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/moderation-events">{{ t('remaining.publicModeration') }}</RouterLink>
        <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/appeals">{{ t('profile.appeal') }}</RouterLink>
      </div>
    </section>
  </main>
</template>
