<script setup>
import { inject } from 'vue'

const vp = inject('votePanel')
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

      <img v-if="vp.evidencePreviewUrl(item)" :src="vp.evidencePreviewUrl(item)" alt="" class="max-h-36 w-full rounded-md border border-white/10 object-cover" />

      <p class="text-sm leading-5 text-zinc-200">{{ item.evidence_note || vp.t('evidence.noNote') }}</p>

      <div class="rounded-md border border-white/10 bg-white/[0.03] p-2">
        <p class="text-[11px] text-zinc-500">{{ vp.evidenceTypeLabel(item) }}</p>
        <a :href="item.evidence_url" target="_blank" rel="noreferrer" class="mt-1 block truncate text-xs font-semibold text-cyan-200">
          {{ item.evidence_host || item.evidence_url }}
        </a>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button class="rounded-md border border-emerald-300/30 px-2 py-1 text-xs text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50" :disabled="vp.reactingId.value === item.id || !vp.isVotingOpen.value || (vp.isLoggedIn.value && !vp.canReactToEvidence.value)" @click="vp.react(item, true)">
          {{ vp.t('votePanel.helpful') }} {{ item.helpful_count }}
        </button>
        <button class="rounded-md border border-red-300/30 px-2 py-1 text-xs text-red-100 disabled:cursor-not-allowed disabled:opacity-50" :disabled="vp.reactingId.value === item.id || !vp.isVotingOpen.value || (vp.isLoggedIn.value && !vp.canReactToEvidence.value)" @click="vp.react(item, false)">
          {{ vp.t('votePanel.unhelpful') }} {{ item.unhelpful_count }}
        </button>
        <button class="ml-auto rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-300" @click="vp.reportItem(item)">
          {{ vp.t('votePanel.report') }}
        </button>
      </div>
    </article>
  </section>
</template>
