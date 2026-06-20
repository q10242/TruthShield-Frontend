<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { createComment, deleteComment, fetchComments, reactToComment, reportComment } from '../lib/api'
import { submitWithBotChallenge } from '../lib/botChallenge'

const route = useRoute()
const TOKEN_KEY = 'truthshield_api_token'
const USER_KEY = 'truthshield_user'

const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const myUserId = ref(null)
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
    if (stored?.id) myUserId.value = stored.id
  } catch {}
  await load()
})

onBeforeUnmount(() => window.removeEventListener('message', handleMessage))
</script>

<template>
  <main class="comment-panel">
    <header class="panel-header">
      <div>
        <span class="eyebrow">留言板</span>
        <strong>{{ loading ? '讀取中…' : `共 ${total} 則留言` }}</strong>
      </div>
    </header>

    <!-- Compose -->
    <div class="compose">
      <textarea
        v-model="body"
        class="compose-input"
        placeholder="分享你對這篇文章的想法…（最多 500 字）"
        maxlength="500"
        rows="3"
        :disabled="submitting"
        @input="notifyHeight"
      ></textarea>
      <div class="compose-footer">
        <span class="char-count" :class="{ warn: body.length > 450 }">{{ body.length }}/500</span>
        <button class="send-btn" :disabled="submitting || !body.trim()" @click="submit">
          {{ submitting ? '送出中…' : token ? '送出留言' : '登入後留言' }}
        </button>
      </div>
    </div>

    <p v-if="error" class="global-error">{{ error }}</p>

    <div v-if="loading" class="state">載入中…</div>
    <div v-else-if="!comments.length" class="empty">
      <p>還沒有留言，成為第一個留言的讀者。</p>
    </div>

    <template v-else>
      <article
        v-for="comment in comments"
        :key="comment.id"
        class="comment"
        :class="{ deleted: deletedIds.has(comment.id), dimmed: comment.weight_score < 0.2 }"
      >
        <template v-if="deletedIds.has(comment.id)">
          <p class="deleted-msg">留言已刪除</p>
        </template>
        <template v-else>
          <div class="comment-head">
            <div class="avatar">{{ authorInitial(comment) }}</div>
            <div class="author-info">
              <span class="author-name">{{ comment.author?.display_name || 'TruthShield 讀者' }}</span>
              <span v-if="comment.author?.identity_label" class="identity-badge">{{ comment.author.identity_label }}</span>
              <span v-if="comment.author?.badge" class="identity-badge" :style="{ backgroundColor: comment.author.badge.color, color: '#09090b' }">{{ comment.author.badge.name }}</span>
            </div>
            <span class="time">{{ formatTime(comment.created_at) }}</span>
          </div>
          <p class="comment-body" :class="{ folded: comment.weight_score < 0.2 }">{{ comment.body }}</p>
          <div class="comment-actions">
            <button
              class="act-btn"
              :class="{ active: myReactions[comment.id] === 'helpful' }"
              :disabled="reactingId === comment.id"
              @click="react(comment, true)"
            >👍 {{ comment.helpful_count }}</button>
            <button
              class="act-btn"
              :class="{ active: myReactions[comment.id] === 'unhelpful' }"
              :disabled="reactingId === comment.id"
              @click="react(comment, false)"
            >👎 {{ comment.unhelpful_count }}</button>
            <button class="act-btn" @click="startReply(comment.id)">回覆</button>
            <button
              v-if="myUserId && comment.author && comment.author.id === myUserId"
              class="act-btn danger"
              @click="removeComment(comment)"
            >刪除</button>
            <button
              v-else-if="!reportedIds.has(comment.id)"
              class="act-btn muted"
              @click="report(comment)"
            >檢舉</button>
            <span v-else class="act-btn muted" style="cursor:default">已檢舉</span>
          </div>

          <!-- Reply compose -->
          <div v-if="replyingTo === comment.id" class="reply-compose">
            <textarea
              v-model="replyBody[comment.id]"
              class="compose-input small"
              :placeholder="`回覆 ${comment.author?.display_name || '留言'}…`"
              maxlength="500"
              rows="2"
              @input="notifyHeight"
            ></textarea>
            <div class="compose-footer">
              <button class="act-btn" @click="replyingTo = null; notifyHeight()">取消</button>
              <button
                class="send-btn small"
                :disabled="submittingReply === comment.id || !replyBody[comment.id]?.trim()"
                @click="submitReply(comment.id)"
              >{{ submittingReply === comment.id ? '送出中…' : '送出回覆' }}</button>
            </div>
          </div>

          <!-- Replies -->
          <div v-if="comment.replies?.length" class="replies">
            <article
              v-for="reply in comment.replies"
              :key="reply.id"
              class="comment reply"
              :class="{ deleted: deletedIds.has(reply.id) }"
            >
              <template v-if="deletedIds.has(reply.id)">
                <p class="deleted-msg">留言已刪除</p>
              </template>
              <template v-else>
                <div class="comment-head">
                  <div class="avatar small">{{ authorInitial(reply) }}</div>
                  <span class="author-name">{{ reply.author?.display_name || 'TruthShield 讀者' }}</span>
                  <span class="time">{{ formatTime(reply.created_at) }}</span>
                </div>
                <p class="comment-body">{{ reply.body }}</p>
                <div class="comment-actions">
                  <button
                    class="act-btn"
                    :class="{ active: myReactions[reply.id] === 'helpful' }"
                    :disabled="reactingId === reply.id"
                    @click="react(reply, true)"
                  >👍 {{ reply.helpful_count }}</button>
                  <button
                    class="act-btn"
                    :class="{ active: myReactions[reply.id] === 'unhelpful' }"
                    :disabled="reactingId === reply.id"
                    @click="react(reply, false)"
                  >👎 {{ reply.unhelpful_count }}</button>
                  <button
                    v-if="myUserId && reply.author && reply.author.id === myUserId"
                    class="act-btn danger"
                    @click="removeComment(reply)"
                  >刪除</button>
                  <button
                    v-else-if="!reportedIds.has(reply.id)"
                    class="act-btn muted"
                    @click="report(reply)"
                  >檢舉</button>
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
.comment-panel { box-sizing: border-box; width: 100%; padding: 14px; color: #f4f4f5; background: #18181b; font: 13px/1.5 system-ui, sans-serif; }
.panel-header { margin-bottom: 12px; }
.eyebrow { display: block; margin-bottom: 3px; color: #67e8f9; font-size: 11px; font-weight: 800; letter-spacing: .08em; }
strong { display: block; font-size: 15px; }

/* Compose */
.compose { margin-bottom: 14px; border: 1px solid rgba(255,255,255,.12); border-radius: 10px; background: #09090b; overflow: hidden; }
.compose-input { display: block; width: 100%; box-sizing: border-box; border: 0; border-bottom: 1px solid rgba(255,255,255,.08); padding: 10px 12px; background: transparent; color: #f4f4f5; font: 13px/1.5 system-ui, sans-serif; resize: none; }
.compose-input:focus { outline: none; border-bottom-color: rgba(103,232,249,.4); }
.compose-input.small { font-size: 12px; }
.compose-input::placeholder { color: #3f3f46; }
.compose-footer { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 7px 10px; }
.char-count { font-size: 11px; color: #3f3f46; margin-right: auto; }
.char-count.warn { color: #fcd34d; }
.send-btn { border: 0; border-radius: 8px; padding: 6px 14px; background: #67e8f9; color: #083344; font-weight: 800; font-size: 12px; cursor: pointer; }
.send-btn:disabled { opacity: .45; cursor: not-allowed; }
.send-btn.small { padding: 4px 10px; font-size: 11px; }

/* Comments */
.state, .empty { padding: 18px 0; text-align: center; color: #52525b; font-size: 13px; }
.global-error { margin-bottom: 10px; color: #fda4af; font-size: 12px; }

.comment { padding: 10px 0; border-top: 1px solid rgba(255,255,255,.07); }
.comment.reply { padding: 8px 0 4px; border-top: 1px solid rgba(255,255,255,.05); }
.comment.dimmed { opacity: .55; }
.deleted-msg { color: #3f3f46; font-size: 12px; font-style: italic; }

.comment-head { display: flex; align-items: center; gap: 7px; margin-bottom: 6px; }
.avatar { flex-shrink: 0; width: 26px; height: 26px; border-radius: 50%; background: rgba(103,232,249,.15); color: #67e8f9; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.avatar.small { width: 20px; height: 20px; font-size: 10px; }
.author-info { display: flex; align-items: center; gap: 5px; min-width: 0; flex: 1; }
.author-name { font-weight: 700; font-size: 12px; color: #d4d4d8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.identity-badge { flex-shrink: 0; border-radius: 4px; padding: 1px 5px; background: rgba(255,255,255,.08); color: #a1a1aa; font-size: 10px; font-weight: 700; }
.time { flex-shrink: 0; font-size: 11px; color: #52525b; margin-left: auto; }

.comment-body { margin: 0 0 8px; color: #d4d4d8; font-size: 13px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; }
.comment-body.folded { color: #71717a; font-size: 12px; }

.comment-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-bottom: 2px; }
.act-btn { border: 1px solid rgba(255,255,255,.1); border-radius: 6px; padding: 2px 8px; background: transparent; color: #71717a; font-size: 11px; cursor: pointer; }
.act-btn:hover:not(:disabled) { color: #d4d4d8; border-color: rgba(255,255,255,.22); }
.act-btn.active { border-color: rgba(103,232,249,.4); color: #67e8f9; }
.act-btn.danger { border-color: rgba(251,113,133,.25); color: #fda4af; }
.act-btn.muted { border-color: transparent; color: #3f3f46; }
.act-btn:disabled { opacity: .45; cursor: not-allowed; }

.replies { margin-top: 6px; margin-left: 18px; padding-left: 12px; border-left: 2px solid rgba(255,255,255,.07); }

.reply-compose { margin-top: 8px; border: 1px solid rgba(255,255,255,.1); border-radius: 8px; background: #09090b; overflow: hidden; }

.load-more { display: block; width: 100%; margin-top: 14px; border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 9px; background: transparent; color: #71717a; font-size: 12px; cursor: pointer; }
.load-more:hover:not(:disabled) { color: #d4d4d8; border-color: rgba(255,255,255,.2); }
.load-more:disabled { opacity: .45; cursor: not-allowed; }
</style>
