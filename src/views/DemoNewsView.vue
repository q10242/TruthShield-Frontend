<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { trackPageView } from '../lib/traffic'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'
import { markOnboardingStep } from '../lib/onboarding'

const { t } = useI18n()

const navKeys = ['navPolitics', 'navSociety', 'navInternational', 'navLife', 'navVideo']
const trendingKeys = ['trending1', 'trending2', 'trending3', 'trending4']
const resultKeys = ['panelTag1', 'panelTag2', 'panelTag3']
const demoLinks = {
  primary: 'https://example.com/article',
  related1: 'https://www.cna.com.tw/news/aipl/202605160202.aspx',
  related2: 'https://www.cna.com.tw/news/afe/202605240093.aspx',
}
const demoFeedback = ref('')
let feedbackTimer = null

onMounted(() => {
  trackPageView('demo_news')
  markOnboardingStep('open_demo').catch(() => null)
})

function showDemoFeedback(key) {
  demoFeedback.value = t(`demoNews.${key}`)
  window.clearTimeout(feedbackTimer)
  feedbackTimer = window.setTimeout(() => {
    demoFeedback.value = ''
  }, 2600)
}

async function copyDemoLink() {
  try {
    await navigator.clipboard?.writeText(window.location.href)
  } catch {
    // Some browser test surfaces do not expose clipboard access.
  }
  showDemoFeedback('copyFeedback')
}
</script>

<template>
  <main class="min-h-screen bg-[#eceff1] text-zinc-950">
    <section class="mx-auto max-w-7xl px-4 py-5">
      <AppNav>
        <RouterLink class="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white" to="/extension-install">
          {{ t('common.extensionInstall') }}
        </RouterLink>
        <RouterLink class="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700" to="/user-guide">
          {{ t('common.userGuide') }}
        </RouterLink>
      </AppNav>

      <section class="overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-sm">
        <div class="border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-500">
          {{ t('demoNews.demoNotice') }}
        </div>

        <header class="bg-white">
          <div class="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <p class="text-3xl font-black tracking-tight text-zinc-950">{{ t('demoNews.mediaName') }}</p>
              <p class="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{{ t('demoNews.mediaTagline') }}</p>
            </div>
            <div class="flex min-w-[220px] flex-1 justify-end">
              <div class="hidden h-16 w-full max-w-md items-center justify-center border border-dashed border-zinc-300 bg-zinc-100 text-xs font-semibold text-zinc-500 md:flex">
                {{ t('demoNews.adLabel') }}
              </div>
            </div>
          </div>
          <nav class="flex items-center gap-6 overflow-x-auto border-y border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-700">
            <span v-for="key in navKeys" :key="key" class="whitespace-nowrap">{{ t(`demoNews.${key}`) }}</span>
            <span class="ml-auto hidden min-w-56 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-500 lg:block">
              {{ t('demoNews.searchPlaceholder') }}
            </span>
          </nav>
        </header>

        <div id="truthshield-demo-banner" class="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-cyan-300/25 bg-zinc-950 px-4 py-3 text-zinc-100 shadow-lg">
          <button class="flex min-w-0 items-center gap-3 text-left" type="button" @click="showDemoFeedback('panelFeedback')">
            <img class="h-8 w-8 shrink-0" src="/brand/truthshield-mark.svg" alt="" />
            <span class="min-w-0">
              <span class="block text-sm font-bold text-cyan-200">TruthShield</span>
              <span class="block truncate text-xs text-zinc-400">{{ t('demoNews.bannerSubtitle') }}</span>
            </span>
          </button>
          <div class="flex items-center gap-2">
            <span class="hidden rounded bg-red-500/20 px-2 py-1 text-xs font-bold text-red-100 sm:inline">{{ t('demoNews.tooltipText') }}</span>
            <span class="rounded bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-300">{{ t('demoNews.bannerStatus') }}</span>
          </div>
        </div>

        <section class="grid gap-8 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article class="min-w-0">
            <div class="border-b border-zinc-200 pb-5">
              <p class="text-sm font-bold text-red-600">{{ t('demoNews.category') }}</p>
              <h1 class="mt-3 max-w-4xl text-3xl font-black leading-tight text-zinc-950 md:text-5xl">
                {{ t('demoNews.articleTitle') }}
              </h1>
              <p class="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">{{ t('demoNews.articleLead') }}</p>
              <div class="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                <span>{{ t('demoNews.articleMeta') }}</span>
                <span>·</span>
                <span>{{ t('demoNews.author') }}</span>
                <span>·</span>
                <button class="rounded-full border border-zinc-300 px-3 py-1 text-xs font-bold text-zinc-600" type="button" @click="showDemoFeedback('shareFeedback')">
                  {{ t('demoNews.share') }}
                </button>
                <button class="rounded-full border border-zinc-300 px-3 py-1 text-xs font-bold text-zinc-600" type="button" @click="copyDemoLink">
                  {{ t('demoNews.copyLink') }}
                </button>
              </div>
              <p v-if="demoFeedback" class="mt-3 rounded-md border border-cyan-300/30 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-900" role="status">
                {{ demoFeedback }}
              </p>
            </div>

            <div class="relative mt-6">
              <figure class="mb-6">
                <div class="flex aspect-[16/9] items-center justify-center border border-zinc-200 bg-[linear-gradient(135deg,#dfe3e8,#f8fafc_52%,#c7d2fe)] text-sm font-semibold text-zinc-500">
                  {{ t('demoNews.photoCaption') }}
                </div>
                <figcaption class="mt-2 text-xs text-zinc-500">{{ t('demoNews.photoCredit') }}</figcaption>
              </figure>

              <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div class="min-w-0 space-y-5 text-lg leading-9 text-zinc-800">
                  <p>{{ t('demoNews.paragraph1') }}</p>
                  <p>
                    {{ t('demoNews.paragraph2Before') }}
                    <span class="group relative inline-flex">
                      <a class="rounded bg-cyan-100 px-1 font-bold text-cyan-800 underline decoration-cyan-500 decoration-2 underline-offset-4" :href="demoLinks.primary" target="_blank" rel="noopener noreferrer">
                        {{ t('demoNews.relatedLink') }}
                      </a>
                      <span class="pointer-events-none absolute left-0 top-8 z-30 hidden w-80 rounded-lg border border-cyan-300/30 bg-zinc-950 p-4 text-sm leading-6 text-white shadow-2xl group-hover:block">
                        <span class="flex items-center justify-between gap-3">
                          <span class="font-bold text-cyan-200">TruthShield</span>
                          <span class="text-xs text-zinc-500">{{ t('demoNews.tooltipLive') }}</span>
                        </span>
                        <span class="mt-3 block rounded-md border border-red-300/40 bg-red-500/20 p-3 font-bold text-red-100">{{ t('demoNews.tooltipText') }}</span>
                        <span class="mt-2 block text-xs leading-5 text-zinc-400">{{ t('demoNews.tooltipHint') }}</span>
                      </span>
                    </span>
                    {{ t('demoNews.paragraph2After') }}
                  </p>
                  <p>{{ t('demoNews.paragraph3') }}</p>
                  <p>{{ t('demoNews.paragraph4') }}</p>
                  <p>{{ t('demoNews.paragraph5') }}</p>

                  <section class="border-y border-zinc-200 py-5">
                    <p class="text-sm font-bold text-zinc-500">{{ t('demoNews.relatedHeading') }}</p>
                    <div class="mt-3 grid gap-3 md:grid-cols-2">
                      <a class="block border border-zinc-200 bg-zinc-50 p-4 text-sm font-bold leading-6 text-zinc-800 hover:border-cyan-300" :href="demoLinks.related1" target="_blank" rel="noopener noreferrer">
                        {{ t('demoNews.related1') }}
                      </a>
                      <a class="block border border-zinc-200 bg-zinc-50 p-4 text-sm font-bold leading-6 text-zinc-800 hover:border-cyan-300" :href="demoLinks.related2" target="_blank" rel="noopener noreferrer">
                        {{ t('demoNews.related2') }}
                      </a>
                    </div>
                  </section>
                </div>

                <aside class="space-y-4">
                  <section class="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                    <p class="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{{ t('demoNews.contextMenuTitle') }}</p>
                    <p class="mt-2 text-sm leading-6 text-zinc-600">{{ t('demoNews.contextMenuDesc') }}</p>
                    <div class="mt-3 rounded-md border border-zinc-200 bg-white p-2 text-sm shadow-lg">
                      <div class="rounded px-2 py-2 hover:bg-cyan-50">{{ t('home.extensionContextMenuStatus') }}</div>
                      <div class="rounded px-2 py-2 hover:bg-cyan-50">{{ t('home.extensionContextMenuVote') }}</div>
                      <div class="rounded px-2 py-2 hover:bg-cyan-50">{{ t('home.extensionContextMenuReport') }}</div>
                    </div>
                  </section>

                  <section class="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p class="text-sm font-bold text-amber-950">{{ t('demoNews.evidencePreviewTitle') }}</p>
                    <p class="mt-2 text-sm leading-6 text-amber-900">{{ t('demoNews.evidencePreviewDesc') }}</p>
                  </section>
                </aside>
              </div>
            </div>
          </article>

          <aside class="space-y-4">
            <section class="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h2 class="text-sm font-black text-zinc-950">{{ t('demoNews.trendingTitle') }}</h2>
              <div class="mt-3 space-y-3">
                <div v-for="key in trendingKeys" :key="key" class="border-b border-zinc-200 pb-3 last:border-0 last:pb-0">
                  <p class="text-sm font-bold leading-6 text-zinc-700">{{ t(`demoNews.${key}`) }}</p>
                  <p class="mt-1 text-xs text-zinc-500">{{ t('demoNews.trendingMeta') }}</p>
                </div>
              </div>
            </section>

            <section class="rounded-lg border border-zinc-200 bg-white p-4">
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">{{ t('demoNews.sidebarAd') }}</p>
              <div class="mt-3 flex h-40 items-center justify-center border border-dashed border-zinc-300 bg-zinc-50 text-xs font-semibold text-zinc-400">
                {{ t('demoNews.adLabel') }}
              </div>
            </section>

            <section class="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <h2 class="text-sm font-black text-zinc-950">{{ t('demoNews.newsletterTitle') }}</h2>
              <p class="mt-2 text-sm leading-6 text-zinc-600">{{ t('demoNews.newsletterDesc') }}</p>
              <button class="mt-3 w-full rounded-md bg-zinc-950 px-4 py-2 text-sm font-bold text-white" type="button" @click="showDemoFeedback('newsletterFeedback')">
                {{ t('demoNews.newsletterButton') }}
              </button>
            </section>
          </aside>
        </section>
      </section>

      <section class="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div class="rounded-lg border border-zinc-300 bg-white p-5">
          <p class="text-sm font-bold text-cyan-700">{{ t('demoNews.sideEyebrow') }}</p>
          <h2 class="mt-2 text-2xl font-black text-zinc-950">{{ t('demoNews.sideTitle') }}</h2>
          <p class="mt-3 text-sm leading-7 text-zinc-600">{{ t('demoNews.sideDesc') }}</p>
        </div>
        <aside id="truthshield-demo-panel" class="rounded-lg border border-zinc-800 bg-zinc-950 p-5 text-zinc-100 shadow-xl">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <img class="h-8 w-8" src="/brand/truthshield-mark.svg" alt="" />
              <div>
                <p class="text-sm font-bold text-cyan-200">TruthShield</p>
                <p class="text-xs text-zinc-500">{{ t('demoNews.panelTitle') }}</p>
              </div>
            </div>
            <span class="rounded bg-emerald-400/15 px-2 py-1 text-xs font-bold text-emerald-100">{{ t('demoNews.panelOpen') }}</span>
          </div>

          <p class="mt-5 text-sm font-bold">{{ t('demoNews.panelResult') }}</p>
          <div class="mt-3 rounded-md border border-red-300/40 bg-red-500/20 p-3 text-sm font-bold text-red-100">
            {{ t('demoNews.tooltipText') }}
          </div>
          <p class="mt-4 text-xs text-zinc-400">{{ t('demoNews.panelReading') }}</p>
          <div class="mt-2 h-2 rounded-full bg-zinc-800">
            <div class="h-2 w-4/5 rounded-full bg-cyan-300"></div>
          </div>
          <div class="mt-4 grid gap-2">
            <span v-for="key in resultKeys" :key="key" class="rounded-md border border-white/10 px-3 py-2 text-xs text-zinc-200">
              {{ t(`demoNews.${key}`) }}
            </span>
          </div>
          <div class="mt-4 rounded-md border border-white/10 bg-white/[0.04] p-3">
            <p class="text-xs font-bold text-zinc-300">{{ t('demoNews.panelEvidenceTitle') }}</p>
            <p class="mt-2 text-xs leading-5 text-zinc-500">{{ t('demoNews.panelEvidenceUrl') }}</p>
          </div>
          <div class="mt-5 grid gap-3">
            <RouterLink class="rounded-md bg-cyan-300 px-4 py-3 text-center text-sm font-bold text-zinc-950" to="/extension-install">
              {{ t('common.extensionInstall') }}
            </RouterLink>
            <RouterLink class="rounded-md border border-white/15 px-4 py-3 text-center text-sm font-bold text-zinc-100 hover:border-cyan-300/50" to="/user-guide">
              {{ t('common.userGuide') }}
            </RouterLink>
          </div>
        </aside>
      </section>
    </section>
  </main>
</template>
