<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchBotProtectionConfig, fetchSystemHealth } from '../lib/api'
import { useI18n } from '../i18n'

const { t } = useI18n()
const health = ref(null)
const botConfig = ref(null)
const loading = ref(true)

const installSteps = computed(() => [
  {
    title: t('extensionInstall.stepDownloadTitle'),
    description: t('extensionInstall.stepDownloadDesc'),
    code: 'truth-shield-web/public/extension',
  },
  {
    title: t('extensionInstall.stepChromeTitle'),
    description: t('extensionInstall.stepChromeDesc'),
    code: 'chrome://extensions',
  },
  {
    title: t('extensionInstall.stepLoadTitle'),
    description: t('extensionInstall.stepLoadDesc'),
    code: 'public/extension',
  },
  {
    title: t('extensionInstall.stepVerifyTitle'),
    description: t('extensionInstall.stepVerifyDesc'),
    code: 'http://127.0.0.1:15173/local-news-demo',
  },
])

const capabilityCards = computed(() => [
  { label: t('extensionInstall.tooltipStatus'), value: t('extensionInstall.enabled') },
  { label: t('extensionInstall.bannerStatus'), value: t('extensionInstall.enabled') },
  { label: t('extensionInstall.contextMenuStatus'), value: t('extensionInstall.enabled') },
  { label: t('extensionInstall.signedRequests'), value: botConfig.value?.bot_protection_enabled ? t('extensionInstall.protected') : t('extensionInstall.localMode') },
])

onMounted(async () => {
  loading.value = true
  const [healthPayload, botPayload] = await Promise.all([
    fetchSystemHealth().catch(() => null),
    fetchBotProtectionConfig().catch(() => null),
  ])
  health.value = healthPayload
  botConfig.value = botPayload
  loading.value = false
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <RouterLink class="flex items-center gap-3 text-sm font-semibold text-white" to="/">
          <img class="h-9 w-9" src="/brand/truthshield-mark.svg" alt="" />
          <span>TruthShield</span>
        </RouterLink>
        <div class="flex flex-wrap gap-2">
          <RouterLink class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100" to="/local-qa-checklist">
            {{ t('common.localQaChecklist') }}
          </RouterLink>
          <RouterLink class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100" to="/extension-coverage">
            {{ t('common.extensionCoverage') }}
          </RouterLink>
        </div>
      </nav>

      <section class="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          <p class="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-100">
            {{ t('extensionInstall.eyebrow') }}
          </p>
          <h1 class="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-white md:text-5xl">
            {{ t('extensionInstall.title') }}
          </h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
            {{ t('extensionInstall.intro') }}
          </p>
          <div class="mt-6 flex flex-wrap gap-3">
            <a class="rounded-md bg-cyan-300 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-200" href="chrome://extensions">
              {{ t('extensionInstall.openChromeExtensions') }}
            </a>
            <a class="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-zinc-100 hover:border-cyan-300/60 hover:text-cyan-100" href="/truthshield-extension.zip">
              {{ t('extensionInstall.downloadZip') }}
            </a>
            <RouterLink class="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-zinc-100 hover:border-cyan-300/60 hover:text-cyan-100" to="/local-news-demo">
              {{ t('extensionInstall.testDemo') }}
            </RouterLink>
          </div>
          <p class="mt-3 text-xs leading-5 text-zinc-500">{{ t('extensionInstall.zipNote') }}</p>
        </div>

        <aside class="rounded-lg border border-cyan-300/20 bg-zinc-900 p-5 shadow-2xl shadow-cyan-950/30">
          <h2 class="text-sm font-semibold text-white">{{ t('extensionInstall.localStatus') }}</h2>
          <div class="mt-4 space-y-3">
            <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <p class="text-xs text-zinc-500">API</p>
              <p class="mt-1 text-sm font-semibold" :class="health?.ok ? 'text-emerald-200' : 'text-amber-200'">
                {{ loading ? t('common.loading') : health?.ok ? t('extensionInstall.healthy') : t('extensionInstall.needsCheck') }}
              </p>
            </div>
            <div v-for="card in capabilityCards" :key="card.label" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <p class="text-xs text-zinc-500">{{ card.label }}</p>
              <p class="mt-1 text-sm font-semibold text-cyan-100">{{ card.value }}</p>
            </div>
          </div>
        </aside>
      </section>

      <section class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <article v-for="(step, index) in installSteps" :key="step.title" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div class="text-sm font-semibold text-cyan-300">0{{ index + 1 }}</div>
          <h2 class="mt-3 text-base font-semibold text-white">{{ step.title }}</h2>
          <p class="mt-3 text-sm leading-6 text-zinc-400">{{ step.description }}</p>
          <code class="mt-4 block overflow-x-auto rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">{{ step.code }}</code>
        </article>
      </section>

      <section class="mt-8 rounded-lg border border-white/10 bg-zinc-900/70 p-5">
        <h2 class="text-lg font-semibold text-white">{{ t('extensionInstall.packageTitle') }}</h2>
        <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('extensionInstall.packageDesc') }}</p>
        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">npm run package:extension</code>
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">dist/truthshield-extension.zip</code>
        </div>
      </section>
    </section>
  </main>
</template>
