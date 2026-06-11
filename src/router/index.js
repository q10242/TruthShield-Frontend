import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import RankingView from '../views/RankingView.vue'
import IframeTooltipView from '../views/IframeTooltipView.vue'
import IframeVotePanelView from '../views/IframeVotePanelView.vue'
import LoginView from '../views/LoginView.vue'
import ReportDomainView from '../views/ReportDomainView.vue'
import EvidenceLibraryView from '../views/EvidenceLibraryView.vue'
import TransparencyView from '../views/TransparencyView.vue'
import ProfileView from '../views/ProfileView.vue'
import NewsSearchView from '../views/NewsSearchView.vue'
import MediaDetailView from '../views/MediaDetailView.vue'
import HealthView from '../views/HealthView.vue'
import AlgorithmView from '../views/AlgorithmView.vue'
import TrustLeaderboardView from '../views/TrustLeaderboardView.vue'
import ApiDocsView from '../views/ApiDocsView.vue'
import NewsDetailView from '../views/NewsDetailView.vue'
import AppealsView from '../views/AppealsView.vue'
import ModerationEventsView from '../views/ModerationEventsView.vue'
import ExtensionCoverageView from '../views/ExtensionCoverageView.vue'
import ExtensionInstallView from '../views/ExtensionInstallView.vue'
import AccountGraphView from '../views/AccountGraphView.vue'
import ApiClientsView from '../views/ApiClientsView.vue'
import LaunchOpsView from '../views/LaunchOpsView.vue'
import DonateView from '../views/DonateView.vue'
import PrivacyView from '../views/PrivacyView.vue'
import SecurityView from '../views/SecurityView.vue'
import TermsView from '../views/TermsView.vue'
import GovernanceView from '../views/GovernanceView.vue'
import DataRequestView from '../views/DataRequestView.vue'
import VisionReadinessView from '../views/VisionReadinessView.vue'
import CommunityTasksView from '../views/CommunityTasksView.vue'
import CommunityTaskDetailView from '../views/CommunityTaskDetailView.vue'
import PlatformRulesView from '../views/PlatformRulesView.vue'
import LabelGuideView from '../views/LabelGuideView.vue'
import DataProcessingPolicyView from '../views/DataProcessingPolicyView.vue'
import OfficialResponsePolicyView from '../views/OfficialResponsePolicyView.vue'
import BugReportView from '../views/BugReportView.vue'
import MobileHomeView from '../views/MobileHomeView.vue'
import MobileShareView from '../views/MobileShareView.vue'
import MobileCheckView from '../views/MobileCheckView.vue'
import EventsView from '../views/EventsView.vue'
import EventDetailView from '../views/EventDetailView.vue'
import GlobalEntitiesView from '../views/GlobalEntitiesView.vue'
import IframeEventPinView from '../views/IframeEventPinView.vue'
import OnboardingView from '../views/OnboardingView.vue'

const SITE_ORIGIN = 'https://truth-shield.otus.tw'
const SITE_NAME = 'TruthShield 真相護盾'
const DEFAULT_TITLE = SITE_NAME
const DEFAULT_DESCRIPTION = 'TruthShield 真相護盾用社群證據、信用權重與透明治理，讓讀者在新聞頁旁查看可信度訊號、證據與投票結果。'
const DEFAULT_IMAGE = `${SITE_ORIGIN}/brand/export/social-preview-1200x630.png`

const routeMeta = {
  home: {
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
  },
  'demo-news': {
    title: `互動示範 - ${SITE_NAME}`,
    description: '不用安裝插件，先看 TruthShield 在新聞頁上方橫幅、Hover Tooltip、右鍵入口與投票面板的實際體驗。',
  },
  'user-guide': {
    title: `使用手冊 - ${SITE_NAME}`,
    description: '從安裝、投票、補證據、YouTube 小標到反網軍機制，一頁看懂 TruthShield 的日常使用方式。',
  },
  'extension-install': {
    title: `下載瀏覽器插件 - ${SITE_NAME}`,
    description: '取得 TruthShield Chrome 與 Firefox 測試插件，把新聞脈絡提示放進日常閱讀流程。',
  },
  mobile: {
    title: `手機快速查新聞 - ${SITE_NAME}`,
    description: '手機分享或貼上新聞 URL 時使用的快速查詢入口；一般 TruthShield 頁面仍使用同一網址自動適配手機與桌機。',
  },
  events: {
    title: `事件脈絡 - ${SITE_NAME}`,
    description: '用時間線與人物/組織關係圖整理多篇新聞，讓事件脈絡與公開來源更容易被檢查。',
  },
  'news-search': {
    title: `新聞搜尋 - ${SITE_NAME}`,
    description: '貼上新聞 URL 或搜尋已收錄新聞，查看目前標籤、加權結果、證據與定案狀態。',
  },
  'evidence-library': {
    title: `證據庫 - ${SITE_NAME}`,
    description: '瀏覽 TruthShield 社群提交的公開證據、澄清連結與來源品質訊號。',
  },
  transparency: {
    title: `透明儀表板 - ${SITE_NAME}`,
    description: '查看 TruthShield 系統健康、治理統計、社群任務、回報與公開營運指標。',
  },
  'extension-coverage': {
    title: `插件覆蓋 - ${SITE_NAME}`,
    description: '檢查 TruthShield 已支援的新聞網域、YouTube 頻道與插件相容性狀態。',
  },
  onboarding: {
    title: `新手導覽 - ${SITE_NAME}`,
    description: '用新手任務快速了解 TruthShield 插件、投票、證據、脈絡需求與事件脈絡。',
  },
}

function setMetaTag(attribute, name, content) {
  let element = document.head.querySelector(`meta[${attribute}="${name}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function setCanonical(url) {
  let element = document.head.querySelector('link[rel="canonical"]')
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', 'canonical')
    document.head.appendChild(element)
  }
  element.setAttribute('href', url)
}

function applyRouteMeta(route) {
  const meta = routeMeta[route.name] || {}
  const title = meta.title || DEFAULT_TITLE
  const description = meta.description || DEFAULT_DESCRIPTION
  const url = new URL(route.path || '/', SITE_ORIGIN).toString()

  document.title = title
  setCanonical(url)
  setMetaTag('name', 'description', description)
  setMetaTag('property', 'og:type', route.name === 'home' ? 'website' : 'article')
  setMetaTag('property', 'og:site_name', SITE_NAME)
  setMetaTag('property', 'og:title', title)
  setMetaTag('property', 'og:description', description)
  setMetaTag('property', 'og:url', url)
  setMetaTag('property', 'og:image', DEFAULT_IMAGE)
  setMetaTag('name', 'twitter:card', 'summary_large_image')
  setMetaTag('name', 'twitter:title', title)
  setMetaTag('name', 'twitter:description', description)
  setMetaTag('name', 'twitter:image', DEFAULT_IMAGE)
}

const localRoutes = import.meta.env.DEV
  ? [
      { path: '/local-news-demo', name: 'local-news-demo', component: () => import('../views/LocalNewsDemoView.vue') },
      { path: '/local-qa-checklist', name: 'local-qa-checklist', component: () => import('../views/LocalQaChecklistView.vue') },
    ]
  : [
      { path: '/local-news-demo', redirect: '/demo-news' },
    ]

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/mobile', name: 'mobile', component: MobileHomeView },
    { path: '/mobile/share', name: 'mobile-share', component: MobileShareView },
    { path: '/mobile/check', name: 'mobile-check', component: MobileCheckView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/ranking', name: 'ranking', component: RankingView },
    { path: '/evidence-library', name: 'evidence-library', component: EvidenceLibraryView },
    { path: '/transparency', name: 'transparency', component: TransparencyView },
    { path: '/profile', name: 'profile', component: ProfileView },
    { path: '/onboarding', name: 'onboarding', component: OnboardingView },
    { path: '/news-search', name: 'news-search', component: NewsSearchView },
    { path: '/events', name: 'events', component: EventsView },
    { path: '/events/:id', name: 'event-detail', component: EventDetailView },
    { path: '/global-entities', name: 'global-entities', component: GlobalEntitiesView },
    { path: '/media/:slug', name: 'media-detail', component: MediaDetailView },
    { path: '/health', name: 'health', component: HealthView },
    { path: '/algorithm', name: 'algorithm', component: AlgorithmView },
    { path: '/trust-leaderboard', name: 'trust-leaderboard', component: TrustLeaderboardView },
    { path: '/api-docs', name: 'api-docs', component: ApiDocsView },
    { path: '/news/:id', name: 'news-detail', component: NewsDetailView },
    { path: '/appeals', name: 'appeals', component: AppealsView },
    { path: '/moderation-events', name: 'moderation-events', component: ModerationEventsView },
    { path: '/extension-coverage', name: 'extension-coverage', component: ExtensionCoverageView },
    { path: '/extension-install', name: 'extension-install', component: ExtensionInstallView },
    { path: '/extension-auth-sync', name: 'extension-auth-sync', component: () => import('../views/ExtensionAuthSyncView.vue') },
    { path: '/user-guide', name: 'user-guide', component: () => import('../views/UserGuideView.vue') },
    { path: '/demo-news', name: 'demo-news', component: () => import('../views/DemoNewsView.vue') },
    { path: '/account-graph', name: 'account-graph', component: AccountGraphView },
    { path: '/api-clients', name: 'api-clients', component: ApiClientsView },
    { path: '/launch-ops', name: 'launch-ops', component: LaunchOpsView },
    ...localRoutes,
    { path: '/community-tasks', name: 'community-tasks', component: CommunityTasksView },
    { path: '/community-tasks/:id', name: 'community-task-detail', component: CommunityTaskDetailView },
    { path: '/donate', name: 'donate', component: DonateView },
    { path: '/donate/return', name: 'donate-return', component: DonateView },
    { path: '/privacy', name: 'privacy', component: PrivacyView },
    { path: '/security', name: 'security', component: SecurityView },
    { path: '/terms', name: 'terms', component: TermsView },
    { path: '/governance', name: 'governance', component: GovernanceView },
    { path: '/vision-readiness', name: 'vision-readiness', component: VisionReadinessView },
    { path: '/data-request', name: 'data-request', component: DataRequestView },
    { path: '/platform-rules', name: 'platform-rules', component: PlatformRulesView },
    { path: '/label-guide', name: 'label-guide', component: LabelGuideView },
    { path: '/data-processing-policy', name: 'data-processing-policy', component: DataProcessingPolicyView },
    { path: '/official-response-policy', name: 'official-response-policy', component: OfficialResponsePolicyView },
    { path: '/bug-report', name: 'bug-report', component: BugReportView },
    { path: '/report-domain', name: 'report-domain', component: ReportDomainView },
    { path: '/iframe-tooltip', name: 'iframe-tooltip', component: IframeTooltipView },
    { path: '/iframe-vote-panel', name: 'iframe-vote-panel', component: IframeVotePanelView },
    { path: '/iframe-event-pin', name: 'iframe-event-pin', component: IframeEventPinView },
  ],
})

router.afterEach((to) => {
  if (typeof document !== 'undefined') {
    applyRouteMeta(to)
  }
})

export default router
