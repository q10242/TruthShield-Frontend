<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchNewsDomainReportStatus, reportNewsDomain, reportUrlClassification, suggestTrustedSource } from '../lib/api'

const route = useRoute()
const url = ref(route.query.url || '')
const pageTitle = ref(route.query.page_title || '')
const note = ref('')
const classification = ref(route.query.classification || 'article')
const sourceType = ref('cloud_drive')
const error = ref('')
const message = ref('')
const classificationMessage = ref('')
const sourceMessage = ref('')
const submitting = ref(false)
const classificationSubmitting = ref(false)
const sourceSubmitting = ref(false)
const existingReport = ref(null)

const domain = computed(() => {
  try {
    return new URL(url.value).hostname
  } catch {
    return ''
  }
})

async function submit() {
  error.value = ''
  message.value = ''

  if (!domain.value) {
    error.value = '請輸入有效的新聞網址。'
    return
  }

  submitting.value = true

  try {
    await reportNewsDomain({
      url: url.value,
      page_title: pageTitle.value || undefined,
      note: note.value || undefined,
    })
    message.value = '已收到回報。審核後會加入插件監控清單。'
  } catch (err) {
    error.value = err.errors?.url?.[0] || err.message || '回報失敗'
  } finally {
    submitting.value = false
  }
}

async function submitClassification() {
  error.value = ''
  classificationMessage.value = ''

  if (!domain.value) {
    error.value = '請輸入有效的網址。'
    return
  }

  classificationSubmitting.value = true

  try {
    await reportUrlClassification({
      url: url.value,
      classification: classification.value,
      page_title: pageTitle.value || undefined,
      note: note.value || undefined,
    })
    classificationMessage.value = '已收到 URL 分類回報。多位使用者回報後會形成後台規則建議。'
  } catch (err) {
    error.value = err.errors?.url?.[0] || err.message || '分類回報失敗'
  } finally {
    classificationSubmitting.value = false
  }
}

async function submitTrustedSource() {
  error.value = ''
  sourceMessage.value = ''

  if (!domain.value) {
    error.value = '請輸入有效的來源網址。'
    return
  }

  sourceSubmitting.value = true

  try {
    await suggestTrustedSource({
      url: url.value,
      source_type: sourceType.value,
      note: note.value || undefined,
    })
    sourceMessage.value = '已收到可信來源建議。累積足夠訊號後管理員可一鍵加入可信來源。'
  } catch (err) {
    error.value = err.errors?.host?.[0] || err.message || '可信來源建議失敗'
  } finally {
    sourceSubmitting.value = false
  }
}

async function loadStatus() {
  if (!domain.value) return

  try {
    const payload = await fetchNewsDomainReportStatus(domain.value)
    existingReport.value = payload.report || null
  } catch {
    existingReport.value = null
  }
}

onMounted(async () => {
  await loadStatus()
  if (url.value) {
    await submit()
    await loadStatus()
  }
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-5 py-8 text-zinc-100">
    <section class="mx-auto max-w-xl">
      <div class="mb-6">
        <p class="text-sm font-semibold text-cyan-300">TruthShield</p>
        <h1 class="mt-2 text-2xl font-semibold text-white">社群維護回報</h1>
        <p class="mt-2 text-sm leading-6 text-zinc-400">
          大量資料由使用者回報，系統聚合後交給後台審核。你可以回報未收錄新聞站、URL 是否為文章頁，或建議可信證據來源。
        </p>
      </div>

      <form class="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4" @submit.prevent="submit">
        <label class="block text-sm text-zinc-300">
          新聞網址
          <input
            v-model="url"
            class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
            placeholder="https://example.com/news/story"
          />
        </label>

        <label class="block text-sm text-zinc-300">
          頁面標題
          <input
            v-model="pageTitle"
            class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
            placeholder="可選填"
          />
        </label>

        <label class="block text-sm text-zinc-300">
          補充說明
          <textarea
            v-model="note"
            rows="3"
            class="mt-2 w-full resize-none rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
            placeholder="例如：這是地方新聞網站、財經媒體、或特定專題頁"
          ></textarea>
        </label>

        <label class="block text-sm text-zinc-300">
          URL 分類
          <select
            v-model="classification"
            class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
          >
            <option value="article">這是單篇新聞</option>
            <option value="list">這是分類 / 列表頁</option>
            <option value="home">這是首頁</option>
            <option value="search">這是搜尋頁</option>
            <option value="not_news">這不是新聞頁</option>
            <option value="unknown">不確定</option>
          </select>
        </label>

        <label class="block text-sm text-zinc-300">
          可信來源類型
          <select
            v-model="sourceType"
            class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
          >
            <option value="cloud_drive">雲端硬碟</option>
            <option value="image_host">圖床</option>
            <option value="archive">存證服務</option>
            <option value="fact_check">查核組織</option>
            <option value="government">政府資料</option>
            <option value="media">媒體資料</option>
          </select>
        </label>

        <div v-if="domain" class="rounded-md border border-cyan-300/30 bg-cyan-300/10 p-3 text-sm text-cyan-100">
          將回報 domain：{{ domain }}
        </div>

        <div v-if="existingReport" class="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-300">
          目前狀態：{{ existingReport.status }}，累計 {{ existingReport.report_count }} 次回報。
        </div>

        <p v-if="error" class="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{{ error }}</p>
        <p v-if="message" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{{ message }}</p>
        <p v-if="classificationMessage" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{{ classificationMessage }}</p>
        <p v-if="sourceMessage" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{{ sourceMessage }}</p>

        <div class="grid gap-2 sm:grid-cols-3">
          <button
            class="rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="submitting"
          >
            {{ submitting ? '送出中...' : '回報新聞站' }}
          </button>
          <button
            type="button"
            class="rounded-md border border-white/15 px-3 py-2 text-sm font-semibold text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="classificationSubmitting"
            @click="submitClassification"
          >
            {{ classificationSubmitting ? '送出中...' : '回報 URL 分類' }}
          </button>
          <button
            type="button"
            class="rounded-md border border-white/15 px-3 py-2 text-sm font-semibold text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="sourceSubmitting"
            @click="submitTrustedSource"
          >
            {{ sourceSubmitting ? '送出中...' : '建議可信來源' }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>
