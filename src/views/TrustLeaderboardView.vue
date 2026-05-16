<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchTrustLeaderboard } from '../lib/api'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

const users = ref([])
const { t } = useI18n()

onMounted(async () => {
  users.value = await fetchTrustLeaderboard()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-4xl">
      <AppNav>
        <RouterLink class="text-sm text-zinc-400" to="/ranking">{{ t('common.ranking') }}</RouterLink>
      </AppNav>
      <h1 class="text-3xl font-semibold text-white">{{ t('remaining.trustLeaderboardTitle') }}</h1>
      <div class="mt-6 overflow-hidden rounded-lg border border-white/10">
        <table class="w-full text-left">
          <tbody>
            <tr v-for="user in users" :key="user.id" class="border-t border-white/10">
              <td class="px-4 py-3 font-medium text-white">{{ user.name }}</td>
              <td class="px-4 py-3 text-cyan-200">{{ Number(user.trust_score).toFixed(2) }}</td>
              <td class="px-4 py-3 text-sm text-zinc-400">{{ user.votes_count }} {{ t('remaining.voteUnit') }}</td>
              <td class="px-4 py-3">
                <span v-for="badge in user.badges" :key="badge.id" class="mr-1 rounded bg-white/10 px-2 py-1 text-xs">{{ badge.name }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
