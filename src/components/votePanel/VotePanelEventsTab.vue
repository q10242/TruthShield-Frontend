<script setup>
import { inject } from 'vue'

const vp = inject('votePanel')

const sourceTypeLabels = {
  news: 'votePanel.eventSourceNews',
  evidence: 'votePanel.eventSourceEvidence',
  official_response: 'votePanel.eventSourceOfficial',
  external: 'votePanel.eventSourceExternal',
}
</script>

<template>
  <section class="mt-4 space-y-3">
    <div>
      <p class="text-xs font-semibold text-zinc-400">{{ vp.t('votePanel.contextTabTitle') }}</p>
      <div v-if="vp.relatedEvents.value.length" class="mt-2 space-y-2">
        <div v-for="ev in vp.relatedEvents.value" :key="ev.id" class="rounded border border-cyan-300/20 bg-zinc-950/70 p-2">
          <div class="flex items-center justify-between gap-2">
            <p class="truncate text-xs font-semibold text-cyan-100">{{ ev.name }}</p>
            <a :href="`/events/${ev.id}`" target="_blank" rel="noopener noreferrer" class="shrink-0 text-[11px] text-zinc-500 hover:text-cyan-100">↗</a>
          </div>
          <p class="mt-0.5 text-[11px] text-zinc-500">
            {{ vp.t('votePanel.eventCountTimeline', { count: ev.counts?.timeline ?? 0 }) }} · {{ vp.t('votePanel.eventCountGraph', { count: ev.counts?.relationships ?? 0 }) }}
          </p>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button class="rounded px-2 py-1 text-[11px] font-semibold" :class="vp.eventDetailTab.value?.eventId === ev.id && vp.eventDetailTab.value?.mode === 'timeline' ? 'bg-cyan-300 text-zinc-950' : 'bg-cyan-300/15 text-cyan-100'" @click="vp.openEventDetail(ev, 'timeline')">{{ vp.t('votePanel.timeline') }}</button>
            <button class="rounded px-2 py-1 text-[11px] font-semibold" :class="vp.eventDetailTab.value?.eventId === ev.id && vp.eventDetailTab.value?.mode === 'graph' ? 'bg-cyan-300 text-zinc-950' : 'bg-cyan-300/15 text-cyan-100'" @click="vp.openEventDetail(ev, 'graph')">{{ vp.t('votePanel.graph') }}</button>
          </div>
          <div v-if="vp.eventDetailTab.value?.eventId === ev.id" class="mt-2">
            <div v-if="vp.eventDetailLoading.value" class="text-[11px] text-zinc-400">{{ vp.t('votePanel.loading') }}</div>
            <div v-else-if="vp.eventDetailError.value" class="text-[11px] text-red-300">{{ vp.eventDetailError.value }}</div>
            <template v-else-if="vp.eventDetailTab.value.mode === 'timeline'">
              <div v-if="!vp.eventTimeline.value.length" class="text-[11px] text-zinc-500">{{ vp.t('votePanel.noTimelineEntries') }}</div>
              <div v-else class="space-y-2 border-l-2 border-cyan-300/20 pl-3">
                <div v-for="entry in vp.eventTimeline.value" :key="entry.id">
                  <p class="text-[10px] text-zinc-500">{{ entry.occurred_at ? vp.formatDateTime(entry.occurred_at) : '' }} · {{ vp.t(sourceTypeLabels[entry.source_type] || 'votePanel.eventSourceExternal') }}</p>
                  <p class="text-[11px] font-semibold leading-snug text-zinc-200">{{ entry.title }}</p>
                  <p v-if="entry.summary" class="mt-0.5 text-[11px] leading-relaxed text-zinc-400">{{ entry.summary }}</p>
                  <a v-if="entry.source_url" :href="entry.source_url" target="_blank" rel="noopener noreferrer" class="mt-0.5 block truncate text-[10px] text-cyan-300">{{ entry.source_url }}</a>
                </div>
              </div>
            </template>
            <template v-else-if="vp.eventDetailTab.value.mode === 'graph'">
              <div v-if="!vp.eventGraph.value.entities?.length" class="text-[11px] text-zinc-500">{{ vp.t('votePanel.noNodesYet') }}</div>
              <svg v-else viewBox="0 0 320 240" class="w-full rounded border border-white/10" style="background:#09090b">
                <defs>
                  <marker id="vp-arrow" viewBox="0 0 8 8" refX="6.8" refY="4" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                    <path d="M 0 0 L 8 4 L 0 8 z" fill="#67e8f9" />
                  </marker>
                </defs>
                <g v-for="edge in vp.graphLayout.value.edgeLayouts" :key="edge.id">
                  <line :x1="edge.x1" :y1="edge.y1" :x2="edge.x2" :y2="edge.y2" :stroke="edge.isRisk ? '#f97316' : '#67e8f9'" stroke-width="1.5" opacity="0.65" marker-end="url(#vp-arrow)" :marker-start="edge.isBidirectional ? 'url(#vp-arrow)' : undefined" />
                  <template v-if="edge.label">
                    <rect :x="edge.mx - edge.label.length * 3.5 - 4" :y="edge.my - 7" :width="edge.label.length * 7 + 8" height="14" rx="3" fill="#09090b" :stroke="edge.isRisk ? '#f97316' : '#155e75'" opacity="0.95" />
                    <text :x="edge.mx" :y="edge.my + 1" text-anchor="middle" dominant-baseline="middle" :fill="edge.isRisk ? '#fed7aa' : '#cffafe'" font-size="8" font-weight="700">{{ edge.label }}</text>
                  </template>
                </g>
                <g v-for="node in vp.graphLayout.value.nodeLayouts" :key="node.id">
                  <circle :cx="node.x" :cy="node.y" :r="node.r" :fill="node.fill" :stroke="node.stroke" stroke-width="1.5" />
                  <text :x="node.x" :y="node.y + 3" text-anchor="middle" fill="#fff" font-size="9" pointer-events="none">{{ node.name }}</text>
                </g>
              </svg>
            </template>
          </div>
        </div>
      </div>
      <div v-else class="mt-1 rounded-md border border-white/10 bg-white/[0.03] p-3">
        <p class="text-[11px] leading-5 text-zinc-500">{{ vp.t('votePanel.noContextYet') }}</p>
        <p class="mt-2 text-[11px] leading-5 text-zinc-400">{{ vp.t('votePanel.contextExplain') }}</p>
      </div>
    </div>

    <div class="space-y-2 rounded-md border border-cyan-300/20 bg-cyan-300/[0.05] p-3">
      <p class="text-xs font-semibold text-cyan-100">{{ vp.t('votePanel.contextAddTitle') }}</p>
      <p class="text-[11px] leading-5 text-zinc-500">{{ vp.t('votePanel.contextAddDesc') }}</p>
      <div v-if="!vp.isLoggedIn.value" class="text-[11px] text-amber-200">{{ vp.t('votePanel.signInToAddEvents') }}</div>
      <div v-else-if="!vp.canUseEventSystem.value" class="rounded border border-amber-300/30 bg-amber-300/10 px-2 py-1.5 text-[11px] leading-5 text-amber-100">
        {{ vp.t('votePanel.eventSystemMinTrust', { score: vp.eventSystemMinTrustScore.value.toFixed(2) }) }}
      </div>

      <div class="flex rounded border border-white/10 bg-zinc-900 p-0.5 text-xs font-semibold">
        <button class="flex-1 rounded py-1.5 transition-colors" :class="vp.pinMode.value === 'timeline' ? 'bg-cyan-300 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'" @click="vp.pinMode.value = 'timeline'">{{ vp.t('votePanel.timeline') }}</button>
        <button class="flex-1 rounded py-1.5 transition-colors" :class="vp.pinMode.value === 'graph' ? 'bg-cyan-300 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'" @click="vp.pinMode.value = 'graph'">{{ vp.t('votePanel.graph') }}</button>
      </div>

      <div class="grid gap-1.5 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input v-model="vp.pinEventSearch.value" class="min-w-0 rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.t('votePanel.searchEvents')" @keydown.enter.prevent="vp.searchPinEvents()" />
        <button type="button" class="rounded border border-white/10 px-2 py-1.5 text-xs font-semibold text-zinc-200" @click="vp.searchPinEvents()">{{ vp.t('votePanel.searchEvents') }}</button>
      </div>
      <select v-model="vp.pinSelectedEventId.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300">
        <option value="">{{ vp.t('votePanel.createNewEvent') }}</option>
        <option v-for="ev in vp.pinSearchEvents.value" :key="ev.id" :value="String(ev.id)">{{ ev.name }}</option>
      </select>
      <template v-if="!vp.pinSelectedEventId.value">
        <input v-model="vp.pinNewEventName.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.t('votePanel.eventName')" />
        <textarea v-model="vp.pinNewEventSummary.value" rows="2" class="w-full resize-none rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.t('votePanel.eventSummary')"></textarea>
        <select v-model="vp.pinNewEventPrimaryCategory.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300">
          <option value="">{{ vp.t('votePanel.eventUncategorized') }}</option>
          <option v-for="option in vp.pinEventOptions.value.primary_categories" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
        <select v-model="vp.pinNewEventProgressStatus.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300">
          <option v-for="option in vp.pinEventOptions.value.progress_statuses" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
        <select v-model="vp.pinNewEventTags.value" multiple size="4" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300">
          <option v-for="option in vp.pinEventOptions.value.tags" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </template>

      <template v-if="vp.pinMode.value === 'timeline'">
        <input v-model="vp.pinEntryTitle.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.t('votePanel.entryTitle')" />
        <textarea v-model="vp.pinEntrySummary.value" rows="2" class="w-full resize-none rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.t('votePanel.summary')"></textarea>
        <input v-model="vp.pinOccurredAt.value" type="datetime-local" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" />
        <input v-model="vp.pinSourceUrl.value" type="url" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.t('votePanel.sourceUrl')" />
      </template>

      <template v-else>
        <div class="flex rounded border border-white/10 bg-zinc-900 p-0.5 text-xs font-semibold">
          <button class="flex-1 rounded py-1 transition-colors" :class="vp.pinGraphMode.value === 'entity' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-zinc-300'" @click="vp.pinGraphMode.value = 'entity'">{{ vp.t('votePanel.addNode') }}</button>
          <button class="flex-1 rounded py-1 transition-colors" :class="vp.pinGraphMode.value === 'relationship' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-zinc-300'" :disabled="!vp.pinEventGraph.value.entities?.length" @click="vp.pinGraphMode.value = 'relationship'">{{ vp.t('votePanel.addRelationship') }}</button>
        </div>

        <template v-if="vp.pinGraphMode.value === 'entity'">
          <p v-if="vp.pinSelectedEventId.value && !vp.pinEventGraph.value.entities?.length" class="rounded border border-cyan-300/20 bg-cyan-300/10 px-2 py-1.5 text-[11px] text-cyan-200">
            {{ vp.t('votePanel.firstNodeHint') }}
          </p>
          <input v-model="vp.pinEntityName.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.t('votePanel.personOrOrgName')" />
          <select v-model="vp.pinEntityType.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300">
            <option value="person">{{ vp.t('votePanel.person') }}</option>
            <option value="organization">{{ vp.t('votePanel.organization') }}</option>
          </select>
          <template v-if="vp.pinEventGraph.value.entities?.length">
            <p class="text-[10px] text-zinc-500">{{ vp.t('votePanel.connectExistingNodeOptional') }}</p>
            <select v-model="vp.pinToEntityId.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300">
              <option v-for="e in vp.pinEventGraph.value.entities" :key="e.id" :value="String(e.id)">{{ e.name }} · {{ e.entity_type }}</option>
            </select>
            <input v-model="vp.pinRelType.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.t('votePanel.relationshipLabelPlaceholder')" />
            <label class="flex items-center gap-2 text-[11px] text-zinc-400 cursor-pointer">
              <input v-model="vp.pinIsBidirectional.value" type="checkbox" class="rounded border-white/20 bg-zinc-900" />
              {{ vp.t('votePanel.bidirectional') }}
            </label>
          </template>
        </template>

        <template v-else>
          <p class="text-[10px] text-zinc-500">{{ vp.t('votePanel.addBetweenNodes') }}</p>
          <select v-model="vp.pinFromEntityId.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300">
            <option v-for="e in vp.pinEventGraph.value.entities" :key="e.id" :value="String(e.id)">{{ e.name }} · {{ e.entity_type }}</option>
          </select>
          <p class="text-center text-[10px] text-zinc-500">↓ {{ vp.t('votePanel.relationshipWord') }} ↓</p>
          <select v-model="vp.pinToEntityId.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300">
            <option v-for="e in vp.pinEventGraph.value.entities" :key="e.id" :value="String(e.id)">{{ e.name }} · {{ e.entity_type }}</option>
          </select>
          <input v-model="vp.pinRelType.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.t('votePanel.relationshipLabelPlaceholder')" />
          <label class="flex items-center gap-2 text-[11px] text-zinc-400 cursor-pointer">
            <input v-model="vp.pinIsBidirectional.value" type="checkbox" class="rounded border-white/20 bg-zinc-900" />
            {{ vp.t('votePanel.bidirectional') }}
          </label>
        </template>

        <textarea v-model="vp.pinRelDesc.value" rows="2" class="w-full resize-none rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.t('votePanel.description')"></textarea>
        <input v-model="vp.pinSourceUrl.value" type="url" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.t('votePanel.sourceUrl')" />
      </template>

      <p v-if="vp.pinError.value" class="text-[11px] text-red-300">{{ vp.pinError.value }}</p>
      <p v-if="vp.pinMessage.value" class="text-[11px] text-emerald-300">{{ vp.pinMessage.value }}</p>
      <button class="w-full rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50" :disabled="vp.pinSubmitting.value || !vp.isLoggedIn.value || !vp.canUseEventSystem.value" @click="vp.submitPinEntry()">
        {{ vp.pinSubmitting.value ? vp.t('votePanel.submitting') : vp.t('votePanel.addToEvent') }}
      </button>
    </div>
  </section>
</template>
