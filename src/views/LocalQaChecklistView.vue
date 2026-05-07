<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from '../i18n'

const { t } = useI18n()

const groups = computed(() => [
  {
    title: t('qa.authTitle'),
    items: [
      t('qa.authLogin'),
      t('qa.authProfile'),
      t('qa.authLogout'),
    ],
  },
  {
    title: t('qa.voteTitle'),
    items: [
      t('qa.voteDemo'),
      t('qa.voteRead'),
      t('qa.voteEvidence'),
      t('qa.voteResult'),
    ],
  },
  {
    title: t('qa.extensionTitle'),
    items: [
      t('qa.extensionLoad'),
      t('qa.extensionTooltip'),
      t('qa.extensionBanner'),
      t('qa.extensionPopup'),
    ],
  },
  {
    title: t('qa.adminTitle'),
    items: [
      t('qa.adminLogin'),
      t('qa.adminCreate'),
      t('qa.adminReview'),
      t('qa.adminDashboard'),
    ],
  },
  {
    title: t('qa.officialTitle'),
    items: [
      t('qa.officialProfile'),
      t('qa.officialAdmin'),
      t('qa.officialSubmit'),
      t('qa.officialReaction'),
    ],
  },
  {
    title: t('qa.opsTitle'),
    items: [
      t('qa.opsHealth'),
      t('qa.opsReadiness'),
      t('qa.opsExports'),
      t('qa.opsPackage'),
    ],
  },
])
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <RouterLink class="text-sm text-zinc-400" to="/vision-readiness">{{ t('common.visionReadiness') }}</RouterLink>
      </nav>

      <header>
        <p class="text-sm font-semibold text-cyan-300">{{ t('qa.eyebrow') }}</p>
        <h1 class="mt-2 text-3xl font-semibold text-white">{{ t('qa.title') }}</h1>
        <p class="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">{{ t('qa.intro') }}</p>
      </header>

      <div class="mt-6 grid gap-4 md:grid-cols-2">
        <section v-for="group in groups" :key="group.title" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 class="text-lg font-semibold text-white">{{ group.title }}</h2>
          <div class="mt-4 space-y-3">
            <label v-for="item in group.items" :key="item" class="flex gap-3 rounded-md border border-white/10 bg-zinc-950/70 p-3 text-sm text-zinc-300">
              <input type="checkbox" class="mt-1 h-4 w-4 accent-cyan-300" />
              <span>{{ item }}</span>
            </label>
          </div>
        </section>
      </div>

      <section class="mt-6 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-5">
        <h2 class="text-lg font-semibold text-white">{{ t('qa.commands') }}</h2>
        <div class="mt-3 grid gap-2 md:grid-cols-2">
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">php artisan test --filter=TruthShieldApiTest</code>
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">npm run build</code>
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">npm run package:extension</code>
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">php artisan truthshield:check-extension-selectors</code>
        </div>
      </section>
    </section>
  </main>
</template>
