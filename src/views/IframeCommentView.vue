<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { createComment, deleteComment, fetchComments, reactToComment, reportComment } from '../lib/api'
import { submitWithBotChallenge } from '../lib/botChallenge'

const route = useRoute()
const TOKEN_KEY = 'truthshield_api_token'
const USER_KEY = 'truthshield_user'

const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const myUserId = ref(null)
const myUser = ref(null)
const myInitial = computed(() => String(myUser.value?.display_name || '讀').slice(0, 1).toUpperCase())
const comments = ref([])
const total = ref(0)
const nextCursor = ref(null)
const loading = ref(true)
const loadingMore = ref(false)
const submitting = ref(false)
const error = ref('')
const body = ref('')
const replyingTo = ref(null)
const replyBody = ref({})
const submittingReply = ref(null)
const reactingId = ref(null)
const myReactions = ref({})
const reportedIds = ref(new Set())
const deletedIds = ref(new Set())

function notifyHeight() {
  nextTick(() => window.parent?.postMessage({
    type: 'TRUTH_SHIELD_VOTE_PANEL_RESIZE',
    height: Math.ceil(document.documentElement.scrollHeight),
    collapsed: false,
  }, '*'))
}

function requestAuth() {
  window.parent?.postMessage({ type: 'TRUTH_SHIELD_AUTH_REQUEST', source: 'truthshield-comment' }, '*')
}

function handleMessage(event) {
  const isExtension = event.source === window.parent && event.data?.source === 'truthshield-extension'
  const isSameOrigin = event.origin === window.location.origin
  if (event.data?.type !== 'TRUTH_SHIELD_AUTH_UPDATED' || (!isExtension && !isSameOrigin)) return
  if (event.data.token) {
    token.value = event.data.token
    localStorage.setItem(TOKEN_KEY, event.data.token)
  }
  if (event.data.user?.id) {
    myUserId.value = event.data.user.id
    myUser.value = event.data.user
  }
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = Date.now()
  const diff = (now - d.getTime()) / 1000
  if (diff < 60) return '剛剛'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`
  return `${Math.floor(diff / 86400)} 天前`
}

function authorInitial(comment) {
  return String(comment.author?.display_name || '讀').slice(0, 1).toUpperCase()
}

async function load(cursor = null) {
  const url = route.query.news_url
  if (!url) return
  try {
    const result = await fetchComments(url, cursor)
    if (cursor) {
      comments.value.push(...(result.data || []))
    } else {
      comments.value = result.data || []
      total.value = result.meta?.total || 0
    }
    nextCursor.value = result.meta?.next_cursor || null
    // Merge myReactions from first load
    ;(result.data || []).forEach((c) => {
      if (c.my_reaction) myReactions.value[c.id] = c.my_reaction
      ;(c.replies || []).forEach((r) => { if (r.my_reaction) myReactions.value[r.id] = r.my_reaction })
    })
  } catch (e) {
    error.value = e?.message || '載入留言失敗'
  } finally {
    loading.value = false
    loadingMore.value = false
    notifyHeight()
  }
}

async function submit() {
  if (!token.value) { requestAuth(); return }
  const text = body.value.trim()
  if (!text) return
  submitting.value = true
  error.value = ''
  try {
    const result = await submitWithBotChallenge('comment.create', (challengeToken, challengeRetry) =>
      createComment(token.value, {
        news_url: route.query.news_url,
        body: text,
        challenge_token: challengeToken || undefined,
        challenge_retry: challengeRetry || undefined,
      })
    )
    body.value = ''
    const newComment = result.data
    comments.value.unshift(newComment)
    total.value++
    window.parent?.postMessage({
      type: 'TRUTH_SHIELD_COMMENT_SUBMITTED',
      url: route.query.news_url,
      total: total.value,
    }, '*')
  } catch (e) {
    error.value = e?.message || '送出失敗，請稍後再試。'
  } finally {
    submitting.value = false
    notifyHeight()
  }
}

async function submitReply(parentId) {
  if (!token.value) { requestAuth(); return }
  const text = (replyBody.value[parentId] || '').trim()
  if (!text) return
  submittingReply.value = parentId
  try {
    const result = await submitWithBotChallenge('comment.create', (challengeToken, challengeRetry) =>
      createComment(token.value, {
        news_url: route.query.news_url,
        body: text,
        parent_id: parentId,
        challenge_token: challengeToken || undefined,
        challenge_retry: challengeRetry || undefined,
      })
    )
    const parent = comments.value.find((c) => c.id === parentId)
    if (parent) {
      parent.replies = [result.data, ...(parent.replies || [])]
    }
    replyBody.value[parentId] = ''
    replyingTo.value = null
    total.value++
    window.parent?.postMessage({
      type: 'TRUTH_SHIELD_COMMENT_SUBMITTED',
      url: route.query.news_url,
      total: total.value,
    }, '*')
  } catch (e) {
    error.value = e?.message || '送出失敗'
  } finally {
    submittingReply.value = null
    notifyHeight()
  }
}

async function react(comment, helpful) {
  if (!token.value) { requestAuth(); return }
  if (reactingId.value === comment.id) return
  reactingId.value = comment.id
  try {
    const prev = myReactions.value[comment.id]
    const result = await reactToComment(token.value, comment.id, helpful)
    comment.helpful_count = result.helpful_count
    comment.unhelpful_count = result.unhelpful_count
    if (prev === (helpful ? 'helpful' : 'unhelpful')) {
      delete myReactions.value[comment.id]
    } else {
      myReactions.value[comment.id] = helpful ? 'helpful' : 'unhelpful'
    }
  } catch {}
  reactingId.value = null
  notifyHeight()
}

async function removeComment(comment) {
  if (!token.value) return
  try {
    await deleteComment(token.value, comment.id)
    deletedIds.value.add(comment.id)
    total.value = Math.max(0, total.value - 1)
    window.parent?.postMessage({
      type: 'TRUTH_SHIELD_COMMENT_SUBMITTED',
      url: route.query.news_url,
      total: total.value,
    }, '*')
  } catch {}
  notifyHeight()
}

async function report(comment) {
  if (!token.value) { requestAuth(); return }
  try {
    await reportComment(token.value, comment.id)
    reportedIds.value.add(comment.id)
  } catch {}
}

function startReply(id) {
  replyingTo.value = replyingTo.value === id ? null : id
  nextTick(notifyHeight)
}

onMounted(async () => {
  window.addEventListener('message', handleMessage)
  requestAuth()
  try {
    const stored = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
    if (stored?.id) { myUserId.value = stored.id; myUser.value = stored }
  } catch {}
  await load()
})

onBeforeUnmount(() => window.removeEventListener('message', handleMessage))
</script>

<template>
  <main class="panel">

    <!-- ── Header ── -->
    <header class="top-bar">
      <div class="top-bar-left">
        <span class="top-label">留言板</span>
        <span v-if="!loading" class="count-pill">{{ total }}</span>
      </div>
    </header>

    <!-- ── Compose card ── -->
    <section class="compose-card">
      <div class="compose-avatar">{{ myInitial }}</div>
      <div class="compose-body">
        <textarea
          v-model="body"
          class="compose-ta"
          placeholder="分享你對這篇文章的想法…"
          maxlength="500"
          rows="3"
          :disabled="submitting"
          @input="notifyHeight"
        ></textarea>
        <div class="compose-bar">
          <span class="char-hint" :class="{ warn: body.length > 450 }">{{ body.length }}/500</span>
          <button class="send-btn" :disabled="submitting || !body.trim()" @click="submit">
            {{ submitting ? '送出中…' : token ? '送出留言' : '登入後留言' }}
          </button>
        </div>
      </div>
    </section>

    <p v-if="error" class="err-bar">{{ error }}</p>

    <!-- ── Loading skeletons ── -->
    <template v-if="loading">
      <div v-for="i in 3" :key="i" class="sk-card">
        <div class="sk-row">
          <div class="sk-circle"></div>
          <div class="sk-lines">
            <div class="sk-line short"></div>
            <div class="sk-line long"></div>
          </div>
        </div>
        <div class="sk-block"></div>
        <div class="sk-block thin"></div>
      </div>
    </template>

    <!-- ── Empty state ── -->
    <div v-else-if="!comments.length" class="empty-state">
      <div class="empty-icon">💬</div>
      <p class="empty-title">還沒有留言</p>
      <p class="empty-sub">成為第一個分享想法的讀者，在上方輸入你的看法。</p>
    </div>

    <!-- ── Comment list ── -->
    <template v-else>
      <div class="list-label">最新留言</div>

      <article
        v-for="comment in comments"
        :key="comment.id"
        class="card"
        :class="{ dimmed: comment.weight_score < 0.2 }"
      >
        <!-- Deleted -->
        <p v-if="deletedIds.has(comment.id)" class="deleted-msg">留言已刪除</p>

        <template v-else>
          <!-- Author row -->
          <div class="card-head">
            <div class="avatar">{{ authorInitial(comment) }}</div>
            <div class="card-meta">
              <div class="name-row">
                <span class="author-name">{{ comment.author?.display_name || 'TruthShield 讀者' }}</span>
                <span v-if="comment.author?.identity_label" class="badge id-badge">{{ comment.author.identity_label }}</span>
                <span v-if="comment.author?.badge" class="badge" :style="{ background: comment.author.badge.color, color: '#09090b' }">{{ comment.author.badge.name }}</span>
              </div>
              <span class="time-line">{{ formatTime(comment.created_at) }}</span>
            </div>
          </div>

          <!-- Body -->
          <p class="card-body" :class="{ folded: comment.weight_score < 0.2 }">{{ comment.body }}</p>

          <!-- Actions -->
          <div class="card-actions">
            <button class="act" :class="{ lit: myReactions[comment.id] === 'helpful' }" :disabled="reactingId === comment.id" @click="react(comment, true)">
              👍 <span>{{ comment.helpful_count || '' }}</span>
            </button>
            <button class="act" :class="{ dim: myReactions[comment.id] === 'unhelpful' }" :disabled="reactingId === comment.id" @click="react(comment, false)">
              👎 <span>{{ comment.unhelpful_count || '' }}</span>
            </button>
            <button class="act reply-btn" @click="startReply(comment.id)">
              ↩ 回覆
            </button>
            <button v-if="myUserId && comment.author?.id === myUserId" class="act danger-btn" @click="removeComment(comment)">刪除</button>
            <button v-else-if="!reportedIds.has(comment.id)" class="act ghost-btn" @click="report(comment)">檢舉</button>
            <span v-else class="act ghost-btn" style="cursor:default;opacity:.4">已檢舉</span>
          </div>

          <!-- Reply compose -->
          <div v-if="replyingTo === comment.id" class="reply-compose">
            <textarea
              v-model="replyBody[comment.id]"
              class="reply-ta"
              :placeholder="`回覆 ${comment.author?.display_name || '這則留言'}…`"
              maxlength="500"
              rows="2"
              @input="notifyHeight"
            ></textarea>
            <div class="reply-bar">
              <button class="act ghost-btn" @click="replyingTo = null; notifyHeight()">取消</button>
              <button class="send-btn sm" :disabled="submittingReply === comment.id || !replyBody[comment.id]?.trim()" @click="submitReply(comment.id)">
                {{ submittingReply === comment.id ? '送出中…' : '送出回覆' }}
              </button>
            </div>
          </div>

          <!-- Replies -->
          <div v-if="comment.replies?.length" class="replies">
            <article v-for="reply in comment.replies" :key="reply.id" class="reply-card">
              <p v-if="deletedIds.has(reply.id)" class="deleted-msg">留言已刪除</p>
              <template v-else>
                <div class="card-head">
                  <div class="avatar sm">{{ authorInitial(reply) }}</div>
                  <div class="card-meta">
                    <span class="author-name">{{ reply.author?.display_name || 'TruthShield 讀者' }}</span>
                    <span class="time-line">{{ formatTime(reply.created_at) }}</span>
                  </div>
                </div>
                <p class="card-body reply-body">{{ reply.body }}</p>
                <div class="card-actions">
                  <button class="act" :class="{ lit: myReactions[reply.id] === 'helpful' }" :disabled="reactingId === reply.id" @click="react(reply, true)">👍 <span>{{ reply.helpful_count || '' }}</span></button>
                  <button class="act" :class="{ dim: myReactions[reply.id] === 'unhelpful' }" :disabled="reactingId === reply.id" @click="react(reply, false)">👎 <span>{{ reply.unhelpful_count || '' }}</span></button>
                  <button v-if="myUserId && reply.author?.id === myUserId" class="act danger-btn" @click="removeComment(reply)">刪除</button>
                  <button v-else-if="!reportedIds.has(reply.id)" class="act ghost-btn" @click="report(reply)">檢舉</button>
                </div>
              </template>
            </article>
          </div>
        </template>
      </article>

      <button v-if="nextCursor" class="load-more" :disabled="loadingMore" @click="loadingMore = true; load(nextCursor)">
        {{ loadingMore ? '載入中…' : '載入更多留言' }}
      </button>
    </template>
  </main>
</template>

<style scoped>
:global(html), :global(body), :global(#app) { margin: 0; min-height: 100%; background: transparent; }
* { box-sizing: border-box; }
.panel { width: 100%; padding: 0; color: #e4e4e7; background: #18181b; font: 14px/1.55 system-ui, sans-serif; }

/* ── Header ── */
.top-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px 10px; border-bottom: 1px solid rgba(255,255,255,.07); }
.top-bar-left { display: flex; align-items: center; gap: 8px; }
.top-label { font-size: 15px; font-weight: 800; color: #fff; }
.count-pill { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 20px; padding: 0 6px; border-radius: 999px; background: rgba(103,232,249,.15); color: #67e8f9; font-size: 11px; font-weight: 800; }

/* ── Compose ── */
.compose-card { display: flex; gap: 10px; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.07); background: rgba(255,255,255,.02); }
.compose-avatar { flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, rgba(103,232,249,.25), rgba(103,232,249,.08)); color: #67e8f9; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; margin-top: 2px; }
.compose-body { flex: 1; min-width: 0; }
.compose-ta { display: block; width: 100%; border: 1px solid rgba(255,255,255,.1); border-radius: 10px; padding: 10px 12px; background: #09090b; color: #f4f4f5; font: 13px/1.55 system-ui, sans-serif; resize: none; transition: border-color .15s; }
.compose-ta:focus { outline: none; border-color: rgba(103,232,249,.45); box-shadow: 0 0 0 3px rgba(103,232,249,.06); }
.compose-ta::placeholder { color: #52525b; }
.compose-bar { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.char-hint { font-size: 11px; color: #3f3f46; }
.char-hint.warn { color: #fcd34d; }
.send-btn { border: 0; border-radius: 8px; padding: 7px 16px; background: #67e8f9; color: #083344; font-size: 12px; font-weight: 800; cursor: pointer; transition: opacity .15s; }
.send-btn:disabled { opacity: .4; cursor: not-allowed; }
.send-btn.sm { padding: 5px 12px; font-size: 11px; }

.err-bar { margin: 10px 16px 0; padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(251,113,133,.3); background: rgba(251,113,133,.08); color: #fda4af; font-size: 12px; }

/* ── Skeletons ── */
.sk-card { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.05); }
.sk-row { display: flex; gap: 10px; margin-bottom: 10px; }
.sk-circle { flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%; background: rgba(255,255,255,.06); animation: pulse 1.4s ease infinite; }
.sk-lines { flex: 1; display: flex; flex-direction: column; gap: 6px; justify-content: center; }
.sk-line { height: 10px; border-radius: 5px; background: rgba(255,255,255,.06); animation: pulse 1.4s ease infinite; }
.sk-line.short { width: 40%; }
.sk-line.long { width: 70%; }
.sk-block { height: 12px; border-radius: 5px; background: rgba(255,255,255,.06); margin-bottom: 6px; animation: pulse 1.4s ease infinite; }
.sk-block.thin { width: 55%; }
@keyframes pulse { 0%,100% { opacity:.5 } 50% { opacity:1 } }

/* ── Empty state ── */
.empty-state { padding: 48px 24px 40px; text-align: center; }
.empty-icon { font-size: 44px; line-height: 1; margin-bottom: 16px; opacity: .6; }
.empty-title { font-size: 16px; font-weight: 700; color: #d4d4d8; margin: 0 0 8px; }
.empty-sub { font-size: 13px; color: #71717a; line-height: 1.6; max-width: 260px; margin: 0 auto; }

/* ── List ── */
.list-label { padding: 10px 16px 6px; font-size: 11px; font-weight: 800; letter-spacing: .06em; color: #52525b; text-transform: uppercase; }

.card { padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,.06); transition: background .1s; }
.card:hover { background: rgba(255,255,255,.015); }
.card.dimmed { opacity: .5; }

.card-head { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
.avatar { flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, rgba(103,232,249,.25), rgba(103,232,249,.08)); color: #67e8f9; font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.avatar.sm { width: 26px; height: 26px; font-size: 10px; }
.card-meta { flex: 1; min-width: 0; }
.name-row { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; margin-bottom: 2px; }
.author-name { font-weight: 700; font-size: 13px; color: #d4d4d8; }
.badge { flex-shrink: 0; border-radius: 4px; padding: 2px 6px; background: rgba(255,255,255,.09); color: #a1a1aa; font-size: 10px; font-weight: 700; }
.id-badge { background: rgba(103,232,249,.12); color: #67e8f9; }
.time-line { font-size: 11px; color: #52525b; }

.card-body { margin: 0 0 10px; color: #d4d4d8; font-size: 14px; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
.card-body.folded { color: #71717a; font-size: 13px; }
.reply-body { font-size: 13px; }

.card-actions { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.act { display: inline-flex; align-items: center; gap: 4px; border: 1px solid rgba(255,255,255,.09); border-radius: 6px; padding: 3px 9px; background: transparent; color: #71717a; font-size: 11px; cursor: pointer; transition: color .12s, border-color .12s; }
.act:hover:not(:disabled) { color: #d4d4d8; border-color: rgba(255,255,255,.2); }
.act.lit { border-color: rgba(103,232,249,.4); color: #67e8f9; }
.act.dim { border-color: rgba(251,113,133,.3); color: #fda4af; }
.act:disabled { opacity: .4; cursor: not-allowed; }
.reply-btn { margin-left: 4px; }
.danger-btn { border-color: transparent; color: #ef4444; font-size: 11px; }
.ghost-btn { border-color: transparent; color: #3f3f46; font-size: 11px; }
.ghost-btn:hover:not(:disabled) { color: #71717a; border-color: transparent; }

/* ── Reply compose ── */
.reply-compose { margin: 10px 0 4px 44px; border: 1px solid rgba(255,255,255,.1); border-radius: 10px; background: #09090b; overflow: hidden; }
.reply-ta { display: block; width: 100%; border: 0; border-bottom: 1px solid rgba(255,255,255,.07); padding: 9px 12px; background: transparent; color: #f4f4f5; font: 13px/1.5 system-ui, sans-serif; resize: none; }
.reply-ta:focus { outline: none; border-bottom-color: rgba(103,232,249,.35); }
.reply-ta::placeholder { color: #3f3f46; }
.reply-bar { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 7px 10px; }

/* ── Replies ── */
.replies { margin: 8px 0 2px 44px; border-left: 2px solid rgba(255,255,255,.07); padding-left: 12px; }
.reply-card { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,.04); }
.reply-card:last-child { border-bottom: 0; }

.deleted-msg { color: #3f3f46; font-size: 12px; font-style: italic; padding: 6px 0; }

/* ── Load more ── */
.load-more { display: block; width: calc(100% - 32px); margin: 12px 16px 16px; border: 1px solid rgba(255,255,255,.1); border-radius: 9px; padding: 10px; background: transparent; color: #71717a; font-size: 12px; cursor: pointer; transition: color .12s, border-color .12s; }
.load-more:hover:not(:disabled) { color: #d4d4d8; border-color: rgba(255,255,255,.2); }
.load-more:disabled { opacity: .4; cursor: not-allowed; }
</style>
