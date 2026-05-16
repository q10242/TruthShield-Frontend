<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { searchGlobalEntities, createGlobalEntity } from '../lib/api'
import { currentLocale } from '../i18n'
import AppNav from '../components/AppNav.vue'

const zh = currentLocale() !== 'en'
const token = ref(localStorage.getItem('truthshield_api_token') || '')

const q = ref('')
const typeFilter = ref('all')
const loading = ref(false)
const error = ref('')
const entities = ref([])

const createForm = ref({
  name: '',
  entity_type: 'person',
  description: '',
  wikipedia_url: '',
})
const creating = ref(false)
const createMessage = ref('')
const createError = ref('')

const text = {
  title: zh ? '全域實體資料庫' : 'Global Entity Database',
  intro: zh
    ? '跨事件共用的人物與組織資料庫，可連結到多個事件中的節點，減少重複建立。'
    : 'Shared people and organization database across events. Link entities to multiple events to avoid duplication.',
  search: zh ? '搜尋人物或組織名稱' : 'Search people or organizations',
  empty: zh ? '目前沒有符合條件的實體。' : 'No matching entities yet.',
  person: zh ? '人物' : 'Person',
  organization: zh ? '組織' : 'Organization',
  all: zh ? '全部' : 'All',
  events: zh ? '個事件' : 'events',
  wiki: zh ? 'Wikipedia' : 'Wikipedia',
  findEvents: zh ? '查看相關事件' : 'Find related events',
  createTitle: zh ? '建立全域實體' : 'Create Global Entity',
  createIntro: zh ? '建立後可在任何事件的節點中連結此實體。' : 'Once created, this entity can be linked from nodes in any event.',
  nameLabel: zh ? '名稱' : 'Name',
  descLabel: zh ? '簡短描述' : 'Short description',
  wikiLabel: zh ? 'Wikipedia URL（選填）' : 'Wikipedia URL (optional)',
  submit: zh ? '建立實體' : 'Create Entity',
  submitting: zh ? '建立中...' : 'Creating...',
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params = { q: q.value }
    if (typeFilter.value !== 'all') params.type = typeFilter.value
    const payload = await searchGlobalEntities(params)
    entities.value = payload.data || []
  } catch (err) {
    error.value = err.message || (zh ? '載入失敗。' : 'Failed to load entities.')
  } finally {
    loading.value = false
  }
}

function setTypeFilter(value) {
  typeFilter.value = value
  load()
}

async function submitCreate() {
  if (!token.value) return
  creating.value = true
  createMessage.value = ''
  createError.value = ''
  try {
    await createGlobalEntity(token.value, createForm.value)
    createForm.value = { name: '', entity_type: 'person', description: '', wikipedia_url: '' }
    createMessage.value = zh ? '實體已建立。' : 'Entity created successfully.'
    await load()
  } catch (err) {
    createError.value = err.message || (zh ? '建立失敗。' : 'Failed to create entity.')
  } finally {
    creating.value = false
  }
}

onMounted(load)
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-6xl">
      <AppNav>
        <RouterLink class="text-zinc-400 hover:text-cyan-100" to="/events">{{ zh ? '事件' : 'Events' }}</RouterLink>
        <RouterLink class="text-zinc-400 hover:text-cyan-100" to="/community-tasks">{{ zh ? '社群任務' : 'Community Tasks' }}</RouterLink>
      </AppNav>

      <div class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p class="text-sm font-semibold text-cyan-300">TruthShield Global Entities</p>
          <h1 class="mt-2 text-3xl font-semibold text-white">{{ text.title }}</h1>
          <p class="mt-3 text-sm leading-7 text-zinc-400">{{ text.intro }}</p>
        </div>
        <form class="rounded-lg border border-white/10 bg-white/[0.03] p-4" @submit.prevent="load">
          <label class="text-xs font-semibold text-zinc-500">{{ text.search }}</label>
          <div class="mt-2 flex gap-2">
            <input v-model="q" class="min-w-0 flex-1 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" />
            <button class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" type="submit">{{ zh ? '搜尋' : 'Search' }}</button>
          </div>
        </form>
      </div>

      <!-- type filter bar -->
      <div class="mt-6 flex items-center gap-2">
        <span class="text-xs text-zinc-500">{{ zh ? '類型：' : 'Type:' }}</span>
        <button
          v-for="opt in [{ value: 'all', label: text.all }, { value: 'person', label: text.person }, { value: 'organization', label: text.organization }]"
          :key="opt.value"
          type="button"
          class="rounded-md border px-3 py-1 text-xs font-semibold transition-colors"
          :class="typeFilter === opt.value
            ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100'
            : 'border-white/10 text-zinc-400 hover:border-cyan-300/40 hover:text-zinc-200'"
          @click="setTypeFilter(opt.value)"
        >
          {{ opt.label }}
        </button>
        <span class="ml-auto text-xs text-zinc-600">{{ zh ? `共 ${entities.length} 筆` : `${entities.length} entities` }}</span>
      </div>

      <div v-if="error" class="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-100">{{ error }}</div>
      <div v-else-if="loading" class="mt-4 rounded-lg border border-white/10 p-4 text-sm text-zinc-400">{{ zh ? '載入中...' : 'Loading...' }}</div>
      <div v-else class="mt-4 grid gap-4">
        <div v-if="entities.length === 0" class="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">{{ text.empty }}</div>
        <article v-for="entity in entities" :key="entity.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <span
                  class="rounded px-2 py-1 font-semibold"
                  :class="entity.entity_type === 'organization' ? 'bg-violet-500/10 text-violet-200' : 'bg-cyan-300/10 text-cyan-100'"
                >
                  {{ entity.entity_type === 'organization' ? text.organization : text.person }}
                </span>
                <span v-if="entity.event_entities_count" class="rounded bg-white/10 px-2 py-1 text-zinc-300">
                  {{ entity.event_entities_count }} {{ text.events }}
                </span>
              </div>
              <h2 class="mt-2 text-xl font-semibold text-white">{{ entity.name }}</h2>
              <p v-if="entity.description" class="mt-2 text-sm leading-6 text-zinc-400">{{ entity.description }}</p>
            </div>
            <div class="flex shrink-0 flex-col items-end gap-2">
              <RouterLink
                class="rounded-md border border-cyan-300/40 px-3 py-2 text-sm font-semibold text-cyan-100 hover:border-cyan-300/80"
                :to="`/events?q=${encodeURIComponent(entity.name)}`"
              >
                {{ text.findEvents }}
              </RouterLink>
              <a
                v-if="entity.wikipedia_url"
                :href="entity.wikipedia_url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-xs text-cyan-300/70 hover:text-cyan-200 underline"
              >
                {{ text.wiki }}
              </a>
            </div>
          </div>
        </article>
      </div>

      <!-- create form for logged-in users -->
      <div v-if="token" class="mt-10">
        <form class="rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-6" @submit.prevent="submitCreate">
          <p class="text-sm font-semibold text-cyan-100">{{ text.createTitle }}</p>
          <p class="mt-1 text-xs text-zinc-400">{{ text.createIntro }}</p>
          <div class="mt-4 grid gap-3">
            <div class="grid gap-3 md:grid-cols-[1fr_160px]">
              <input
                v-model="createForm.name"
                class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300"
                :placeholder="text.nameLabel"
                required
              />
              <select
                v-model="createForm.entity_type"
                class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300"
              >
                <option value="person">{{ text.person }}</option>
                <option value="organization">{{ text.organization }}</option>
              </select>
            </div>
            <textarea
              v-model="createForm.description"
              class="min-h-20 rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300"
              :placeholder="text.descLabel"
            ></textarea>
            <input
              v-model="createForm.wikipedia_url"
              class="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-cyan-300"
              :placeholder="text.wikiLabel"
            />
            <div v-if="createMessage || createError" class="rounded-md border p-3 text-sm" :class="createError ? 'border-red-400/40 bg-red-500/10 text-red-100' : 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'">
              {{ createError || createMessage }}
            </div>
            <button
              class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
              type="submit"
              :disabled="creating"
            >
              {{ creating ? text.submitting : text.submit }}
            </button>
          </div>
        </form>
      </div>
      <div v-else class="mt-10 rounded-lg border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-zinc-400">
        <RouterLink class="text-cyan-300 hover:text-cyan-100 underline" to="/login">{{ zh ? '登入' : 'Sign in' }}</RouterLink>
        {{ zh ? '後可建立全域實體。' : ' to create global entities.' }}
      </div>
    </section>
  </main>
</template>
