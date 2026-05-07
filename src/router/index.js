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
import AccountGraphView from '../views/AccountGraphView.vue'
import ApiClientsView from '../views/ApiClientsView.vue'
import LaunchOpsView from '../views/LaunchOpsView.vue'
import LocalNewsDemoView from '../views/LocalNewsDemoView.vue'
import DonateView from '../views/DonateView.vue'

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
    { path: '/account-graph', name: 'account-graph', component: AccountGraphView },
    { path: '/api-clients', name: 'api-clients', component: ApiClientsView },
    { path: '/launch-ops', name: 'launch-ops', component: LaunchOpsView },
    { path: '/local-news-demo', name: 'local-news-demo', component: LocalNewsDemoView },
    { path: '/donate', name: 'donate', component: DonateView },
    { path: '/donate/return', name: 'donate-return', component: DonateView },
    { path: '/report-domain', name: 'report-domain', component: ReportDomainView },
    { path: '/iframe-tooltip', name: 'iframe-tooltip', component: IframeTooltipView },
    { path: '/iframe-vote-panel', name: 'iframe-vote-panel', component: IframeVotePanelView },
  ],
})

export default router
