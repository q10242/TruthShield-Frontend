<script setup>
import { useI18n } from '../i18n'

const { locale, locales, setLocale, t } = useI18n()
</script>

<template>
  <div class="inline-flex items-center gap-1 rounded-md border border-white/10 bg-zinc-900/90 p-1" :aria-label="t('common.language')">
    <button
      v-for="item in locales"
      :key="item.code"
      class="rounded px-2.5 py-1.5 text-xs font-semibold transition"
      :class="locale === item.code ? 'bg-cyan-300 text-zinc-950' : 'text-zinc-400 hover:bg-white/10 hover:text-zinc-100'"
      type="button"
      @click="setLocale(item.code)"
    >
      {{ item.label }}
    </button>
  </div>
</template>
