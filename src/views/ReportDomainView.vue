<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchNewsDomainReportStatus, reportNewsDomain } from '../lib/api'

const route = useRoute()
const url = ref(route.query.url || '')
const pageTitle = ref(route.query.page_title || '')
const note = ref('')
const error = ref('')
const message = ref('')
const submitting = ref(false)
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
        <h1 class="mt-2 text-2xl font-semibold text-white">回報未收錄新聞網站</h1>
        <p class="mt-2 text-sm leading-6 text-zinc-400">
          這個網站目前不在插件監控清單內。回報後會先進入待審清單，不會直接加入正式 domain。
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

        <div v-if="domain" class="rounded-md border border-cyan-300/30 bg-cyan-300/10 p-3 text-sm text-cyan-100">
          將回報 domain：{{ domain }}
        </div>

        <div v-if="existingReport" class="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-300">
          目前狀態：{{ existingReport.status }}，累計 {{ existingReport.report_count }} 次回報。
        </div>

        <p v-if="error" class="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{{ error }}</p>
        <p v-if="message" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{{ message }}</p>

        <button
          class="w-full rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="submitting"
        >
          {{ submitting ? '送出中...' : '送出回報' }}
        </button>
      </form>
    </section>
  </main>
</template>
