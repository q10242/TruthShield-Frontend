<script setup>
import { provide } from 'vue'
import { useRoute } from 'vue-router'
import { useVotePanel } from '../composables/useVotePanel'
import VotePanelResultsTab from '../components/votePanel/VotePanelResultsTab.vue'
import VotePanelVoteTab from '../components/votePanel/VotePanelVoteTab.vue'
import VotePanelEvidenceTab from '../components/votePanel/VotePanelEvidenceTab.vue'
import VotePanelEventsTab from '../components/votePanel/VotePanelEventsTab.vue'

const route = useRoute()
const vp = useVotePanel(route)
provide('votePanel', vp)

const {
  t,
  collapsed,
  activeTab,
  statusLoading,
  error,
  status,
  tabSteps,
  activeStepNumber,
  toneClass,
  statusBadgeText,
  nextActionText,
  totalWeight,
  statusNote,
  isLoggedIn,
  isVotingOpen,
  user,
  userDisplayName,
  userTitle,
  achievementCount,
  achievementTotal,
  featuredAchievements,
  nextAchievement,
  snapshot,
  snapshotAlert,
  readSeconds,
  readMinimum,
  readProgress,
  hasReadEnough,
  openLogin,
  formatDateTime,
} = vp
</script>

<template>
  <main class="min-w-0 bg-transparent p-3 text-zinc-100">
    <button
      v-if="collapsed"
      class="ml-auto flex items-center gap-2 rounded-full border border-cyan-300/40 bg-zinc-950 px-4 py-3 text-sm font-semibold text-cyan-100 shadow-2xl shadow-black/40"
      @click="collapsed = false"
    >
      <span class="h-2 w-2 rounded-full bg-cyan-300"></span>
      {{ t('votePanel.shieldRating') }}
    </button>

    <section v-else class="rounded-lg border border-white/10 bg-zinc-950 p-4 shadow-xl shadow-black/30">
      <div class="mb-3 flex items-center justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <a class="inline-flex min-w-0 items-center gap-2 rounded-md pr-1 hover:text-cyan-100" href="/" target="_blank" rel="noopener noreferrer" title="TruthShield">
              <img class="h-6 w-6 shrink-0" src="/brand/truthshield-mark.svg" alt="" />
              <span class="truncate text-sm font-semibold text-white">TruthShield</span>
            </a>
            <span class="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">{{ statusBadgeText }}</span>
          </div>
          <p class="mt-1 text-[11px] text-zinc-500">{{ nextActionText }}</p>
        </div>
        <button class="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-400 hover:border-cyan-300/50 hover:text-cyan-100" @click="collapsed = true">
          {{ t('votePanel.collapse') }}
        </button>
      </div>

      <div class="grid grid-cols-4 rounded-md border border-white/10 bg-white/[0.03] p-1 text-xs font-semibold">
        <button
          v-for="step in tabSteps"
          :key="step.key"
          class="rounded px-2 py-2"
          :class="activeTab === step.key ? 'bg-cyan-300 text-zinc-950' : step.number < activeStepNumber ? 'text-cyan-200' : 'text-zinc-400'"
          @click="activeTab = step.key"
        >
          <span class="mr-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px]">{{ step.number }}</span>
          {{ step.label }}
        </button>
      </div>

      <div class="mt-3 w-full rounded-md border p-3 text-left" :class="toneClass">
        <div v-if="statusLoading" class="text-sm text-zinc-300">{{ t('votePanel.checkingNews') }}</div>
        <div v-else-if="error" class="text-sm text-orange-100">{{ t('votePanel.unavailable') }}</div>
        <div v-else class="space-y-1">
          <div class="text-sm font-semibold">{{ status?.display_text || t('votePanel.noData') }}</div>
          <div class="text-xs opacity-80">{{ t('votePanel.totalWeight', { weight: totalWeight.toFixed(2) }) }}</div>
          <div class="text-xs opacity-80">{{ statusNote }}</div>
        </div>
      </div>

      <div v-if="!isLoggedIn && isVotingOpen" class="mt-3 rounded-md border border-cyan-300/25 bg-cyan-300/[0.06] p-3">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-sm font-semibold text-cyan-100">{{ t('votePanel.signInCtaTitle') }}</p>
            <p class="mt-1 text-xs leading-5 text-zinc-300">{{ t('votePanel.signInCtaDesc') }}</p>
          </div>
          <button class="shrink-0 rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950" @click="openLogin">
            {{ t('votePanel.signInContinue') }}
          </button>
        </div>
        <div class="mt-3 grid grid-cols-3 gap-2 text-[11px] text-zinc-300">
          <div class="rounded border border-white/10 bg-zinc-950/60 p-2">{{ t('votePanel.unlockVote') }}</div>
          <div class="rounded border border-white/10 bg-zinc-950/60 p-2">{{ t('votePanel.unlockEvidence') }}</div>
          <div class="rounded border border-white/10 bg-zinc-950/60 p-2">{{ t('votePanel.unlockBadges') }}</div>
        </div>
      </div>

      <div v-if="isLoggedIn" class="mt-3 rounded-md border border-white/10 bg-white/[0.03] p-3">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold text-white">{{ t('votePanel.signedInAs', { name: userDisplayName }) }}</p>
            <p class="mt-1 text-xs text-cyan-200">{{ userTitle }}</p>
            <p class="mt-1 text-[11px] text-zinc-500">
              {{ t('votePanel.trustWeightLine', { score: Number(user?.trust_score || 0).toFixed(2), count: achievementCount, total: achievementTotal }) }}
            </p>
          </div>
          <a class="shrink-0 rounded-md border border-cyan-300/30 px-3 py-2 text-xs font-semibold text-cyan-100 hover:border-cyan-300/70" href="/profile" target="_blank" rel="noopener noreferrer">
            {{ t('votePanel.openProfile') }}
          </a>
        </div>
        <div v-if="featuredAchievements.length" class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="achievement in featuredAchievements"
            :key="achievement.slug"
            class="rounded-full px-2.5 py-1 text-[11px] font-semibold text-zinc-950"
            :style="{ backgroundColor: achievement.color || '#67e8f9' }"
          >
            {{ achievement.name }}
          </span>
        </div>
        <div v-else-if="nextAchievement" class="mt-3 rounded border border-white/10 bg-zinc-950/60 p-2">
          <div class="flex items-center justify-between gap-3 text-[11px]">
            <span class="font-semibold text-zinc-300">{{ t('votePanel.nextBadge', { name: nextAchievement.name }) }}</span>
            <span class="text-zinc-500">{{ nextAchievement.current }} / {{ nextAchievement.target }}</span>
          </div>
          <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div class="h-full rounded-full" :style="{ width: `${nextAchievement.percentage}%`, backgroundColor: nextAchievement.color || '#67e8f9' }"></div>
          </div>
        </div>
      </div>

      <div
        v-if="snapshotAlert"
        class="mt-3 rounded-md border p-3 text-xs"
        :class="snapshotAlert.tone === 'danger' ? 'border-red-400/40 bg-red-500/10 text-red-100' : 'border-orange-400/40 bg-orange-500/10 text-orange-100'"
      >
        <p class="font-semibold">{{ snapshotAlert.text }}</p>
        <p v-if="snapshot?.latest_snapshot?.captured_at" class="mt-1 opacity-80">
          {{ t('votePanel.lastSnapshotAt', { time: formatDateTime(snapshot.latest_snapshot.captured_at) }) }}
        </p>
        <a v-if="snapshot?.archive_url" class="mt-2 inline-block font-semibold text-cyan-100" :href="snapshot.archive_url" target="_blank" rel="noreferrer">
          {{ t('votePanel.openArchive') }}
        </a>
      </div>

      <div v-if="isVotingOpen" class="mt-3 grid gap-2 rounded-md border border-white/10 bg-white/[0.03] p-3 text-xs text-zinc-300">
        <div class="flex items-center justify-between gap-3">
          <span>{{ t('votePanel.readThreshold') }}</span>
          <span :class="hasReadEnough ? 'text-emerald-300' : 'text-orange-300'">{{ Math.min(readSeconds, readMinimum) }} / {{ readMinimum }} {{ t('votePanel.seconds') }}</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-white/10">
          <div class="h-full rounded-full bg-cyan-300" :style="{ width: `${readProgress}%` }"></div>
        </div>
      </div>

      <VotePanelResultsTab v-if="activeTab === 'results'" />
      <VotePanelVoteTab v-else-if="activeTab === 'vote'" />
      <VotePanelEventsTab v-else-if="activeTab === 'events'" />
      <VotePanelEvidenceTab v-else />
    </section>
  </main>
</template>
