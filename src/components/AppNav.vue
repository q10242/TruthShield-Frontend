<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import BrandLink from './BrandLink.vue'
import { currentLocale } from '../i18n'
import { fetchEvents } from '../lib/api'

const zh = currentLocale() !== 'en'

const open = ref(false)
const loaded = ref(false)
const events = ref([])

async function toggle() {
  open.value = !open.value
  if (open.value && !loaded.value) {
    try {
      const res = await fetchEvents({ per_page: 7 })
      events.value = (res.data || []).slice(0, 7)
      loaded.value = true
    } catch {}
  }
}

function close() {
  open.value = false
}

function onKeydown(e) {
  if (e.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
    <BrandLink />
    <div class="flex items-center gap-3 text-sm">
      <!-- Events dropdown -->
      <div class="relative">
        <button
          class="flex items-center gap-1 text-zinc-400 hover:text-cyan-100"
          :class="open ? 'text-cyan-100' : ''"
          type="button"
          @click="toggle"
        >
          {{ zh ? '事件' : 'Events' }}
          <svg class="h-3 w-3 transition-transform" :class="open ? 'rotate-180' : ''" viewBox="0 0 12 12" fill="currentColor">
            <path d="M6 8L1 3h10L6 8z" />
          </svg>
        </button>

        <div v-if="open" class="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-white/10 bg-zinc-900 py-1 shadow-2xl">
          <!-- backdrop to close on outside click -->
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

      <!-- slot for view-specific links -->
      <slot />
    </div>
  </nav>
</template>
