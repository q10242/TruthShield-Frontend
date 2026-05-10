<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchCommunityTaskStats } from '../lib/api'
import { trackPageView } from '../lib/traffic'
import { useI18n } from '../i18n'

const TOKEN_KEY = 'truthshield_api_token'
const USER_KEY = 'truthshield_user'
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const user = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))
const communityStats = ref(null)
const { t } = useI18n()

const primaryLinks = computed(() => [
  { to: '/demo-news', label: t('common.demoNews'), description: t('home.demoNewsDesc'), mark: '00' },
  { to: '/user-guide', label: t('common.userGuide'), description: t('home.userGuideDesc'), mark: '01' },
  { to: '/extension-install', label: t('common.extensionInstall'), description: t('home.extensionInstallDesc'), mark: '02' },
  { to: '/mobile', label: t('common.mobile'), description: t('home.mobileDesc'), mark: '03' },
  { to: '/news-search', label: t('common.newsSearch'), description: t('home.newsSearchDesc'), mark: '04' },
  { to: '/community-tasks', label: t('common.communityTasks'), description: t('home.communityTasksDesc'), mark: '05' },
  { to: '/evidence-library', label: t('common.evidenceLibrary'), description: t('home.evidenceLibraryDesc'), mark: '06' },
  { to: '/transparency', label: t('common.transparency'), description: t('home.transparencyDesc'), mark: '07' },
])

const authLabel = computed(() => token.value ? (user.value?.name || t('common.profile')) : t('common.signIn'))

function signOut() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  window.postMessage({ type: 'TRUTH_SHIELD_AUTH_CLEARED' }, window.location.origin)
  token.value = ''
  user.value = null
}

const secondaryLinks = computed(() => [
  { to: '/demo-news', label: t('common.demoNews') },
  { to: '/user-guide', label: t('common.userGuide') },
  { to: '/extension-install', label: t('common.extensionInstall') },
  { to: '/mobile', label: t('common.mobile') },
  { to: '/news-search', label: t('common.newsSearch') },
  { to: '/profile', label: t('common.profile') },
  { to: '/trust-leaderboard', label: t('common.trustLeaderboard') },
  { to: '/moderation-events', label: t('common.moderationEvents') },
  { to: '/extension-coverage', label: t('common.extensionCoverage') },
  { to: '/community-tasks', label: t('common.communityTasks') },
  { to: '/account-graph', label: t('common.accountGraph') },
  { to: '/vision-readiness', label: t('common.visionReadiness') },
  { to: '/platform-rules', label: t('common.platformRules') },
  { to: '/label-guide', label: t('common.labelGuide') },
  { to: '/donate', label: t('common.donate') },
  { to: '/algorithm', label: t('common.algorithm') },
  { to: '/api-docs', label: t('common.apiDocs') },
])

const githubLinks = computed(() => [
  { href: 'https://github.com/q10242/TruthShield-Frontend', label: t('common.githubFrontend') },
  { href: 'https://github.com/q10242/TruthShield-Backend', label: t('common.githubBackend') },
])

const navGroups = computed(() => [
  { title: t('home.readerGroup'), links: secondaryLinks.value.slice(0, 3) },
  { title: t('home.reviewerGroup'), links: secondaryLinks.value.slice(3, 6) },
  { title: t('home.opsGroup'), links: secondaryLinks.value.slice(6) },
])

const missionStats = computed(() => [
  { value: '72h', label: t('home.missionStatWindow'), description: t('home.missionStatWindowDesc') },
  { value: t('home.missionStatOnePersonValue'), label: t('home.missionStatOnePerson'), description: t('home.missionStatOnePersonDesc') },
  { value: t('home.missionStatOpenValue'), label: t('home.missionStatOpen'), description: t('home.missionStatOpenDesc') },
])

const whyCards = computed(() => [
  { title: t('home.whyHeadlineTitle'), description: t('home.whyHeadlineDesc') },
  { title: t('home.whyEvidenceTitle'), description: t('home.whyEvidenceDesc') },
  { title: t('home.whyTimingTitle'), description: t('home.whyTimingDesc') },
])

const missionSteps = computed(() => [
  { number: '01', title: t('home.stepReadTitle'), description: t('home.stepReadDesc') },
  { number: '02', title: t('home.stepEvidenceTitle'), description: t('home.stepEvidenceDesc') },
  { number: '03', title: t('home.stepWeightTitle'), description: t('home.stepWeightDesc') },
  { number: '04', title: t('home.stepPublicTitle'), description: t('home.stepPublicDesc') },
])

const firstUseSteps = computed(() => [
  { number: '01', title: t('home.firstUseDemoTitle'), description: t('home.firstUseDemoDesc'), to: '/demo-news', cta: t('common.demoNews') },
  { number: '02', title: t('home.firstUseGuideTitle'), description: t('home.firstUseGuideDesc'), to: '/user-guide', cta: t('common.userGuide') },
  { number: '03', title: t('home.firstUseInstallTitle'), description: t('home.firstUseInstallDesc'), to: '/extension-install', cta: t('common.extensionInstall') },
])

const pledges = computed(() => [
  { title: t('home.pledgeNoCensorshipTitle'), description: t('home.pledgeNoCensorshipDesc') },
  { title: t('home.pledgeTransparentTitle'), description: t('home.pledgeTransparentDesc') },
  { title: t('home.pledgeCommunityTitle'), description: t('home.pledgeCommunityDesc') },
])

const antiAbuseCards = computed(() => [
  { title: t('home.antiAbuseWeightTitle'), description: t('home.antiAbuseWeightDesc') },
  { title: t('home.antiAbuseEvidenceTitle'), description: t('home.antiAbuseEvidenceDesc') },
  { title: t('home.antiAbuseOneVoteTitle'), description: t('home.antiAbuseOneVoteDesc') },
  { title: t('home.antiAbuseFinalizedTitle'), description: t('home.antiAbuseFinalizedDesc') },
])

const trustFormulaCards = computed(() => [
  { label: t('home.trustFormulaBase'), value: t('home.trustFormulaBaseValue') },
  { label: t('home.trustFormulaIdentity'), value: t('home.trustFormulaIdentityValue') },
  { label: t('home.trustFormulaAbuse'), value: t('home.trustFormulaAbuseValue') },
])

const communityCards = computed(() => [
  { value: communityStats.value?.open_tasks ?? 0, label: t('communityTasks.openTasks') },
  { value: communityStats.value?.escalated_tasks ?? 0, label: t('communityTasks.escalatedTasks') },
  { value: communityStats.value?.authenticated_signals ?? 0, label: t('communityTasks.authSignals') },
])

const presenterLinks = computed(() => [
  { to: '/demo-news', label: t('common.demoNews'), description: t('home.presenterDemoDesc') },
  { to: '/user-guide', label: t('common.userGuide'), description: t('home.presenterGuideDesc') },
  { to: '/transparency', label: t('common.transparency'), description: t('home.presenterTransparencyDesc') },
])

onMounted(async () => {
  trackPageView('home')
  communityStats.value = await fetchCommunityTaskStats().catch(() => null)
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 text-zinc-100">
    <section class="mx-auto max-w-6xl px-6 py-8">
      <nav class="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <RouterLink class="flex items-center gap-3 text-sm font-semibold text-white" to="/" aria-label="TruthShield">
          <img class="h-10 w-10" src="/brand/truthshield-mark.svg" alt="" />
          <span class="leading-tight">
            <span class="block text-base font-semibold text-white">TruthShield</span>
            <span class="block text-xs font-medium text-zinc-500">真相護盾</span>
          </span>
        </RouterLink>
        <div class="flex flex-wrap items-center gap-2">
          <RouterLink
            v-for="link in secondaryLinks.slice(0, 5)"
            :key="link.to"
            class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100"
            :to="link.to"
          >
            {{ link.label }}
          </RouterLink>
          <a
            class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100"
            href="https://github.com/q10242/TruthShield-Frontend"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('common.github') }}
          </a>
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

      <div class="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_430px]">
        <section class="space-y-6">
          <div>
            <p class="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-100">{{ t('home.missionEyebrow') }}</p>
            <h1 class="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-white md:text-5xl">{{ t('home.missionTitle') }}</h1>
            <p class="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
              {{ t('home.missionLead') }}
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <RouterLink class="rounded-md bg-cyan-300 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-200" to="/demo-news">
              {{ t('home.demoNewsCta') }}
            </RouterLink>
            <RouterLink class="rounded-md bg-cyan-300 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-200" to="/user-guide">
              {{ t('home.manualGuideCta') }}
            </RouterLink>
            <RouterLink class="rounded-md border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100 hover:border-amber-200" to="/extension-install">
              {{ t('home.installExtensionCta') }}
            </RouterLink>
            <RouterLink class="rounded-md bg-cyan-300 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-200" to="/news-search">
              {{ t('home.primaryCta') }}
            </RouterLink>
            <RouterLink class="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-zinc-100 hover:border-cyan-300/60 hover:text-cyan-100" :to="token ? '/profile' : '/login'">
              {{ t('home.secondaryCta') }}
            </RouterLink>
            <RouterLink class="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-zinc-100 hover:border-cyan-300/60 hover:text-cyan-100" to="/evidence-library">
              {{ t('home.thirdCta') }}
            </RouterLink>
          </div>

          <div class="rounded-lg border border-amber-300/30 bg-amber-300/10 p-4">
            <p class="text-sm font-semibold text-amber-100">{{ t('home.extensionReviewTitle') }}</p>
            <p class="mt-2 text-sm leading-6 text-amber-50/80">{{ t('home.extensionReviewDesc') }}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <RouterLink class="rounded-md bg-amber-200 px-3 py-2 text-xs font-semibold text-zinc-950" to="/demo-news">
                {{ t('home.demoNewsCta') }}
              </RouterLink>
              <RouterLink class="rounded-md border border-amber-200/40 px-3 py-2 text-xs font-semibold text-amber-100" to="/extension-install">
                {{ t('common.extensionInstall') }}
              </RouterLink>
            </div>
          </div>

          <div class="grid gap-3 md:grid-cols-3">
            <article v-for="stat in missionStats" :key="stat.label" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <div class="text-2xl font-semibold text-white">{{ stat.value }}</div>
              <h2 class="mt-2 text-sm font-semibold text-cyan-100">{{ stat.label }}</h2>
              <p class="mt-2 text-sm leading-6 text-zinc-400">{{ stat.description }}</p>
            </article>
          </div>
        </section>

        <aside class="overflow-hidden rounded-lg border border-cyan-300/20 bg-zinc-900 shadow-2xl shadow-cyan-950/40">
          <img class="w-full border-b border-white/10 bg-zinc-950" src="/brand/mission-network.svg" :alt="t('home.heroVisualAlt')" />
          <div class="flex items-center justify-between border-b border-white/10 p-5 pb-4">
            <span class="text-sm font-semibold text-white">{{ t('home.articleStatus') }}</span>
            <span class="rounded bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-100">{{ t('home.tagExample') }}</span>
          </div>
          <div class="space-y-4 p-5 pt-5">
            <div class="rounded-md border border-red-300/30 bg-red-500/10 p-4">
              <p class="text-sm font-semibold text-red-100">{{ t('home.warningExample') }}</p>
              <p class="mt-2 text-xs text-red-100/75">{{ t('home.evidenceHint') }}</p>
            </div>
            <RouterLink class="block w-full rounded-md bg-cyan-300 px-4 py-2 text-center text-sm font-semibold text-zinc-950" to="/news-search">
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

      <section class="grid gap-6 border-t border-white/10 py-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
        <div>
          <p class="text-sm font-semibold text-cyan-300">{{ t('home.whyEyebrow') }}</p>
          <h2 class="mt-2 text-3xl font-semibold text-white">{{ t('home.whyTitle') }}</h2>
          <p class="mt-4 text-sm leading-7 text-zinc-400">{{ t('home.whyIntro') }}</p>
        </div>
        <div class="grid gap-3 md:grid-cols-3">
          <article v-for="card in whyCards" :key="card.title" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <h3 class="text-base font-semibold text-white">{{ card.title }}</h3>
            <p class="mt-3 text-sm leading-6 text-zinc-400">{{ card.description }}</p>
          </article>
        </div>
      </section>

      <section class="border-t border-white/10 py-8">
        <div class="grid gap-5 rounded-lg border border-cyan-300/20 bg-zinc-900/80 p-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <p class="text-sm font-semibold text-cyan-300">{{ t('home.antiAbuseEyebrow') }}</p>
            <h2 class="mt-2 text-3xl font-semibold text-white">{{ t('home.antiAbuseTitle') }}</h2>
            <p class="mt-4 text-sm leading-7 text-zinc-400">{{ t('home.antiAbuseIntro') }}</p>
            <RouterLink class="mt-5 inline-flex rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/algorithm">
              {{ t('home.manualAntiAbuseCta') }}
            </RouterLink>
          </div>
          <div class="grid gap-3 md:grid-cols-2">
            <article v-for="card in antiAbuseCards" :key="card.title" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <h3 class="text-sm font-semibold text-white">{{ card.title }}</h3>
              <p class="mt-2 text-sm leading-6 text-zinc-400">{{ card.description }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="grid gap-5 border-t border-white/10 py-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <p class="text-sm font-semibold text-cyan-300">{{ t('home.trustFormulaEyebrow') }}</p>
          <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('home.trustFormulaTitle') }}</h2>
          <p class="mt-3 text-sm leading-7 text-zinc-400">{{ t('home.trustFormulaIntro') }}</p>
          <div class="mt-4 rounded-lg border border-cyan-300/30 bg-cyan-300/[0.06] p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{{ t('home.trustFormulaLabel') }}</p>
            <p class="mt-2 text-lg font-semibold text-white">{{ t('home.trustFormulaEquation') }}</p>
          </div>
        </div>
        <div class="grid gap-3">
          <article v-for="item in trustFormulaCards" :key="item.label" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <h3 class="text-sm font-semibold text-white">{{ item.label }}</h3>
            <p class="mt-2 text-sm leading-6 text-zinc-400">{{ item.value }}</p>
          </article>
        </div>
      </section>

      <section class="grid gap-5 border-t border-white/10 py-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <div>
          <p class="text-sm font-semibold text-red-300">{{ t('home.youtubeEyebrow') }}</p>
          <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('home.youtubeTitle') }}</h2>
          <p class="mt-3 text-sm leading-6 text-zinc-400">{{ t('home.youtubeDesc') }}</p>
          <div class="mt-4 flex flex-wrap gap-2 text-xs text-zinc-300">
            <span class="rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1 text-red-100">{{ t('home.youtubePointChip') }}</span>
            <span class="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{{ t('home.youtubePointEvidence') }}</span>
            <span class="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">{{ t('home.youtubePointChannel') }}</span>
          </div>
        </div>
        <div class="rounded-lg border border-white/10 bg-zinc-900/80 p-4">
          <div class="aspect-video rounded-md border border-white/10 bg-zinc-950 p-3">
            <div class="flex h-full items-center justify-center rounded bg-black">
              <div class="flex h-14 w-20 items-center justify-center rounded-xl bg-red-600 text-lg font-semibold text-white">▶</div>
            </div>
          </div>
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <span class="inline-flex max-w-full items-center gap-2 rounded-full border border-red-300/40 bg-zinc-950 px-3 py-2 text-xs font-semibold text-white">
              <span class="text-red-300">TruthShield</span>
              <span class="truncate">{{ t('home.youtubeChipExample') }}</span>
            </span>
            <RouterLink class="rounded-md border border-cyan-300/40 px-3 py-2 text-xs font-semibold text-cyan-100" to="/extension-install">
              {{ t('home.installExtensionCta') }}
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="border-t border-white/10 py-8">
        <div class="grid gap-5 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p class="text-sm font-semibold text-cyan-300">{{ t('communityTasks.eyebrow') }}</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('home.communityMissionTitle') }}</h2>
            <p class="mt-3 text-sm leading-6 text-zinc-400">{{ t('home.communityMissionDesc') }}</p>
            <RouterLink class="mt-4 inline-flex rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" to="/community-tasks">
              {{ t('common.communityTasks') }}
            </RouterLink>
          </div>
          <div class="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
            <div v-for="card in communityCards" :key="card.label" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <p class="text-xs text-zinc-500">{{ card.label }}</p>
              <p class="mt-1 text-2xl font-semibold text-white">{{ card.value }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="border-t border-white/10 py-8">
        <div class="grid gap-6 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div>
            <p class="text-sm font-semibold text-cyan-300">{{ t('home.demoEyebrow') }}</p>
            <h2 class="mt-2 text-3xl font-semibold text-white">{{ t('home.demoTitle') }}</h2>
            <p class="mt-4 text-sm leading-7 text-zinc-300">{{ t('home.demoIntro') }}</p>
            <div class="mt-5 flex flex-wrap gap-3">
              <RouterLink class="rounded-md bg-cyan-300 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-200" to="/demo-news">
                {{ t('home.demoNewsCta') }}
              </RouterLink>
              <RouterLink class="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-zinc-100 hover:border-cyan-300/60 hover:text-cyan-100" to="/user-guide">
                {{ t('home.manualGuideCta') }}
              </RouterLink>
            </div>
          </div>
          <div class="relative rounded-lg border border-white/10 bg-zinc-950 p-4">
            <div class="rounded-md border border-white/10 bg-zinc-900 p-4">
              <div class="mb-3 flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <span class="text-sm font-semibold text-cyan-200">TruthShield</span>
                <span class="rounded bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-100">{{ t('home.tagExample') }}</span>
              </div>
              <p class="text-xs text-zinc-500">{{ t('home.demoArticleLabel') }}</p>
              <h3 class="mt-2 text-xl font-semibold text-white">{{ t('home.demoArticleTitle') }}</h3>
              <p class="mt-3 text-sm leading-6 text-zinc-400">{{ t('home.demoArticleExcerpt') }}</p>
              <div class="mt-4 inline-flex rounded-md border border-cyan-300/40 px-3 py-2 text-sm font-semibold text-cyan-100">
                {{ t('home.demoRightClickHint') }}
              </div>
            </div>
            <div class="absolute -right-2 top-8 hidden w-72 rounded-lg border border-red-300/30 bg-black p-4 shadow-2xl shadow-red-950/40 md:block">
              <div class="flex items-center justify-between">
                <span class="text-sm font-semibold text-cyan-200">TruthShield</span>
                <span class="text-xs text-zinc-500">{{ t('home.extensionTooltipLive') }}</span>
              </div>
              <p class="mt-3 text-sm font-semibold text-white">{{ t('home.extensionTooltipExample') }}</p>
              <p class="mt-1 text-xs text-zinc-400">{{ t('home.extensionTooltipHint') }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="border-t border-white/10 py-8">
        <div class="max-w-2xl">
          <p class="text-sm font-semibold text-cyan-300">{{ t('home.firstUseEyebrow') }}</p>
          <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('home.firstUseTitle') }}</h2>
          <p class="mt-3 text-sm leading-7 text-zinc-400">{{ t('home.firstUseIntro') }}</p>
        </div>
        <div class="mt-5 grid gap-3 md:grid-cols-3">
          <article v-for="step in firstUseSteps" :key="step.number" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <div class="text-sm font-semibold text-cyan-300">{{ step.number }}</div>
            <h3 class="mt-3 text-base font-semibold text-white">{{ step.title }}</h3>
            <p class="mt-3 text-sm leading-6 text-zinc-400">{{ step.description }}</p>
            <RouterLink class="mt-4 inline-flex rounded-md border border-cyan-300/40 px-3 py-2 text-xs font-semibold text-cyan-100" :to="step.to">
              {{ step.cta }}
            </RouterLink>
          </article>
        </div>
      </section>

      <section class="border-t border-white/10 py-8">
        <div class="max-w-2xl">
          <p class="text-sm font-semibold text-cyan-300">{{ t('home.howItWorksEyebrow') }}</p>
          <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('home.howItWorksTitle') }}</h2>
        </div>
        <div class="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <article v-for="step in missionSteps" :key="step.number" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <div class="text-sm font-semibold text-cyan-300">{{ step.number }}</div>
            <h3 class="mt-3 text-base font-semibold text-white">{{ step.title }}</h3>
            <p class="mt-3 text-sm leading-6 text-zinc-400">{{ step.description }}</p>
          </article>
        </div>
      </section>

      <section class="grid gap-6 border-t border-white/10 py-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        <div>
          <p class="text-sm font-semibold text-cyan-300">{{ t('home.pledgeEyebrow') }}</p>
          <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('home.pledgeTitle') }}</h2>
          <p class="mt-4 text-sm leading-6 text-zinc-400">{{ t('home.pledgeIntro') }}</p>
        </div>
        <div class="grid gap-3">
          <article v-for="pledge in pledges" :key="pledge.title" class="rounded-lg border border-white/10 bg-zinc-900/70 p-5">
            <h3 class="text-base font-semibold text-white">{{ pledge.title }}</h3>
            <p class="mt-2 text-sm leading-6 text-zinc-400">{{ pledge.description }}</p>
          </article>
        </div>
      </section>

      <section class="grid gap-4 border-t border-white/10 py-8 lg:grid-cols-2">
        <article class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 class="text-xl font-semibold text-white">{{ t('home.evidenceReminderTitle') }}</h2>
          <p class="mt-3 text-sm leading-6 text-zinc-400">{{ t('home.evidenceReminderDesc') }}</p>
          <RouterLink class="mt-4 inline-flex rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/evidence-library">
            {{ t('common.evidenceLibrary') }}
          </RouterLink>
        </article>
        <article class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 class="text-xl font-semibold text-white">{{ t('home.noCensorshipTitle') }}</h2>
          <p class="mt-3 text-sm leading-6 text-zinc-400">{{ t('home.noCensorshipDesc') }}</p>
          <RouterLink class="mt-4 inline-flex rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/platform-rules">
            {{ t('common.platformRules') }}
          </RouterLink>
        </article>
      </section>

      <section class="border-t border-white/10 py-8">
        <div class="grid gap-5 rounded-lg border border-white/10 bg-white/[0.03] p-5 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
          <div>
            <p class="text-sm font-semibold text-cyan-300">{{ t('home.presenterEyebrow') }}</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('home.presenterTitle') }}</h2>
            <p class="mt-3 text-sm leading-7 text-zinc-400">{{ t('home.presenterIntro') }}</p>
          </div>
          <div class="grid gap-3 md:grid-cols-3">
            <RouterLink
              v-for="link in presenterLinks"
              :key="link.to"
              class="rounded-lg border border-white/10 bg-zinc-950/70 p-4 hover:border-cyan-300/60"
              :to="link.to"
            >
              <h3 class="text-sm font-semibold text-white">{{ link.label }}</h3>
              <p class="mt-2 text-xs leading-5 text-zinc-400">{{ link.description }}</p>
            </RouterLink>
          </div>
        </div>
      </section>

      <section class="border-t border-white/10 py-8">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-sm font-semibold text-cyan-300">{{ t('home.exploreEyebrow') }}</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('home.exploreTitle') }}</h2>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{{ t('home.exploreIntro') }}</p>
          </div>
        </div>
        <div class="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <RouterLink
            v-for="link in primaryLinks"
            :key="link.to"
            class="group rounded-lg border border-white/10 bg-white/[0.03] p-5 hover:border-cyan-300/60 hover:bg-cyan-300/[0.06]"
            :to="link.to"
          >
            <div class="flex items-center justify-between gap-4">
              <span class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-300/10 text-xs font-semibold text-cyan-100">{{ link.mark }}</span>
              <span class="text-lg text-cyan-200">→</span>
            </div>
            <div class="mt-4">
              <h3 class="text-base font-semibold text-white">{{ link.label }}</h3>
              <p class="mt-3 text-sm leading-6 text-zinc-400 group-hover:text-zinc-300">{{ link.description }}</p>
            </div>
          </RouterLink>
        </div>
      </section>

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
        <RouterLink class="hover:text-cyan-100" to="/user-guide">{{ t('common.userGuide') }}</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/terms">{{ t('common.terms') }}</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/data-processing-policy">{{ t('common.dataProcessingPolicy') }}</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/official-response-policy">{{ t('common.officialResponsePolicy') }}</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/security">{{ t('common.security') }}</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/bug-report">{{ t('common.bugReport') }}</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/governance">{{ t('common.governance') }}</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/platform-rules">{{ t('common.platformRules') }}</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/label-guide">{{ t('common.labelGuide') }}</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/vision-readiness">{{ t('common.visionReadiness') }}</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/donate">{{ t('common.donate') }}</RouterLink>
        <a
          v-for="link in githubLinks"
          :key="link.href"
          class="hover:text-cyan-100"
          :href="link.href"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ link.label }}
        </a>
      </footer>
    </section>
  </main>
</template>
