<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchNewsDomainReportStatus, reportNewsDomain, reportUrlClassification, suggestTrustedSource } from '../lib/api'
import { useI18n } from '../i18n'

const route = useRoute()
const { t } = useI18n()
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
    error.value = t('remaining.validNewsUrl')
    return
  }

  submitting.value = true

  try {
    await reportNewsDomain({
      url: url.value,
      page_title: pageTitle.value || undefined,
      note: note.value || undefined,
    })
    message.value = t('remaining.reportReceived')
  } catch (err) {
    error.value = err.errors?.url?.[0] || err.message || t('remaining.reportFailed')
  } finally {
    submitting.value = false
  }
}

async function submitClassification() {
  error.value = ''
  classificationMessage.value = ''

  if (!domain.value) {
    error.value = t('remaining.validUrl')
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
    classificationMessage.value = t('remaining.classificationReceived')
  } catch (err) {
    error.value = err.errors?.url?.[0] || err.message || t('remaining.classificationFailed')
  } finally {
    classificationSubmitting.value = false
  }
}

async function submitTrustedSource() {
  error.value = ''
  sourceMessage.value = ''

  if (!domain.value) {
    error.value = t('remaining.validSourceUrl')
    return
  }

  sourceSubmitting.value = true

  try {
    await suggestTrustedSource({
      url: url.value,
      source_type: sourceType.value,
      note: note.value || undefined,
    })
    sourceMessage.value = t('remaining.sourceReceived')
  } catch (err) {
    error.value = err.errors?.host?.[0] || err.message || t('remaining.sourceFailed')
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
        <h1 class="mt-2 text-2xl font-semibold text-white">{{ t('remaining.reportTitle') }}</h1>
        <p class="mt-2 text-sm leading-6 text-zinc-400">
          {{ t('remaining.reportIntro') }}
        </p>
      </div>

      <form class="space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-4" @submit.prevent="submit">
        <label class="block text-sm text-zinc-300">
          {{ t('remaining.newsUrl') }}
          <input
            v-model="url"
            class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
            placeholder="https://example.com/news/story"
          />
        </label>

        <label class="block text-sm text-zinc-300">
          {{ t('remaining.pageTitle') }}
          <input
            v-model="pageTitle"
            class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
            :placeholder="t('remaining.optional')"
          />
        </label>

        <label class="block text-sm text-zinc-300">
          {{ t('remaining.note') }}
          <textarea
            v-model="note"
            rows="3"
            class="mt-2 w-full resize-none rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
            :placeholder="t('remaining.notePlaceholder')"
          ></textarea>
        </label>

        <label class="block text-sm text-zinc-300">
          {{ t('remaining.urlClassification') }}
          <select
            v-model="classification"
            class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
          >
            <option value="article">{{ t('remaining.articlePage') }}</option>
            <option value="list">{{ t('remaining.listPage') }}</option>
            <option value="home">{{ t('remaining.homePage') }}</option>
            <option value="search">{{ t('remaining.searchPage') }}</option>
            <option value="not_news">{{ t('remaining.notNewsPage') }}</option>
            <option value="unknown">{{ t('remaining.unsure') }}</option>
          </select>
        </label>

        <label class="block text-sm text-zinc-300">
          {{ t('remaining.trustedSourceType') }}
          <select
            v-model="sourceType"
            class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
          >
            <option value="cloud_drive">{{ t('evidence.cloudDrive') }}</option>
            <option value="image_host">{{ t('remaining.imageHost') }}</option>
            <option value="archive">{{ t('remaining.archive') }}</option>
            <option value="fact_check">{{ t('remaining.factCheck') }}</option>
            <option value="government">{{ t('remaining.governmentData') }}</option>
            <option value="media">{{ t('remaining.mediaData') }}</option>
          </select>
        </label>

        <div v-if="domain" class="rounded-md border border-cyan-300/30 bg-cyan-300/10 p-3 text-sm text-cyan-100">
          {{ t('remaining.willReportDomain', { domain }) }}
        </div>

        <div v-if="existingReport" class="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-300">
          {{ t('remaining.currentReportStatus', { status: existingReport.status, count: existingReport.report_count }) }}
        </div>

        <p v-if="error" class="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{{ error }}</p>
        <p v-if="message" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{{ message }}</p>
        <p v-if="classificationMessage" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{{ classificationMessage }}</p>
        <p v-if="sourceMessage" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{{ sourceMessage }}</p>
        <div v-if="message || classificationMessage || sourceMessage" class="rounded-md border border-white/10 bg-zinc-900 p-3 text-sm text-zinc-300">
          <p class="font-semibold text-white">{{ t('remaining.whatNext') }}</p>
          <p class="mt-1 leading-6 text-zinc-400">{{ t('remaining.reportNext') }}</p>
        </div>

        <div class="grid gap-2 sm:grid-cols-3">
          <button
            class="rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="submitting"
          >
            {{ submitting ? t('remaining.submitting') : t('remaining.reportNewsSite') }}
          </button>
          <button
            type="button"
            class="rounded-md border border-white/15 px-3 py-2 text-sm font-semibold text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="classificationSubmitting"
            @click="submitClassification"
          >
            {{ classificationSubmitting ? t('remaining.submitting') : t('remaining.reportUrlClassification') }}
          </button>
          <button
            type="button"
            class="rounded-md border border-white/15 px-3 py-2 text-sm font-semibold text-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="sourceSubmitting"
            @click="submitTrustedSource"
          >
            {{ sourceSubmitting ? t('remaining.submitting') : t('remaining.suggestTrustedSource') }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>
