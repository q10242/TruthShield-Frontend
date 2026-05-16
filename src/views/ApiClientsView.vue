<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { createApiClient, fetchApiClients, revokeApiClient } from '../lib/api'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

const TOKEN_KEY = 'truthshield_api_token'
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const clients = ref([])
const name = ref('Research integration')
const plainKey = ref('')
const error = ref('')
const { t } = useI18n()

async function loadClients() {
  if (!token.value) return
  clients.value = await fetchApiClients(token.value)
}

async function createClient() {
  error.value = ''
  plainKey.value = ''
  try {
    const payload = await createApiClient(token.value, { name: name.value, abilities: ['read:exports'] })
    plainKey.value = payload.plain_key
    await loadClients()
  } catch (err) {
    error.value = err.message
  }
}

async function revokeClient(id) {
  await revokeApiClient(token.value, id)
  await loadClients()
}

onMounted(loadClients)
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-4xl">
      <AppNav>
        <RouterLink class="text-sm text-zinc-400" to="/api-docs">{{ t('remaining.apiDocsTitle') }}</RouterLink>
      </AppNav>

      <h1 class="text-3xl font-semibold text-white">{{ t('remaining.apiKeysTitle') }}</h1>
      <p class="mt-2 text-sm text-zinc-400">{{ t('remaining.apiKeysIntro') }}</p>

      <div v-if="!token" class="mt-6 rounded-lg border border-amber-300/30 bg-amber-400/10 p-4 text-sm text-amber-100">
        {{ t('remaining.signInForApiKey') }}
      </div>

      <template v-else>
        <form class="mt-6 flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-4 sm:flex-row" @submit.prevent="createClient">
          <input v-model="name" class="min-w-0 flex-1 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300/60" maxlength="120" required>
          <button type="submit" class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950">{{ t('remaining.create') }}</button>
        </form>

        <p v-if="plainKey" class="mt-3 break-all rounded-md border border-emerald-300/30 bg-emerald-500/10 p-3 text-xs text-emerald-100">
          {{ t('remaining.newKeyOnce', { key: plainKey }) }}
        </p>
        <p v-if="error" class="mt-3 rounded-md border border-red-300/30 bg-red-500/10 p-3 text-xs text-red-100">{{ error }}</p>

        <div class="mt-6 space-y-2">
          <div v-for="client in clients" :key="client.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p class="font-semibold text-white">{{ client.name }}</p>
                <p class="mt-1 text-xs text-zinc-500">{{ t('remaining.created') }} {{ client.created_at }} · {{ t('remaining.lastUsed') }} {{ client.last_used_at || t('remaining.never') }}</p>
              </div>
              <button v-if="client.status === 'active'" class="rounded-md border border-red-300/30 px-3 py-2 text-xs font-semibold text-red-100" @click="revokeClient(client.id)">{{ t('remaining.revoke') }}</button>
              <span v-else class="rounded bg-white/10 px-2 py-1 text-xs text-zinc-400">{{ client.status }}</span>
            </div>
          </div>
          <div v-if="!clients.length" class="rounded-lg border border-white/10 p-4 text-sm text-zinc-500">{{ t('remaining.noApiClients') }}</div>
        </div>
      </template>
    </section>
  </main>
</template>
