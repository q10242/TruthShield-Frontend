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
import LocalNewsDemoView from '../views/LocalNewsDemoView.vue'
import DonateView from '../views/DonateView.vue'
import PrivacyView from '../views/PrivacyView.vue'
import SecurityView from '../views/SecurityView.vue'
import TermsView from '../views/TermsView.vue'
import GovernanceView from '../views/GovernanceView.vue'
import DataRequestView from '../views/DataRequestView.vue'
import VisionReadinessView from '../views/VisionReadinessView.vue'
import LocalQaChecklistView from '../views/LocalQaChecklistView.vue'
import CommunityTasksView from '../views/CommunityTasksView.vue'
import CommunityTaskDetailView from '../views/CommunityTaskDetailView.vue'
import PlatformRulesView from '../views/PlatformRulesView.vue'
import LabelGuideView from '../views/LabelGuideView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/ranking', name: 'ranking', component: RankingView },
    { path: '/evidence-library', name: 'evidence-library', component: EvidenceLibraryView },
    { path: '/transparency', name: 'transparency', component: TransparencyView },
    { path: '/profile', name: 'profile', component: ProfileView },
    { path: '/news-search', name: 'news-search', component: NewsSearchView },
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
    { path: '/account-graph', name: 'account-graph', component: AccountGraphView },
    { path: '/api-clients', name: 'api-clients', component: ApiClientsView },
    { path: '/launch-ops', name: 'launch-ops', component: LaunchOpsView },
    { path: '/local-news-demo', name: 'local-news-demo', component: LocalNewsDemoView },
    { path: '/local-qa-checklist', name: 'local-qa-checklist', component: LocalQaChecklistView },
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
    { path: '/report-domain', name: 'report-domain', component: ReportDomainView },
    { path: '/iframe-tooltip', name: 'iframe-tooltip', component: IframeTooltipView },
    { path: '/iframe-vote-panel', name: 'iframe-vote-panel', component: IframeVotePanelView },
  ],
})

export default router
