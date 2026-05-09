<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  fetchNewsDomainReportStatus,
  fetchYoutubeChannelReportStatus,
  reportNewsDomain,
  reportUrlClassification,
  reportYoutubeChannel,
  suggestTrustedSource,
} from '../lib/api'
import { trackEvent, trackPageView } from '../lib/traffic'
import { useI18n } from '../i18n'

const route = useRoute()
const { t } = useI18n()
const url = ref(route.query.url || '')
const pageTitle = ref(route.query.page_title || '')
const note = ref('')
const classification = ref(route.query.classification || 'article')
const sourceType = ref('cloud_drive')
const youtubeChannelUrl = ref(route.query.youtube_channel_url || '')
const youtubeChannelTitle = ref(route.query.youtube_channel_title || '')
const youtubeChannelType = ref('news')
const error = ref('')
const message = ref('')
const classificationMessage = ref('')
const sourceMessage = ref('')
const youtubeMessage = ref('')
const submitting = ref(false)
const classificationSubmitting = ref(false)
const sourceSubmitting = ref(false)
const youtubeSubmitting = ref(false)
const existingReport = ref(null)
const existingYoutubeReport = ref(null)

const domain = computed(() => {
  try {
    return new URL(url.value).hostname
  } catch {
    return ''
  }
})

const isYoutubeContext = computed(() => {
  const host = domain.value.toLowerCase()
  return host === 'youtube.com' || host === 'www.youtube.com' || host === 'm.youtube.com' || host === 'youtu.be' || Boolean(youtubeChannelUrl.value)
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
    trackEvent('domain_report_completed', { feature: 'domain_report', url: url.value, domain: domain.value })
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
    trackEvent('url_classification_completed', { feature: 'url_classification', url: url.value, domain: domain.value, metadata: { classification: classification.value } })
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
    trackEvent('trusted_source_suggested', { feature: 'trusted_source_suggestion', url: url.value, domain: domain.value, metadata: { source_type: sourceType.value } })
  } catch (err) {
    error.value = err.errors?.host?.[0] || err.message || t('remaining.sourceFailed')
  } finally {
    sourceSubmitting.value = false
  }
}

async function submitYoutubeChannel() {
  error.value = ''
  youtubeMessage.value = ''

  if (!youtubeChannelUrl.value) {
    error.value = t('remaining.validYoutubeChannelUrl')
    return
  }

  youtubeSubmitting.value = true

  try {
    await reportYoutubeChannel({
      channel_url: youtubeChannelUrl.value,
      channel_title: youtubeChannelTitle.value || pageTitle.value || undefined,
      channel_type: youtubeChannelType.value,
      note: note.value || undefined,
    })
    youtubeMessage.value = t('remaining.youtubeChannelReceived')
    trackEvent('youtube_channel_report_completed', { feature: 'youtube_channel_report', url: youtubeChannelUrl.value, domain: domain.value, metadata: { channel_type: youtubeChannelType.value } })
    await loadYoutubeStatus()
  } catch (err) {
    error.value = err.errors?.channel_url?.[0] || err.message || t('remaining.youtubeChannelFailed')
  } finally {
    youtubeSubmitting.value = false
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

async function loadYoutubeStatus() {
  if (!youtubeChannelUrl.value) return

  try {
    const payload = await fetchYoutubeChannelReportStatus(youtubeChannelUrl.value)
    existingYoutubeReport.value = payload.report || null
  } catch {
    existingYoutubeReport.value = null
  }
}

onMounted(async () => {
  trackPageView('report_domain')
  if (!youtubeChannelUrl.value && isYoutubeContext.value) {
    youtubeChannelUrl.value = url.value
  }

  await loadStatus()
  await loadYoutubeStatus()
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
        <BrandLink />
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

        <div v-if="isYoutubeContext" class="space-y-3 rounded-lg border border-red-400/20 bg-red-500/5 p-3">
          <div>
            <p class="text-sm font-semibold text-white">{{ t('remaining.youtubeChannelReport') }}</p>
            <p class="mt-1 text-xs leading-5 text-zinc-400">{{ t('remaining.youtubeChannelIntro') }}</p>
          </div>
          <label class="block text-sm text-zinc-300">
            {{ t('remaining.youtubeChannelUrl') }}
            <input
              v-model="youtubeChannelUrl"
              class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-red-300"
              placeholder="https://www.youtube.com/@channel"
            />
          </label>
          <div class="grid gap-3 sm:grid-cols-2">
            <label class="block text-sm text-zinc-300">
              {{ t('remaining.youtubeChannelTitle') }}
              <input
                v-model="youtubeChannelTitle"
                class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-red-300"
                :placeholder="t('remaining.optional')"
              />
            </label>
            <label class="block text-sm text-zinc-300">
              {{ t('remaining.youtubeChannelType') }}
              <select
                v-model="youtubeChannelType"
                class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-red-300"
              >
                <option value="news">{{ t('remaining.channelTypeNews') }}</option>
                <option value="politics">{{ t('remaining.channelTypePolitics') }}</option>
                <option value="official">{{ t('remaining.channelTypeOfficial') }}</option>
                <option value="fact_check">{{ t('remaining.channelTypeFactCheck') }}</option>
                <option value="commentary">{{ t('remaining.channelTypeCommentary') }}</option>
                <option value="other">{{ t('remaining.channelTypeOther') }}</option>
              </select>
            </label>
          </div>
          <div v-if="existingYoutubeReport" class="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-300">
            {{ t('remaining.currentYoutubeReportStatus', { status: existingYoutubeReport.status, count: existingYoutubeReport.report_count }) }}
          </div>
        </div>

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
        <p v-if="youtubeMessage" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{{ youtubeMessage }}</p>
        <div v-if="message || classificationMessage || sourceMessage || youtubeMessage" class="rounded-md border border-white/10 bg-zinc-900 p-3 text-sm text-zinc-300">
          <p class="font-semibold text-white">{{ t('remaining.whatNext') }}</p>
          <p class="mt-1 leading-6 text-zinc-400">{{ t('remaining.reportNext') }}</p>
        </div>

        <div class="grid gap-2 sm:grid-cols-4">
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
          <button
            v-if="isYoutubeContext"
            type="button"
            class="rounded-md border border-red-300/30 px-3 py-2 text-sm font-semibold text-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="youtubeSubmitting"
            @click="submitYoutubeChannel"
          >
            {{ youtubeSubmitting ? t('remaining.submitting') : t('remaining.reportYoutubeChannel') }}
          </button>
        </div>
      </form>
    </section>
  </main>
</template>
