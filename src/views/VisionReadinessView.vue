<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchVisionReadiness } from '../lib/api'
import { useI18n } from '../i18n'

const payload = ref(null)
const loading = ref(true)
const activeCategory = ref('')
const activeMode = ref('next')
const { t } = useI18n()

const categoriesByKey = computed(() => Object.fromEntries((payload.value?.categories || []).map((item) => [item.key, item])))
const filteredPoints = computed(() => {
  const points = activeMode.value === 'next'
    ? payload.value?.local_next_points || []
    : activeMode.value === 'polish'
      ? payload.value?.local_completed_polish_points || []
      : payload.value?.feature_points || []
  if (!activeCategory.value) return points

  return points.filter((item) => item.category === activeCategory.value)
})

const categoryProgress = computed(() => (payload.value?.categories || []).map((category) => {
  const points = (payload.value?.feature_points || []).filter((item) => item.category === category.key)
  const implemented = points.filter((item) => item.status === 'implemented').length

  return { ...category, total: points.length, implemented }
}))

const livePressureItems = computed(() => Object.entries(payload.value?.live_pressure || {}).map(([key, value]) => ({
  key,
  value,
  label: t(`vision.livePressure.${key}`),
})))

onMounted(async () => {
  try {
    payload.value = await fetchVisionReadiness()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-6xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="flex items-center gap-3 text-sm font-semibold text-white" to="/">
          <img class="h-9 w-9" src="/brand/truthshield-mark.svg" alt="" />
          <span>TruthShield</span>
        </RouterLink>
        <div class="flex flex-wrap gap-2">
          <RouterLink class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100" to="/transparency">{{ t('common.transparency') }}</RouterLink>
        </div>
      </nav>

      <div v-if="loading" class="rounded-lg border border-white/10 p-5 text-zinc-400">{{ t('common.loading') }}</div>

      <template v-else-if="payload">
        <header class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p class="text-sm font-semibold text-cyan-300">{{ t('vision.eyebrow') }}</p>
            <h1 class="mt-2 text-4xl font-semibold leading-tight text-white">{{ t('vision.title') }}</h1>
            <p class="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">{{ t('vision.intro') }}</p>
          </div>
          <div class="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.05] p-5">
            <p class="text-sm font-semibold text-cyan-100">{{ payload.summary.name }}</p>
            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
                <p class="text-xs text-zinc-500">{{ t('vision.localPoints') }}</p>
                <p class="mt-1 text-3xl font-semibold text-white">{{ payload.summary.completed_local_points }} / {{ payload.summary.local_feature_points }}</p>
              </div>
              <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
                <p class="text-xs text-zinc-500">{{ t('vision.nextPoints') }}</p>
                <p class="mt-1 text-3xl font-semibold text-white">{{ payload.summary.local_next_points }}</p>
              </div>
              <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
                <p class="text-xs text-zinc-500">{{ t('vision.polishPoints') }}</p>
                <p class="mt-1 text-3xl font-semibold text-white">{{ payload.summary.local_completed_polish_points }}</p>
              </div>
              <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
                <p class="text-xs text-zinc-500">{{ t('vision.externalDeps') }}</p>
                <p class="mt-1 text-3xl font-semibold text-white">{{ payload.summary.external_launch_dependencies }}</p>
              </div>
            </div>
          </div>
        </header>

        <section class="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <button
            v-for="category in categoryProgress"
            :key="category.key"
            type="button"
            class="rounded-lg border p-4 text-left transition"
            :class="activeCategory === category.key ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10 bg-white/[0.03] hover:border-cyan-300/50'"
            @click="activeCategory = activeCategory === category.key ? '' : category.key"
          >
            <p class="text-sm font-semibold text-white">{{ category.name }}</p>
            <p class="mt-2 text-xs leading-5 text-zinc-500">{{ category.intent }}</p>
            <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div class="h-full rounded-full bg-cyan-300" :style="{ width: `${category.total ? (category.implemented / category.total) * 100 : 0}%` }"></div>
            </div>
            <p class="mt-2 text-xs text-cyan-200">{{ category.implemented }} / {{ category.total }}</p>
          </button>
        </section>

        <section class="mt-8 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-white">{{ activeMode === 'next' ? t('vision.nextFeaturePoints') : activeMode === 'polish' ? t('vision.polishFeaturePoints') : t('vision.featurePoints') }}</h2>
            <div class="flex flex-wrap gap-2">
              <button type="button" class="rounded-md border px-3 py-2 text-xs font-semibold" :class="activeMode === 'next' ? 'border-cyan-300 bg-cyan-300 text-zinc-950' : 'border-white/10 text-zinc-300'" @click="activeMode = 'next'">{{ t('vision.nextMode') }}</button>
              <button type="button" class="rounded-md border px-3 py-2 text-xs font-semibold" :class="activeMode === 'polish' ? 'border-cyan-300 bg-cyan-300 text-zinc-950' : 'border-white/10 text-zinc-300'" @click="activeMode = 'polish'">{{ t('vision.polishMode') }}</button>
              <button type="button" class="rounded-md border px-3 py-2 text-xs font-semibold" :class="activeMode === 'completed' ? 'border-cyan-300 bg-cyan-300 text-zinc-950' : 'border-white/10 text-zinc-300'" @click="activeMode = 'completed'">{{ t('vision.completedMode') }}</button>
              <button type="button" class="rounded-md border px-3 py-2 text-xs font-semibold" :class="activeMode === 'external' ? 'border-cyan-300 bg-cyan-300 text-zinc-950' : 'border-white/10 text-zinc-300'" @click="activeMode = 'external'">{{ t('vision.externalMode') }}</button>
            </div>
            <button v-if="activeCategory" type="button" class="rounded-md border border-white/10 px-3 py-2 text-xs text-zinc-300" @click="activeCategory = ''">{{ t('vision.clearFilter') }}</button>
          </div>
          <div v-if="activeMode !== 'external'" class="mt-4 grid gap-2 md:grid-cols-2">
            <article v-for="point in filteredPoints" :key="point.id" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-sm font-semibold text-white">{{ point.id }}. {{ point.title }}</p>
                  <p class="mt-1 text-xs text-zinc-500">{{ point.impact || categoriesByKey[point.category]?.name }}</p>
                </div>
                <span class="rounded px-2 py-1 text-[11px] font-semibold" :class="activeMode === 'next' ? 'bg-amber-500/15 text-amber-200' : 'bg-emerald-500/15 text-emerald-200'">{{ activeMode === 'next' ? t('vision.next') : t('vision.implemented') }}</span>
              </div>
            </article>
          </div>
          <div v-else class="mt-4 grid gap-2 md:grid-cols-2">
            <article v-for="item in payload.launch_dependencies" :key="item" class="rounded-md border border-white/10 bg-zinc-950/70 p-3 text-sm text-zinc-300">{{ item }}</article>
          </div>
        </section>

        <section class="mt-8 grid gap-5 lg:grid-cols-2">
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <h2 class="text-xl font-semibold text-white">{{ t('vision.journalismTaxonomy') }}</h2>
            <div class="mt-4 space-y-3">
              <article v-for="tag in [...payload.journalism_taxonomy.negative, ...payload.journalism_taxonomy.positive]" :key="tag.slug" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
                <div class="flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: tag.color }"></span>
                  <p class="text-sm font-semibold text-white">{{ tag.name }}</p>
                  <span class="ml-auto rounded bg-white/10 px-2 py-1 text-[11px] text-zinc-400">{{ tag.severity }}</span>
                </div>
                <p class="mt-2 text-xs leading-5 text-zinc-500">{{ tag.description }}</p>
              </article>
            </div>
          </div>

          <div class="grid gap-5">
            <section class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
              <h2 class="text-xl font-semibold text-white">{{ t('vision.evidenceRubric') }}</h2>
              <div class="mt-4 space-y-2">
                <article v-for="item in payload.evidence_rubric" :key="item.name" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
                  <div class="flex items-center justify-between gap-3">
                    <p class="text-sm font-semibold text-white">{{ item.name }}</p>
                    <span class="rounded bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">{{ item.score }}</span>
                  </div>
                  <p class="mt-2 text-xs leading-5 text-zinc-500">{{ item.description }}</p>
                </article>
              </div>
            </section>

            <section class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
              <h2 class="text-xl font-semibold text-white">{{ t('vision.livePressureTitle') }}</h2>
              <div class="mt-4 grid gap-2 sm:grid-cols-2">
                <div v-for="item in livePressureItems" :key="item.key" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
                  <p class="text-xs text-zinc-500">{{ item.label }}</p>
                  <p class="mt-1 text-2xl font-semibold text-white">{{ item.value }}</p>
                </div>
              </div>
            </section>
          </div>
        </section>

        <section class="mt-8 grid gap-5 lg:grid-cols-3">
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <h2 class="text-lg font-semibold text-white">{{ t('vision.participationLoops') }}</h2>
            <div class="mt-4 space-y-3">
              <article v-for="item in payload.participation_loops" :key="item.role">
                <p class="text-sm font-semibold text-cyan-100">{{ item.role }}</p>
                <p class="mt-1 text-xs leading-5 text-zinc-500">{{ item.loop }}</p>
              </article>
            </div>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <h2 class="text-lg font-semibold text-white">{{ t('vision.operationalPlaybooks') }}</h2>
            <div class="mt-4 space-y-3">
              <article v-for="item in payload.operational_playbooks" :key="item.trigger">
                <p class="text-sm font-semibold text-cyan-100">{{ item.trigger }}</p>
                <p class="mt-1 text-xs leading-5 text-zinc-500">{{ item.action }}</p>
              </article>
            </div>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <h2 class="text-lg font-semibold text-white">{{ t('vision.launchDependencies') }}</h2>
            <ul class="mt-4 space-y-2 text-xs leading-5 text-zinc-400">
              <li v-for="item in payload.launch_dependencies" :key="item">• {{ item }}</li>
            </ul>
          </div>
        </section>

        <section class="mt-8 grid gap-5 lg:grid-cols-2">
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <h2 class="text-lg font-semibold text-white">{{ t('vision.productionChecklist') }}</h2>
            <div class="mt-4 space-y-2">
              <article v-for="item in payload.production_checklist" :key="item.key" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
                <p class="text-sm font-semibold text-white">{{ item.title }}</p>
                <code class="mt-2 block rounded bg-black/30 px-2 py-1 text-xs text-cyan-100">{{ item.command }}</code>
              </article>
            </div>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <h2 class="text-lg font-semibold text-white">{{ t('vision.securityFlow') }}</h2>
            <div class="mt-4 space-y-2">
              <article v-for="item in payload.security_report_flow" :key="item.severity" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
                <p class="text-sm font-semibold text-white">{{ item.severity }}</p>
                <p class="mt-1 text-xs leading-5 text-zinc-500">{{ item.target }}</p>
                <p class="mt-2 text-xs text-cyan-200">{{ item.sla }}</p>
              </article>
            </div>
          </div>
        </section>
      </template>
    </section>
  </main>
</template>
