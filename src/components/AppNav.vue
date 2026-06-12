<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import BrandLink from './BrandLink.vue'
import { useI18n } from '../i18n'
import { fetchEvents } from '../lib/api'

const { locale } = useI18n()
const zh = computed(() => locale.value !== 'en')

const openMenu = ref('')
const loaded = ref(false)
const events = ref([])

const navGroups = computed(() => [
  {
    key: 'use',
    label: zh.value ? '使用' : 'Use',
    links: [
      { to: '/extension-install', label: zh.value ? '下載插件' : 'Install extension' },
      { to: '/demo-news', label: zh.value ? '互動示範' : 'Demo' },
      { to: '/news-search', label: zh.value ? '查新聞' : 'Check news' },
      { to: '/mobile', label: zh.value ? '手機快查' : 'Mobile check' },
      { to: '/user-guide', label: zh.value ? '使用手冊' : 'Guide' },
    ],
  },
  {
    key: 'context',
    label: zh.value ? '脈絡' : 'Context',
    links: [
      { to: '/events', label: zh.value ? '事件脈絡' : 'Events' },
      { to: '/global-entities', label: zh.value ? '人物/組織' : 'Entities' },
      { to: '/account-graph', label: zh.value ? '關係圖' : 'Relationship graph' },
      { to: '/stats/media', label: zh.value ? '媒體統計' : 'Media stats' },
      { to: '/stats/journalists', label: zh.value ? '記者統計' : 'Journalist stats' },
    ],
  },
  {
    key: 'community',
    label: zh.value ? '社群' : 'Community',
    links: [
      { to: '/evidence-library', label: zh.value ? '證據庫' : 'Evidence library' },
      { to: '/community-tasks', label: zh.value ? '社群任務' : 'Community tasks' },
      { to: '/report-domain', label: zh.value ? '回報新聞站' : 'Report news site' },
      { to: '/bug-report', label: zh.value ? '回報問題' : 'Report bug' },
      { to: '/profile', label: zh.value ? '我的頁面' : 'Profile' },
    ],
  },
  {
    key: 'governance',
    label: zh.value ? '透明治理' : 'Governance',
    links: [
      { to: '/transparency', label: zh.value ? '透明儀表板' : 'Transparency' },
      { to: '/algorithm', label: zh.value ? '演算法說明' : 'Algorithm' },
      { to: '/platform-rules', label: zh.value ? '平台規則' : 'Platform rules' },
      { to: '/moderation-events', label: zh.value ? '治理紀錄' : 'Moderation log' },
      { to: '/extension-coverage', label: zh.value ? '插件覆蓋' : 'Extension coverage' },
      { to: '/health', label: zh.value ? '系統健康' : 'System health' },
    ],
  },
])

async function toggle(menu) {
  openMenu.value = openMenu.value === menu ? '' : menu
  if (menu === 'events' && openMenu.value === 'events' && !loaded.value) {
    try {
      const res = await fetchEvents({ per_page: 7, sort: 'recent' })
      events.value = (res.data || []).slice(0, 7)
      loaded.value = true
    } catch {}
  }
}

function close() {
  openMenu.value = ''
}

function onKeydown(e) {
  if (e.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <nav class="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5 pr-32">
    <BrandLink />
    <div class="flex flex-wrap items-center justify-end gap-3 text-sm">
      <div class="relative">
        <button
          class="flex items-center gap-1 text-zinc-400 hover:text-cyan-100"
          :class="openMenu === 'events' ? 'text-cyan-100' : ''"
          type="button"
          @click="toggle('events')"
        >
          {{ zh ? '事件' : 'Events' }}
          <svg class="h-3 w-3 transition-transform" :class="openMenu === 'events' ? 'rotate-180' : ''" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 8L1 3h10L6 8z" />
          </svg>
        </button>

        <div v-if="openMenu === 'events'" class="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-white/10 bg-zinc-900 py-1 shadow-2xl">
          <div class="fixed inset-0 -z-10" @click="close" />

          <RouterLink
            class="block px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-white/5"
            to="/events"
            @click="close"
          >
            {{ zh ? '所有事件 →' : 'All events →' }}
          </RouterLink>

          <div class="my-1 border-t border-white/10" />

          <div v-if="!loaded" class="px-4 py-3 text-xs text-zinc-500">{{ zh ? '載入中...' : 'Loading...' }}</div>
          <template v-else>
            <RouterLink
              v-for="ev in events"
              :key="ev.id"
              class="block truncate px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-cyan-100"
              :to="`/events/${ev.id}`"
              @click="close"
            >
              {{ ev.name }}
            </RouterLink>
            <p v-if="!events.length" class="px-4 py-2 text-xs text-zinc-500">{{ zh ? '暫無事件' : 'No events yet' }}</p>
          </template>
        </div>
      </div>

      <div v-for="group in navGroups" :key="group.key" class="relative">
        <button
          class="flex items-center gap-1 text-zinc-400 hover:text-cyan-100"
          :class="openMenu === group.key ? 'text-cyan-100' : ''"
          type="button"
          @click="toggle(group.key)"
        >
          {{ group.label }}
          <svg class="h-3 w-3 transition-transform" :class="openMenu === group.key ? 'rotate-180' : ''" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 8L1 3h10L6 8z" />
          </svg>
        </button>

        <div v-if="openMenu === group.key" class="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border border-white/10 bg-zinc-900 py-1 shadow-2xl">
          <div class="fixed inset-0 -z-10" @click="close" />
          <RouterLink
            v-for="link in group.links"
            :key="link.to"
            class="block px-4 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-cyan-100"
            :to="link.to"
            @click="close"
          >
            {{ link.label }}
          </RouterLink>
        </div>
      </div>

      <RouterLink class="rounded-md bg-emerald-300 px-3 py-1.5 font-semibold text-zinc-950 hover:bg-emerald-200" to="/donate">{{ zh ? '支持專案' : 'Support' }}</RouterLink>
      <a
        class="rounded-md border border-white/10 px-3 py-1.5 text-zinc-400 hover:border-cyan-300/60 hover:text-cyan-100"
        href="https://www.otus.tw/"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ zh ? 'Otus 官網' : 'Otus' }}
      </a>

      <!-- slot for view-specific links -->
      <slot />
    </div>
  </nav>
</template>
