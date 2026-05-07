<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchTags } from '../lib/api'
import { useI18n } from '../i18n'

const { t } = useI18n()
const tags = ref([])
const error = ref('')

const groupedTags = computed(() => ({
  negative: tags.value.filter((tag) => tag.severity !== 'positive'),
  positive: tags.value.filter((tag) => tag.severity === 'positive'),
}))

function criteriaFor(tag) {
  const translated = t(`labelGuide.criteria.${tag.slug}`)
  return translated === `labelGuide.criteria.${tag.slug}` ? tag.description : translated
}

onMounted(async () => {
  try {
    tags.value = await fetchTags()
  } catch (err) {
    error.value = err.message || t('labelGuide.loadFailed')
  }
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-6xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <RouterLink class="text-sm text-cyan-200" to="/platform-rules">{{ t('common.platformRules') }}</RouterLink>
      </nav>

      <p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">{{ t('labelGuide.eyebrow') }}</p>
      <h1 class="mt-3 text-3xl font-semibold text-white">{{ t('labelGuide.title') }}</h1>
      <p class="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">{{ t('labelGuide.intro') }}</p>

      <div v-if="error" class="mt-6 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">{{ error }}</div>
      <div v-else-if="!tags.length" class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">{{ t('common.loading') }}</div>

      <div v-else class="mt-8 grid gap-6 lg:grid-cols-2">
        <section class="rounded-lg border border-red-400/20 bg-red-500/[0.04] p-5">
          <h2 class="text-lg font-semibold text-red-100">{{ t('labelGuide.negativeTitle') }}</h2>
          <div class="mt-4 space-y-3">
            <article v-for="tag in groupedTags.negative" :key="tag.slug" class="rounded-md border border-white/10 bg-zinc-950/70 p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="font-semibold text-white">{{ tag.name }}</p>
                <span class="rounded px-2 py-1 text-xs font-semibold" :style="{ backgroundColor: `${tag.color}22`, color: tag.color }">{{ tag.severity }}</span>
              </div>
              <p class="mt-2 text-sm leading-6 text-zinc-400">{{ criteriaFor(tag) }}</p>
              <p v-if="tag.requires_evidence" class="mt-3 text-xs font-semibold text-amber-200">{{ t('labelGuide.evidenceRequired') }}</p>
            </article>
          </div>
        </section>

        <section class="rounded-lg border border-emerald-400/20 bg-emerald-500/[0.04] p-5">
          <h2 class="text-lg font-semibold text-emerald-100">{{ t('labelGuide.positiveTitle') }}</h2>
          <div class="mt-4 space-y-3">
            <article v-for="tag in groupedTags.positive" :key="tag.slug" class="rounded-md border border-white/10 bg-zinc-950/70 p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="font-semibold text-white">{{ tag.name }}</p>
                <span class="rounded px-2 py-1 text-xs font-semibold" :style="{ backgroundColor: `${tag.color}22`, color: tag.color }">{{ t('labelGuide.positiveBadge') }}</span>
              </div>
              <p class="mt-2 text-sm leading-6 text-zinc-400">{{ criteriaFor(tag) }}</p>
            </article>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>
