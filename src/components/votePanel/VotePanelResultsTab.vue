<script setup>
import { inject } from 'vue'

const vp = inject('votePanel')
</script>

<template>
  <section class="mt-4 space-y-3">
    <div class="rounded-md border border-emerald-300/20 bg-emerald-300/[0.04] p-3">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold text-emerald-100">{{ vp.t('votePanel.evidenceVerdictTitle') }}</p>
          <p class="mt-1 text-xs leading-5 text-zinc-400">{{ vp.evidenceVerdictLabel.value }}</p>
        </div>
        <button class="shrink-0 rounded-md border border-emerald-300/30 px-2 py-1 text-xs font-semibold text-emerald-100" @click="vp.activeTab.value = 'evidence'">
          {{ vp.t('votePanel.viewEvidence') }}
        </button>
      </div>
      <div class="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] text-zinc-400">
        <div class="rounded bg-zinc-950/70 px-2 py-2">
          <p class="font-semibold text-emerald-100">{{ Number(vp.evidenceVerdict.value?.supports_weight || 0).toFixed(1) }}</p>
          <p>{{ vp.t('votePanel.evidenceSupports') }}</p>
        </div>
        <div class="rounded bg-zinc-950/70 px-2 py-2">
          <p class="font-semibold text-red-100">{{ Number(vp.evidenceVerdict.value?.refutes_weight || 0).toFixed(1) }}</p>
          <p>{{ vp.t('votePanel.evidenceRefutes') }}</p>
        </div>
        <div class="rounded bg-zinc-950/70 px-2 py-2">
          <p class="font-semibold text-cyan-100">{{ Number(vp.evidenceVerdict.value?.contextual_weight || 0).toFixed(1) }}</p>
          <p>{{ vp.t('votePanel.evidenceContextual') }}</p>
        </div>
      </div>
    </div>

    <div v-if="vp.clusterSummary.value.visible" class="rounded-md border border-cyan-300/20 bg-cyan-300/[0.04] p-3 text-xs leading-5 text-cyan-100">
      {{ vp.t('votePanel.clusterSummary', { count: vp.clusterSummary.value.count }) }}
      <span v-if="vp.clusterSummary.value.title" class="text-zinc-300"> {{ vp.clusterSummary.value.title }}</span>
    </div>

    <div v-if="vp.mediaContext.value || vp.journalistContext.value.length" class="space-y-2">
      <div v-if="vp.mediaContext.value" class="rounded-md border border-white/10 bg-white/[0.03] p-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold text-zinc-200">媒體報導標籤統計</p>
            <p class="mt-1 text-xs text-zinc-500">{{ vp.mediaContext.value.name }}</p>
          </div>
          <a class="shrink-0 text-xs font-semibold text-cyan-200 hover:text-cyan-100" :href="`/stats/media/${vp.mediaContext.value.id}`" target="_blank" rel="noopener noreferrer">詳情</a>
        </div>
        <div class="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div class="rounded bg-zinc-950/70 px-2 py-2">
            <p class="font-semibold text-white">{{ vp.mediaContext.value.stats.article_count }}</p>
            <p class="text-zinc-500">已確認收錄</p>
          </div>
          <div class="rounded bg-zinc-950/70 px-2 py-2">
            <p class="font-semibold text-orange-100">{{ vp.mediaContext.value.stats.tracked_tag_count }}</p>
            <p class="text-zinc-500">{{ vp.mediaContext.value.stats.tracked_tag?.name || '最高標籤' }}</p>
          </div>
          <div class="rounded bg-zinc-950/70 px-2 py-2">
            <p class="font-semibold text-cyan-100">{{ vp.mediaContext.value.stats.ratio_available ? `${vp.mediaContext.value.stats.tracked_tag_ratio}%` : '樣本不足' }}</p>
            <p class="text-zinc-500">比例</p>
          </div>
        </div>
      </div>

      <div v-for="row in vp.journalistContext.value" :key="row.match_id" class="rounded-md border border-white/10 bg-white/[0.03] p-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-xs font-semibold text-zinc-200">記者報導標籤統計</p>
            <p class="mt-1 text-xs text-zinc-500">
              <span v-if="row.review_status === 'confirmed'">已確認收錄：{{ row.journalist.display_name }}</span>
              <span v-else>可能對應記者：{{ row.journalist.display_name }}，尚未納入統計</span>
            </p>
          </div>
          <button class="shrink-0 rounded border border-white/10 px-2 py-1 text-[11px] font-semibold text-zinc-400 hover:border-orange-300/50 hover:text-orange-100" @click="vp.reportJournalistMismatch(row.match_id)">
            回報作者有誤
          </button>
        </div>
        <div v-if="row.stats" class="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
          <div class="rounded bg-zinc-950/70 px-2 py-2">
            <p class="font-semibold text-white">{{ row.stats.article_count }}</p>
            <p class="text-zinc-500">已確認收錄</p>
          </div>
          <div class="rounded bg-zinc-950/70 px-2 py-2">
            <p class="font-semibold text-orange-100">{{ row.stats.tracked_tag_count }}</p>
            <p class="text-zinc-500">{{ row.stats.tracked_tag?.name || '最高標籤' }}</p>
          </div>
          <div class="rounded bg-zinc-950/70 px-2 py-2">
            <p class="font-semibold text-cyan-100">{{ row.stats.ratio_available ? `${row.stats.tracked_tag_ratio}%` : '樣本不足' }}</p>
            <p class="text-zinc-500">比例</p>
          </div>
        </div>
        <p v-else class="mt-2 text-xs leading-5 text-zinc-500">來源：{{ row.match_source }} · {{ row.confidence }} confidence</p>
      </div>
    </div>

    <div v-if="vp.distribution.value.length === 0" class="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-400">
      <p>{{ vp.t('votePanel.noVotes') }}</p>
      <div class="mt-3 grid grid-cols-2 gap-2">
        <button class="rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50" :disabled="!vp.isVotingOpen.value" @click="vp.isLoggedIn.value ? (vp.activeTab.value = 'vote') : vp.openLogin()">
          {{ vp.t('votePanel.firstVoteCta') }}
        </button>
        <button class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-cyan-300/50 hover:text-cyan-100" @click="vp.activeTab.value = 'evidence'">
          {{ vp.t('votePanel.firstEvidenceCta') }}
        </button>
      </div>
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
      @click="vp.isLoggedIn.value ? (vp.activeTab.value = 'vote') : vp.openLogin()"
    >
      {{ vp.isLoggedIn.value ? vp.t('votePanel.goVote') : vp.t('common.signIn') }}
    </button>
    <button
      class="w-full rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-300 hover:border-cyan-300/50 hover:text-cyan-100"
      @click="vp.activeTab.value = 'evidence'"
    >
      {{ vp.t('votePanel.viewEvidence') }}
    </button>
    <div class="rounded-md border border-cyan-300/20 bg-cyan-300/[0.05] p-3">
      <p class="text-xs font-semibold text-cyan-100">{{ vp.t('votePanel.officialCtaTitle') }}</p>
      <p class="mt-1 text-xs leading-5 text-zinc-400">{{ vp.t('votePanel.officialCtaDesc') }}</p>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <button class="rounded-md border border-cyan-300/30 px-3 py-2 text-xs font-semibold text-cyan-100" @click="vp.activeTab.value = 'evidence'">
          {{ vp.t('votePanel.openClarificationArea') }}
        </button>
        <a class="rounded-md border border-white/10 px-3 py-2 text-center text-xs font-semibold text-zinc-300 hover:border-cyan-300/50 hover:text-cyan-100" href="/official-response-policy" target="_blank" rel="noopener noreferrer">
          {{ vp.t('votePanel.clarificationPolicy') }}
        </a>
      </div>
    </div>
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
