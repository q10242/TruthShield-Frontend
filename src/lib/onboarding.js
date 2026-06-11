import { fetchOnboarding, updateOnboarding } from './api'
import { trackEvent } from './traffic'

export const ONBOARDING_VERSION = 1
export const ONBOARDING_LOCAL_KEY = 'truthshield_onboarding_state_v1'
export const ONBOARDING_REQUIRED_STEPS = [
  'open_demo',
  'install_extension',
  'sync_auth',
  'see_article_banner',
  'open_vote_panel',
  'open_event_context',
]
export const ONBOARDING_SURFACES = [
  'site_modal',
  'banner_coach',
  'vote_panel_coach',
  'event_graph_coach',
  'popup_onboarding',
]

const stepSet = new Set(ONBOARDING_REQUIRED_STEPS)
const surfaceSet = new Set(ONBOARDING_SURFACES)

export const onboardingCopy = {
  'zh-TW': {
    open_demo: { title: '先搞懂你要做什麼', description: 'TruthShield 不是叫你相信平台，而是讓你在新聞旁邊多看一層脈絡。' },
    install_extension: { title: '確認 Chrome 套件可用', description: '真正的使用場景在新聞網站，不是在官網假頁面。' },
    sync_auth: { title: '同步登入狀態', description: '登入後才能投票、補證據、補脈絡需求與累積徽章。' },
    see_article_banner: { title: '在真實新聞頁看到上方 bar', description: '打開支援的新聞頁，確認 TruthShield 會在頁面頂端出現。' },
    open_vote_panel: { title: '從 bar 或 popup 打開面板', description: '面板裡先看結果、證據、投標籤，也能連到事件。' },
    open_event_context: { title: '看一次事件脈絡', description: '事件頁整理多篇新聞背後的時間線、狀態、分類與關係圖。' },
  },
  en: {
    open_demo: { title: 'Understand what to do first', description: 'TruthShield does not ask you to trust the platform. It adds context beside the news.' },
    install_extension: { title: 'Confirm the Chrome extension works', description: 'The real workflow happens on news sites, not on a fake website demo.' },
    sync_auth: { title: 'Sync sign-in', description: 'Sign in to vote, add evidence, leave reactions, and build badges.' },
    see_article_banner: { title: 'See the top bar on a real article', description: 'Open a supported news article and confirm TruthShield appears at the top.' },
    open_vote_panel: { title: 'Open the panel from the bar or popup', description: 'The panel contains results, reactions, votes, evidence, and event links.' },
    open_event_context: { title: 'View event context once', description: 'Event pages organize timelines, status, categories, and relationship graphs.' },
  },
}

export function emptyOnboardingState() {
  return {
    version: ONBOARDING_VERSION,
    completed_steps: [],
    dismissed_surfaces: [],
    completed_at: null,
    reward_claimed_at: null,
  }
}

export function normalizeOnboardingState(state = {}) {
  return {
    ...emptyOnboardingState(),
    ...state,
    completed_steps: knownUnique(state.completed_steps || [], stepSet),
    dismissed_surfaces: knownUnique(state.dismissed_surfaces || [], surfaceSet),
  }
}

export function readLocalOnboarding() {
  try {
    return normalizeOnboardingState(JSON.parse(localStorage.getItem(ONBOARDING_LOCAL_KEY) || 'null') || {})
  } catch {
    return emptyOnboardingState()
  }
}

export function writeLocalOnboarding(state) {
  const normalized = normalizeOnboardingState(state)
  localStorage.setItem(ONBOARDING_LOCAL_KEY, JSON.stringify(normalized))

  return normalized
}

export function onboardingSummary(state = readLocalOnboarding()) {
  const normalized = normalizeOnboardingState(state)
  const remaining = ONBOARDING_REQUIRED_STEPS.filter((step) => !normalized.completed_steps.includes(step))

  return {
    ...normalized,
    required_steps: ONBOARDING_REQUIRED_STEPS,
    remaining_steps: remaining,
    completed: remaining.length === 0,
    badge_slug: 'truthshield-onboarded',
  }
}

export async function markOnboardingStep(step, token = localStorage.getItem('truthshield_api_token') || '') {
  if (!stepSet.has(step)) return onboardingSummary()
  const local = mergeLocal({ completed_steps: [step] })
  trackEvent('onboarding_step_completed', { feature: 'onboarding', metadata: { step } })

  return syncOnboarding(token, local).catch(() => onboardingSummary(local))
}

export async function dismissOnboardingSurface(surface, token = localStorage.getItem('truthshield_api_token') || '') {
  if (!surfaceSet.has(surface)) return onboardingSummary()
  const local = mergeLocal({ dismissed_surfaces: [surface] })

  return syncOnboarding(token, local).catch(() => onboardingSummary(local))
}

export async function loadOnboarding(token = localStorage.getItem('truthshield_api_token') || '') {
  const local = readLocalOnboarding()
  if (!token) return onboardingSummary(local)

  return syncOnboarding(token, local)
}

export async function syncOnboarding(token, state = readLocalOnboarding()) {
  const local = normalizeOnboardingState(state)
  if (!token) return onboardingSummary(local)

  const remote = await fetchOnboarding(token).catch(() => null)
  const remoteSummary = remote?.summary || {}
  const payload = {
    completed_steps: [
      ...(remoteSummary.completed_steps || []),
      ...local.completed_steps,
    ],
    dismissed_surfaces: [
      ...(remoteSummary.dismissed_surfaces || []),
      ...local.dismissed_surfaces,
    ],
  }
  const updated = await updateOnboarding(token, payload)
  const next = normalizeOnboardingState(updated.summary || {})
  writeLocalOnboarding(next)

  return onboardingSummary(next)
}

function mergeLocal(payload = {}) {
  const current = readLocalOnboarding()
  return writeLocalOnboarding({
    ...current,
    completed_steps: [...current.completed_steps, ...(payload.completed_steps || [])],
    dismissed_surfaces: [...current.dismissed_surfaces, ...(payload.dismissed_surfaces || [])],
  })
}

function knownUnique(values, allowedSet) {
  return Array.from(new Set((values || []).filter((value) => allowedSet.has(value))))
}
