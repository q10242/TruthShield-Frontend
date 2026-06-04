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
    open_demo: { title: '看過互動示範', description: '先知道上方 bar、hover、右鍵與面板怎麼運作。' },
    install_extension: { title: '安裝 Chrome 套件', description: '讓 TruthShield 進入日常新聞閱讀流程。' },
    sync_auth: { title: '同步登入狀態', description: '登入後才能投票、補證據與累積徽章。' },
    see_article_banner: { title: '在新聞頁看到上方 bar', description: '確認插件能辨識支援的新聞頁。' },
    open_vote_panel: { title: '打開投票與證據面板', description: '看結果、投心情、投票、補證據都在這裡。' },
    open_event_context: { title: '看過事件脈絡', description: '理解新聞可以被整理成時間線與人物/組織關係。' },
  },
  en: {
    open_demo: { title: 'Open the interactive demo', description: 'See the banner, hover tooltip, context menu, and panel flow.' },
    install_extension: { title: 'Install the Chrome extension', description: 'Bring TruthShield into everyday news reading.' },
    sync_auth: { title: 'Sync sign-in', description: 'Sign in to vote, add evidence, and build badges.' },
    see_article_banner: { title: 'See the article banner', description: 'Confirm the extension recognizes a supported news page.' },
    open_vote_panel: { title: 'Open voting and evidence', description: 'Results, reactions, votes, evidence, and events live here.' },
    open_event_context: { title: 'Explore event context', description: 'News can be organized into timelines and people/org graphs.' },
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
