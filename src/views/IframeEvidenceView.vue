<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchNewsEvidence, reactToEvidence } from '../lib/api'
import { submitWithBotChallenge } from '../lib/botChallenge'

const route = useRoute()
const TOKEN_KEY = 'truthshield_api_token'
const evidence = ref([])
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const loading = ref(true)
const error = ref('')
const reactingId = ref(null)
const reactions = ref({})

function notifyHeight() {
  nextTick(() => window.parent?.postMessage({
    type: 'TRUTH_SHIELD_VOTE_PANEL_RESIZE',
    height: Math.ceil(document.documentElement.scrollHeight),
    collapsed: false,
  }, '*'))
}

function requestAuth() {
  window.parent?.postMessage({ type: 'TRUTH_SHIELD_AUTH_REQUEST', source: 'truthshield-evidence' }, '*')
}

function openVotePanel() {
  window.parent?.postMessage({ type: 'TRUTH_SHIELD_OPEN_VOTE_PANEL', tab: 'evidence' }, '*')
}

function handleMessage(event) {
  const isExtension = event.source === window.parent && event.data?.source === 'truthshield-extension'
  const isSameOrigin = event.origin === window.location.origin
  if (event.data?.type !== 'TRUTH_SHIELD_AUTH_UPDATED' || (!isExtension && !isSameOrigin)) return
  if (event.data.token) {
    token.value = event.data.token
    localStorage.setItem(TOKEN_KEY, event.data.token)
  }
}

async function react(item, helpful) {
  if (!token.value) { requestAuth(); return }
  if (reactingId.value === item.id) return
  reactingId.value = item.id
  try {
    await submitWithBotChallenge('evidence.react', (challengeToken, challengeRetry) =>
      reactToEvidence(token.value, item.id, helpful, {
        challenge_token: challengeToken || undefined,
        challenge_retry: challengeRetry || undefined,
      })
    )
    const key = item.id
    reactions.value = {
      ...reactions.value,
      [key]: helpful ? 'helpful' : 'unhelpful',
    }
    if (helpful) item.helpful_count = (item.helpful_count || 0) + 1
    else item.unhelpful_count = (item.unhelpful_count || 0) + 1
  } catch {}
  reactingId.value = null
  notifyHeight()
}

function evidenceHost(item) {
  if (item.evidence_host) return item.evidence_host
  try { return new URL(item.evidence_url).hostname.replace(/^www\./, '') } catch { return item.evidence_url }
}

onMounted(async () => {
  window.addEventListener('message', handleMessage)
  requestAuth()
  const url = route.query.news_url
  if (!url) {
    error.value = '缺少文章網址'
    loading.value = false
    notifyHeight()
    return
  }
  try {
    evidence.value = await fetchNewsEvidence(url)
  } catch (e) {
    error.value = e?.message || '載入失敗，請稍後再試。'
  } finally {
    loading.value = false
    notifyHeight()
  }
})

onBeforeUnmount(() => window.removeEventListener('message', handleMessage))
</script>

<template>
  <main class="evidence-panel">
    <header class="panel-header">
      <div>
        <span class="eyebrow">查看證據</span>
        <strong>社群舉證 {{ loading ? '' : `(${evidence.length})` }}</strong>
      </div>
      <button class="add-btn" @click="openVotePanel">＋ 補充證據</button>
    </header>

    <div v-if="loading" class="state">載入中…</div>
    <div v-else-if="error" class="state error">{{ error }}</div>
    <div v-else-if="!evidence.length" class="empty">
      <p>此文章尚無社群舉證。</p>
      <p class="hint">投票後可附上來源網址，成為第一位提供證據的讀者。</p>
      <button class="add-btn-lg" @click="openVotePanel">補充證據</button>
    </div>

    <template v-else>
      <article v-for="item in evidence" :key="item.id" class="card">
        <div class="card-meta">
          <span v-if="item.tag?.name" class="tag">{{ item.tag.name }}</span>
          <span v-if="item.is_trusted_evidence" class="trusted">已核實</span>
        </div>
        <p v-if="item.evidence_note" class="note">{{ item.evidence_note }}</p>
        <a v-if="item.evidence_url" :href="item.evidence_url" target="_blank" rel="noopener noreferrer" class="source-link">
          {{ evidenceHost(item) }}
        </a>
        <div class="card-actions">
          <button
            class="react-btn helpful"
            :class="{ active: reactions[item.id] === 'helpful' }"
            :disabled="reactingId === item.id"
            @click="react(item, true)"
          >有幫助 {{ item.helpful_count || 0 }}</button>
          <button
            class="react-btn"
            :class="{ active: reactions[item.id] === 'unhelpful' }"
            :disabled="reactingId === item.id"
            @click="react(item, false)"
          >沒幫助 {{ item.unhelpful_count || 0 }}</button>
        </div>
      </article>

      <footer class="panel-footer">
        <button class="add-btn-lg" @click="openVotePanel">＋ 補充證據</button>
      </footer>
    </template>
  </main>
</template>

<style scoped>
:global(html), :global(body), :global(#app) { margin: 0; min-height: 100%; background: transparent; }
.evidence-panel { box-sizing: border-box; width: 100%; padding: 14px; color: #f4f4f5; background: #18181b; font: 13px/1.45 system-ui, sans-serif; }
.panel-header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
.eyebrow { display: block; margin-bottom: 3px; color: #67e8f9; font-size: 11px; font-weight: 800; letter-spacing: .08em; }
strong { display: block; font-size: 15px; }
.add-btn { flex-shrink: 0; border: 1px solid rgba(103,232,249,.4); border-radius: 8px; padding: 5px 10px; color: #67e8f9; background: transparent; font: 11px/1 system-ui, sans-serif; font-weight: 700; cursor: pointer; white-space: nowrap; }
.add-btn:hover { background: rgba(103,232,249,.08); }
.state { padding: 20px 0; color: #a1a1aa; text-align: center; }
.state.error { color: #fda4af; }
.empty { padding: 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,.08); background: rgba(255,255,255,.03); text-align: center; }
.empty p { margin: 0 0 4px; color: #a1a1aa; }
.empty .hint { font-size: 11px; color: #52525b; }
.add-btn-lg { display: block; width: 100%; margin-top: 14px; border: 0; border-radius: 10px; padding: 10px; color: #083344; background: #67e8f9; font-weight: 900; font-size: 13px; cursor: pointer; }
.card { margin-bottom: 10px; border: 1px solid rgba(255,255,255,.09); border-radius: 10px; background: #09090b; padding: 11px; }
.card:last-of-type { margin-bottom: 0; }
.card-meta { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
.tag { border-radius: 5px; padding: 2px 7px; background: rgba(255,255,255,.09); color: #d4d4d8; font-size: 11px; font-weight: 700; }
.trusted { border-radius: 5px; padding: 2px 7px; background: rgba(52,211,153,.12); color: #6ee7b7; font-size: 11px; font-weight: 700; }
.note { margin: 0 0 8px; color: #e4e4e7; font-size: 13px; line-height: 1.5; }
.source-link { display: block; margin-bottom: 10px; color: #67e8f9; font-size: 11px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-actions { display: flex; gap: 7px; }
.react-btn { border: 1px solid rgba(255,255,255,.14); border-radius: 7px; padding: 4px 10px; color: #a1a1aa; background: transparent; font-size: 11px; cursor: pointer; }
.react-btn:hover:not(:disabled) { border-color: rgba(255,255,255,.28); color: #e4e4e7; }
.react-btn.helpful.active { border-color: rgba(52,211,153,.5); color: #6ee7b7; }
.react-btn.active:not(.helpful) { border-color: rgba(251,113,133,.4); color: #fda4af; }
.react-btn:disabled { cursor: wait; opacity: .5; }
.panel-footer { margin-top: 12px; }
</style>
