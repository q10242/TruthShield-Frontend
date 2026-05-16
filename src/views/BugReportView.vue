<script setup>
import { onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { createBugReport } from '../lib/api'
import { trackEvent, trackPageView } from '../lib/traffic'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

const route = useRoute()
const { t } = useI18n()
const form = reactive({
  report_type: 'bug',
  severity: 'medium',
  title: '',
  description: '',
  steps_to_reproduce: '',
  page_url: '',
  attachment_url: '',
  contact_email: '',
  browser: navigator.userAgent,
  extension_version: '',
  source: 'website',
  diagnostics: {},
})
const message = ref('')
const error = ref('')
const submitting = ref(false)

onMounted(() => {
  trackPageView('bug_report')
  form.report_type = String(route.query.report_type || form.report_type)
  form.page_url = String(route.query.url || '')
  form.title = String(route.query.title || '')
  form.extension_version = String(route.query.extension_version || '')
  form.source = String(route.query.source || form.source)
})

async function submit() {
  message.value = ''
  error.value = ''
  submitting.value = true

  try {
    await createBugReport({
      ...form,
      diagnostics: {
        language: navigator.language,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    })
    message.value = t('bugReport.success')
    form.title = ''
    form.description = ''
    form.steps_to_reproduce = ''
    form.attachment_url = ''
    trackEvent('bug_report_completed', { feature: 'bug_report', metadata: { report_type: form.report_type, severity: form.severity } })
  } catch (err) {
    error.value = err.errors?.title?.[0] || err.errors?.description?.[0] || err.message || t('bugReport.failed')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-3xl">
      <AppNav>
        <RouterLink class="text-sm text-zinc-400 hover:text-cyan-100" to="/security">{{ t('common.security') }}</RouterLink>
      </AppNav>

      <p class="text-sm font-semibold text-cyan-300">{{ t('bugReport.eyebrow') }}</p>
      <h1 class="mt-2 text-3xl font-semibold text-white">{{ t('bugReport.title') }}</h1>
      <p class="mt-3 text-sm leading-7 text-zinc-400">{{ t('bugReport.intro') }}</p>

      <div class="mt-6 rounded-lg border border-orange-300/20 bg-orange-500/[0.06] p-4 text-sm leading-6 text-orange-100">
        {{ t('bugReport.securityNotice') }}
      </div>

      <form class="mt-6 grid gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-5 md:grid-cols-2" @submit.prevent="submit">
        <label class="block text-xs text-zinc-400">
          {{ t('bugReport.type') }}
          <select v-model="form.report_type" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white">
            <option value="bug">{{ t('bugReport.typeBug') }}</option>
            <option value="security">{{ t('bugReport.typeSecurity') }}</option>
            <option value="extension">{{ t('bugReport.typeExtension') }}</option>
            <option value="data">{{ t('bugReport.typeData') }}</option>
            <option value="translation">{{ t('bugReport.typeTranslation') }}</option>
            <option value="ux">{{ t('bugReport.typeUx') }}</option>
          </select>
        </label>
        <label class="block text-xs text-zinc-400">
          {{ t('bugReport.severity') }}
          <select v-model="form.severity" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white">
            <option value="low">{{ t('bugReport.low') }}</option>
            <option value="medium">{{ t('bugReport.medium') }}</option>
            <option value="high">{{ t('bugReport.high') }}</option>
            <option value="critical">{{ t('bugReport.critical') }}</option>
          </select>
        </label>
        <input v-model="form.title" required class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white md:col-span-2" :placeholder="t('bugReport.titlePlaceholder')" />
        <textarea v-model="form.description" required rows="5" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white md:col-span-2" :placeholder="t('bugReport.descriptionPlaceholder')"></textarea>
        <textarea v-model="form.steps_to_reproduce" rows="5" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white md:col-span-2" :placeholder="t('bugReport.stepsPlaceholder')"></textarea>
        <input v-model="form.page_url" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white md:col-span-2" :placeholder="t('bugReport.pageUrl')" />
        <input v-model="form.attachment_url" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white md:col-span-2" :placeholder="t('bugReport.attachmentUrl')" />
        <input v-model="form.contact_email" type="email" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white" :placeholder="t('bugReport.contactEmail')" />
        <input v-model="form.extension_version" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white" :placeholder="t('bugReport.extensionVersion')" />
        <input v-model="form.browser" class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white md:col-span-2" :placeholder="t('bugReport.browser')" />
        <p v-if="message" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100 md:col-span-2">{{ message }}</p>
        <p v-if="error" class="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100 md:col-span-2">{{ error }}</p>
        <button type="submit" class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:opacity-50" :disabled="submitting">
          {{ submitting ? t('remaining.submitting') : t('bugReport.submit') }}
        </button>
      </form>
    </section>
  </main>
</template>
