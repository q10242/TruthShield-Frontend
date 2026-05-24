<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useRoute, useRouter } from 'vue-router'
import { trackEvent } from '../lib/traffic'
import { useI18n } from '../i18n'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const targetUrl = ref('')
const redirecting = ref(false)

function extractUrl() {
  const candidates = [route.query.url, route.query.text, route.query.title]
    .filter(Boolean)
    .map(String)

  for (const value of candidates) {
    const direct = value.trim()
    try {
      return new URL(direct).toString()
    } catch {
      const match = direct.match(/https?:\/\/\S+/)
      if (match) {
        try {
          return new URL(match[0]).toString()
        } catch {
          // Keep scanning other share fields.
        }
      }
    }
  }

  return ''
}

function extractTitle() {
  const direct = String(route.query.title || '').trim()
  if (direct) return direct

  const text = String(route.query.text || '').trim()
  if (!text) return ''

  return text.replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim().slice(0, 120)
}

const extractedTitle = computed(() => extractTitle())
const targetDomain = computed(() => {
  try {
    return targetUrl.value ? new URL(targetUrl.value).hostname : ''
  } catch {
    return ''
  }
})

function openTarget() {
  if (!targetUrl.value) return
  redirecting.value = true
  router.replace({
    name: 'mobile-check',
    query: {
      url: targetUrl.value,
      ...(extractedTitle.value ? { title: extractedTitle.value } : {}),
    },
  })
}

onMounted(() => {
  targetUrl.value = extractUrl()
  trackEvent('mobile_share_target_open', {
    source: 'mobile_pwa',
    feature: 'mobile_share',
    url: targetUrl.value,
    has_url: Boolean(targetUrl.value),
  })

  if (!targetUrl.value) return

  redirecting.value = true
  window.setTimeout(openTarget, 420)
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-5 py-6 text-zinc-100">
    <div class="mx-auto flex min-h-[calc(100vh-3rem)] max-w-md items-center">
      <section class="w-full rounded-[28px] border border-cyan-300/20 bg-zinc-900/90 p-6 shadow-2xl shadow-cyan-950/30">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10">
          <img class="h-8 w-8" src="/brand/truthshield-mark.svg" alt="" />
        </div>

        <div class="mt-5 text-center">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">{{ t('mobile.shareEyebrow') }}</p>
          <h1 class="mt-3 text-2xl font-semibold text-white">
            {{ targetUrl ? t('mobile.shareOpeningTitle') : t('mobile.shareMissingTitle') }}
          </h1>
          <p class="mt-3 text-sm leading-6 text-zinc-400">
            {{ targetUrl ? t('mobile.shareOpeningBody') : t('mobile.shareMissingBody') }}
          </p>
        </div>

        <div v-if="targetUrl" class="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div class="flex items-start gap-3">
            <div class="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-300"></div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{{ t('mobile.shareDetected') }}</p>
              <p v-if="extractedTitle" class="mt-2 text-sm font-semibold leading-5 text-white">{{ extractedTitle }}</p>
              <p class="mt-2 break-all text-xs leading-5 text-zinc-400">{{ targetUrl }}</p>
              <p v-if="targetDomain" class="mt-2 text-xs text-cyan-100">{{ targetDomain }}</p>
            </div>
          </div>
          <div class="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-3">
            <p class="text-xs text-cyan-50">{{ t('mobile.shareRedirecting') }}</p>
            <button
              class="rounded-full bg-cyan-300 px-3 py-1.5 text-xs font-semibold text-zinc-950"
              type="button"
              @click="openTarget"
            >
              {{ redirecting ? t('mobile.shareOpenNow') : t('mobile.shareContinue') }}
            </button>
          </div>
        </div>

        <div v-else class="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-4">
          <p class="text-sm font-semibold text-amber-100">{{ t('mobile.shareTipTitle') }}</p>
          <p class="mt-2 text-sm leading-6 text-amber-50/80">{{ t('mobile.shareTipBody') }}</p>
        </div>

        <div class="mt-5 grid gap-3">
          <RouterLink
            v-if="!targetUrl"
            class="rounded-2xl bg-cyan-300 px-4 py-3 text-center text-sm font-semibold text-zinc-950"
            to="/mobile"
          >
            {{ t('mobile.shareGoHome') }}
          </RouterLink>
          <RouterLink
            class="rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-zinc-200"
            to="/user-guide"
          >
            {{ t('mobile.shareOpenGuide') }}
          </RouterLink>
        </div>
      </section>
    </div>
  </main>
</template>
