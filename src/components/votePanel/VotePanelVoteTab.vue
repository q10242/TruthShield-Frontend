<script setup>
import { inject } from 'vue'
import { evidenceUploadConfig } from '../../lib/evidenceUpload'

const vp = inject('votePanel')
</script>

<template>
  <section class="mt-4 space-y-3 border-t border-white/10 pt-4">
    <div class="flex items-center justify-between gap-3">
      <div>
        <p class="text-sm font-semibold text-white">{{ vp.t('votePanel.yourRating') }}</p>
        <p class="text-xs text-zinc-500">{{ vp.isLoggedIn.value ? `${vp.user.value.email} · ${vp.t('profile.weight')} ${Number(vp.user.value.trust_score || 1).toFixed(2)}` : vp.t('votePanel.notSignedIn') }}</p>
        <p class="mt-1 text-[11px]" :class="vp.isLoggedIn.value ? 'text-emerald-300' : 'text-amber-200'">
          {{ vp.isLoggedIn.value ? vp.t('votePanel.authReady') : vp.t('votePanel.authSyncHint') }}
        </p>
        <p v-if="vp.myVote.value" class="mt-1 text-xs text-cyan-300">{{ vp.t('votePanel.existingVote') }}</p>
        <p v-if="vp.isWeightLimited.value" class="mt-1 rounded border border-orange-400/40 bg-orange-500/10 px-2 py-1 text-xs text-orange-100">
          {{ vp.t('votePanel.weightLimitedNotice') }}
        </p>
        <p class="mt-1 text-xs text-zinc-500">{{ vp.statusNote.value }}</p>
        <p class="mt-1 text-xs" :class="vp.hasReadEnough.value ? 'text-emerald-300' : 'text-orange-300'">
          {{ vp.t('votePanel.readThreshold') }} {{ Math.min(vp.readSeconds.value, vp.readMinimum.value) }} / {{ vp.readMinimum.value }} {{ vp.t('votePanel.seconds') }}
        </p>
      </div>
      <button v-if="!vp.isLoggedIn.value && vp.isVotingOpen.value" class="rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950" @click="vp.openLogin()">
        {{ vp.t('common.signIn') }}
      </button>
    </div>

    <div v-if="!vp.isVotingOpen.value" class="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-400">
      {{ vp.t('votePanel.voteClosedReadonly') }}
    </div>

    <div v-else class="rounded-md border border-white/10 bg-white/[0.03] p-3">
      <div class="flex items-center justify-between text-xs">
        <span class="font-semibold text-zinc-200">{{ vp.t('votePanel.readConfirm') }}</span>
        <span :class="vp.hasReadEnough.value ? 'text-emerald-300' : 'text-orange-300'">{{ vp.hasReadEnough.value ? vp.t('votePanel.readReady') : vp.t('votePanel.reading') }}</span>
      </div>
      <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
        <div class="h-full rounded-full bg-cyan-300" :style="{ width: `${vp.readProgress.value}%` }"></div>
      </div>
    </div>

    <div class="space-y-3">
      <div v-for="group in vp.groupedVotingTags.value" :key="group.key" class="rounded-md border border-white/10 bg-white/[0.02] p-2">
        <p class="mb-2 text-[11px] font-semibold text-zinc-400">{{ group.label }}</p>
        <div class="grid gap-2 sm:grid-cols-2">
          <button
            v-for="tag in group.tags"
            :key="tag.id"
            class="rounded-md border px-3 py-2 text-left text-xs font-semibold"
            :class="vp.selectedTagId.value === tag.id ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/[0.03] text-zinc-300'"
            :disabled="!vp.isVotingOpen.value"
            @click="vp.selectedTagId.value = tag.id"
          >
            <span class="block">{{ tag.name }}</span>
            <span class="mt-1 block text-[11px] font-normal leading-4 opacity-70">{{ vp.tagPlainHint(tag) }}</span>
            <span class="mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px]" :class="vp.tagEvidenceBadgeClass(tag)">
              {{ vp.tagEvidenceBadge(tag) }}
            </span>
          </button>
        </div>
      </div>
    </div>
    <div class="rounded-md border border-white/10 bg-white/[0.03] p-3">
      <div class="flex items-center justify-between gap-3">
        <div>
          <p class="text-xs font-semibold text-zinc-200">{{ vp.t('votePanel.secondaryLabels') }}</p>
          <p class="mt-1 text-[11px] text-zinc-500">{{ vp.t('votePanel.secondaryHelp') }}</p>
        </div>
        <span class="text-[11px] text-zinc-500">{{ vp.selectedSecondaryTagIds.value.length }} / 4</span>
      </div>
      <div class="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          v-for="tag in vp.tags.value"
          :key="`secondary-${tag.id}`"
          class="rounded-md border px-3 py-2 text-left text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          :class="vp.selectedSecondaryTagIds.value.includes(tag.id) ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-zinc-950/70 text-zinc-400'"
          :disabled="!vp.isVotingOpen.value || vp.selectedTagId.value === tag.id"
          @click="vp.toggleSecondaryTag(tag.id)"
        >
          {{ tag.name }}
        </button>
      </div>
    </div>
    <details class="rounded-md border border-white/10 bg-zinc-950/70 p-3 text-xs text-zinc-400">
      <summary class="cursor-pointer font-semibold text-cyan-100">{{ vp.t('votePanel.tagCriteria') }}</summary>
      <p class="mt-2 leading-5">{{ vp.selectedTagCriteria.value }}</p>
      <p class="mt-2 leading-5 text-zinc-500">{{ vp.t('votePanel.evidenceRuleSummary') }}</p>
      <p class="mt-2 leading-5">{{ vp.selectedEvidenceGuidance.value }}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        <span class="rounded-full px-2 py-1 text-[11px] font-semibold" :class="vp.requiresEvidenceUrl.value ? 'bg-amber-300/15 text-amber-100' : 'bg-cyan-300/10 text-cyan-100'">
          {{ vp.requiresEvidenceUrl.value ? vp.t('votePanel.evidenceUrlNeeded') : vp.t('votePanel.textReasonAccepted') }}
        </span>
        <span class="rounded-full px-2 py-1 text-[11px] font-semibold" :class="vp.requiresEvidenceNote.value ? 'bg-amber-300/15 text-amber-100' : 'bg-white/10 text-zinc-300'">
          {{ vp.requiresEvidenceNote.value ? vp.t('votePanel.noteNeeded') : vp.t('votePanel.noteEncouraged') }}
        </span>
      </div>
    </details>

    <label class="block text-xs text-zinc-400">
      {{ vp.selectedEvidenceUrlLabel.value }}<span v-if="vp.requiresEvidenceUrl.value" class="text-amber-200"> *</span>
      <input
        v-model="vp.evidenceUrl.value"
        class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
        :disabled="!vp.isVotingOpen.value"
        :placeholder="vp.requiresEvidenceUrl.value ? vp.t('votePanel.evidenceUrlRequired') : vp.t('votePanel.evidenceUrlOptional')"
      />
    </label>

    <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold text-white">{{ vp.t('votePanel.directUploadTitle') }}</p>
          <p class="mt-1 text-xs leading-5 text-zinc-500">
            {{ evidenceUploadConfig.enabled ? vp.t('votePanel.directUploadReady') : vp.t('votePanel.directUploadFallback') }}
          </p>
        </div>
        <span class="shrink-0 rounded bg-cyan-300/10 px-2 py-1 text-[11px] font-semibold text-cyan-100">
          {{ vp.t('votePanel.noSelfHosting') }}
        </span>
      </div>
      <input
        :ref="(el) => { vp.evidenceUploadInput.value = el }"
        class="hidden"
        type="file"
        accept="image/*"
        :disabled="!vp.isVotingOpen.value || vp.evidenceUploading.value"
        @change="vp.handleEvidenceFileChange"
      />
      <div class="mt-3 grid gap-2 sm:grid-cols-3">
        <button
          type="button"
          class="rounded-md border border-cyan-300/30 px-3 py-2 text-xs font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="!vp.isVotingOpen.value || vp.evidenceUploading.value"
          @click="vp.openEvidenceUploadPicker()"
        >
          {{ vp.evidenceUploading.value ? vp.t('votePanel.uploading') : vp.t('votePanel.uploadScreenshot') }}
        </button>
        <button
          type="button"
          class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-200"
          @click="vp.openExternalEvidenceTarget(evidenceUploadConfig.openImageHostUrl)"
        >
          {{ vp.t('votePanel.openImageHost') }}
        </button>
        <button
          type="button"
          class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-200"
          @click="vp.openExternalEvidenceTarget(evidenceUploadConfig.openCloudDriveUrl)"
        >
          {{ vp.t('votePanel.openCloudDrive') }}
        </button>
      </div>
      <p v-if="vp.evidenceUploadMessage.value" class="mt-2 rounded-md border border-emerald-400/30 bg-emerald-500/10 p-2 text-xs text-emerald-100">
        {{ vp.evidenceUploadMessage.value }}
      </p>
    </div>

    <label class="block text-xs text-zinc-400">
      {{ vp.selectedEvidenceNoteLabel.value }}<span v-if="vp.requiresEvidenceNote.value" class="text-amber-200"> *</span>
      <textarea
        v-model="vp.evidenceNote.value"
        rows="3"
        class="mt-2 w-full resize-none rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"
        :disabled="!vp.isVotingOpen.value"
        :placeholder="vp.selectedEvidenceNotePlaceholder.value"
      ></textarea>
    </label>

    <p v-if="vp.voteError.value" class="rounded-md border border-red-400/40 bg-red-500/10 p-2 text-xs text-red-100">{{ vp.voteError.value }}</p>
    <p v-if="vp.voteMessage.value" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-2 text-xs text-emerald-100">{{ vp.voteMessage.value }}</p>
    <p v-if="vp.achievementToastMessage.value" class="rounded-md border border-cyan-300/40 bg-cyan-300/10 p-2 text-xs text-cyan-100">{{ vp.achievementToastMessage.value }}</p>
    <div class="rounded-md border border-cyan-300/20 bg-cyan-300/[0.05] p-3">
      <p class="text-xs font-semibold text-cyan-100">{{ vp.t('votePanel.submitPreviewTitle') }}</p>
      <div class="mt-2 grid gap-2 text-[11px] text-zinc-300 sm:grid-cols-2">
        <div class="rounded border border-white/10 bg-zinc-950/70 p-2">
          <span class="block text-zinc-500">{{ vp.t('votePanel.previewLabel') }}</span>
          <span class="mt-1 block font-semibold text-white">{{ vp.selectedTag.value?.name || vp.t('votePanel.tagCriteriaFallback') }}</span>
        </div>
        <div class="rounded border border-white/10 bg-zinc-950/70 p-2">
          <span class="block text-zinc-500">{{ vp.t('votePanel.previewWeight') }}</span>
          <span class="mt-1 block font-semibold text-cyan-100">{{ vp.isLoggedIn.value ? vp.estimatedVoteWeight.value.toFixed(2) : vp.t('votePanel.notSignedIn') }}</span>
        </div>
        <div class="rounded border border-white/10 bg-zinc-950/70 p-2">
          <span class="block text-zinc-500">{{ vp.t('votePanel.previewEvidence') }}</span>
          <span class="mt-1 block font-semibold" :class="vp.requiresEvidenceUrl.value && !vp.evidenceUrl.value.trim() ? 'text-amber-200' : 'text-zinc-100'">
            {{ vp.tagEvidenceBadge(vp.selectedTag.value) }}
          </span>
        </div>
        <div class="rounded border border-white/10 bg-zinc-950/70 p-2">
          <span class="block text-zinc-500">{{ vp.t('votePanel.previewStatus') }}</span>
          <span class="mt-1 block font-semibold" :class="vp.primaryCannotVoteReason.value ? 'text-amber-200' : 'text-emerald-300'">
            {{ vp.primaryCannotVoteReason.value || vp.t('votePanel.readyToSubmit') }}
          </span>
        </div>
      </div>
    </div>
    <div v-if="vp.voteMessage.value && !vp.voteError.value" class="rounded-md border border-cyan-300/20 bg-cyan-300/[0.05] p-3">
      <p class="text-xs font-semibold text-cyan-100">{{ vp.t('votePanel.afterVoteTitle') }}</p>
      <div class="mt-2 grid gap-2 sm:grid-cols-3">
        <button class="rounded-md border border-cyan-300/30 px-2 py-2 text-[11px] font-semibold text-cyan-100" type="button" @click="vp.shareCurrentResult()">
          {{ vp.t('votePanel.shareResult') }}
        </button>
        <a class="rounded-md border border-white/10 px-2 py-2 text-center text-[11px] font-semibold text-zinc-200" href="/profile" target="_blank" rel="noopener noreferrer">
          {{ vp.t('votePanel.viewBadges') }}
        </a>
        <button class="rounded-md border border-white/10 px-2 py-2 text-[11px] font-semibold text-zinc-200" type="button" @click="vp.advancedMode.value = true; vp.activeTab.value = 'events'">
          {{ vp.t('votePanel.organizeContext') }}
        </button>
      </div>
    </div>
    <div v-if="vp.primaryCannotVoteReason.value" class="rounded-md border border-white/10 bg-zinc-950/70 p-3 text-xs text-zinc-400">
      <p class="font-semibold text-zinc-200">{{ vp.t('votePanel.cannotVoteTitle') }}</p>
      <ul class="mt-2 space-y-1">
        <li v-for="reason in vp.cannotVoteReasons.value" :key="reason">• {{ reason }}</li>
      </ul>
    </div>

    <button
      class="w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
      :disabled="vp.loading.value || vp.submitting.value || !vp.selectedTagId.value || !vp.isVotingOpen.value"
      @click="vp.submitVote()"
    >
      {{ !vp.isVotingOpen.value ? vp.t('votePanel.voteClosed') : vp.submitting.value ? vp.t('votePanel.submitting') : vp.isLoggedIn.value ? (vp.hasReadEnough.value ? vp.t('votePanel.submitOrUpdate') : vp.t('votePanel.waitRead')) : vp.t('common.signIn') }}
    </button>
  </section>
</template>
