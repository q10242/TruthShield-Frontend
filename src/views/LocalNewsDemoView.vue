<script setup>
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

const cnaUrl = 'https://www.cna.com.tw/news/aipl/202605060001.aspx'
const secondUrl = 'https://news.pts.org.tw/article/999001'
const { t } = useI18n()
</script>

<template>
  <main class="min-h-screen bg-zinc-950 text-zinc-100">
    <article class="mx-auto max-w-3xl px-5 py-10">
      <AppNav />
      <p class="mt-4 text-xs font-semibold uppercase text-cyan-300">Local QA</p>
      <h1 class="mt-4 text-3xl font-bold leading-tight text-white">
        {{ t('remaining.localQaTitle') }}
      </h1>
      <p class="mt-3 text-sm leading-6 text-zinc-400">
        {{ t('remaining.localQaIntro') }}
      </p>

      <section class="mt-8 space-y-6 text-base leading-8 text-zinc-200">
        <p>
          {{ t('remaining.localQaSetup') }}
          <span class="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-cyan-200">http://127.0.0.1:18080</span>
          {{ t('remaining.vueSiteAt') }}
          <span class="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-cyan-200">http://127.0.0.1:15173</span>
          。
        </p>

        <p>
          {{ t('remaining.hoverCna') }}
          <a class="font-semibold text-cyan-200 underline decoration-cyan-300/50 underline-offset-4" :href="cnaUrl">
            {{ t('remaining.cnaTestLink') }}
          </a>
          {{ t('remaining.hoverDelay') }}
        </p>

        <p>
          {{ t('remaining.hoverSecond') }}
          <a class="font-semibold text-orange-200 underline decoration-orange-300/50 underline-offset-4" :href="secondUrl">
            {{ t('remaining.ptsTestLink') }}
          </a>
          {{ t('remaining.multiDomain') }}
        </p>

        <p>
          {{ t('remaining.realVoteInstruction') }}
          <span class="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm">tester@truthshield.local</span>
          {{ t('remaining.afterLoginInstruction') }}
        </p>

        <div class="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
          {{ t('remaining.httpsNotice') }}
        </div>
      </section>
    </article>
  </main>
</template>
