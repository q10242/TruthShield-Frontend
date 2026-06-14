<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchCommunityTaskStats, fetchDonationConfig, fetchDonationSummary, fetchEvents, fetchPublicCommunityMetrics } from '../lib/api'
import { trackPageView } from '../lib/traffic'
import { useI18n } from '../i18n'

const TOKEN_KEY = 'truthshield_api_token'
const USER_KEY = 'truthshield_user'
const CHROME_WEB_STORE_URL = 'https://chromewebstore.google.com/detail/truthshield/liobfmdknkkpbpogdfefmglpgcijmkfk'
const SAFARI_SOURCE_ZIP_URL = '/truthshield-safari-extension-source.zip'
const FACEBOOK_PAGE_URL = 'https://www.facebook.com/profile.php?id=61590569198089'
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const user = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))
const communityStats = ref(null)
const communityMetrics = ref(null)
const communityMetricsLoaded = ref(false)
const featuredEvents = ref([])
const donationSummary = ref(null)
const donationPurposes = ref([])
const homeNavOpen = ref(false)
const { t, locale } = useI18n()
const zh = computed(() => locale.value !== 'en')

const primaryLinks = computed(() => [
  { to: '/demo-news', label: t('common.demoNews'), description: t('home.demoNewsDesc'), mark: '00' },
  { to: '/user-guide', label: t('common.userGuide'), description: t('home.userGuideDesc'), mark: '01' },
  { to: '/extension-install', label: t('common.extensionInstall'), description: t('home.extensionInstallDesc'), mark: '02' },
  { to: '/mobile', label: t('common.mobile'), description: t('home.mobileDesc'), mark: '03' },
  { to: '/news-search', label: t('common.newsSearch'), description: t('home.newsSearchDesc'), mark: '04' },
  { to: '/events', label: t('common.events'), description: t('home.eventsDesc'), mark: '05' },
  { to: '/community-tasks', label: t('common.communityTasks'), description: t('home.communityTasksDesc'), mark: '06' },
  { to: '/evidence-library', label: t('common.evidenceLibrary'), description: t('home.evidenceLibraryDesc'), mark: '07' },
  { to: '/transparency', label: t('common.transparency'), description: t('home.transparencyDesc'), mark: '08' },
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
  { to: '/extension-install', label: t('common.extensionInstall') },
  { to: '/demo-news', label: t('common.demoNews') },
  { to: '/news-search', label: t('common.newsSearch') },
  { to: '/events', label: t('common.events') },
  { to: '/stats/media', label: zh.value ? '媒體統計' : 'Media stats' },
  { to: '/stats/journalists', label: zh.value ? '記者統計' : 'Journalist stats' },
  { to: '/community-tasks', label: t('common.communityTasks') },
  { to: '/evidence-library', label: t('common.evidenceLibrary') },
  { to: '/user-guide', label: t('common.userGuide') },
  { to: '/mobile', label: t('common.mobile') },
  { to: '/profile', label: t('common.profile') },
  { to: '/global-entities', label: zh.value ? '人物/組織' : 'Entities' },
  { to: '/trust-leaderboard', label: t('common.trustLeaderboard') },
  { to: '/moderation-events', label: t('common.moderationEvents') },
  { to: '/extension-coverage', label: t('common.extensionCoverage') },
  { to: '/account-graph', label: t('common.accountGraph') },
  { to: '/transparency', label: t('common.transparency') },
  { to: '/vision-readiness', label: t('common.visionReadiness') },
  { to: '/platform-rules', label: t('common.platformRules') },
  { to: '/label-guide', label: t('common.labelGuide') },
  { to: '/donate', label: t('common.donate') },
  { to: '/algorithm', label: t('common.algorithm') },
  { to: '/api-docs', label: t('common.apiDocs') },
])

const topNavLinks = computed(() => secondaryLinks.value.slice(0, 6))
const moreNavLinks = computed(() => secondaryLinks.value.slice(6))

const githubLinks = computed(() => [
  { href: 'https://github.com/q10242/TruthShield-Frontend', label: t('common.githubFrontend') },
  { href: 'https://github.com/q10242/TruthShield-Backend', label: t('common.githubBackend') },
])

const navGroups = computed(() => [
  { title: t('home.readerGroup'), links: secondaryLinks.value.slice(0, 3) },
  { title: t('home.reviewerGroup'), links: secondaryLinks.value.slice(3, 6) },
  { title: t('home.opsGroup'), links: secondaryLinks.value.slice(6) },
])

const chromeLogoClass = 'relative inline-flex h-5 w-5 shrink-0 overflow-hidden rounded-full bg-white'
const safariLogoClass = 'relative inline-flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full border border-sky-100/80 bg-[radial-gradient(circle_at_center,#f8fafc_0_33%,#38bdf8_34%_100%)] text-[9px] font-bold text-sky-950'

const missionStats = computed(() => [
  { value: '72h', label: t('home.missionStatWindow'), description: t('home.missionStatWindowDesc') },
  { value: t('home.missionStatOnePersonValue'), label: t('home.missionStatOnePerson'), description: t('home.missionStatOnePersonDesc') },
  { value: t('home.missionStatOpenValue'), label: t('home.missionStatOpen'), description: t('home.missionStatOpenDesc') },
])

const eventShowcaseText = computed(() => ({
  eyebrow: zh.value ? '正在整理的事件' : 'Live event context',
  title: zh.value ? '先看事件脈絡，再看單篇新聞' : 'Start with the event, then inspect each article',
  intro: zh.value
    ? 'TruthShield 把新聞、證據、時間線、脈絡需求與治理紀錄收斂到同一個事件頁，讓脈絡比標題更早出現。'
    : 'TruthShield groups articles, evidence, timelines, reader reactions, and governance logs into event pages so context appears before a headline takes over.',
  fallbackSummary: zh.value ? '整理公開新聞、證據與後續進展。' : 'Public articles, evidence, and follow-up status are being organized.',
  openEvent: zh.value ? '查看事件' : 'Open event',
  allEvents: zh.value ? '看全部事件' : 'View all events',
  items: zh.value ? '資料' : 'Items',
  timeline: zh.value ? '時間線' : 'Timeline',
  views: zh.value ? '瀏覽' : 'Views',
  latest: zh.value ? '最近更新' : 'Recently updated',
}))

const fallbackFeaturedEvents = computed(() => [
  {
    name: zh.value ? '愷愷案與兒少保護修法' : 'Kai-Kai case and child protection reform',
    summary: zh.value
      ? '整理案件前因、司法程序、社福制度漏洞與後續修法結果。'
      : 'A timeline of the case, court process, child welfare gaps, and legislative follow-up.',
    primary_category_label: zh.value ? '社會案件' : 'Social case',
    progress_status_label: zh.value ? '已定案' : 'Resolved',
    tag_labels: zh.value ? ['兒少', '修法', '司法案件'] : ['Children', 'Law reform', 'Legal case'],
    counts: { items: 0, timeline: 0 },
    view_count: 0,
  },
  {
    name: zh.value ? '依托咪酯電子煙與毒駕管制爭議' : 'Etomidate vape and impaired-driving regulation',
    summary: zh.value
      ? '追蹤管制、執法、交通安全與社會風險的公開資料。'
      : 'Tracking public sources on regulation, enforcement, traffic safety, and social risk.',
    primary_category_label: zh.value ? '公共政策' : 'Public policy',
    progress_status_label: zh.value ? '持續追蹤' : 'Tracking',
    tag_labels: zh.value ? ['交通', '修法', '公衛醫療'] : ['Traffic', 'Law reform', 'Public health'],
    counts: { items: 0, timeline: 0 },
    view_count: 0,
  },
  {
    name: zh.value ? '能源政策與核電再運轉審查' : 'Energy policy and nuclear restart review',
    summary: zh.value
      ? '彙整審查程序、核安、供電、核廢與地方回應。'
      : 'Collecting review process, nuclear safety, power supply, waste, and local responses.',
    primary_category_label: zh.value ? '公共政策' : 'Public policy',
    progress_status_label: zh.value ? '持續追蹤' : 'Tracking',
    tag_labels: zh.value ? ['能源', '環境', '平台治理'] : ['Energy', 'Environment', 'Governance'],
    counts: { items: 0, timeline: 0 },
    view_count: 0,
  },
])

const visibleFeaturedEvents = computed(() => {
  const events = featuredEvents.value.length ? featuredEvents.value : fallbackFeaturedEvents.value
  return events.slice(0, 3)
})

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

const communityProgressCards = computed(() => [
  { value: communityMetrics.value?.registered_users_total ?? 0, label: t('home.communityProgressUsers') },
  { value: communityMetrics.value?.active_registered_users_30d ?? 0, label: t('home.communityProgressActive') },
  { value: communityMetrics.value?.active_extension_clients_7d ?? 0, label: t('home.communityProgressExtensionClients') },
  { value: communityMetrics.value?.content_totals?.evidence ?? 0, label: t('home.communityProgressEvidence') },
])

const supportGoal = computed(() => {
  const purposes = donationPurposes.value.length ? donationPurposes.value : [
    {
      key: 'operations_ai',
      label: zh.value ? '伺服器與 AI 營運' : 'Server and AI operations',
      label_en: 'Server and AI operations',
      description: zh.value ? '含金流手續費；達標代表這期營運有社群支持。' : 'Includes payment processing fees; reaching the goal means this round is community-supported.',
      description_en: 'Includes payment processing fees; reaching the goal means this round is community-supported.',
      target_amount: 8000,
      period: 'monthly',
    },
  ]
  const purpose = purposes.find((item) => item.key === 'operations_ai') || purposes[0]
  const row = (donationSummary.value?.purpose_breakdown || []).find((item) => item.purpose === purpose.key) || {}
  const current = purpose.period === 'monthly' ? Number(row.month_amount || 0) : Number(row.amount || 0)
  const target = Number(purpose.target_amount || 0)

  return {
    label: zh.value ? purpose.label : (purpose.label_en || purpose.label),
    description: zh.value ? purpose.description : (purpose.description_en || purpose.description),
    current,
    target,
    progress: target ? Math.min(100, Math.round((current / target) * 100)) : 0,
  }
})

const presenterLinks = computed(() => [
  { to: '/demo-news', label: t('common.demoNews'), description: t('home.presenterDemoDesc') },
  { to: '/user-guide', label: t('common.userGuide'), description: t('home.presenterGuideDesc') },
  { to: '/transparency', label: t('common.transparency'), description: t('home.presenterTransparencyDesc') },
])

function shuffleEvents(events) {
  const shuffled = [...events]
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]]
  }
  return shuffled
}

function eventSummary(event) {
  const summary = String(event.summary || '').split('\n').find((line) => line.trim())
  return summary || eventShowcaseText.value.fallbackSummary
}

function eventLink(event) {
  return event.id ? `/events/${event.id}` : '/events'
}

function eventTabLink(event, tab = '') {
  if (!event.id) return '/events'
  return tab ? { path: `/events/${event.id}`, query: { tab } } : `/events/${event.id}`
}

function eventMetric(event, key) {
  return Number(event.counts?.[key] ?? 0).toLocaleString()
}

function closeHomeNav() {
  homeNavOpen.value = false
}

onMounted(async () => {
  trackPageView('home')
  const [statsPayload, metricsPayload, eventsPayload, donationConfigPayload, donationSummaryPayload] = await Promise.all([
    fetchCommunityTaskStats().catch(() => null),
    fetchPublicCommunityMetrics().catch(() => null),
    fetchEvents({ per_page: 18, sort: 'updated' }).catch(() => null),
    fetchDonationConfig().catch(() => null),
    fetchDonationSummary().catch(() => null),
  ])
  communityStats.value = statsPayload
  communityMetrics.value = metricsPayload
  communityMetricsLoaded.value = true
  featuredEvents.value = shuffleEvents(eventsPayload?.data || []).slice(0, 3)
  donationPurposes.value = donationConfigPayload?.purposes || []
  donationSummary.value = donationSummaryPayload
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
            v-for="link in topNavLinks"
            :key="link.to"
            class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100"
            :to="link.to"
          >
            {{ link.label }}
          </RouterLink>
          <RouterLink
            class="rounded-md bg-emerald-300 px-3 py-2 text-sm font-semibold text-zinc-950 hover:bg-emerald-200"
            to="/donate"
          >
            {{ t('common.donate') }}
          </RouterLink>
          <div class="relative">
            <button
              class="flex items-center gap-1 rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100"
              :class="homeNavOpen ? 'border-cyan-300/60 text-cyan-100' : ''"
              type="button"
              @click="homeNavOpen = !homeNavOpen"
            >
              {{ zh ? '更多' : 'More' }}
              <svg class="h-3 w-3 transition-transform" :class="homeNavOpen ? 'rotate-180' : ''" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 8L1 3h10L6 8z" />
              </svg>
            </button>
            <div v-if="homeNavOpen" class="absolute right-0 top-full z-50 mt-2 grid w-64 gap-1 rounded-lg border border-white/10 bg-zinc-900 p-1 shadow-2xl">
              <div class="fixed inset-0 -z-10" @click="closeHomeNav" />
              <RouterLink
                v-for="link in moreNavLinks"
                :key="link.to"
                class="rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-cyan-100"
                :to="link.to"
                @click="closeHomeNav"
              >
                {{ link.label }}
              </RouterLink>
            </div>
          </div>
          <a
            class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100"
            href="https://www.otus.tw/"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ t('common.companyWebsite') }}
          </a>
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
            <a
              class="inline-flex items-center gap-2 rounded-md border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100 hover:border-amber-200"
              :href="CHROME_WEB_STORE_URL"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span :class="chromeLogoClass" aria-hidden="true">
                <span class="absolute inset-0 bg-[conic-gradient(#e43d30_0_33%,#f6c443_0_66%,#26a65b_0_83%,#e43d30_0)]"></span>
                <span class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-blue-500"></span>
              </span>
              {{ t('home.installChromeCta') }}
            </a>
            <a
              class="inline-flex items-center gap-2 rounded-md border border-sky-300/40 bg-sky-300/10 px-4 py-3 text-sm font-semibold text-sky-100 hover:border-sky-200"
              :href="SAFARI_SOURCE_ZIP_URL"
              download
            >
              <span :class="safariLogoClass" aria-hidden="true">
                <span class="absolute h-3.5 w-0.5 rotate-45 rounded-full bg-red-500"></span>
                <span class="absolute h-3.5 w-0.5 -rotate-45 rounded-full bg-sky-700"></span>
                <span class="relative h-1.5 w-1.5 rounded-full bg-white"></span>
              </span>
              {{ t('home.installSafariCta') }}
            </a>
            <RouterLink class="rounded-md border border-emerald-300/50 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-100 hover:border-emerald-200" to="/donate">
              {{ t('common.donate') }}
            </RouterLink>
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-400">
            <RouterLink class="hover:text-cyan-100" to="/user-guide">{{ t('home.manualGuideCta') }}</RouterLink>
            <RouterLink class="hover:text-cyan-100" to="/mobile">{{ t('common.mobile') }}</RouterLink>
            <RouterLink class="hover:text-cyan-100" to="/news-search">{{ t('home.primaryCta') }}</RouterLink>
            <RouterLink class="hover:text-cyan-100" :to="token ? '/profile' : '/login'">{{ t('home.secondaryCta') }}</RouterLink>
            <RouterLink class="hover:text-cyan-100" to="/evidence-library">{{ t('home.thirdCta') }}</RouterLink>
          </div>

          <div class="rounded-lg border border-amber-300/30 bg-amber-300/10 p-4">
            <p class="text-sm font-semibold text-amber-100">{{ t('home.extensionReviewTitle') }}</p>
            <p class="mt-2 text-sm leading-6 text-amber-50/80">{{ t('home.extensionReviewDesc') }}</p>
            <div class="mt-3 flex flex-wrap gap-2">
              <RouterLink class="rounded-md bg-amber-200 px-3 py-2 text-xs font-semibold text-zinc-950" to="/demo-news">
                {{ t('home.demoNewsCta') }}
              </RouterLink>
              <a
                class="inline-flex items-center gap-2 rounded-md border border-amber-200/40 bg-zinc-950/30 px-3 py-2 text-xs font-semibold text-amber-100 hover:border-amber-200"
                :href="CHROME_WEB_STORE_URL"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span :class="chromeLogoClass" aria-hidden="true">
                  <span class="absolute inset-0 bg-[conic-gradient(#e43d30_0_33%,#f6c443_0_66%,#26a65b_0_83%,#e43d30_0)]"></span>
                  <span class="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-blue-500"></span>
                </span>
                {{ t('home.installChromeCta') }}
              </a>
              <RouterLink
                class="inline-flex items-center gap-2 rounded-md border border-orange-200/40 bg-orange-400/10 px-3 py-2 text-xs font-semibold text-orange-100 hover:border-orange-200"
                to="/extension-install"
              >
                <span class="relative inline-flex h-5 w-5 shrink-0 overflow-hidden rounded-full bg-purple-900">
                  <span class="absolute inset-0 bg-[radial-gradient(circle_at_68%_62%,#4f46e5_0_25%,transparent_26%),conic-gradient(from_210deg,#ff7139,#ffb000,#ff7139,#a855f7,#4f46e5,#ff7139)]"></span>
                  <span class="absolute bottom-0.5 left-0.5 right-0.5 top-1.5 rounded-full border-t border-orange-100/60 bg-orange-400/80"></span>
                </span>
                {{ t('home.installFirefoxCta') }}
              </RouterLink>
              <a
                class="inline-flex items-center gap-2 rounded-md border border-sky-200/40 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-100 hover:border-sky-200"
                :href="SAFARI_SOURCE_ZIP_URL"
                download
              >
                <span :class="safariLogoClass" aria-hidden="true">
                  <span class="absolute h-3.5 w-0.5 rotate-45 rounded-full bg-red-500"></span>
                  <span class="absolute h-3.5 w-0.5 -rotate-45 rounded-full bg-sky-700"></span>
                  <span class="relative h-1.5 w-1.5 rounded-full bg-white"></span>
                </span>
                {{ t('home.installSafariCta') }}
              </a>
              <RouterLink class="rounded-md border border-amber-200/30 px-3 py-2 text-xs font-semibold text-amber-100 hover:border-amber-200" to="/extension-install">
                {{ t('home.installGuideCta') }}
              </RouterLink>
            </div>
            <p class="mt-3 text-xs leading-5 text-amber-50/70">{{ t('home.browserInstallNote') }}</p>
          </div>

          <div class="rounded-lg border border-emerald-300/25 bg-emerald-300/[0.07] p-4">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="max-w-2xl">
                <p class="text-sm font-semibold text-emerald-100">{{ t('home.communityProgressTitle') }}</p>
                <p class="mt-2 text-sm leading-6 text-emerald-50/80">{{ t('home.communityProgressDesc') }}</p>
              </div>
              <RouterLink class="rounded-md border border-emerald-200/40 px-3 py-2 text-xs font-semibold text-emerald-100 hover:border-emerald-200" to="/community-tasks">
                {{ t('home.communityProgressCta') }}
              </RouterLink>
            </div>
            <div v-if="communityMetrics" class="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div v-for="card in communityProgressCards" :key="card.label" class="rounded-md border border-emerald-200/15 bg-zinc-950/50 p-3">
                <p class="text-2xl font-semibold text-white">{{ Number(card.value || 0).toLocaleString() }}</p>
                <p class="mt-1 text-xs leading-5 text-emerald-100/75">{{ card.label }}</p>
              </div>
            </div>
            <p v-else class="mt-4 rounded-md border border-emerald-200/15 bg-zinc-950/50 p-3 text-sm text-emerald-50/75">
              {{ communityMetricsLoaded ? t('home.communityProgressUnavailable') : t('common.loading') }}
            </p>
          </div>

          <div class="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="max-w-2xl">
                <p class="text-sm font-semibold text-cyan-100">{{ t('home.supportPromptTitle') }}</p>
                <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('home.supportPromptDesc') }}</p>
              </div>
              <RouterLink class="rounded-md border border-cyan-300/40 px-3 py-2 text-xs font-semibold text-cyan-100 hover:border-cyan-200" to="/donate">
                {{ t('home.supportPromptCta') }}
              </RouterLink>
            </div>
            <div class="mt-4 rounded-md border border-cyan-300/15 bg-zinc-950/50 p-3">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-white">{{ supportGoal.label }}</p>
                  <p class="mt-1 text-xs leading-5 text-zinc-500">{{ supportGoal.description }}</p>
                </div>
                <span class="text-xs font-semibold text-cyan-100">NT$ {{ Number(supportGoal.current || 0).toLocaleString() }} / {{ Number(supportGoal.target || 0).toLocaleString() }}</span>
              </div>
              <div class="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div class="h-full rounded-full bg-cyan-300" :style="{ width: `${supportGoal.progress}%` }"></div>
              </div>
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

        <aside class="rounded-lg border border-cyan-300/20 bg-zinc-900 shadow-2xl shadow-cyan-950/40">
          <div class="border-b border-white/10 p-5">
            <p class="text-sm font-semibold text-cyan-300">{{ eventShowcaseText.eyebrow }}</p>
            <h2 class="mt-2 text-2xl font-semibold leading-tight text-white">{{ eventShowcaseText.title }}</h2>
            <p class="mt-3 text-sm leading-6 text-zinc-400">{{ eventShowcaseText.intro }}</p>
          </div>
          <div class="divide-y divide-white/10">
            <article v-for="event in visibleFeaturedEvents" :key="event.id || event.name" class="p-5">
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <RouterLink v-if="event.primary_category_label" class="rounded-full bg-cyan-300/10 px-2.5 py-1 font-semibold text-cyan-100 hover:bg-cyan-300/20" :to="{ path: '/events', query: { primary_category: event.primary_category } }">{{ event.primary_category_label }}</RouterLink>
                <RouterLink class="rounded-full bg-emerald-300/10 px-2.5 py-1 font-semibold text-emerald-100 hover:bg-emerald-300/20" :to="{ path: '/events', query: { progress_status: event.progress_status || 'collecting' } }">{{ event.progress_status_label || event.progress_status || eventShowcaseText.latest }}</RouterLink>
              </div>
              <RouterLink class="mt-3 block text-base font-semibold leading-6 text-white transition hover:text-cyan-100" :to="eventLink(event)">{{ event.name }}</RouterLink>
              <p class="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{{ eventSummary(event) }}</p>
              <div v-if="event.tag_labels?.length" class="mt-3 flex flex-wrap gap-2 text-xs">
                <RouterLink v-for="(label, index) in event.tag_labels.slice(0, 3)" :key="label" class="rounded-full border border-white/10 px-2.5 py-1 text-zinc-300 hover:border-cyan-300/40 hover:text-cyan-100" :to="{ path: '/events', query: { tag: event.tags?.[index] || label } }">{{ label }}</RouterLink>
              </div>
              <div class="mt-4 grid grid-cols-3 gap-2 text-xs">
                <RouterLink class="rounded-md bg-white/[0.04] p-3 transition hover:bg-cyan-300/10 hover:text-cyan-100" :to="eventTabLink(event, 'news')">
                  <div class="font-semibold text-white">{{ eventMetric(event, 'items') }}</div>
                  <div class="mt-1 text-zinc-500">{{ eventShowcaseText.items }}</div>
                </RouterLink>
                <RouterLink class="rounded-md bg-white/[0.04] p-3 transition hover:bg-cyan-300/10 hover:text-cyan-100" :to="eventTabLink(event, 'timeline')">
                  <div class="font-semibold text-white">{{ eventMetric(event, 'timeline') }}</div>
                  <div class="mt-1 text-zinc-500">{{ eventShowcaseText.timeline }}</div>
                </RouterLink>
                <RouterLink class="rounded-md bg-white/[0.04] p-3 transition hover:bg-cyan-300/10 hover:text-cyan-100" :to="eventTabLink(event)">
                  <div class="font-semibold text-white">{{ Number(event.view_count ?? 0).toLocaleString() }}</div>
                  <div class="mt-1 text-zinc-500">{{ eventShowcaseText.views }}</div>
                </RouterLink>
              </div>
              <RouterLink class="mt-4 inline-flex rounded-md border border-cyan-300/40 px-3 py-2 text-xs font-semibold text-cyan-100 hover:border-cyan-200" :to="eventLink(event)">
                {{ eventShowcaseText.openEvent }}
              </RouterLink>
            </article>
          </div>
          <div class="border-t border-white/10 p-5">
            <RouterLink class="block rounded-md bg-cyan-300 px-4 py-3 text-center text-sm font-semibold text-zinc-950 hover:bg-cyan-200" to="/events">
              {{ eventShowcaseText.allEvents }}
            </RouterLink>
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
        <details class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <summary class="cursor-pointer list-none">
            <p class="text-sm font-semibold text-cyan-300">{{ t('home.exploreEyebrow') }}</p>
            <div class="mt-2 flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-2xl font-semibold text-white">{{ t('home.exploreTitle') }}</h2>
              <span class="rounded-md border border-cyan-300/40 px-3 py-2 text-xs font-semibold text-cyan-100">{{ t('home.exploreOpen') }}</span>
            </div>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">{{ t('home.exploreIntro') }}</p>
          </summary>
          <div class="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <RouterLink
              v-for="link in primaryLinks"
              :key="link.to"
              class="group rounded-lg border border-white/10 bg-zinc-950/70 p-5 hover:border-cyan-300/60 hover:bg-cyan-300/[0.06]"
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
        </details>
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
        <a class="hover:text-cyan-100" :href="FACEBOOK_PAGE_URL" target="_blank" rel="noopener noreferrer">{{ t('common.facebookPage') }}</a>
        <a class="hover:text-cyan-100" href="https://www.otus.tw/" target="_blank" rel="noopener noreferrer">{{ t('common.companyWebsite') }}</a>
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
