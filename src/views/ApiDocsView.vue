<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchApiDocs } from '../lib/api'

const docs = ref(null)

onMounted(async () => {
  docs.value = await fetchApiDocs()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-4xl">
      <nav class="mb-8 border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
      </nav>
      <h1 class="text-3xl font-semibold text-white">API Docs</h1>
      <div v-if="docs" class="mt-6 space-y-2">
        <article v-for="endpoint in docs.endpoints" :key="endpoint.path" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p class="font-mono text-sm text-cyan-200">{{ endpoint.method }} {{ endpoint.path }}</p>
          <p class="mt-2 text-sm text-zinc-400">{{ endpoint.description }}</p>
        </article>
      </div>
    </section>
  </main>
</template>
