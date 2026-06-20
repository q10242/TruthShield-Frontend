<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { createVote, fetchTags } from '../lib/api'
import { submitWithBotChallenge } from '../lib/botChallenge'

const route = useRoute()
const TOKEN_KEY = 'truthshield_api_token'
const tags = ref([])
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const evidenceUrl = ref('')
const evidenceNote = ref('')
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const message = ref('')

const selectedTag = computed(() => tags.value.find((tag) => String(tag.id) === String(route.query.tag_id)))
const requirement = computed(() => selectedTag.value?.evidence_requirement || (selectedTag.value?.requires_evidence ? 'strong_evidence' : 'optional'))
const needsUrl = computed(() => selectedTag.value?.evidence_url_required ?? requirement.value === 'strong_evidence')
const needsNote = computed(() => selectedTag.value?.evidence_note_required ?? false)

function notifyHeight() {
  nextTick(() => window.parent?.postMessage({
    type: 'TRUTH_SHIELD_VOTE_PANEL_RESIZE',
    height: Math.ceil(document.documentElement.scrollHeight),
    collapsed: false,
  }, '*'))
}

function requestAuth() {
  window.parent?.postMessage({ type: 'TRUTH_SHIELD_AUTH_REQUEST', source: 'truthshield-quick-action' }, '*')
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

async function submit() {
  error.value = ''
  message.value = ''
  if (!token.value) {
    error.value = '請先登入，再送出這次操作。'
    requestAuth()
    return
  }
  if (!selectedTag.value) {
    error.value = '找不到所選標籤，請回到完整面板重試。'
    return
  }
  if (needsUrl.value && !evidenceUrl.value.trim()) {
    error.value = '請提供可公開查閱的來源網址。'
    return
  }
  if (needsNote.value && !evidenceNote.value.trim()) {
    error.value = '請補充簡短說明。'
    return
  }

  submitting.value = true
  try {
    await submitWithBotChallenge('vote.create', (challengeToken, challengeRetry) => createVote(token.value, {
      url: route.query.news_url,
      tag_id: selectedTag.value.id,
      evidence_url: evidenceUrl.value.trim() || undefined,
      evidence_note: evidenceNote.value.trim() || undefined,
      challenge_token: challengeToken || undefined,
      challenge_retry: challengeRetry || undefined,
    }))
    message.value = '投票已送出。'
    window.parent?.postMessage({
      type: 'TRUTH_SHIELD_QUICK_ACTION_COMPLETED',
      action: 'vote',
      url: route.query.news_url,
    }, '*')
  } catch (cause) {
    error.value = cause?.message || '送出失敗，請稍後再試。'
  } finally {
    submitting.value = false
    notifyHeight()
  }
}

onMounted(async () => {
  window.addEventListener('message', handleMessage)
  requestAuth()
  try {
    tags.value = await fetchTags()
  } catch (cause) {
    error.value = cause?.message || '標籤載入失敗。'
  } finally {
    loading.value = false
    notifyHeight()
  }
})

onBeforeUnmount(() => window.removeEventListener('message', handleMessage))
</script>

<template>
  <main class="quick-card">
    <header>
      <span class="eyebrow">快速投票</span>
      <strong>{{ selectedTag?.name || selectedTag?.label || '載入中' }}</strong>
      <p>{{ selectedTag?.description || '只填這個標籤必要的補充資料。' }}</p>
    </header>

    <div v-if="loading" class="state">正在載入…</div>
    <form v-else @submit.prevent="submit">
      <label v-if="needsUrl || requirement !== 'optional'">
        公開來源網址 <span v-if="needsUrl">（必填）</span>
        <input v-model="evidenceUrl" type="url" inputmode="url" placeholder="https://…" :required="needsUrl">
      </label>
      <label v-if="needsNote || requirement !== 'optional'">
        簡短說明 <span v-if="needsNote">（必填）</span>
        <textarea v-model="evidenceNote" rows="3" maxlength="1000" :required="needsNote" placeholder="指出需要留意的段落或原因"></textarea>
      </label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="message" class="success" role="status">{{ message }}</p>
      <button type="submit" :disabled="submitting || Boolean(message)">{{ submitting ? '驗證並送出…' : '送出投票' }}</button>
    </form>
  </main>
</template>

<style scoped>
:global(html), :global(body), :global(#app) { margin: 0; min-height: 100%; background: transparent; }
.quick-card { box-sizing: border-box; width: 100%; padding: 18px; color: #f4f4f5; background: #18181b; font: 14px/1.45 system-ui, sans-serif; }
header { margin-bottom: 14px; }
.eyebrow { display: block; margin-bottom: 4px; color: #67e8f9; font-size: 11px; font-weight: 800; letter-spacing: .08em; }
strong { display: block; font-size: 18px; }
p { margin: 5px 0 0; color: #a1a1aa; }
label { display: grid; gap: 6px; margin-top: 12px; color: #d4d4d8; font-weight: 700; }
input, textarea { box-sizing: border-box; width: 100%; border: 1px solid #3f3f46; border-radius: 10px; padding: 10px 11px; color: white; background: #09090b; font: inherit; }
input:focus, textarea:focus { border-color: #22d3ee; outline: 2px solid rgb(34 211 238 / .18); }
button { width: 100%; margin-top: 15px; border: 0; border-radius: 10px; padding: 11px; color: #083344; background: #67e8f9; font-weight: 900; cursor: pointer; }
button:disabled { cursor: wait; opacity: .55; }
.error { color: #fda4af; }
.success { color: #86efac; }
.state { color: #a1a1aa; }
</style>
