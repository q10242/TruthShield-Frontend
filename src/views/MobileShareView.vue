<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { trackEvent } from '../lib/traffic'

const route = useRoute()
const router = useRouter()

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

onMounted(() => {
  const url = extractUrl()
  trackEvent('mobile_share_target_open', { source: 'mobile_pwa', feature: 'mobile_share', url })

  router.replace(url
    ? { name: 'mobile-check', query: { url, title: route.query.title || '' } }
    : { name: 'mobile' })
})
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
    <div class="text-center">
      <img class="mx-auto h-12 w-12" src="/brand/truthshield-mark.svg" alt="" />
      <p class="mt-4 text-sm text-zinc-400">Opening TruthShield...</p>
    </div>
  </main>
</template>
