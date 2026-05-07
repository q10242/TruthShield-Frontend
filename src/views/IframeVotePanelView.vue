<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  createVote,
  fetchCurrentUser,
  fetchMyVote,
  fetchNewsEvidence,
  fetchNewsStatus,
  fetchTags,
  fetchEvidenceReportReasons,
  recordReadSession,
  reactToEvidence,
  reportEvidence,
} from '../lib/api'

const TOKEN_KEY = 'truthshield_api_token'
const USER_KEY = 'truthshield_user'

const route = useRoute()
const collapsed = ref(route.query.expanded !== '1')
const activeTab = ref('results')
const loading = ref(true)
const statusLoading = ref(true)
const error = ref('')
const voteError = ref('')
const voteMessage = ref('')
const evidenceError = ref('')
const reportMessage = ref('')
const readMessage = ref('')
const status = ref(null)
const tags = ref([])
const evidence = ref([])
const reportReasons = ref([])
const selectedTagId = ref('')
const evidenceUrl = ref('')
const evidenceNote = ref('')
const submitting = ref(false)
const reactingId = ref(null)
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const user = ref(readStoredUser())
const myVote = ref(null)
const readSeconds = ref(0)
const readMinimum = ref(15)
const readSynced = ref(false)
const readTimer = ref(null)
const tabSteps = [
  { key: 'results', number: 1, label: '看結果' },
  { key: 'vote', number: 2, label: '投票' },
  { key: 'evidence', number: 3, label: '查證據' },
]

const newsUrl = computed(() => route.query.news_url || '')
const selectedTag = computed(() => tags.value.find((tag) => tag.id === selectedTagId.value))
const isLoggedIn = computed(() => Boolean(token.value && user.value))
const totalWeight = computed(() => Number(status.value?.total_weight || 0))
const distribution = computed(() => status.value?.distribution || [])
const evidenceReactionMinTrustScore = computed(() => Number(user.value?.evidence_reaction_min_trust_score ?? 0.5))
const canReactToEvidence = computed(() => {
  if (!isLoggedIn.value) return true
  if (typeof user.value?.can_react_to_evidence === 'boolean') return user.value.can_react_to_evidence

  return Number(user.value?.trust_score || 0) >= evidenceReactionMinTrustScore.value
})
const isVotingOpen = computed(() => (status.value?.voting_closes_at ? Boolean(status.value?.is_open) : true))
const hasReadEnough = computed(() => readMinimum.value <= 0 || readSeconds.value >= readMinimum.value || Boolean(myVote.value))
const readProgress = computed(() => {
  if (readMinimum.value <= 0) return 100
  return Math.min(100, Math.round((readSeconds.value / readMinimum.value) * 100))
})
const deadlineText = computed(() => formatDateTime(status.value?.voting_closes_at))
const finalizedText = computed(() => formatDateTime(status.value?.finalized_at))
const isClosingSoon = computed(() => {
  if (!isVotingOpen.value || !status.value?.voting_closes_at) return false

  const remaining = new Date(status.value.voting_closes_at).getTime() - Date.now()
  return remaining > 0 && remaining <= 6 * 60 * 60 * 1000
})
const statusNote = computed(() => {
  if (status.value?.finalized_at) return `加權結果已於 ${finalizedText.value} 定案`
  if (!isVotingOpen.value) return '投票與證據評分已截止，正在讀取定案結果'
  if (isClosingSoon.value && deadlineText.value) return `即將截止：每人限一則，可修改到 ${deadlineText.value}`
  if (deadlineText.value) return `每人限一則，可在截止前修改；截止時間 ${deadlineText.value}`

  return '每人限一則，可在截止前修改'
})
const nextActionText = computed(() => {
  if (!isVotingOpen.value) return '結果已定案'
  if (!isLoggedIn.value) return '登入後可投票與評分證據'
  if (!hasReadEnough.value) return `再閱讀 ${Math.max(0, readMinimum.value - readSeconds.value)} 秒即可投票`
  if (myVote.value) return '可更新你的投票與證據'

  return '可送出你的第一筆投票'
})
const statusBadgeText = computed(() => {
  if (status.value?.finalized_at) return '已定案'
  if (!isVotingOpen.value) return '已截止'
  if (isClosingSoon.value) return '即將截止'

  return '開放中'
})
const activeStepNumber = computed(() => tabSteps.find((step) => step.key === activeTab.value)?.number || 1)

const toneClass = computed(() => {
  const tone = status.value?.tone

  if (tone === 'danger') return 'border-red-400/50 bg-red-500/15 text-red-100'
  if (tone === 'positive') return 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100'
  if (tone === 'warning') return 'border-orange-400/50 bg-orange-500/15 text-orange-100'

  return 'border-white/10 bg-white/[0.04] text-zinc-200'
})

function readStoredUser() {
  try {
    const value = localStorage.getItem(USER_KEY)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function notifyHeight() {
  nextTick(() => {
    window.parent?.postMessage(
      {
        type: 'TRUTH_SHIELD_VOTE_PANEL_RESIZE',
        height: document.documentElement.scrollHeight,
        collapsed: collapsed.value,
      },
      '*',
    )
  })
}

function formatDateTime(value) {
  if (!value) return ''

  try {
    return new Intl.DateTimeFormat('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value))
  } catch {
    return ''
  }
}

async function loadAuth() {
  token.value = localStorage.getItem(TOKEN_KEY) || ''
  user.value = readStoredUser()

  if (!token.value) return

  try {
    user.value = await fetchCurrentUser(token.value)
    readMinimum.value = Number(user.value?.min_read_seconds_before_vote ?? 15)
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  } catch {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    token.value = ''
    user.value = null
  }
}

async function syncReadSession() {
  if (!token.value || !newsUrl.value || document.hidden) return

  try {
    const payload = await recordReadSession(token.value, {
      url: newsUrl.value,
      title_snapshot: document.title || undefined,
      seconds_read: readSeconds.value,
      visible: !document.hidden,
    })
    readMinimum.value = Number(payload.minimum_seconds ?? readMinimum.value)
    readSynced.value = Boolean(payload.can_vote)
  } catch {
    readSynced.value = false
  } finally {
    notifyHeight()
  }
}

function startReadTracking() {
  window.clearInterval(readTimer.value)
  readTimer.value = window.setInterval(() => {
    if (document.hidden || collapsed.value) return

    readSeconds.value += 1

    if (readSeconds.value % 5 === 0 || readSeconds.value === readMinimum.value) {
      syncReadSession()
    }
  }, 1000)
}

async function loadData() {
  error.value = ''
  evidenceError.value = ''
  statusLoading.value = true

  try {
    if (!newsUrl.value) throw new Error('缺少 news_url')

    const requests = [
      fetchNewsStatus(newsUrl.value),
      fetchTags(),
      fetchNewsEvidence(newsUrl.value),
      fetchEvidenceReportReasons(),
    ]

    if (token.value) {
      requests.push(fetchMyVote(token.value, newsUrl.value).catch(() => ({ vote: null })))
    }

    const [statusPayload, tagPayload, evidencePayload, reportReasonsPayload, myVotePayload] = await Promise.all(requests)

    status.value = statusPayload
    tags.value = tagPayload
    evidence.value = evidencePayload
    reportReasons.value = reportReasonsPayload
    myVote.value = myVotePayload?.vote || null

    if (myVote.value) {
      selectedTagId.value = myVote.value.tag_id
      evidenceUrl.value = myVote.value.evidence_url || ''
      evidenceNote.value = myVote.value.evidence_note || ''
    } else {
      selectedTagId.value ||= statusPayload.top_tag?.id || tagPayload[0]?.id || ''
    }
  } catch (err) {
    error.value = err.message || 'Unable to load status'
  } finally {
    loading.value = false
    statusLoading.value = false
    notifyHeight()
  }
}

function openLogin() {
  const loginUrl = new URL('/login', window.location.origin)
  loginUrl.searchParams.set('redirect', window.location.pathname + window.location.search)
  window.open(loginUrl.toString(), 'truthshield-login', 'width=460,height=680')
  pollForLogin()
}

function pollForLogin() {
  let attempts = 0
  const timer = window.setInterval(async () => {
    attempts += 1
    await loadAuth()

    if (isLoggedIn.value || attempts >= 40) {
      window.clearInterval(timer)
      if (isLoggedIn.value) {
        await loadData()
      }
      notifyHeight()
    }
  }, 500)
}

async function submitVote() {
  voteError.value = ''
  voteMessage.value = ''

  if (!isLoggedIn.value) {
    openLogin()
    return
  }

  if (!isVotingOpen.value) {
    voteError.value = '這則新聞的投票窗口已截止，結果已定案。'
    notifyHeight()
    return
  }

  if (!hasReadEnough.value) {
    await syncReadSession()
    voteError.value = `請先閱讀本文至少 ${readMinimum.value} 秒，目前 ${readSeconds.value} 秒。`
    notifyHeight()
    return
  }

  if (selectedTag.value?.requires_evidence && !evidenceUrl.value.trim()) {
    voteError.value = '此標籤需要截圖、雲端硬碟圖片或相關新聞連結。'
    notifyHeight()
    return
  }

  if (selectedTag.value?.requires_evidence && !evidenceNote.value.trim()) {
    voteError.value = '請用一句話說明這個證據證明了什麼。'
    notifyHeight()
    return
  }

  submitting.value = true

  try {
    await createVote(token.value, {
      url: newsUrl.value,
      tag_id: selectedTagId.value,
      evidence_url: evidenceUrl.value.trim() || undefined,
      evidence_note: evidenceNote.value.trim() || undefined,
    })

    voteMessage.value = '已送出投票，結果已用你的信用權重重新計算。'
    activeTab.value = 'results'
    evidenceUrl.value = ''
    evidenceNote.value = ''
    await loadData()
  } catch (err) {
    voteError.value = err.status === 409
      ? '這則新聞的投票窗口已截止，結果已定案。'
      : err.status === 428
        ? `請先閱讀本文至少 ${err.payload?.minimum_read_seconds || readMinimum.value} 秒，目前 ${err.payload?.seconds_read ?? readSeconds.value} 秒。`
        : err.errors?.evidence_url?.[0] || err.errors?.evidence_note?.[0] || err.message || '投票失敗'
  } finally {
    submitting.value = false
    notifyHeight()
  }
}

async function reportItem(item) {
  evidenceError.value = ''
  reportMessage.value = ''

  if (!isLoggedIn.value) {
    openLogin()
    return
  }

  try {
    await reportEvidence(token.value, item.id, {
      reason: 'needs_review',
      note: reportReasons.value.find((reason) => reason.value === 'needs_review')?.label || '使用者從新聞頁面回報此證據需要管理員檢視。',
    })
    reportMessage.value = '已送出檢舉，管理員會在後台檢視。'
  } catch (err) {
    evidenceError.value = err.message || '檢舉失敗'
  } finally {
    notifyHeight()
  }
}

async function react(item, helpful) {
  evidenceError.value = ''

  if (!isLoggedIn.value) {
    openLogin()
    return
  }

  if (!isVotingOpen.value) {
    evidenceError.value = '證據評分已截止，排序不再變動。'
    notifyHeight()
    return
  }

  if (!canReactToEvidence.value) {
    evidenceError.value = `信用權重需達 ${evidenceReactionMinTrustScore.value.toFixed(2)} 才能評分證據。`
    notifyHeight()
    return
  }

  reactingId.value = item.id

  try {
    await reactToEvidence(token.value, item.id, helpful)
    evidence.value = await fetchNewsEvidence(newsUrl.value)
  } catch (err) {
    evidenceError.value = err.status === 409
      ? '證據評分已截止，排序不再變動。'
      : err.status === 403
        ? `信用權重需達 ${evidenceReactionMinTrustScore.value.toFixed(2)} 才能評分證據。`
        : err.message || '證據評分失敗'
  } finally {
    reactingId.value = null
    notifyHeight()
  }
}

function evidencePreviewUrl(item) {
  if (item.evidence_type === 'cloud_drive') {
    return ''
  }

  if (item.preview_url) return item.preview_url
  if (item.evidence_type !== 'image') return ''

  try {
    const url = new URL(item.evidence_url)
    if (url.hostname === 'imgur.com' || url.hostname === 'www.imgur.com') {
      const id = url.pathname.split('/').filter(Boolean).pop()
      return id ? `https://i.imgur.com/${id}.jpg` : item.evidence_url
    }
  } catch {
    return ''
  }

  return item.evidence_url
}

function evidenceTypeLabel(item) {
  if (item.evidence_type === 'cloud_drive') return '雲端硬碟'
  if (item.evidence_type === 'image') return '圖片證據'
  if (item.evidence_type === 'link') return '相關連結'

  return '外部證據'
}

function evidenceTrustLabel(item) {
  return item.is_trusted_evidence ? '可信來源' : '待社群驗證'
}

watch([collapsed, activeTab, selectedTagId, evidenceUrl, evidenceNote, voteError, voteMessage, evidenceError, reportMessage, readSeconds], notifyHeight)

onMounted(async () => {
  await Promise.all([loadAuth(), loadData()])
  window.addEventListener('focus', loadAuth)
  window.addEventListener('storage', loadAuth)
  window.addEventListener('message', async (event) => {
    if (event.data?.type === 'TRUTH_SHIELD_AUTH_UPDATED') {
      await loadAuth()
      await syncReadSession()
    }

    if (event.data?.type === 'TRUTH_SHIELD_ARTICLE_READ_TICK') {
      readSeconds.value = Math.max(readSeconds.value, Number(event.data.secondsRead || 0))
      if (readSeconds.value % 5 === 0 || readSeconds.value >= readMinimum.value) {
        await syncReadSession()
      }
    }
  })
  startReadTracking()
  await syncReadSession()
  notifyHeight()
})
</script>

<template>
  <main class="min-w-[360px] bg-transparent p-3 text-zinc-100">
    <button
      v-if="collapsed"
      class="ml-auto flex items-center gap-2 rounded-full border border-cyan-300/40 bg-zinc-950 px-4 py-3 text-sm font-semibold text-cyan-100 shadow-2xl shadow-black/40"
      @click="collapsed = false"
    >
      <span class="h-2 w-2 rounded-full bg-cyan-300"></span>
      TruthShield 評分
    </button>

    <section v-else class="rounded-lg border border-white/10 bg-zinc-950 p-4 shadow-xl shadow-black/30">
      <div class="mb-3 flex items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <p class="text-xs font-semibold text-cyan-300">TruthShield</p>
            <span class="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">{{ statusBadgeText }}</span>
          </div>
          <p class="mt-1 text-[11px] text-zinc-500">{{ nextActionText }}</p>
        </div>
        <button class="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-400 hover:border-cyan-300/50 hover:text-cyan-100" @click="collapsed = true">
          收合
        </button>
      </div>

      <div class="grid grid-cols-3 rounded-md border border-white/10 bg-white/[0.03] p-1 text-xs font-semibold">
        <button
          v-for="step in tabSteps"
          :key="step.key"
          class="rounded px-2 py-2"
          :class="activeTab === step.key ? 'bg-cyan-300 text-zinc-950' : step.number < activeStepNumber ? 'text-cyan-200' : 'text-zinc-400'"
          @click="activeTab = step.key"
        >
          <span class="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px]">{{ step.number }}</span>
          {{ step.label }}
        </button>
      </div>

      <div class="mt-3 w-full rounded-md border p-3 text-left" :class="toneClass">
        <div v-if="statusLoading" class="text-sm text-zinc-300">正在查核此新聞...</div>
        <div v-else-if="error" class="text-sm text-orange-100">暫時無法取得資料</div>
        <div v-else class="space-y-1">
          <div class="text-sm font-semibold">{{ status?.display_text || '尚無足夠投票資料' }}</div>
          <div class="text-xs opacity-80">目前總權重 {{ totalWeight.toFixed(2) }}</div>
          <div class="text-xs opacity-80">{{ statusNote }}</div>
        </div>
      </div>

      <div v-if="isVotingOpen" class="mt-3 grid gap-2 rounded-md border border-white/10 bg-white/[0.03] p-3 text-xs text-zinc-300">
        <div class="flex items-center justify-between gap-3">
          <span>閱讀門檻</span>
          <span :class="hasReadEnough ? 'text-emerald-300' : 'text-orange-300'">{{ Math.min(readSeconds, readMinimum) }} / {{ readMinimum }} 秒</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div class="h-full rounded-full bg-cyan-300" :style="{ width: `${readProgress}%` }"></div>
        </div>
      </div>

      <section v-if="activeTab === 'results'" class="mt-4 space-y-3">
        <div v-if="distribution.length === 0" class="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-400">
          尚無投票。你可以先閱讀本文，再選擇是否投票或提供證據。
        </div>

        <div v-for="row in distribution" :key="row.tag.id" class="space-y-1">
          <div class="flex items-center justify-between gap-3 text-xs">
            <span class="font-semibold text-zinc-100">{{ row.tag.name }}</span>
            <span class="text-zinc-400">{{ row.percentage }}% / 權重 {{ Number(row.weight).toFixed(2) }}</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-white/10">
            <div class="h-full rounded-full bg-cyan-300" :style="{ width: `${row.percentage}%` }"></div>
          </div>
        </div>

        <button
          class="w-full rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!isVotingOpen"
          @click="activeTab = 'vote'"
        >
          {{ isLoggedIn ? '前往投票' : '登入後投票' }}
        </button>
        <button
          class="w-full rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-300 hover:border-cyan-300/50 hover:text-cyan-100"
          @click="activeTab = 'evidence'"
        >
          查看社群證據
        </button>
      </section>

      <section v-else-if="activeTab === 'vote'" class="mt-4 space-y-3 border-t border-white/10 pt-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-white">你的評分</p>
            <p class="text-xs text-zinc-500">{{ isLoggedIn ? `${user.email} · 權重 ${Number(user.trust_score || 1).toFixed(2)}` : '尚未登入' }}</p>
            <p v-if="myVote" class="mt-1 text-xs text-cyan-300">已載入你對這篇新聞的既有投票，可在截止前修改。</p>
            <p class="mt-1 text-xs text-zinc-500">{{ statusNote }}</p>
            <p class="mt-1 text-xs" :class="hasReadEnough ? 'text-emerald-300' : 'text-orange-300'">
              閱讀門檻 {{ Math.min(readSeconds, readMinimum) }} / {{ readMinimum }} 秒
            </p>
          </div>
          <button v-if="!isLoggedIn && isVotingOpen" class="rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950" @click="openLogin">
            登入
          </button>
        </div>

        <div v-if="!isVotingOpen" class="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-400">
          這則新聞已截止，投票與證據留言不可再修改。
        </div>

        <div v-else class="rounded-md border border-white/10 bg-white/[0.03] p-3">
          <div class="flex items-center justify-between text-xs">
            <span class="font-semibold text-zinc-200">閱讀確認</span>
            <span :class="hasReadEnough ? 'text-emerald-300' : 'text-orange-300'">{{ hasReadEnough ? '已達門檻' : '閱讀中' }}</span>
          </div>
          <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div class="h-full rounded-full bg-cyan-300" :style="{ width: `${readProgress}%` }"></div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="tag in tags"
            :key="tag.id"
            class="rounded-md border px-3 py-2 text-left text-xs font-semibold"
            :class="selectedTagId === tag.id ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/[0.03] text-zinc-300'"
            :disabled="!isVotingOpen"
            @click="selectedTagId = tag.id"
          >
            {{ tag.name }}
          </button>
        </div>

        <label class="block text-xs text-zinc-400">
          截圖、雲端硬碟圖片或相關新聞連結
          <input
            v-model="evidenceUrl"
            class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
            :disabled="!isVotingOpen"
            :placeholder="selectedTag?.requires_evidence ? '必填：Google Drive、Dropbox、OneDrive、Imgur 或澄清報導 URL' : '可選填'"
          />
        </label>

        <label class="block text-xs text-zinc-400">
          簡短證據說明
          <textarea
            v-model="evidenceNote"
            rows="3"
            class="mt-2 w-full resize-none rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
            :disabled="!isVotingOpen"
            :placeholder="selectedTag?.requires_evidence ? '必填：這個證據如何支持你的判斷？' : '可選填'"
          ></textarea>
        </label>

        <p v-if="voteError" class="rounded-md border border-red-400/40 bg-red-500/10 p-2 text-xs text-red-100">{{ voteError }}</p>
        <p v-if="voteMessage" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-2 text-xs text-emerald-100">{{ voteMessage }}</p>

        <button
          class="w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loading || submitting || !selectedTagId || !isVotingOpen"
          @click="submitVote"
        >
          {{ !isVotingOpen ? '投票已截止' : submitting ? '送出中...' : isLoggedIn ? (hasReadEnough ? '送出或更新我的投票' : '閱讀達門檻後可投票') : '登入後投票' }}
        </button>
      </section>

      <section v-else class="mt-4 space-y-3 border-t border-white/10 pt-4">
        <div class="flex items-center justify-between">
          <p class="text-sm font-semibold text-white">社群證據</p>
          <span class="text-xs text-zinc-500">{{ evidence.length }} 筆</span>
        </div>

        <p v-if="isLoggedIn && !canReactToEvidence" class="rounded-md border border-orange-400/40 bg-orange-500/10 p-2 text-xs text-orange-100">
          你的信用權重需達 {{ evidenceReactionMinTrustScore.toFixed(2) }} 才能評分證據；目前仍可閱讀證據與投票結果。
        </p>

        <p v-if="evidenceError" class="rounded-md border border-red-400/40 bg-red-500/10 p-2 text-xs text-red-100">{{ evidenceError }}</p>
        <p v-if="reportMessage" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-2 text-xs text-emerald-100">{{ reportMessage }}</p>

        <div v-if="evidence.length === 0" class="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-400">
          尚無證據。負面投票會要求提供截圖、雲端硬碟圖片或澄清連結。
        </div>

        <article v-for="item in evidence" :key="item.id" class="space-y-3 rounded-md border border-white/10 bg-zinc-900/80 p-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded bg-white/10 px-2 py-1 text-[11px] font-semibold text-zinc-200">{{ item.tag.name }}</span>
            <span class="rounded px-2 py-1 text-[11px] font-semibold" :class="item.is_trusted_evidence ? 'bg-emerald-500/15 text-emerald-200' : 'bg-zinc-800 text-zinc-400'">
              {{ evidenceTrustLabel(item) }}
            </span>
            <span class="ml-auto text-[11px] text-zinc-500">淨有用權重 {{ Number(item.net_helpful_weight).toFixed(2) }}</span>
          </div>

          <img v-if="evidencePreviewUrl(item)" :src="evidencePreviewUrl(item)" alt="" class="max-h-36 w-full rounded-md border border-white/10 object-cover" />

          <p class="text-sm leading-5 text-zinc-200">{{ item.evidence_note || '未提供說明' }}</p>

          <div class="rounded-md border border-white/10 bg-white/[0.03] p-2">
            <p class="text-[11px] text-zinc-500">{{ evidenceTypeLabel(item) }}</p>
            <a :href="item.evidence_url" target="_blank" rel="noreferrer" class="mt-1 block truncate text-xs font-semibold text-cyan-200">
              {{ item.evidence_host || item.evidence_url }}
            </a>
          </div>

          <div class="flex items-center gap-2">
            <button class="rounded-md border border-emerald-300/30 px-2 py-1 text-xs text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50" :disabled="reactingId === item.id || !isVotingOpen || (isLoggedIn && !canReactToEvidence)" @click="react(item, true)">
              有用 {{ item.helpful_count }}
            </button>
            <button class="rounded-md border border-red-300/30 px-2 py-1 text-xs text-red-100 disabled:cursor-not-allowed disabled:opacity-50" :disabled="reactingId === item.id || !isVotingOpen || (isLoggedIn && !canReactToEvidence)" @click="react(item, false)">
              沒幫助 {{ item.unhelpful_count }}
            </button>
            <button class="ml-auto rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-300" @click="reportItem(item)">
              檢舉
            </button>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>
