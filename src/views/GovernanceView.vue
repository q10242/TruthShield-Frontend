<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-4xl">
      <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
      <h1 class="mt-8 text-3xl font-semibold text-white">透明治理</h1>
      <div class="mt-6 grid gap-4 md:grid-cols-3">
        <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="font-semibold text-white">可稽核</h2>
          <p class="mt-2 text-sm leading-6 text-zinc-400">審核、申訴、降權與信任調整都需要保存原因。</p>
        </div>
        <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="font-semibold text-white">可申訴</h2>
          <p class="mt-2 text-sm leading-6 text-zinc-400">使用者可針對證據隱藏、帳號限制與信用調整提出申訴。</p>
        </div>
        <div class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <h2 class="font-semibold text-white">可公開檢查</h2>
          <p class="mt-2 text-sm leading-6 text-zinc-400">公開頁只揭露操作類型、原因、狀態與時間，不洩漏私人資料。</p>
        </div>
      </div>
      <div class="mt-6 flex flex-wrap gap-2">
        <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/transparency">透明儀表板</RouterLink>
        <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/moderation-events">公開審核紀錄</RouterLink>
        <RouterLink class="rounded-md border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-100" to="/appeals">提出申訴</RouterLink>
      </div>
    </section>
  </main>
</template>
