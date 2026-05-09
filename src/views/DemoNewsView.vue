<script setup>
import { onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { trackPageView } from '../lib/traffic'
import { useI18n } from '../i18n'

const { t } = useI18n()

onMounted(() => trackPageView('demo_news'))
</script>

<template>
  <main class="min-h-screen bg-zinc-950 text-zinc-100">
    <section class="mx-auto max-w-6xl px-6 py-8">
      <BrandLink />

      <section class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <article class="overflow-hidden rounded-lg border border-white/10 bg-zinc-100 text-zinc-950">
          <div class="flex items-center justify-between gap-3 bg-zinc-950 px-4 py-3 text-zinc-100">
            <div class="flex items-center gap-3">
              <img class="h-7 w-7" src="/brand/truthshield-mark.svg" alt="" />
              <div>
                <p class="text-sm font-semibold">TruthShield</p>
                <p class="text-xs text-zinc-400">{{ t('demoNews.bannerSubtitle') }}</p>
              </div>
            </div>
            <span class="rounded bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-100">{{ t('demoNews.bannerStatus') }}</span>
          </div>

          <div class="border-b border-zinc-200 bg-white px-6 py-4">
            <p class="text-sm font-semibold text-zinc-500">{{ t('demoNews.mediaName') }}</p>
            <h1 class="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-zinc-950">{{ t('demoNews.articleTitle') }}</h1>
            <p class="mt-3 text-sm text-zinc-500">{{ t('demoNews.articleMeta') }}</p>
          </div>

          <div class="grid gap-6 bg-white px-6 py-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div class="space-y-5 text-base leading-8 text-zinc-800">
              <p>{{ t('demoNews.paragraph1') }}</p>
              <p>
                {{ t('demoNews.paragraph2Before') }}
                <span class="group relative inline-flex">
                  <a class="rounded bg-cyan-100 px-1 font-semibold text-cyan-800 underline decoration-cyan-500 decoration-2 underline-offset-4" href="#" @click.prevent>
                    {{ t('demoNews.relatedLink') }}
                  </a>
                  <span class="pointer-events-none absolute left-0 top-8 z-10 hidden w-80 rounded-lg border border-red-300/50 bg-zinc-950 p-4 text-sm text-white shadow-2xl group-hover:block">
                    <span class="flex items-center justify-between gap-3">
                      <span class="font-semibold text-cyan-200">TruthShield</span>
                      <span class="text-xs text-zinc-500">{{ t('demoNews.tooltipLive') }}</span>
                    </span>
                    <span class="mt-3 block rounded-md border border-red-300/40 bg-red-500/20 p-3 font-semibold text-red-100">{{ t('demoNews.tooltipText') }}</span>
                    <span class="mt-2 block text-xs leading-5 text-zinc-400">{{ t('demoNews.tooltipHint') }}</span>
                  </span>
                </span>
                {{ t('demoNews.paragraph2After') }}
              </p>
              <p>{{ t('demoNews.paragraph3') }}</p>

              <div class="rounded-lg border border-cyan-200 bg-cyan-50 p-4">
                <h2 class="text-base font-semibold text-cyan-950">{{ t('demoNews.tryTitle') }}</h2>
                <p class="mt-2 text-sm leading-6 text-cyan-900">{{ t('demoNews.tryDesc') }}</p>
                <div class="mt-4 flex flex-wrap gap-3">
                  <button class="rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-zinc-950" type="button">
                    {{ t('demoNews.fakeOpenPanel') }}
                  </button>
                  <button class="rounded-md border border-cyan-300 px-4 py-2 text-sm font-semibold text-cyan-900" type="button">
                    {{ t('demoNews.fakeRightClick') }}
                  </button>
                </div>
              </div>
            </div>

            <aside class="space-y-4">
              <div class="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{{ t('demoNews.contextMenuTitle') }}</p>
                <div class="mt-3 rounded-md border border-zinc-200 bg-white p-2 text-sm shadow-lg">
                  <div class="rounded px-2 py-2 hover:bg-cyan-50">{{ t('home.extensionContextMenuStatus') }}</div>
                  <div class="rounded px-2 py-2 hover:bg-cyan-50">{{ t('home.extensionContextMenuVote') }}</div>
                  <div class="rounded px-2 py-2 hover:bg-cyan-50">{{ t('home.extensionContextMenuReport') }}</div>
                </div>
              </div>

              <div class="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                <p class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{{ t('demoNews.panelTitle') }}</p>
                <div class="mt-3 rounded-lg bg-zinc-950 p-4 text-zinc-100">
                  <div class="flex items-center justify-between gap-3">
                    <span class="text-sm font-semibold text-cyan-200">TruthShield</span>
                    <span class="rounded bg-emerald-400/15 px-2 py-1 text-xs font-semibold text-emerald-100">{{ t('demoNews.panelOpen') }}</span>
                  </div>
                  <p class="mt-4 text-sm font-semibold">{{ t('demoNews.panelResult') }}</p>
                  <div class="mt-3 rounded-md border border-red-300/40 bg-red-500/20 p-3 text-sm font-semibold text-red-100">{{ t('demoNews.tooltipText') }}</div>
                  <p class="mt-4 text-xs text-zinc-400">{{ t('demoNews.panelReading') }}</p>
                  <div class="mt-2 h-2 rounded-full bg-zinc-800">
                    <div class="h-2 w-4/5 rounded-full bg-cyan-300"></div>
                  </div>
                  <div class="mt-4 grid gap-2">
                    <span class="rounded-md border border-white/10 px-3 py-2 text-xs text-cyan-100">{{ t('demoNews.panelTag1') }}</span>
                    <span class="rounded-md border border-white/10 px-3 py-2 text-xs text-zinc-300">{{ t('demoNews.panelTag2') }}</span>
                    <span class="rounded-md border border-white/10 px-3 py-2 text-xs text-zinc-300">{{ t('demoNews.panelTag3') }}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </article>

        <aside class="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <div class="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-5">
            <p class="text-sm font-semibold text-cyan-300">{{ t('demoNews.sideEyebrow') }}</p>
            <h2 class="mt-2 text-2xl font-semibold text-white">{{ t('demoNews.sideTitle') }}</h2>
            <p class="mt-3 text-sm leading-7 text-zinc-400">{{ t('demoNews.sideDesc') }}</p>
            <div class="mt-5 grid gap-3">
              <RouterLink class="rounded-md bg-cyan-300 px-4 py-3 text-center text-sm font-semibold text-zinc-950" to="/extension-install">
                {{ t('common.extensionInstall') }}
              </RouterLink>
              <RouterLink class="rounded-md border border-white/15 px-4 py-3 text-center text-sm font-semibold text-zinc-100 hover:border-cyan-300/50" to="/user-guide">
                {{ t('common.userGuide') }}
              </RouterLink>
            </div>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <h2 class="text-lg font-semibold text-white">{{ t('demoNews.notesTitle') }}</h2>
            <ul class="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
              <li>• {{ t('demoNews.note1') }}</li>
              <li>• {{ t('demoNews.note2') }}</li>
              <li>• {{ t('demoNews.note3') }}</li>
            </ul>
          </div>
        </aside>
      </section>
    </section>
  </main>
</template>
