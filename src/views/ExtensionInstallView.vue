<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchBotProtectionConfig, fetchSystemHealth } from '../lib/api'
import { trackEvent, trackPageView } from '../lib/traffic'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

const { t } = useI18n()
const PRODUCTION_WEB_ORIGIN = 'https://truth-shield.otus.tw'
const PRODUCTION_API_ORIGIN = 'https://truth-shield-api.otus.tw'
const CHROME_WEB_STORE_URL = 'https://chromewebstore.google.com/detail/truthshield/liobfmdknkkpbpogdfefmglpgcijmkfk'
const FIREFOX_ADDONS_URL = 'https://addons.mozilla.org/zh-TW/firefox/addon/truthshield-%E6%96%B0%E8%81%9E%E4%BF%A1%E8%AD%BD%E6%8F%90%E7%A4%BA/'
const health = ref(null)
const botConfig = ref(null)
const extensionVersion = ref('0.1.0')
const loading = ref(true)
const copiedChromeUrl = ref(false)
const copiedFirefoxUrl = ref(false)
const copiedSafariCommand = ref(false)
const zipGeneratedAt = new Date(import.meta.env.VITE_BUILD_TIME || document.lastModified || Date.now()).toLocaleString()

const installSteps = computed(() => [
  {
    title: t('extensionInstall.stepStoreTitle'),
    description: t('extensionInstall.stepStoreDesc'),
    code: 'Chrome Web Store / Firefox Add-ons',
  },
  {
    title: t('extensionInstall.stepPinTitle'),
    description: t('extensionInstall.stepPinDesc'),
    code: t('extensionInstall.stepPinCode'),
  },
  {
    title: t('extensionInstall.stepArticleTitle'),
    description: t('extensionInstall.stepArticleDesc'),
    code: 'https://www.cna.com.tw/',
  },
  {
    title: t('extensionInstall.stepVerifyTitle'),
    description: t('extensionInstall.stepVerifyDesc'),
    code: t('extensionInstall.stepVerifyCode'),
  },
])

const capabilityCards = computed(() => [
  { label: t('extensionInstall.extensionVersion'), value: extensionVersion.value },
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

const firefoxGuide = computed(() => [
  t('extensionInstall.firefoxGuide1'),
  t('extensionInstall.firefoxGuide2'),
  t('extensionInstall.firefoxGuide3'),
  t('extensionInstall.firefoxGuide4'),
])

const safariGuide = computed(() => [
  t('extensionInstall.safariGuide1'),
  t('extensionInstall.safariGuide2'),
  t('extensionInstall.safariGuide3'),
  t('extensionInstall.safariGuide4'),
])

const githubLinks = computed(() => [
  { href: 'https://github.com/q10242/TruthShield-Frontend', label: t('common.githubFrontend') },
  { href: 'https://github.com/q10242/TruthShield-Backend', label: t('common.githubBackend') },
])

const originCards = computed(() => [
  { label: t('extensionInstall.productionWebLabel'), value: PRODUCTION_WEB_ORIGIN },
  { label: t('extensionInstall.productionApiLabel'), value: PRODUCTION_API_ORIGIN },
])

const readinessCards = computed(() => [
  {
    label: t('extensionInstall.localStatus'),
    value: loading.value ? t('common.loading') : health.value?.ok ? t('extensionInstall.healthy') : t('extensionInstall.needsCheck'),
    tone: loading.value ? 'text-zinc-100' : health.value?.ok ? 'text-emerald-200' : 'text-amber-200',
  },
  {
    label: t('extensionInstall.signedRequests'),
    value: botConfig.value?.bot_protection_enabled ? t('extensionInstall.protected') : t('extensionInstall.localMode'),
    tone: botConfig.value?.bot_protection_enabled ? 'text-cyan-100' : 'text-amber-200',
  },
])

const verifyChecks = computed(() => [
  { title: t('extensionInstall.verifyTooltipTitle'), description: t('extensionInstall.verifyTooltipDesc') },
  { title: t('extensionInstall.verifyBannerTitle'), description: t('extensionInstall.verifyBannerDesc') },
  { title: t('extensionInstall.verifyContextTitle'), description: t('extensionInstall.verifyContextDesc') },
  { title: t('extensionInstall.verifyPopupTitle'), description: t('extensionInstall.verifyPopupDesc') },
])

onMounted(async () => {
  trackPageView('extension_install')
  loading.value = true
  const [healthPayload, botPayload, manifestPayload] = await Promise.all([
    fetchSystemHealth().catch(() => null),
    fetchBotProtectionConfig().catch(() => null),
    fetch('/extension/manifest.json').then((response) => response.json()).catch(() => null),
  ])
  health.value = healthPayload
  botConfig.value = botPayload
  extensionVersion.value = manifestPayload?.version || extensionVersion.value
  loading.value = false
})

function trackDownload() {
  trackEvent('extension_zip_download', { feature: 'extension_download' })
}

function trackFirefoxDownload() {
  trackEvent('firefox_extension_zip_download', { feature: 'extension_download' })
}

function trackSafariDownload() {
  trackEvent('safari_extension_source_download', { feature: 'extension_download' })
}

function trackStoreClick() {
  trackEvent('chrome_web_store_click', { feature: 'extension_install' })
}

function trackFirefoxStoreClick() {
  trackEvent('firefox_addons_click', { feature: 'extension_install' })
}

async function copyChromeExtensionsUrl() {
  try {
    await navigator.clipboard?.writeText('chrome://extensions')
  } catch {
    // Clipboard access can be unavailable in embedded browsers or strict test contexts.
  }
  copiedChromeUrl.value = true
  trackEvent('chrome_extensions_url_copy', { feature: 'extension_install' })
  window.setTimeout(() => {
    copiedChromeUrl.value = false
  }, 2400)
}

async function copyFirefoxDebuggingUrl() {
  try {
    await navigator.clipboard?.writeText('about:debugging#/runtime/this-firefox')
  } catch {
    // Clipboard access can be unavailable in embedded browsers or strict test contexts.
  }
  copiedFirefoxUrl.value = true
  trackEvent('firefox_debugging_url_copy', { feature: 'extension_install' })
  window.setTimeout(() => {
    copiedFirefoxUrl.value = false
  }, 2400)
}

async function copySafariPackageCommand() {
  try {
    await navigator.clipboard?.writeText('npm run package:extension:safari')
  } catch {
    // Clipboard access can be unavailable in embedded browsers or strict test contexts.
  }
  copiedSafariCommand.value = true
  trackEvent('safari_package_command_copy', { feature: 'extension_install' })
  window.setTimeout(() => {
    copiedSafariCommand.value = false
  }, 2400)
}
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <AppNav>
        <a
          class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100"
          href="https://github.com/q10242/TruthShield-Frontend"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ t('common.github') }}
        </a>
        <RouterLink class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100" to="/extension-coverage">
          {{ t('common.extensionCoverage') }}
        </RouterLink>
      </AppNav>

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
          <div class="mt-5 flex flex-wrap gap-2">
            <span class="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">{{ t('extensionInstall.tooltipStatus') }}</span>
            <span class="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">{{ t('extensionInstall.bannerStatus') }}</span>
            <span class="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">{{ t('extensionInstall.contextMenuStatus') }}</span>
          </div>
          <div class="mt-5 rounded-lg border border-amber-300/30 bg-amber-300/[0.08] p-4">
            <p class="text-sm font-semibold text-amber-100">{{ t('extensionInstall.selfHostedTitle') }}</p>
            <ul class="mt-3 space-y-2 text-sm leading-6 text-amber-50/80">
              <li v-for="note in selfHostedNotes" :key="note">{{ note }}</li>
            </ul>
          </div>
          <div class="mt-6 flex flex-wrap gap-3">
            <a
              class="rounded-md bg-cyan-300 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-cyan-200"
              :href="CHROME_WEB_STORE_URL"
              target="_blank"
              rel="noopener noreferrer"
              @click="trackStoreClick"
            >
              {{ t('extensionInstall.installStore') }}
            </a>
            <a
              class="rounded-md bg-orange-300 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-orange-200"
              :href="FIREFOX_ADDONS_URL"
              target="_blank"
              rel="noopener noreferrer"
              @click="trackFirefoxStoreClick"
            >
              {{ t('extensionInstall.installFirefoxStore') }}
            </a>
            <a class="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-zinc-100 hover:border-cyan-300/60 hover:text-cyan-100" href="/truthshield-extension.zip" download @click="trackDownload">
              {{ t('extensionInstall.downloadZip') }}
            </a>
            <a class="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-zinc-100 hover:border-cyan-300/60 hover:text-cyan-100" href="/truthshield-firefox-extension.zip" download @click="trackFirefoxDownload">
              {{ t('extensionInstall.downloadFirefoxZip') }}
            </a>
            <a class="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-zinc-100 hover:border-cyan-300/60 hover:text-cyan-100" href="/truthshield-safari-extension-source.zip" download @click="trackSafariDownload">
              {{ t('extensionInstall.downloadSafariSourceZip') }}
            </a>
            <button class="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-zinc-100 hover:border-cyan-300/60 hover:text-cyan-100" type="button" @click="copyChromeExtensionsUrl">
              {{ t('extensionInstall.openChromeExtensions') }}
            </button>
          </div>
          <p class="mt-3 text-xs leading-5 text-zinc-500">{{ copiedChromeUrl ? t('extensionInstall.chromeExtensionsCopied') : t('extensionInstall.storeNote') }}</p>
          <p class="mt-2 text-xs leading-5 text-zinc-500">{{ t('extensionInstall.firefoxStoreReviewNote') }}</p>
        </div>

        <aside class="rounded-lg border border-cyan-300/20 bg-zinc-900 p-5 shadow-2xl shadow-cyan-950/30">
          <div class="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.05] p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{{ t('extensionInstall.localStatus') }}</p>
            <h2 class="mt-2 text-lg font-semibold text-white">{{ loading || health?.ok ? t('extensionInstall.statusReadyTitle') : t('extensionInstall.statusNeedsAttentionTitle') }}</h2>
            <p class="mt-2 text-sm leading-6 text-zinc-300">{{ loading || health?.ok ? t('extensionInstall.statusReadyDesc') : t('extensionInstall.statusNeedsAttentionDesc') }}</p>
          </div>
          <div class="mt-4 space-y-3">
            <div v-for="card in readinessCards" :key="card.label" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <p class="text-xs text-zinc-500">{{ card.label }}</p>
              <p class="mt-1 text-sm font-semibold" :class="card.tone">{{ card.value }}</p>
            </div>
            <div v-for="card in capabilityCards" :key="card.label" class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <p class="text-xs text-zinc-500">{{ card.label }}</p>
              <p class="mt-1 text-sm font-semibold text-cyan-100">{{ card.value }}</p>
            </div>
          </div>
          <div class="mt-4 rounded-lg border border-white/10 bg-zinc-950/60 p-4">
            <h3 class="text-sm font-semibold text-white">{{ t('extensionInstall.originSectionTitle') }}</h3>
            <p class="mt-2 text-xs leading-5 text-zinc-400">{{ t('extensionInstall.originSectionDesc') }}</p>
            <div class="mt-3 space-y-2">
              <div v-for="card in originCards" :key="card.label" class="rounded-md border border-white/10 bg-white/[0.02] p-3">
                <p class="text-[11px] uppercase tracking-[0.16em] text-zinc-500">{{ card.label }}</p>
                <code class="mt-1 block overflow-x-auto text-xs font-semibold text-cyan-100">{{ card.value }}</code>
              </div>
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
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">Chrome Web Store</code>
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">Firefox Add-ons</code>
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">/truthshield-extension.zip</code>
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">/truthshield-firefox-extension.zip</code>
          <code class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-cyan-100">/truthshield-safari-extension-source.zip</code>
        </div>
      </section>

      <section class="mt-8 rounded-lg border border-white/10 bg-white/[0.03] p-5">
        <h2 class="text-lg font-semibold text-white">{{ t('extensionInstall.verifyTitle') }}</h2>
        <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('extensionInstall.verifyIntro') }}</p>
        <div class="mt-4 grid gap-3 md:grid-cols-2">
          <article v-for="item in verifyChecks" :key="item.title" class="rounded-lg border border-white/10 bg-zinc-950/60 p-4">
            <p class="text-sm font-semibold text-white">{{ item.title }}</p>
            <p class="mt-2 text-sm leading-6 text-zinc-400">{{ item.description }}</p>
          </article>
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
          <button class="mt-4 inline-flex rounded-md border border-cyan-300/30 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10" type="button" @click="copyChromeExtensionsUrl">
            {{ t('extensionInstall.openChromeExtensions') }}
          </button>
        </article>

        <article class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 class="text-lg font-semibold text-white">{{ t('extensionInstall.firefoxGuideTitle') }}</h2>
          <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('extensionInstall.firefoxGuideIntro') }}</p>
          <ol class="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
            <li v-for="step in firefoxGuide" :key="step">{{ step }}</li>
          </ol>
          <div class="mt-4 flex flex-wrap gap-2">
            <a class="inline-flex rounded-md border border-cyan-300/30 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10" href="/truthshield-firefox-extension.zip" download @click="trackFirefoxDownload">
              {{ t('extensionInstall.downloadFirefoxZip') }}
            </a>
            <button class="inline-flex rounded-md border border-cyan-300/30 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10" type="button" @click="copyFirefoxDebuggingUrl">
              {{ t('extensionInstall.openFirefoxDebugging') }}
            </button>
          </div>
          <p class="mt-3 text-xs leading-5 text-zinc-500">{{ copiedFirefoxUrl ? t('extensionInstall.firefoxDebuggingCopied') : t('extensionInstall.firefoxUnsignedNote') }}</p>
        </article>

        <article class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 class="text-lg font-semibold text-white">{{ t('extensionInstall.safariGuideTitle') }}</h2>
          <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('extensionInstall.safariGuideIntro') }}</p>
          <ol class="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
            <li v-for="step in safariGuide" :key="step">{{ step }}</li>
          </ol>
          <div class="mt-4 flex flex-wrap gap-2">
            <a class="inline-flex rounded-md border border-cyan-300/30 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10" href="/truthshield-safari-extension-source.zip" download @click="trackSafariDownload">
              {{ t('extensionInstall.downloadSafariSourceZip') }}
            </a>
            <button class="inline-flex rounded-md border border-cyan-300/30 px-3 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-300/10" type="button" @click="copySafariPackageCommand">
              {{ t('extensionInstall.copySafariCommand') }}
            </button>
          </div>
          <p class="mt-3 text-xs leading-5 text-zinc-500">{{ copiedSafariCommand ? t('extensionInstall.safariCommandCopied') : t('extensionInstall.safariUnsignedNote') }}</p>
          <div class="mt-4 rounded-md border border-amber-300/25 bg-amber-300/[0.07] p-3 text-xs leading-5 text-amber-50/80">
            <p class="font-semibold text-amber-100">{{ t('extensionInstall.safariNotListedTitle') }}</p>
            <p class="mt-1">{{ t('extensionInstall.safariNotListedDesc') }}</p>
          </div>
        </article>

        <article class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 class="text-lg font-semibold text-white">{{ t('extensionInstall.updateTitle') }}</h2>
          <ul class="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
            <li v-for="step in updateSteps" :key="step">{{ step }}</li>
          </ul>
          <p class="mt-4 rounded-md border border-white/10 bg-zinc-950/70 p-3 text-xs leading-5 text-zinc-500">
            {{ t('extensionInstall.securityNote') }}
          </p>
          <div class="mt-3 flex flex-wrap gap-2">
            <a
              v-for="link in githubLinks"
              :key="link.href"
              class="rounded-md border border-cyan-300/30 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-300/10"
              :href="link.href"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ link.label }}
            </a>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>
