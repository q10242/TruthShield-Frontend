<script setup>
import { inject, ref } from 'vue'

const vp = inject('votePanel')
const lightboxUrl = ref('')
</script>

<template>
  <section class="mt-4 space-y-3 border-t border-white/10 pt-4">
    <div class="rounded-md border border-cyan-300/20 bg-cyan-300/[0.05] p-3">
      <div class="flex items-center justify-between gap-3">
        <p class="text-sm font-semibold text-cyan-100">{{ vp.t('votePanel.officialResponses') }}</p>
        <span class="text-xs text-cyan-200/70">{{ vp.officialResponses.value.length }}</span>
      </div>
      <div v-if="vp.officialResponses.value.length" class="mt-3 space-y-3">
        <article v-for="item in vp.officialResponses.value" :key="item.id" class="rounded-md border border-cyan-300/20 bg-zinc-950/80 p-3">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded bg-cyan-300/15 px-2 py-1 text-[11px] font-semibold text-cyan-100">{{ item.claimant?.claim_type || item.response_type }}</span>
            <span class="text-[11px] text-zinc-500">{{ item.author?.display_name }}</span>
            <span v-if="item.author?.identity_label" class="rounded bg-white/10 px-2 py-1 text-[11px] text-zinc-300">{{ item.author.identity_label }}</span>
          </div>
          <p class="mt-3 text-sm leading-5 text-zinc-100">{{ item.response_text }}</p>
          <a v-if="item.evidence_url" :href="item.evidence_url" target="_blank" rel="noreferrer" class="mt-2 block truncate text-xs font-semibold text-cyan-200">{{ item.evidence_url }}</a>
          <div class="mt-3 flex gap-2">
            <button class="rounded-md border border-emerald-300/30 px-2 py-1 text-xs text-emerald-100 disabled:opacity-50" :disabled="vp.isLoggedIn.value && !vp.canReactToEvidence.value" @click="vp.reactOfficial(item, true)">
              {{ vp.t('votePanel.helpful') }} {{ Number(item.helpful_weight || 0).toFixed(1) }}
            </button>
            <button class="rounded-md border border-red-300/30 px-2 py-1 text-xs text-red-100 disabled:opacity-50" :disabled="vp.isLoggedIn.value && !vp.canReactToEvidence.value" @click="vp.reactOfficial(item, false)">
              {{ vp.t('votePanel.unhelpful') }} {{ Number(item.unhelpful_weight || 0).toFixed(1) }}
            </button>
          </div>
        </article>
      </div>
      <p v-else class="mt-2 text-xs leading-5 text-zinc-400">{{ vp.t('votePanel.noOfficialResponses') }}</p>
      <div v-if="!vp.approvedClaimants.value.length" class="mt-3 rounded-md border border-white/10 bg-zinc-950/70 p-3">
        <p class="text-xs font-semibold text-white">{{ vp.t('votePanel.officialNoIdentityTitle') }}</p>
        <p class="mt-1 text-xs leading-5 text-zinc-500">{{ vp.t('votePanel.officialNoIdentityDesc') }}</p>
        <div class="mt-3 grid gap-2 sm:grid-cols-2">
          <a class="rounded-md border border-cyan-300/30 px-3 py-2 text-center text-xs font-semibold text-cyan-100" href="/profile" target="_blank" rel="noopener noreferrer">
            {{ vp.t('votePanel.applyClaimant') }}
          </a>
          <a class="rounded-md border border-white/10 px-3 py-2 text-center text-xs font-semibold text-zinc-300" href="/official-response-policy" target="_blank" rel="noopener noreferrer">
            {{ vp.t('votePanel.clarificationPolicy') }}
          </a>
        </div>
      </div>

      <details v-if="vp.approvedClaimants.value.length" class="mt-3 rounded-md border border-white/10 bg-zinc-950/70 p-3">
        <summary class="cursor-pointer text-xs font-semibold text-cyan-100">{{ vp.t('votePanel.submitOfficialResponse') }}</summary>
        <div class="mt-3 space-y-3">
          <p class="rounded-md border border-cyan-300/20 bg-cyan-300/[0.05] p-2 text-xs leading-5 text-cyan-100">{{ vp.t('votePanel.officialResponseSeparateRule') }}</p>
          <select v-model="vp.selectedClaimantId.value" class="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white">
            <option value="">{{ vp.t('votePanel.selectClaimant') }}</option>
            <option v-for="claim in vp.approvedClaimants.value" :key="claim.id" :value="claim.id">{{ claim.claim_type }} · {{ claim.domain || claim.organization_name || claim.id }}</option>
          </select>
          <select v-model="vp.officialResponseType.value" class="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white">
            <option value="subject_clarification">{{ vp.t('votePanel.subjectClarification') }}</option>
            <option value="author_clarification">{{ vp.t('votePanel.authorClarification') }}</option>
            <option value="media_statement">{{ vp.t('votePanel.mediaStatement') }}</option>
            <option value="organization_statement">{{ vp.t('votePanel.organizationStatement') }}</option>
            <option value="right_of_reply">{{ vp.t('votePanel.rightOfReply') }}</option>
          </select>
          <textarea v-model="vp.officialResponseText.value" rows="3" class="w-full resize-none rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white" :placeholder="vp.t('votePanel.officialResponseText')"></textarea>
          <input v-model="vp.officialResponseEvidenceUrl.value" class="w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-xs text-white" :placeholder="vp.t('votePanel.officialResponseEvidence')" />
          <button class="w-full rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950" @click="vp.submitOfficialResponse()">{{ vp.t('votePanel.submitOfficialResponse') }}</button>
        </div>
      </details>
      <p v-if="vp.officialResponseError.value" class="mt-2 rounded-md border border-red-400/40 bg-red-500/10 p-2 text-xs text-red-100">{{ vp.officialResponseError.value }}</p>
      <p v-if="vp.officialResponseMessage.value" class="mt-2 rounded-md border border-emerald-400/40 bg-emerald-500/10 p-2 text-xs text-emerald-100">{{ vp.officialResponseMessage.value }}</p>
    </div>

    <div class="flex items-center justify-between">
      <p class="text-sm font-semibold text-white">{{ vp.t('votePanel.communityEvidence') }}</p>
      <span class="text-xs text-zinc-500">{{ vp.t('votePanel.evidenceCount', { count: vp.evidence.value.length }) }}</span>
    </div>

    <p v-if="vp.isLoggedIn.value && !vp.canReactToEvidence.value" class="rounded-md border border-orange-400/40 bg-orange-500/10 p-2 text-xs text-orange-100">
      {{ vp.t('votePanel.lowTrustCannotReact', { score: vp.evidenceReactionMinTrustScore.value.toFixed(2) }) }}
    </p>

    <p v-if="vp.evidenceError.value" class="rounded-md border border-red-400/40 bg-red-500/10 p-2 text-xs text-red-100">{{ vp.evidenceError.value }}</p>
    <p v-if="vp.reportMessage.value" class="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-2 text-xs text-emerald-100">{{ vp.reportMessage.value }}</p>

    <div v-if="vp.evidence.value.length === 0" class="rounded-md border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-400">
      <p>{{ vp.t('votePanel.noEvidence') }}</p>
      <p class="mt-2 text-xs leading-5 text-zinc-500">{{ vp.t('votePanel.noEvidenceHint') }}</p>
      <div class="mt-3 grid gap-2 sm:grid-cols-2">
        <button class="rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50" :disabled="!vp.isVotingOpen.value" @click="vp.isLoggedIn.value ? (vp.activeTab.value = 'vote') : vp.openLogin()">
          {{ vp.t('votePanel.addEvidenceByVote') }}
        </button>
        <button class="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-zinc-300 hover:border-cyan-300/50 hover:text-cyan-100" @click="vp.advancedMode.value = true; vp.activeTab.value = 'events'">
          {{ vp.t('votePanel.organizeContext') }}
        </button>
      </div>
    </div>

    <article v-for="item in vp.evidence.value" :key="item.id" class="space-y-3 rounded-md border border-white/10 bg-zinc-900/80 p-3">
      <div class="flex flex-wrap items-center gap-2">
        <span class="rounded bg-white/10 px-2 py-1 text-[11px] font-semibold text-zinc-200">{{ item.tag.name }}</span>
        <span class="rounded px-2 py-1 text-[11px] font-semibold" :class="item.is_trusted_evidence ? 'bg-emerald-500/15 text-emerald-200' : 'bg-zinc-800 text-zinc-400'">
          {{ vp.evidenceTrustLabel(item) }}
        </span>
        <span class="rounded px-2 py-1 text-[11px] font-semibold" :class="vp.evidenceQualityClass(item)">
          {{ vp.evidenceQualityLabel(item) }}
        </span>
        <span class="ml-auto text-[11px] text-zinc-500">{{ vp.t('evidence.netHelpfulWeight') }} {{ Number(item.net_helpful_weight).toFixed(2) }}</span>
      </div>

      <div v-if="item.author?.name" class="flex flex-wrap items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
        <span class="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-200">
          {{ String(item.author.name || '?').slice(0, 1).toUpperCase() }}
        </span>
        <div class="min-w-0">
          <p class="truncate text-xs font-semibold text-zinc-200">{{ item.author.name }}</p>
          <p class="text-[11px] text-zinc-500">{{ vp.t('profile.weight') }} {{ Number(item.author.trust_score || 0).toFixed(2) }}</p>
        </div>
        <span v-if="item.author.identity_label" class="rounded bg-white/10 px-2 py-1 text-[11px] text-zinc-300">{{ item.author.identity_label }}</span>
        <span
          v-if="item.author.selected_badge"
          class="ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold text-zinc-950"
          :style="{ backgroundColor: item.author.selected_badge.color || '#67e8f9' }"
        >
          {{ item.author.selected_badge.name }}
        </span>
      </div>

      <!-- Image thumbnail — click to enlarge -->
      <button
        v-if="vp.evidencePreviewUrl(item)"
        class="block w-full"
        :aria-label="vp.t('evidence.clickToEnlarge')"
        @click="lightboxUrl = vp.evidencePreviewUrl(item)"
      >
        <img
          :src="vp.evidencePreviewUrl(item)"
          alt=""
          class="max-h-36 w-full cursor-zoom-in rounded-md border border-white/10 object-cover transition-opacity hover:opacity-80"
        />
      </button>

      <p class="text-sm leading-5 text-zinc-200">{{ item.evidence_note || vp.t('evidence.noNote') }}</p>

      <!-- Link box: image type (preview already shown) -->
      <div v-if="vp.evidencePreviewUrl(item)" class="rounded-md border border-white/10 bg-white/[0.03] p-2">
        <p class="text-[11px] text-zinc-500">{{ vp.evidenceTypeLabel(item) }}</p>
        <a :href="item.evidence_url" target="_blank" rel="noreferrer noopener" class="mt-1 block truncate text-xs font-semibold text-cyan-200">
          {{ item.evidence_host || item.evidence_url }}
        </a>
      </div>

      <!-- Link box: external URL (no image preview) — show warning -->
      <div v-else class="rounded-md border border-amber-300/20 bg-amber-300/[0.06] p-2">
        <div class="mb-1.5 flex items-center gap-1.5">
          <span class="text-[10px] font-semibold text-amber-200">⚠ 外部連結</span>
          <span class="text-[10px] text-amber-200/60">請確認網址正確後再前往</span>
        </div>
        <p class="text-[11px] text-zinc-500">{{ vp.evidenceTypeLabel(item) }}</p>
        <a :href="item.evidence_url" target="_blank" rel="noreferrer noopener" class="mt-1 block truncate text-xs font-semibold text-cyan-200">
          {{ item.evidence_host || item.evidence_url }}
        </a>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button class="rounded-md border border-emerald-300/30 px-2 py-1 text-xs text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50" :disabled="vp.reactingId.value === item.id || (vp.isLoggedIn.value && !vp.canReactToEvidence.value)" @click="vp.react(item, true)">
          {{ vp.t('votePanel.helpful') }} {{ item.helpful_count }}
        </button>
        <button class="rounded-md border border-red-300/30 px-2 py-1 text-xs text-red-100 disabled:cursor-not-allowed disabled:opacity-50" :disabled="vp.reactingId.value === item.id || (vp.isLoggedIn.value && !vp.canReactToEvidence.value)" @click="vp.react(item, false)">
          {{ vp.t('votePanel.unhelpful') }} {{ item.unhelpful_count }}
        </button>
        <button class="ml-auto rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-300" @click="vp.reportItem(item)">
          {{ vp.t('votePanel.report') }}
        </button>
      </div>
    </article>
  </section>

  <!-- Lightbox overlay -->
  <Teleport to="body">
    <div
      v-if="lightboxUrl"
      class="fixed inset-0 z-[2147483646] flex flex-col items-center justify-center bg-black/90 p-4"
      @click.self="lightboxUrl = ''"
    >
      <button
        class="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-sm text-white hover:bg-white/20"
        @click="lightboxUrl = ''"
      >✕</button>
      <img
        :src="lightboxUrl"
        alt=""
        class="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
        @click.stop
      />
      <a
        :href="lightboxUrl"
        target="_blank"
        rel="noreferrer noopener"
        class="mt-4 rounded-md bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20"
        @click.stop
      >
        原始圖片 ↗
      </a>
    </div>
  </Teleport>
</template>
