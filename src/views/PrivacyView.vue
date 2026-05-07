<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-3xl">
      <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
      <h1 class="mt-8 text-3xl font-semibold text-white">隱私權草案</h1>
      <div class="mt-6 space-y-5 text-sm leading-7 text-zinc-300">
        <p>TruthShield 只保存運作信譽系統必要的資料：帳號、新聞 URL 指紋、投票、證據連結、證據評分、插件相容性事件與捐款訂單狀態。</p>
        <p>我們不保存信用卡號，不代管證據圖片，不收集完整瀏覽歷史。插件遙測應限縮在新聞網域與相容性診斷。</p>
        <p>使用者可以在個人頁匯出自己的資料，並可對審核、降權或證據處置提出申訴。</p>
        <RouterLink class="inline-flex rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" to="/data-request">提出資料權利請求</RouterLink>
      </div>
    </section>
  </main>
</template>
