<script setup>
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from '../i18n'

const TOKEN_KEY = 'truthshield_api_token'
const USER_KEY = 'truthshield_user'
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const user = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))
const { t } = useI18n()

const primaryLinks = computed(() => [
  { to: '/local-news-demo', label: t('common.localNewsDemo'), description: t('home.localNewsDemoDesc') },
  { to: '/evidence-library', label: t('common.evidenceLibrary'), description: t('home.evidenceLibraryDesc') },
  { to: '/ranking', label: t('common.ranking'), description: t('home.rankingDesc') },
  { to: '/transparency', label: t('common.transparency'), description: t('home.transparencyDesc') },
  { to: '/donate', label: t('common.donate'), description: t('home.donateDesc') },
])

const authLabel = computed(() => token.value ? (user.value?.name || t('common.profile')) : t('common.signIn'))

function signOut() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  token.value = ''
  user.value = null
}

const secondaryLinks = computed(() => [
  { to: '/news-search', label: t('common.newsSearch') },
  { to: '/profile', label: t('common.profile') },
  { to: '/trust-leaderboard', label: t('common.trustLeaderboard') },
  { to: '/moderation-events', label: t('common.moderationEvents') },
  { to: '/extension-coverage', label: t('common.extensionCoverage') },
  { to: '/account-graph', label: t('common.accountGraph') },
  { to: '/launch-ops', label: t('common.launchOps') },
  { to: '/donate', label: t('common.donate') },
  { to: '/algorithm', label: t('common.algorithm') },
  { to: '/api-docs', label: t('common.apiDocs') },
])

const navGroups = computed(() => [
  { title: t('home.readerGroup'), links: secondaryLinks.value.slice(0, 3) },
  { title: t('home.reviewerGroup'), links: secondaryLinks.value.slice(3, 6) },
  { title: t('home.opsGroup'), links: secondaryLinks.value.slice(6) },
])
</script>

<template>
  <main class="min-h-screen bg-zinc-950 text-zinc-100">
    <section class="mx-auto max-w-6xl px-6 py-8">
      <nav class="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold tracking-wide text-white" to="/">TruthShield</RouterLink>
        <div class="flex flex-wrap items-center gap-2">
          <RouterLink
            v-for="link in secondaryLinks.slice(0, 5)"
            :key="link.to"
            class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100"
            :to="link.to"
          >
            {{ link.label }}
          </RouterLink>
          <RouterLink
            class="rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-zinc-950"
            :to="token ? '/profile' : '/login'"
          >
            {{ authLabel }}
          </RouterLink>
          <button v-if="token" class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-400 hover:border-cyan-300/60 hover:text-cyan-100" @click="signOut">
            {{ t('common.signOut') }}
          </button>
        </div>
      </nav>

      <div class="grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
        <section class="space-y-6">
          <div>
            <p class="text-sm font-semibold text-cyan-300">{{ t('home.network') }}</p>
            <h1 class="mt-3 text-4xl font-semibold leading-tight text-white md:text-5xl">{{ t('home.title') }}</h1>
            <p class="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
              {{ t('home.subtitle') }}
            </p>
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <RouterLink
              v-for="link in primaryLinks"
              :key="link.to"
              class="group rounded-lg border border-white/10 bg-white/[0.03] p-5 hover:border-cyan-300/60 hover:bg-cyan-300/[0.06]"
              :to="link.to"
            >
              <div class="flex items-center justify-between gap-4">
                <h2 class="text-lg font-semibold text-white">{{ link.label }}</h2>
                <span class="text-xl text-cyan-200">→</span>
              </div>
              <p class="mt-3 text-sm leading-6 text-zinc-400 group-hover:text-zinc-300">{{ link.description }}</p>
            </RouterLink>
          </div>
        </section>

        <aside class="rounded-lg border border-cyan-300/20 bg-zinc-900 p-5 shadow-2xl shadow-cyan-950/40">
          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <span class="text-sm font-semibold text-white">{{ t('home.articleStatus') }}</span>
            <span class="rounded bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-100">{{ t('home.tagExample') }}</span>
          </div>
          <div class="space-y-4 pt-5">
            <div class="rounded-md border border-red-300/30 bg-red-500/10 p-4">
              <p class="text-sm font-semibold text-red-100">{{ t('home.warningExample') }}</p>
              <p class="mt-2 text-xs text-red-100/75">{{ t('home.evidenceHint') }}</p>
            </div>
            <RouterLink class="block w-full rounded-md bg-cyan-300 px-4 py-2 text-center text-sm font-semibold text-zinc-950" to="/local-news-demo">
              {{ t('home.openVotePanel') }}
            </RouterLink>
            <div class="grid grid-cols-3 gap-2 text-center text-xs">
              <div class="rounded-md bg-white/[0.04] p-3">
                <div class="font-semibold text-white">72h</div>
                <div class="mt-1 text-zinc-500">{{ t('home.closeIn') }}</div>
              </div>
              <div class="rounded-md bg-white/[0.04] p-3">
                <div class="font-semibold text-white">{{ t('home.onePerson') }}</div>
                <div class="mt-1 text-zinc-500">{{ t('home.oneVote') }}</div>
              </div>
              <div class="rounded-md bg-white/[0.04] p-3">
                <div class="font-semibold text-white">{{ t('home.weighted') }}</div>
                <div class="mt-1 text-zinc-500">{{ t('home.trust') }}</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <section class="grid gap-3 border-t border-white/10 py-6 md:grid-cols-3">
        <div v-for="group in navGroups" :key="group.title" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="text-sm font-semibold text-white">{{ group.title }}</h2>
          <div class="mt-3 flex flex-wrap gap-2">
            <RouterLink
              v-for="link in group.links"
              :key="link.to"
              class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-400 hover:border-cyan-300/60 hover:text-cyan-100"
              :to="link.to"
            >
              {{ link.label }}
            </RouterLink>
          </div>
        </div>
      </section>
      <footer class="flex flex-wrap gap-3 border-t border-white/10 py-5 text-sm text-zinc-500">
        <RouterLink class="hover:text-cyan-100" to="/privacy">{{ t('common.privacy') }}</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/terms">{{ t('common.terms') }}</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/security">{{ t('common.security') }}</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/governance">{{ t('common.governance') }}</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/donate">{{ t('common.donate') }}</RouterLink>
      </footer>
    </section>
  </main>
</template>
