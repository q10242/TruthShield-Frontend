<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchBotProtectionConfig, fetchSystemHealth } from '../lib/api'
import { trackEvent, trackPageView } from '../lib/traffic'
import { useI18n } from '../i18n'
import extensionManifest from '../../public/extension/manifest.json'

const { t } = useI18n()
const health = ref(null)
const botConfig = ref(null)
const loading = ref(true)
const zipGeneratedAt = new Date(import.meta.env.VITE_BUILD_TIME || document.lastModified || Date.now()).toLocaleString()

const installSteps = computed(() => [
  {
    title: t('extensionInstall.stepDownloadTitle'),
    description: t('extensionInstall.stepDownloadDesc'),
    code: 'truthshield-extension.zip',
  },
  {
    title: t('extensionInstall.stepChromeTitle'),
    description: t('extensionInstall.stepChromeDesc'),
    code: 'chrome://extensions',
  },
  {
    title: t('extensionInstall.stepLoadTitle'),
    description: t('extensionInstall.stepLoadDesc'),
    code: 'folder containing manifest.json',
  },
  {
    title: t('extensionInstall.stepVerifyTitle'),
    description: t('extensionInstall.stepVerifyDesc'),
    code: 'https://www.cna.com.tw/',
  },
])

const capabilityCards = computed(() => [
  { label: t('extensionInstall.extensionVersion'), value: extensionManifest.version },
  { label: t('extensionInstall.zipGeneratedAt'), value: zipGeneratedAt },
  { label: t('extensionInstall.tooltipStatus'), value: t('extensionInstall.enabled') },
  { label: t('extensionInstall.bannerStatus'), value: t('extensionInstall.enabled') },
  { label: t('extensionInstall.contextMenuStatus'), value: t('extensionInstall.enabled') },
  { label: t('extensionInstall.signedRequests'), value: botConfig.value?.bot_protection_enabled ? t('extensionInstall.protected') : t('extensionInstall.localMode') },
])

const selfHostedNotes = computed(() => [
  t('extensionInstall.selfHostedNote1'),
  t('extensionInstall.selfHostedNote2'),
  t('extensionInstall.selfHostedNote3'),
])

const updateSteps = computed(() => [
  t('extensionInstall.updateStep1'),
  t('extensionInstall.updateStep2'),
  t('extensionInstall.updateStep3'),
])

onMounted(async () => {
  trackPageView('extension_install')
  loading.value = true
  const [healthPayload, botPayload] = await Promise.all([
    fetchSystemHealth().catch(() => null),
    fetchBotProtectionConfig().catch(() => null),
  ])
  health.value = healthPayload
  botConfig.value = botPayload
  loading.value = false
})

function trackDownload() {
  trackEvent('extension_zip_download', { feature: 'extension_download' })
}
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <BrandLink />
        <div class="flex flex-wrap gap-2">
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
          <div class="mt-5 rounded-lg border border-amber-300/30 bg-amber-300/[0.08] p-4">
            <p class="text-sm font-semibold text-amber-100">{{ t('extensionInstall.selfHostedTitle') }}</p>
            <ul class="mt-3 space-y-2 text-sm leading-6 text-amber-50/80">
              <li v-for="note in selfHostedNotes" :key="note">{{ note }}</li>
            </ul>
          </div>
          <div class="mt-6 flex flex-wrap gap-3">
            <a class="rounded-md bg-cyan-300 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-200" href="/truthshield-extension.zip" download @click="trackDownload">
              {{ t('extensionInstall.downloadZip') }}
            </a>
            <a class="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-zinc-100 hover:border-cyan-300/60 hover:text-cyan-100" href="chrome://extensions">
              {{ t('extensionInstall.openChromeExtensions') }}
            </a>
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
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">/truthshield-extension.zip</code>
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">manifest.json</code>
        </div>
      </section>

      <section class="mt-8 grid gap-4 lg:grid-cols-2">
        <article class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 class="text-lg font-semibold text-white">{{ t('extensionInstall.chromeGuideTitle') }}</h2>
          <ol class="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
            <li>{{ t('extensionInstall.chromeGuide1') }}</li>
            <li>{{ t('extensionInstall.chromeGuide2') }}</li>
            <li>{{ t('extensionInstall.chromeGuide3') }}</li>
            <li>{{ t('extensionInstall.chromeGuide4') }}</li>
          </ol>
          <a class="mt-4 inline-flex rounded-md border border-cyan-300/30 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10" href="chrome://extensions">
            {{ t('extensionInstall.openChromeExtensions') }}
          </a>
        </article>

        <article class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 class="text-lg font-semibold text-white">{{ t('extensionInstall.updateTitle') }}</h2>
          <ul class="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
            <li v-for="step in updateSteps" :key="step">{{ step }}</li>
          </ul>
          <p class="mt-4 rounded-md border border-white/10 bg-zinc-950/70 p-3 text-xs leading-5 text-zinc-500">
            {{ t('extensionInstall.securityNote') }}
          </p>
        </article>
      </section>
    </section>
  </main>
</template>
