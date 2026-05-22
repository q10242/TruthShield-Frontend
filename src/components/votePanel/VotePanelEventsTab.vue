<script setup>
import { inject } from 'vue'

const vp = inject('votePanel')
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
          <p class="mt-0.5 text-[11px] text-zinc-500">{{ vp.locale.value === 'en' ? 'Timeline' : '時間線' }} {{ ev.counts?.timeline ?? 0 }} · {{ vp.locale.value === 'en' ? 'Graph' : '關係圖' }} {{ ev.counts?.relationships ?? 0 }}</p>
          <div class="mt-2 flex flex-wrap gap-1.5">
            <button class="rounded px-2 py-1 text-[11px] font-semibold" :class="vp.eventDetailTab.value?.eventId === ev.id && vp.eventDetailTab.value?.mode === 'timeline' ? 'bg-cyan-300 text-zinc-950' : 'bg-cyan-300/15 text-cyan-100'" @click="vp.openEventDetail(ev, 'timeline')">{{ vp.locale.value === 'en' ? 'Timeline' : '時間線' }}</button>
            <button class="rounded px-2 py-1 text-[11px] font-semibold" :class="vp.eventDetailTab.value?.eventId === ev.id && vp.eventDetailTab.value?.mode === 'graph' ? 'bg-cyan-300 text-zinc-950' : 'bg-cyan-300/15 text-cyan-100'" @click="vp.openEventDetail(ev, 'graph')">{{ vp.locale.value === 'en' ? 'Graph' : '關係圖' }}</button>
          </div>
          <div v-if="vp.eventDetailTab.value?.eventId === ev.id" class="mt-2">
            <div v-if="vp.eventDetailLoading.value" class="text-[11px] text-zinc-400">{{ vp.locale.value === 'en' ? 'Loading...' : '載入中...' }}</div>
            <div v-else-if="vp.eventDetailError.value" class="text-[11px] text-red-300">{{ vp.eventDetailError.value }}</div>
            <template v-else-if="vp.eventDetailTab.value.mode === 'timeline'">
              <div v-if="!vp.eventTimeline.value.length" class="text-[11px] text-zinc-500">{{ vp.locale.value === 'en' ? 'No timeline entries yet.' : '尚無時間線資料。' }}</div>
              <div v-else class="space-y-2 border-l-2 border-cyan-300/20 pl-3">
                <div v-for="entry in vp.eventTimeline.value" :key="entry.id">
                  <p class="text-[10px] text-zinc-500">{{ entry.occurred_at ? vp.formatDateTime(entry.occurred_at) : '' }} · {{ { news: vp.locale.value === 'en' ? 'News' : '新聞', evidence: vp.locale.value === 'en' ? 'Evidence' : '佐證', official_response: vp.locale.value === 'en' ? 'Official' : '官方回應', external: vp.locale.value === 'en' ? 'External' : '外部' }[entry.source_type] ?? entry.source_type }}</p>
                  <p class="text-[11px] font-semibold leading-snug text-zinc-200">{{ entry.title }}</p>
                  <p v-if="entry.summary" class="mt-0.5 text-[11px] leading-relaxed text-zinc-400">{{ entry.summary }}</p>
                  <a v-if="entry.source_url" :href="entry.source_url" target="_blank" rel="noopener noreferrer" class="mt-0.5 block truncate text-[10px] text-cyan-300">{{ entry.source_url }}</a>
                </div>
              </div>
            </template>
            <template v-else-if="vp.eventDetailTab.value.mode === 'graph'">
              <div v-if="!vp.eventGraph.value.entities?.length" class="text-[11px] text-zinc-500">{{ vp.locale.value === 'en' ? 'No nodes yet.' : '尚無節點。' }}</div>
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
      <div v-if="!vp.isLoggedIn.value" class="text-[11px] text-amber-200">{{ vp.locale.value === 'en' ? 'Sign in to add articles to events.' : '登入後才能加入事件。' }}</div>

      <div class="flex rounded border border-white/10 bg-zinc-900 p-0.5 text-xs font-semibold">
        <button class="flex-1 rounded py-1.5 transition-colors" :class="vp.pinMode.value === 'timeline' ? 'bg-cyan-300 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'" @click="vp.pinMode.value = 'timeline'">{{ vp.locale.value === 'en' ? 'Timeline' : '時間線' }}</button>
        <button class="flex-1 rounded py-1.5 transition-colors" :class="vp.pinMode.value === 'graph' ? 'bg-cyan-300 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'" @click="vp.pinMode.value = 'graph'">{{ vp.locale.value === 'en' ? 'Graph' : '關係圖' }}</button>
      </div>

      <div class="flex gap-1.5">
        <input v-model="vp.pinEventSearch.value" class="min-w-0 flex-1 rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.locale.value === 'en' ? 'Search events...' : '搜尋事件...'" @keydown.enter.prevent="vp.searchPinEvents()" />
        <button type="button" class="rounded border border-white/10 px-2 py-1.5 text-xs font-semibold text-zinc-200" @click="vp.searchPinEvents()">{{ vp.locale.value === 'en' ? 'Search' : '搜尋' }}</button>
      </div>
      <select v-model="vp.pinSelectedEventId.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300">
        <option value="">{{ vp.locale.value === 'en' ? '+ Create new event' : '＋ 建立新事件' }}</option>
        <option v-for="ev in vp.pinSearchEvents.value" :key="ev.id" :value="String(ev.id)">{{ ev.name }}</option>
      </select>
      <template v-if="!vp.pinSelectedEventId.value">
        <input v-model="vp.pinNewEventName.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.locale.value === 'en' ? 'Event name *' : '事件名稱 *'" />
        <textarea v-model="vp.pinNewEventSummary.value" rows="2" class="w-full resize-none rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.locale.value === 'en' ? 'Event summary' : '事件摘要'"></textarea>
      </template>

      <template v-if="vp.pinMode.value === 'timeline'">
        <input v-model="vp.pinEntryTitle.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.locale.value === 'en' ? 'Entry title *' : '時間線標題 *'" />
        <textarea v-model="vp.pinEntrySummary.value" rows="2" class="w-full resize-none rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.locale.value === 'en' ? 'Summary' : '摘要'"></textarea>
        <input v-model="vp.pinOccurredAt.value" type="datetime-local" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" />
        <input v-model="vp.pinSourceUrl.value" type="url" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.locale.value === 'en' ? 'Source URL' : '參考資料 URL'" />
      </template>

      <template v-else>
        <div class="flex rounded border border-white/10 bg-zinc-900 p-0.5 text-xs font-semibold">
          <button class="flex-1 rounded py-1 transition-colors" :class="vp.pinGraphMode.value === 'entity' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-zinc-300'" @click="vp.pinGraphMode.value = 'entity'">{{ vp.locale.value === 'en' ? '+ Node' : '＋ 節點' }}</button>
          <button class="flex-1 rounded py-1 transition-colors" :class="vp.pinGraphMode.value === 'relationship' ? 'bg-white/15 text-white' : 'text-zinc-500 hover:text-zinc-300'" :disabled="!vp.pinEventGraph.value.entities?.length" @click="vp.pinGraphMode.value = 'relationship'">{{ vp.locale.value === 'en' ? '+ Relationship' : '＋ 關係' }}</button>
        </div>

        <template v-if="vp.pinGraphMode.value === 'entity'">
          <p v-if="vp.pinSelectedEventId.value && !vp.pinEventGraph.value.entities?.length" class="rounded border border-cyan-300/20 bg-cyan-300/10 px-2 py-1.5 text-[11px] text-cyan-200">
            {{ vp.locale.value === 'en' ? 'No nodes yet — this will create the first node.' : '此圖尚無節點，將建立第一個節點。' }}
          </p>
          <input v-model="vp.pinEntityName.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.locale.value === 'en' ? 'Person or org name *' : '人名或組織名 *'" />
          <select v-model="vp.pinEntityType.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300">
            <option value="person">{{ vp.locale.value === 'en' ? 'Person' : '人物' }}</option>
            <option value="organization">{{ vp.locale.value === 'en' ? 'Organization' : '組織' }}</option>
          </select>
          <template v-if="vp.pinEventGraph.value.entities?.length">
            <p class="text-[10px] text-zinc-500">{{ vp.locale.value === 'en' ? 'Connect to existing node (optional)' : '連結到現有節點（選填）' }}</p>
            <select v-model="vp.pinToEntityId.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300">
              <option v-for="e in vp.pinEventGraph.value.entities" :key="e.id" :value="String(e.id)">{{ e.name }} · {{ e.entity_type }}</option>
            </select>
            <input v-model="vp.pinRelType.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.locale.value === 'en' ? 'Relationship label * (e.g. works for)' : '關係標籤 *（任職於、指控、隸屬...）'" />
            <label class="flex items-center gap-2 text-[11px] text-zinc-400 cursor-pointer">
              <input v-model="vp.pinIsBidirectional.value" type="checkbox" class="rounded border-white/20 bg-zinc-900" />
              {{ vp.locale.value === 'en' ? 'Bidirectional (↔)' : '雙向關係（↔）' }}
            </label>
          </template>
        </template>

        <template v-else>
          <p class="text-[10px] text-zinc-500">{{ vp.locale.value === 'en' ? 'Add a relationship between two existing nodes' : '在兩個現有節點之間建立關係' }}</p>
          <select v-model="vp.pinFromEntityId.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300">
            <option v-for="e in vp.pinEventGraph.value.entities" :key="e.id" :value="String(e.id)">{{ e.name }} · {{ e.entity_type }}</option>
          </select>
          <p class="text-center text-[10px] text-zinc-500">↓ {{ vp.locale.value === 'en' ? 'relationship' : '關係' }} ↓</p>
          <select v-model="vp.pinToEntityId.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300">
            <option v-for="e in vp.pinEventGraph.value.entities" :key="e.id" :value="String(e.id)">{{ e.name }} · {{ e.entity_type }}</option>
          </select>
          <input v-model="vp.pinRelType.value" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.locale.value === 'en' ? 'Relationship label * (e.g. works for)' : '關係標籤 *（任職於、指控、隸屬...）'" />
          <label class="flex items-center gap-2 text-[11px] text-zinc-400 cursor-pointer">
            <input v-model="vp.pinIsBidirectional.value" type="checkbox" class="rounded border-white/20 bg-zinc-900" />
            {{ vp.locale.value === 'en' ? 'Bidirectional (↔)' : '雙向關係（↔）' }}
          </label>
        </template>

        <textarea v-model="vp.pinRelDesc.value" rows="2" class="w-full resize-none rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.locale.value === 'en' ? 'Description' : '說明'"></textarea>
        <input v-model="vp.pinSourceUrl.value" type="url" class="w-full rounded border border-white/10 bg-zinc-900 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-300" :placeholder="vp.locale.value === 'en' ? 'Source URL' : '參考資料 URL'" />
      </template>

      <p v-if="vp.pinError.value" class="text-[11px] text-red-300">{{ vp.pinError.value }}</p>
      <p v-if="vp.pinMessage.value" class="text-[11px] text-emerald-300">{{ vp.pinMessage.value }}</p>
      <button class="w-full rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-zinc-950 disabled:opacity-50" :disabled="vp.pinSubmitting.value || !vp.isLoggedIn.value" @click="vp.submitPinEntry()">
        {{ vp.pinSubmitting.value ? (vp.locale.value === 'en' ? 'Submitting...' : '送出中...') : (vp.locale.value === 'en' ? 'Add to event' : '加入事件') }}
      </button>
    </div>
  </section>
</template>
