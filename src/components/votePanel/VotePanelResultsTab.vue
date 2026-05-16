<script setup>
import { inject } from 'vue'

const vp = inject('votePanel')
</script>

<template>
  <section class="mt-4 space-y-3">
    <div v-if="vp.distribution.value.length === 0" class="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-400">
      {{ vp.t('votePanel.noVotes') }}
    </div>

    <div v-for="row in vp.distribution.value" :key="row.tag.id" class="space-y-1">
      <div class="flex items-center justify-between gap-3 text-xs">
        <span class="font-semibold text-zinc-100">{{ row.tag.name }}</span>
        <span class="text-zinc-400">{{ vp.t('votePanel.weightedLine', { percentage: row.percentage, weight: Number(row.weight).toFixed(2) }) }}</span>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-white/10">
        <div class="h-full rounded-full bg-cyan-300" :style="{ width: `${row.percentage}%` }"></div>
      </div>
    </div>

    <div v-if="vp.secondaryDistribution.value.length" class="rounded-md border border-white/10 bg-white/[0.02] p-3">
      <p class="text-xs font-semibold text-zinc-300">{{ vp.t('votePanel.secondaryDistribution') }}</p>
      <div class="mt-3 space-y-2">
        <div v-for="row in vp.secondaryDistribution.value" :key="row.tag.id" class="flex items-center justify-between gap-3 text-xs">
          <span class="text-zinc-300">{{ row.tag.name }}</span>
          <span class="text-zinc-500">{{ vp.t('votePanel.weightedLine', { percentage: row.percentage, weight: Number(row.weight).toFixed(2) }) }}</span>
        </div>
      </div>
    </div>

    <button
      class="w-full rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="!vp.isVotingOpen.value"
      @click="vp.activeTab.value = 'vote'"
    >
      {{ vp.isLoggedIn.value ? vp.t('votePanel.goVote') : vp.t('common.signIn') }}
    </button>
    <button
      class="w-full rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-300 hover:border-cyan-300/50 hover:text-cyan-100"
      @click="vp.activeTab.value = 'evidence'"
    >
      {{ vp.t('votePanel.viewEvidence') }}
    </button>
    <div class="grid grid-cols-2 gap-2">
      <button class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-orange-300/50 hover:text-orange-100" @click="vp.submitChangeReport('title_changed')">
        {{ vp.t('votePanel.reportChanged') }}
      </button>
      <button class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-red-300/50 hover:text-red-100" @click="vp.submitChangeReport('deleted')">
        {{ vp.t('votePanel.reportDeleted') }}
      </button>
    </div>
    <p v-if="vp.changeReportMessage.value" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-2 text-xs text-emerald-100">{{ vp.changeReportMessage.value }}</p>
  </section>
</template>
