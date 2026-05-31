<script setup>
import { inject } from 'vue'

const vp = inject('votePanel')
</script>

<template>
  <section class="mt-4 space-y-3">
    <div class="space-y-3 rounded-md border border-emerald-300/20 bg-emerald-300/[0.05] p-3">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs font-semibold text-emerald-100">{{ vp.t('votePanel.readerReactionTitle') }}</p>
          <p class="mt-1 text-[11px] leading-5 text-zinc-400">{{ vp.t('votePanel.readerReactionDesc') }}</p>
        </div>
        <div class="shrink-0 rounded border border-white/10 bg-zinc-950 px-2 py-1 text-[11px] font-semibold text-zinc-300">
          {{ vp.t('votePanel.readerReactionCount', { count: vp.reactionTotalUsers.value }) }}
        </div>
      </div>

      <select
        v-if="vp.relatedEvents.value.length"
        :value="vp.selectedReactionEventId.value"
        class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-300"
        @change="vp.selectReactionEvent($event.target.value)"
      >
        <option v-for="ev in vp.relatedEvents.value" :key="ev.id" :value="String(ev.id)">{{ ev.name }}</option>
      </select>
      <p v-else class="text-[11px] text-zinc-500">{{ vp.reactionTargetLabel.value }}</p>

      <div v-if="vp.hoverReactionRows.value.length" class="flex flex-wrap gap-2">
        <span
          v-for="row in vp.hoverReactionRows.value"
          :key="`hover-${row.key}`"
          class="inline-flex items-center gap-1 rounded-full border border-white/10 bg-zinc-950 px-2.5 py-1 text-xs font-semibold text-zinc-100"
          :title="`${row.label} · ${vp.t(`votePanel.reactionStrength.${row.strength}`)} · ${row.count}`"
        >
          <span class="text-base">{{ row.emoji }}</span>
          <span>{{ row.label }}</span>
        </span>
      </div>
      <p v-else class="text-[11px] text-zinc-500">{{ vp.t('votePanel.readerReactionEmpty') }}</p>

      <div class="space-y-2">
        <p class="text-[11px] font-semibold text-zinc-300">{{ vp.t('votePanel.readerReactionFeelings') }}</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="option in vp.reactionOptions.value.feelings"
            :key="option.key"
            type="button"
            class="rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors"
            :class="vp.selectedFeelings.value.includes(option.key) ? 'border-emerald-200 bg-emerald-300 text-zinc-950' : 'border-white/10 bg-zinc-950 text-zinc-300 hover:border-emerald-300/50 hover:text-emerald-100'"
            @click="vp.toggleReaderReaction('feeling', option.key)"
          >
            <span class="mr-1 text-sm">{{ option.emoji }}</span>{{ option.label }}
          </button>
        </div>
      </div>

      <div class="space-y-2">
        <p class="text-[11px] font-semibold text-zinc-300">{{ vp.t('votePanel.readerReactionNeeds') }}</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="option in vp.reactionOptions.value.needs"
            :key="option.key"
            type="button"
            class="rounded-full border px-2.5 py-1.5 text-xs font-semibold transition-colors"
            :class="vp.selectedNeeds.value.includes(option.key) ? 'border-cyan-200 bg-cyan-300 text-zinc-950' : 'border-white/10 bg-zinc-950 text-zinc-300 hover:border-cyan-300/50 hover:text-cyan-100'"
            @click="vp.toggleReaderReaction('need', option.key)"
          >
            <span class="mr-1 text-sm">{{ option.emoji }}</span>{{ option.label }}
          </button>
        </div>
      </div>

      <p v-if="vp.reactionError.value" class="text-[11px] text-red-300">{{ vp.reactionError.value }}</p>
      <p v-if="vp.reactionMessage.value" class="text-[11px] text-emerald-300">{{ vp.reactionMessage.value }}</p>
      <button
        type="button"
        class="w-full rounded-md bg-emerald-300 px-3 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50"
        :disabled="vp.reactionSubmitting.value || vp.reactionLoading.value"
        @click="vp.submitReaction()"
      >
        {{ !vp.isLoggedIn.value ? vp.t('common.signIn') : vp.reactionSubmitting.value ? vp.t('votePanel.submitting') : vp.t('votePanel.readerReactionSubmit') }}
      </button>
    </div>
  </section>
</template>
