<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchExtensionCoverage } from '../lib/api'
import { useI18n } from '../i18n'

const rows = ref([])
const { t } = useI18n()
const eventLabels = {
  tooltip_shown: 'remaining.tooltipShown',
  banner_shown: 'remaining.bannerShown',
  vote_panel_opened: 'remaining.votePanelOpened',
  domain_report_opened: 'remaining.domainReportOpened',
  iframe_failed: 'remaining.iframeFailed',
  selector_check_failed: 'remaining.selectorCheckFailed',
}

function eventLabel(type) {
  return eventLabels[type] ? t(eventLabels[type]) : type
}

function domainGrade(row) {
  const events = row.events || []
  if (!events.length) return { label: t('remaining.coverageWatch'), class: 'bg-amber-500/15 text-amber-200' }
  const average = events.reduce((sum, event) => sum + Number(event.success_rate || 0), 0) / events.length
  if (average >= 90) return { label: t('remaining.coverageStable'), class: 'bg-emerald-500/15 text-emerald-200' }
  if (average >= 65) return { label: t('remaining.coverageWatch'), class: 'bg-amber-500/15 text-amber-200' }
  return { label: t('remaining.coverageFailing'), class: 'bg-red-500/15 text-red-200' }
}

onMounted(async () => {
  rows.value = await fetchExtensionCoverage()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-6xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <BrandLink />
        <RouterLink class="text-sm text-zinc-400" to="/health">{{ t('remaining.health') }}</RouterLink>
      </nav>
      <h1 class="text-3xl font-semibold text-white">{{ t('remaining.extensionCoverageTitle') }}</h1>
      <p class="mt-2 text-sm text-zinc-400">{{ t('remaining.extensionCoverageIntro') }}</p>
      <div class="mt-6 grid gap-3">
        <div v-if="rows.length === 0" class="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
          {{ t('remaining.extensionCoverageEmpty') }}
        </div>
        <article v-for="row in rows" :key="row.domain" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div class="flex items-center justify-between gap-3">
            <h2 class="font-semibold text-white">{{ row.domain }}</h2>
            <span class="rounded px-2 py-1 text-xs font-semibold" :class="domainGrade(row).class">{{ domainGrade(row).label }}</span>
          </div>
          <div class="mt-3 grid gap-2 md:grid-cols-3">
            <div v-for="event in row.events" :key="event.event_type" class="rounded-md border border-white/10 p-3">
              <p class="text-xs text-zinc-500">{{ eventLabel(event.event_type) }}</p>
              <p class="mt-1 text-xl font-semibold text-white">{{ event.success_rate }}%</p>
              <p class="mt-1 text-xs text-zinc-500">{{ event.successes }} / {{ event.total }}</p>
            </div>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>
