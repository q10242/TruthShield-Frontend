<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="min-h-screen bg-zinc-950 text-zinc-100">
    <section class="mx-auto grid min-h-screen max-w-6xl content-center gap-12 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div class="space-y-8">
        <nav class="flex flex-wrap items-center gap-2 border-b border-white/10 pb-5">
          <div class="text-sm font-semibold tracking-wide text-white">TruthShield</div>
          <RouterLink class="rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:border-cyan-300/60" to="/ranking">
            媒體信用排行榜
          </RouterLink>
          <RouterLink class="rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:border-cyan-300/60" to="/evidence-library">
            證據庫
          </RouterLink>
          <RouterLink class="rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:border-cyan-300/60" to="/transparency">
            透明儀表板
          </RouterLink>
          <RouterLink class="rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:border-cyan-300/60" to="/news-search">
            新聞搜尋
          </RouterLink>
          <RouterLink class="rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:border-cyan-300/60" to="/profile">
            我的信用
          </RouterLink>
          <RouterLink class="rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:border-cyan-300/60" to="/algorithm">
            演算法
          </RouterLink>
          <RouterLink class="rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:border-cyan-300/60" to="/trust-leaderboard">
            信用排行
          </RouterLink>
          <RouterLink class="rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:border-cyan-300/60" to="/api-docs">
            API 文件
          </RouterLink>
          <RouterLink class="rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:border-cyan-300/60" to="/moderation-events">
            審核紀錄
          </RouterLink>
          <RouterLink class="rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:border-cyan-300/60" to="/extension-coverage">
            插件覆蓋
          </RouterLink>
          <RouterLink class="rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:border-cyan-300/60" to="/account-graph">
            帳號關聯
          </RouterLink>
          <RouterLink class="rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:border-cyan-300/60" to="/api-clients">
            API Keys
          </RouterLink>
          <RouterLink class="rounded-md border border-white/15 px-4 py-2 text-sm text-zinc-200 hover:border-cyan-300/60" to="/launch-ops">
            上線營運
          </RouterLink>
        </nav>

        <div class="space-y-6">
          <p class="text-sm font-medium text-cyan-300">News credibility verification API and browser layer</p>
          <h1 class="max-w-3xl text-5xl font-semibold leading-tight text-white md:text-6xl">
            TruthShield
          </h1>
          <p class="max-w-2xl text-lg leading-8 text-zinc-300">
            以群眾投票、信任分數和網址指紋建立新聞連結的即時風險標籤，讓使用者在點擊前看見來源脈絡。
          </p>
        </div>

        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div class="text-3xl font-semibold text-white">URL</div>
            <p class="mt-3 text-sm text-zinc-400">正規化網址與 SHA-256 指紋</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div class="text-3xl font-semibold text-white">Redis</div>
            <p class="mt-3 text-sm text-zinc-400">快取最高風險標籤統計</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <div class="text-3xl font-semibold text-white">Sanctum</div>
            <p class="mt-3 text-sm text-zinc-400">加權投票身份驗證</p>
          </div>
        </div>
      </div>

      <aside class="self-center rounded-lg border border-cyan-300/20 bg-zinc-900/90 p-6 shadow-2xl shadow-cyan-950/50">
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <span class="text-sm text-zinc-400">Browser Tooltip</span>
          <span class="rounded bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-200">標題殺人</span>
        </div>
        <div class="space-y-5 pt-5">
          <p class="text-2xl font-semibold text-white">最大重點標籤</p>
          <div class="h-3 rounded bg-red-500" />
          <p class="text-sm leading-6 text-zinc-400">
            插件 hover 新聞連結時載入 iframe tooltip，回傳高度給 content script，自動貼齊頁面。
          </p>
        </div>
      </aside>
    </section>
  </main>
</template>
