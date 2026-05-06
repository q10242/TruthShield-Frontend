<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchTransparency } from '../lib/api'

const stats = ref(null)

function displayValue(value) {
  if (value && typeof value === 'object') {
    return JSON.stringify(value)
  }

  return value
}

onMounted(async () => {
  stats.value = await fetchTransparency()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <RouterLink class="text-sm text-zinc-400" to="/evidence-library">證據庫</RouterLink>
      </nav>

      <h1 class="text-3xl font-semibold text-white">透明儀表板</h1>
      <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="(value, key) in stats || {}" :key="key" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p class="text-xs uppercase text-zinc-500">{{ key }}</p>
          <p class="mt-2 break-words text-2xl font-semibold text-white">{{ displayValue(value) }}</p>
        </div>
      </div>
    </section>
  </main>
</template>
