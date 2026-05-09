<script setup>
import { reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { createUserDataRequest } from '../lib/api'
import { useI18n } from '../i18n'

const form = reactive({ email: '', request_type: 'deletion', reason: '' })
const message = ref('')
const error = ref('')
const { t } = useI18n()

async function submit() {
  message.value = ''
  error.value = ''
  try {
    await createUserDataRequest(form)
    message.value = t('remaining.dataRequestSuccess')
  } catch (err) {
    error.value = err.message || t('remaining.submitFailed')
  }
}
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-2xl">
      <BrandLink />
      <h1 class="mt-8 text-3xl font-semibold text-white">{{ t('remaining.dataRequestTitle') }}</h1>
      <form class="mt-6 space-y-4 rounded-lg border border-white/10 bg-white/[0.03] p-5" @submit.prevent="submit">
        <input v-model="form.email" required type="email" class="w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white" :placeholder="t('remaining.emailPlaceholder')" />
        <select v-model="form.request_type" class="w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white">
          <option value="export">{{ t('remaining.exportData') }}</option>
          <option value="deletion">{{ t('remaining.deleteData') }}</option>
          <option value="correction">{{ t('remaining.correctData') }}</option>
        </select>
        <textarea v-model="form.reason" class="min-h-28 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white" :placeholder="t('remaining.requestReasonPlaceholder')"></textarea>
        <p v-if="message" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-100">{{ message }}</p>
        <p v-if="error" class="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{{ error }}</p>
        <button type="submit" class="rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950">{{ t('remaining.submitRequest') }}</button>
      </form>
    </section>
  </main>
</template>
