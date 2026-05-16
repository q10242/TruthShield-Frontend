<script setup>
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { trackPageView } from '../lib/traffic'
import { currentLocale, useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

const { t } = useI18n()
const zh = currentLocale() !== 'en'

const chapters = computed(() => [
  { id: 'start', title: t('userGuide.chapterStart') },
  { id: 'extension', title: t('userGuide.chapterExtension') },
  { id: 'vote', title: t('userGuide.chapterVote') },
  { id: 'search', title: t('userGuide.chapterSearch') },
  { id: 'events', title: zh ? '事件時間線與關係圖' : 'Event timelines and graphs' },
  { id: 'evidence', title: t('userGuide.chapterEvidence') },
  { id: 'response', title: t('userGuide.chapterResponse') },
  { id: 'trust', title: t('userGuide.chapterTrust') },
  { id: 'community', title: t('userGuide.chapterCommunity') },
  { id: 'feature-map', title: t('userGuide.chapterFeatureMap') },
  { id: 'extension-settings', title: t('userGuide.chapterExtensionSettings') },
  { id: 'help', title: t('userGuide.chapterHelp') },
])

const extensionSurfaces = computed(() => [
  {
    title: t('home.extensionInterfaceContextTitle'),
    description: t('home.extensionInterfaceContextDesc'),
    image: '',
    items: [t('home.extensionContextMenuStatus'), t('home.extensionContextMenuVote'), t('home.extensionContextMenuReport')],
  },
  {
    title: t('home.extensionInterfaceTooltipTitle'),
    description: t('home.extensionInterfaceTooltipDesc'),
    image: '',
    items: [t('userGuide.tooltipPoint1'), t('userGuide.tooltipPoint2'), t('userGuide.tooltipPoint3')],
  },
  {
    title: t('home.extensionInterfaceBannerTitle'),
    description: t('home.extensionInterfaceBannerDesc'),
    image: '/brand/export/chrome-store-screenshots/store-screenshot-01-news-banner-1280x800.png',
    items: [t('userGuide.bannerPoint1'), t('userGuide.bannerPoint2'), t('userGuide.bannerPoint3')],
  },
  {
    title: t('home.extensionInterfacePanelTitle'),
    description: t('home.extensionInterfacePanelDesc'),
    image: '/brand/export/chrome-store-screenshots/store-screenshot-02-vote-panel-1280x800.png',
    items: [t('userGuide.panelPoint1'), t('userGuide.panelPoint2'), t('userGuide.panelPoint3')],
  },
  {
    title: t('home.extensionInterfaceYoutubeTitle'),
    description: t('home.extensionInterfaceYoutubeDesc'),
    image: '/brand/export/chrome-store-screenshots/store-screenshot-03-youtube-badge-1280x800.png',
    items: [t('userGuide.youtubePoint1'), t('userGuide.youtubePoint2'), t('userGuide.youtubePoint3')],
  },
  {
    title: t('home.extensionInterfacePopupTitle'),
    description: t('home.extensionInterfacePopupDesc'),
    image: '',
    items: [t('userGuide.popupPoint1'), t('userGuide.popupPoint2'), t('userGuide.popupPoint3')],
  },
])

const votingSteps = computed(() => [
  { title: t('userGuide.voteStep1Title'), description: t('userGuide.voteStep1Desc') },
  { title: t('userGuide.voteStep2Title'), description: t('userGuide.voteStep2Desc') },
  { title: t('userGuide.voteStep3Title'), description: t('userGuide.voteStep3Desc') },
  { title: t('userGuide.voteStep4Title'), description: t('userGuide.voteStep4Desc') },
])

const evidenceRequirementCards = computed(() => [
  { title: t('userGuide.evidenceRequirementStrongTitle'), description: t('userGuide.evidenceRequirementStrongDesc') },
  { title: t('userGuide.evidenceRequirementContextTitle'), description: t('userGuide.evidenceRequirementContextDesc') },
  { title: t('userGuide.evidenceRequirementDisclosureTitle'), description: t('userGuide.evidenceRequirementDisclosureDesc') },
  { title: t('userGuide.evidenceRequirementPositiveTitle'), description: t('userGuide.evidenceRequirementPositiveDesc') },
])

const trustParts = computed(() => [
  { label: t('home.trustFormulaBase'), value: t('home.trustFormulaBaseValue') },
  { label: t('home.trustFormulaIdentity'), value: t('home.trustFormulaIdentityValue') },
  { label: t('home.trustFormulaAbuse'), value: t('home.trustFormulaAbuseValue') },
])

const antiAbuseRules = computed(() => [
  { title: t('home.manualAntiAbuseIdentityTitle'), description: t('home.manualAntiAbuseIdentityDesc') },
  { title: t('home.manualAntiAbuseReadingTitle'), description: t('home.manualAntiAbuseReadingDesc') },
  { title: t('home.manualAntiAbuseEvidenceTitle'), description: t('home.manualAntiAbuseEvidenceDesc') },
  { title: t('home.manualAntiAbuseVelocityTitle'), description: t('home.manualAntiAbuseVelocityDesc') },
  { title: t('home.manualAntiAbuseFreezeTitle'), description: t('home.manualAntiAbuseFreezeDesc') },
  { title: t('home.manualAntiAbuseAppealTitle'), description: t('home.manualAntiAbuseAppealDesc') },
])

const responseSteps = computed(() => [
  { title: t('home.officialFlowProfileTitle'), description: t('home.officialFlowProfileDesc') },
  { title: t('home.officialFlowReviewTitle'), description: t('home.officialFlowReviewDesc') },
  { title: t('home.officialFlowSubmitTitle'), description: t('home.officialFlowSubmitDesc') },
  { title: t('home.officialFlowPublishTitle'), description: t('home.officialFlowPublishDesc') },
])

const featureGroups = computed(() => [
  {
    title: t('userGuide.featureGroupReaderTitle'),
    description: t('userGuide.featureGroupReaderDesc'),
    links: [
      { to: '/news-search', label: t('common.newsSearch') },
      { to: '/events', label: t('common.events') },
      { to: '/evidence-library', label: t('common.evidenceLibrary') },
      { to: '/ranking', label: t('common.ranking') },
      { to: '/trust-leaderboard', label: t('common.trustLeaderboard') },
    ],
  },
  {
    title: t('userGuide.featureGroupGovernanceTitle'),
    description: t('userGuide.featureGroupGovernanceDesc'),
    links: [
      { to: '/transparency', label: t('common.transparency') },
      { to: '/moderation-events', label: t('common.moderationEvents') },
      { to: '/extension-coverage', label: t('common.extensionCoverage') },
      { to: '/algorithm', label: t('common.algorithm') },
      { to: '/account-graph', label: t('common.accountGraph') },
      { to: '/api-docs', label: t('common.apiDocs') },
    ],
  },
  {
    title: t('userGuide.featureGroupAccountTitle'),
    description: t('userGuide.featureGroupAccountDesc'),
    links: [
      { to: '/profile', label: t('common.profile') },
      { to: '/appeals', label: t('userGuide.appealsLabel') },
      { to: '/data-request', label: t('userGuide.dataRequestLabel') },
      { to: '/donate', label: t('common.donate') },
    ],
  },
  {
    title: t('userGuide.featureGroupPolicyTitle'),
    description: t('userGuide.featureGroupPolicyDesc'),
    links: [
      { to: '/privacy', label: t('common.privacy') },
      { to: '/terms', label: t('common.terms') },
      { to: '/security', label: t('common.security') },
      { to: '/data-processing-policy', label: t('common.dataProcessingPolicy') },
      { to: '/official-response-policy', label: t('common.officialResponsePolicy') },
    ],
  },
])

const extensionSettings = computed(() => [
  { title: t('userGuide.extensionSettingOriginTitle'), description: t('userGuide.extensionSettingOriginDesc') },
  { title: t('userGuide.extensionSettingDisplayTitle'), description: t('userGuide.extensionSettingDisplayDesc') },
  { title: t('userGuide.extensionSettingHealthTitle'), description: t('userGuide.extensionSettingHealthDesc') },
  { title: t('userGuide.extensionSettingBackupTitle'), description: t('userGuide.extensionSettingBackupDesc') },
])

onMounted(() => trackPageView('user_guide'))
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-6xl">
      <AppNav />

      <section class="mt-10 grid gap-6 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <aside class="lg:sticky lg:top-6 lg:self-start">
          <p class="text-sm font-semibold text-cyan-300">{{ t('userGuide.eyebrow') }}</p>
          <h1 class="mt-3 text-4xl font-semibold text-white">{{ t('userGuide.title') }}</h1>
          <p class="mt-4 text-sm leading-7 text-zinc-400">{{ t('userGuide.intro') }}</p>
          <div class="mt-5 flex flex-wrap gap-3">
            <RouterLink class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" to="/extension-install">
              {{ t('common.extensionInstall') }}
            </RouterLink>
            <RouterLink class="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-cyan-300/50" to="/news-search">
              {{ t('common.newsSearch') }}
            </RouterLink>
          </div>
          <nav class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{{ t('userGuide.tableOfContents') }}</p>
            <div class="mt-3 grid gap-1">
              <a v-for="chapter in chapters" :key="chapter.id" class="rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-cyan-300/10 hover:text-cyan-100" :href="`#${chapter.id}`">
                {{ chapter.title }}
              </a>
            </div>
          </nav>
        </aside>

        <div class="space-y-6">
          <section id="start" class="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-5">
            <p class="text-sm font-semibold text-cyan-300">{{ t('userGuide.chapterStart') }}</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('userGuide.startTitle') }}</h2>
            <p class="mt-3 text-sm leading-7 text-zinc-300">{{ t('userGuide.startDesc') }}</p>
            <div class="mt-5 overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
              <img class="w-full border-b border-white/10" src="/brand/export/social-preview-1200x630.png" :alt="t('home.manualImageAlt')" />
              <div class="grid gap-3 p-4 md:grid-cols-3">
                <div class="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <p class="text-sm font-semibold text-white">{{ t('userGuide.audienceReaders') }}</p>
                  <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('userGuide.audienceReadersDesc') }}</p>
                </div>
                <div class="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <p class="text-sm font-semibold text-white">{{ t('userGuide.audienceReviewers') }}</p>
                  <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('userGuide.audienceReviewersDesc') }}</p>
                </div>
                <div class="rounded-md border border-white/10 bg-white/[0.03] p-3">
                  <p class="text-sm font-semibold text-white">{{ t('userGuide.audienceSubjects') }}</p>
                  <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('userGuide.audienceSubjectsDesc') }}</p>
                </div>
              </div>
            </div>
          </section>

          <section id="extension" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <p class="text-sm font-semibold text-cyan-300">{{ t('userGuide.chapterExtension') }}</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('userGuide.extensionTitle') }}</h2>
            <p class="mt-3 text-sm leading-7 text-zinc-400">{{ t('userGuide.extensionDesc') }}</p>
            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <article v-for="surface in extensionSurfaces" :key="surface.title" class="overflow-hidden rounded-lg border border-white/10 bg-zinc-950">
                <img v-if="surface.image" class="aspect-[16/10] w-full border-b border-white/10 object-cover object-top" :src="surface.image" :alt="surface.title" loading="lazy" />
                <div v-else class="border-b border-white/10 bg-zinc-900 p-4">
                  <div class="rounded-md border border-white/10 bg-black/50 p-3">
                    <div v-for="item in surface.items" :key="item" class="rounded px-2 py-1 text-sm text-zinc-200 hover:bg-cyan-300/10">{{ item }}</div>
                  </div>
                </div>
                <div class="p-4">
                  <h3 class="text-base font-semibold text-white">{{ surface.title }}</h3>
                  <p class="mt-2 text-sm leading-6 text-zinc-400">{{ surface.description }}</p>
                  <ul class="mt-3 space-y-1 text-sm leading-6 text-zinc-400">
                    <li v-for="item in surface.items" :key="item">• {{ item }}</li>
                  </ul>
                </div>
              </article>
            </div>
          </section>

          <section id="vote" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <p class="text-sm font-semibold text-cyan-300">{{ t('userGuide.chapterVote') }}</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('userGuide.voteTitle') }}</h2>
            <p class="mt-3 text-sm leading-7 text-zinc-400">{{ t('userGuide.voteDesc') }}</p>
            <div class="mt-5 grid gap-3 md:grid-cols-4">
              <article v-for="(step, index) in votingSteps" :key="step.title" class="rounded-md border border-white/10 bg-zinc-950 p-4">
                <span class="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-300 text-sm font-semibold text-zinc-950">{{ index + 1 }}</span>
                <h3 class="mt-3 text-sm font-semibold text-white">{{ step.title }}</h3>
                <p class="mt-2 text-sm leading-6 text-zinc-400">{{ step.description }}</p>
              </article>
            </div>
            <div class="mt-5 rounded-lg border border-amber-300/20 bg-amber-300/[0.06] p-4">
              <h3 class="text-sm font-semibold text-amber-100">{{ t('userGuide.evidenceRequirementTitle') }}</h3>
              <p class="mt-2 text-sm leading-6 text-amber-50/80">{{ t('userGuide.evidenceRequirementIntro') }}</p>
              <div class="mt-4 grid gap-3 md:grid-cols-2">
                <article v-for="item in evidenceRequirementCards" :key="item.title" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
                  <h4 class="text-sm font-semibold text-white">{{ item.title }}</h4>
                  <p class="mt-2 text-sm leading-6 text-zinc-400">{{ item.description }}</p>
                </article>
              </div>
            </div>
          </section>

          <section id="search" class="grid gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div>
              <p class="text-sm font-semibold text-cyan-300">{{ t('userGuide.chapterSearch') }}</p>
              <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('userGuide.searchTitle') }}</h2>
              <p class="mt-3 text-sm leading-7 text-zinc-400">{{ t('userGuide.searchDesc') }}</p>
              <RouterLink class="mt-4 inline-flex rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/news-search">
                {{ t('common.newsSearch') }}
              </RouterLink>
            </div>
            <img class="rounded-lg border border-white/10 object-cover object-top" src="/brand/export/manual-screenshots/manual-news-search.png" :alt="t('home.manualScreenshotSearchAlt')" loading="lazy" />
          </section>

          <section id="events" class="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-5">
            <p class="text-sm font-semibold text-cyan-300">{{ zh ? '事件時間線與關係圖' : 'Event timelines and relationship graphs' }}</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">{{ zh ? '把零散新聞整理成同一個事件脈絡' : 'Turn scattered articles into one shared event context' }}</h2>
            <p class="mt-3 text-sm leading-7 text-zinc-300">
              {{ zh
                ? '當一件事被多家媒體連續報導時，使用者可以從新聞頁或新聞連結右鍵 Pin 到事件時間線或人物/組織關係圖。時間線記錄「何時發生什麼」，關係圖記錄「誰與誰有什麼關係」，每一筆新增、編輯、刪除、合併與拖曳位置都會留下編輯紀錄。'
                : 'When multiple outlets cover the same issue, users can right-click an article or link and pin it to an event timeline or people/organization graph. Timelines record what happened and when; graphs record who is connected to whom. Every add, edit, delete, merge, and position change leaves an edit log.' }}
            </p>
            <div class="mt-5 grid gap-3 md:grid-cols-3">
              <article class="rounded-md border border-white/10 bg-zinc-950 p-4">
                <h3 class="text-sm font-semibold text-white">{{ zh ? '右鍵 Pin' : 'Right-click pinning' }}</h3>
                <p class="mt-2 text-sm leading-6 text-zinc-400">{{ zh ? '在新聞頁或新聞連結上選擇 Pin 到時間線 / 關係圖，側邊表單會帶入目前新聞 URL。' : 'Use the context menu on an article page or link; the side panel pre-fills the current article URL.' }}</p>
              </article>
              <article class="rounded-md border border-white/10 bg-zinc-950 p-4">
                <h3 class="text-sm font-semibold text-white">{{ zh ? '關係圖可匯出' : 'Graph export' }}</h3>
                <p class="mt-2 text-sm leading-6 text-zinc-400">{{ zh ? '關係圖有方向箭頭、線上標示、節點拖曳、PNG/JPEG 下載，方便社群討論與報告引用。' : 'Graphs include directional arrows, labels on lines, draggable nodes, and PNG/JPEG export for community discussion and reports.' }}</p>
              </article>
              <article class="rounded-md border border-white/10 bg-zinc-950 p-4">
                <h3 class="text-sm font-semibold text-white">{{ zh ? '公開編輯紀錄' : 'Public edit logs' }}</h3>
                <p class="mt-2 text-sm leading-6 text-zinc-400">{{ zh ? '使用者可以閱讀事件頁的編輯紀錄，確認誰新增、修改、刪除或合併了資料。' : 'Readers can inspect event edit logs to see who added, changed, deleted, or merged data.' }}</p>
              </article>
            </div>
            <RouterLink class="mt-5 inline-flex rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/events">
              {{ zh ? '查看事件脈絡' : 'Browse events' }}
            </RouterLink>
          </section>

          <section id="evidence" class="grid gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-5 lg:grid-cols-[360px_minmax(0,1fr)]">
            <img class="rounded-lg border border-white/10 object-cover object-top" src="/brand/export/chrome-store-screenshots/store-screenshot-04-evidence-library-1280x800.png" :alt="t('home.manualScreenshotEvidenceAlt')" loading="lazy" />
            <div>
              <p class="text-sm font-semibold text-cyan-300">{{ t('userGuide.chapterEvidence') }}</p>
              <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('userGuide.evidenceTitle') }}</h2>
              <p class="mt-3 text-sm leading-7 text-zinc-400">{{ t('userGuide.evidenceDesc') }}</p>
              <ul class="mt-4 space-y-2 text-sm leading-6 text-zinc-400">
                <li>• {{ t('userGuide.evidencePoint1') }}</li>
                <li>• {{ t('userGuide.evidencePoint2') }}</li>
                <li>• {{ t('userGuide.evidencePoint3') }}</li>
              </ul>
              <RouterLink class="mt-4 inline-flex rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/evidence-library">
                {{ t('common.evidenceLibrary') }}
              </RouterLink>
            </div>
          </section>

          <section id="response" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div>
                <p class="text-sm font-semibold text-cyan-300">{{ t('userGuide.chapterResponse') }}</p>
                <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('home.officialFlowTitle') }}</h2>
                <p class="mt-3 text-sm leading-7 text-zinc-400">{{ t('home.officialFlowIntro') }}</p>
                <div class="mt-5 grid gap-3 md:grid-cols-2">
                  <article v-for="(step, index) in responseSteps" :key="step.title" class="rounded-md border border-white/10 bg-zinc-950 p-4">
                    <span class="text-sm font-semibold text-cyan-300">0{{ index + 1 }}</span>
                    <h3 class="mt-2 text-sm font-semibold text-white">{{ step.title }}</h3>
                    <p class="mt-2 text-sm leading-6 text-zinc-400">{{ step.description }}</p>
                  </article>
                </div>
              </div>
              <img class="rounded-lg border border-white/10 object-cover object-top" src="/brand/export/manual-screenshots/manual-official-response-policy.png" :alt="t('home.manualScreenshotOfficialAlt')" loading="lazy" />
            </div>
          </section>

          <section id="trust" class="rounded-lg border border-red-300/20 bg-red-500/[0.04] p-5">
            <p class="text-sm font-semibold text-red-200">{{ t('userGuide.chapterTrust') }}</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('home.trustFormulaTitle') }}</h2>
            <p class="mt-3 text-sm leading-7 text-zinc-300">{{ t('home.trustFormulaIntro') }}</p>
            <div class="mt-5 rounded-lg border border-red-300/20 bg-zinc-950 p-4">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-red-200">{{ t('home.trustFormulaLabel') }}</p>
              <p class="mt-3 break-words font-mono text-sm leading-7 text-white">{{ t('home.trustFormulaEquation') }}</p>
            </div>
            <div class="mt-4 grid gap-3 md:grid-cols-3">
              <article v-for="part in trustParts" :key="part.label" class="rounded-md border border-white/10 bg-zinc-950/70 p-4">
                <h3 class="text-sm font-semibold text-white">{{ part.label }}</h3>
                <p class="mt-2 text-sm leading-6 text-zinc-400">{{ part.value }}</p>
              </article>
            </div>
            <div class="mt-5 grid gap-3 md:grid-cols-2">
              <article v-for="rule in antiAbuseRules" :key="rule.title" class="rounded-md border border-white/10 bg-zinc-950/70 p-4">
                <h3 class="text-sm font-semibold text-white">{{ rule.title }}</h3>
                <p class="mt-2 text-sm leading-6 text-zinc-400">{{ rule.description }}</p>
              </article>
            </div>
          </section>

          <section id="community" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <p class="text-sm font-semibold text-cyan-300">{{ t('userGuide.chapterCommunity') }}</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('userGuide.communityTitle') }}</h2>
            <p class="mt-3 text-sm leading-7 text-zinc-400">{{ t('userGuide.communityDesc') }}</p>
            <div class="mt-5 grid gap-3 md:grid-cols-3">
              <RouterLink class="rounded-md border border-white/10 bg-zinc-950 p-4 hover:border-cyan-300/50" to="/community-tasks">
                <h3 class="text-sm font-semibold text-white">{{ t('common.communityTasks') }}</h3>
                <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('userGuide.communityTasksDesc') }}</p>
              </RouterLink>
              <RouterLink class="rounded-md border border-white/10 bg-zinc-950 p-4 hover:border-cyan-300/50" to="/report-domain">
                <h3 class="text-sm font-semibold text-white">{{ t('common.reportDomain') }}</h3>
                <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('userGuide.reportDomainDesc') }}</p>
              </RouterLink>
              <RouterLink class="rounded-md border border-white/10 bg-zinc-950 p-4 hover:border-cyan-300/50" to="/profile">
                <h3 class="text-sm font-semibold text-white">{{ t('common.profile') }}</h3>
                <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('userGuide.profileDesc') }}</p>
              </RouterLink>
            </div>
          </section>

          <section id="feature-map" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <p class="text-sm font-semibold text-cyan-300">{{ t('userGuide.chapterFeatureMap') }}</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('userGuide.featureMapTitle') }}</h2>
            <p class="mt-3 text-sm leading-7 text-zinc-400">{{ t('userGuide.featureMapDesc') }}</p>
            <div class="mt-5 grid gap-4 md:grid-cols-2">
              <article v-for="group in featureGroups" :key="group.title" class="rounded-lg border border-white/10 bg-zinc-950 p-4">
                <h3 class="text-base font-semibold text-white">{{ group.title }}</h3>
                <p class="mt-2 text-sm leading-6 text-zinc-400">{{ group.description }}</p>
                <div class="mt-4 flex flex-wrap gap-2">
                  <RouterLink v-for="link in group.links" :key="link.to" class="rounded-md border border-cyan-300/30 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/10" :to="link.to">
                    {{ link.label }}
                  </RouterLink>
                </div>
              </article>
            </div>
          </section>

          <section id="extension-settings" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <p class="text-sm font-semibold text-cyan-300">{{ t('userGuide.chapterExtensionSettings') }}</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('userGuide.extensionSettingsTitle') }}</h2>
            <p class="mt-3 text-sm leading-7 text-zinc-400">{{ t('userGuide.extensionSettingsDesc') }}</p>
            <div class="mt-5 grid gap-3 md:grid-cols-2">
              <article v-for="item in extensionSettings" :key="item.title" class="rounded-md border border-white/10 bg-zinc-950 p-4">
                <h3 class="text-sm font-semibold text-white">{{ item.title }}</h3>
                <p class="mt-2 text-sm leading-6 text-zinc-400">{{ item.description }}</p>
              </article>
            </div>
            <div class="mt-5 flex flex-wrap gap-3">
              <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/health">{{ t('common.health') }}</RouterLink>
              <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/extension-coverage">{{ t('common.extensionCoverage') }}</RouterLink>
              <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/vision-readiness">{{ t('common.visionReadiness') }}</RouterLink>
            </div>
          </section>

          <section id="help" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <p class="text-sm font-semibold text-cyan-300">{{ t('userGuide.chapterHelp') }}</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('userGuide.helpTitle') }}</h2>
            <p class="mt-3 text-sm leading-7 text-zinc-400">{{ t('userGuide.helpDesc') }}</p>
            <div class="mt-5 flex flex-wrap gap-3">
              <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/bug-report">{{ t('common.bugReport') }}</RouterLink>
              <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/platform-rules">{{ t('common.platformRules') }}</RouterLink>
              <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/official-response-policy">{{ t('common.officialResponsePolicy') }}</RouterLink>
              <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/transparency">{{ t('common.transparency') }}</RouterLink>
            </div>
          </section>
        </div>
      </section>
    </section>
  </main>
</template>
