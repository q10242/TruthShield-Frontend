<script setup>
import { RouterLink } from 'vue-router'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

const { t } = useI18n()

const ruleKeys = [
  'noCensorship',
  'oneVote',
  'evidenceFirst',
  'weightedTrust',
  'antiManipulation',
  'rightOfReply',
  'appealable',
  'transparent',
  'privacy',
]
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <AppNav>
        <RouterLink class="text-sm text-cyan-200" to="/label-guide">{{ t('common.labelGuide') }}</RouterLink>
      </AppNav>

      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{{ t('platformRules.eyebrow') }}</p>
      <h1 class="mt-3 text-3xl font-semibold text-white">{{ t('platformRules.title') }}</h1>
      <p class="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">{{ t('platformRules.intro') }}</p>

      <div class="mt-8 grid gap-4 md:grid-cols-2">
        <article v-for="key in ruleKeys" :key="key" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <p class="text-sm font-semibold text-white">{{ t(`platformRules.rules.${key}.title`) }}</p>
          <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t(`platformRules.rules.${key}.desc`) }}</p>
        </article>
      </div>
    </section>
  </main>
</template>
