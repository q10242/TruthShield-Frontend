<script setup>
import { RouterLink } from 'vue-router'

const primaryLinks = [
  { to: '/local-news-demo', label: '本機新聞測試', description: '用固定頁面測試橫幅、面板與投票流程。' },
  { to: '/evidence-library', label: '證據庫', description: '查看社群提交的澄清連結與截圖來源。' },
  { to: '/ranking', label: '媒體排行榜', description: '用加權投票觀察媒體累積表現。' },
  { to: '/transparency', label: '透明儀表板', description: '檢查系統狀態、審核與權重分布。' },
  { to: '/donate', label: '支持專案', description: '用綠界贊助伺服器、備份與開源營運成本。' },
]

const secondaryLinks = [
  { to: '/news-search', label: '新聞搜尋' },
  { to: '/profile', label: '我的信用' },
  { to: '/trust-leaderboard', label: '信用排行' },
  { to: '/moderation-events', label: '審核紀錄' },
  { to: '/extension-coverage', label: '插件覆蓋' },
  { to: '/account-graph', label: '帳號關聯' },
  { to: '/launch-ops', label: '上線營運' },
  { to: '/donate', label: '捐款支持' },
  { to: '/algorithm', label: '演算法' },
  { to: '/api-docs', label: 'API 文件' },
]

const navGroups = [
  { title: '一般使用者', links: secondaryLinks.slice(0, 3) },
  { title: '查證者', links: secondaryLinks.slice(3, 6) },
  { title: '營運與開發', links: secondaryLinks.slice(6) },
]
</script>

<template>
  <main class="min-h-screen bg-zinc-950 text-zinc-100">
    <section class="mx-auto max-w-6xl px-6 py-8">
      <nav class="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold tracking-wide text-white" to="/">TruthShield</RouterLink>
        <div class="flex flex-wrap gap-2">
          <RouterLink
            v-for="link in secondaryLinks.slice(0, 5)"
            :key="link.to"
            class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100"
            :to="link.to"
          >
            {{ link.label }}
          </RouterLink>
        </div>
      </nav>

      <div class="grid gap-8 py-10 lg:grid-cols-[1fr_360px]">
        <section class="space-y-6">
          <div>
            <p class="text-sm font-semibold text-cyan-300">全網新聞信譽防禦網</p>
            <h1 class="mt-3 text-4xl font-semibold leading-tight text-white md:text-5xl">TruthShield 真相護盾</h1>
            <p class="mt-4 max-w-2xl text-base leading-7 text-zinc-300">
              每則新聞保留群眾加權結果、證據連結與定案時間，讓讀者先看脈絡，再決定是否投票。
            </p>
          </div>

          <div class="grid gap-3 md:grid-cols-2">
            <RouterLink
              v-for="link in primaryLinks"
              :key="link.to"
              class="group rounded-lg border border-white/10 bg-white/[0.03] p-5 hover:border-cyan-300/60 hover:bg-cyan-300/[0.06]"
              :to="link.to"
            >
              <div class="flex items-center justify-between gap-4">
                <h2 class="text-lg font-semibold text-white">{{ link.label }}</h2>
                <span class="text-xl text-cyan-200">→</span>
              </div>
              <p class="mt-3 text-sm leading-6 text-zinc-400 group-hover:text-zinc-300">{{ link.description }}</p>
            </RouterLink>
          </div>
        </section>

        <aside class="rounded-lg border border-cyan-300/20 bg-zinc-900 p-5 shadow-2xl shadow-cyan-950/40">
          <div class="flex items-center justify-between border-b border-white/10 pb-4">
            <span class="text-sm font-semibold text-white">新聞頁狀態</span>
            <span class="rounded bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-100">標題殺人</span>
          </div>
          <div class="space-y-4 pt-5">
            <div class="rounded-md border border-red-300/30 bg-red-500/10 p-4">
              <p class="text-sm font-semibold text-red-100">⚠ 85% 使用者標註：標題殺人</p>
              <p class="mt-2 text-xs text-red-100/75">閱讀後可補充證據</p>
            </div>
            <RouterLink class="block w-full rounded-md bg-cyan-300 px-4 py-2 text-center text-sm font-semibold text-zinc-950" to="/local-news-demo">
              開啟投票與證據面板
            </RouterLink>
            <div class="grid grid-cols-3 gap-2 text-center text-xs">
              <div class="rounded-md bg-white/[0.04] p-3">
                <div class="font-semibold text-white">72h</div>
                <div class="mt-1 text-zinc-500">截止</div>
              </div>
              <div class="rounded-md bg-white/[0.04] p-3">
                <div class="font-semibold text-white">1 人</div>
                <div class="mt-1 text-zinc-500">1 票</div>
              </div>
              <div class="rounded-md bg-white/[0.04] p-3">
                <div class="font-semibold text-white">加權</div>
                <div class="mt-1 text-zinc-500">信用</div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <section class="grid gap-3 border-t border-white/10 py-6 md:grid-cols-3">
        <div v-for="group in navGroups" :key="group.title" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="text-sm font-semibold text-white">{{ group.title }}</h2>
          <div class="mt-3 flex flex-wrap gap-2">
            <RouterLink
              v-for="link in group.links"
              :key="link.to"
              class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-400 hover:border-cyan-300/60 hover:text-cyan-100"
              :to="link.to"
            >
              {{ link.label }}
            </RouterLink>
          </div>
        </div>
      </section>
      <footer class="flex flex-wrap gap-3 border-t border-white/10 py-5 text-sm text-zinc-500">
        <RouterLink class="hover:text-cyan-100" to="/privacy">隱私權</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/terms">服務條款</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/security">安全回報</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/governance">透明治理</RouterLink>
        <RouterLink class="hover:text-cyan-100" to="/donate">捐款支持</RouterLink>
      </footer>
    </section>
  </main>
</template>
