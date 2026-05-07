<script setup>
const cnaUrl = 'https://www.cna.com.tw/news/aipl/202605060001.aspx'
const secondUrl = 'https://news.pts.org.tw/article/999001'
</script>

<template>
  <main class="min-h-screen bg-zinc-950 text-zinc-100">
    <article class="mx-auto max-w-3xl px-5 py-10">
      <p class="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">TruthShield Local QA</p>
      <h1 class="mt-4 text-3xl font-bold leading-tight text-white">
        本地新聞測試頁：用來驗證 tooltip 與新聞頁頂部橫幅
      </h1>
      <p class="mt-3 text-sm leading-6 text-zinc-400">
        這個頁面是 HTTP 本地測試頁，會被 Chrome 插件視為新聞頁。打開已載入的 TruthShield extension 後，
        滑鼠停留在文中的新聞連結上應該出現 tooltip；頁面頂部應該自動出現 TruthShield 橫幅，點擊後開啟投票與證據面板。
      </p>

      <section class="mt-8 space-y-6 text-base leading-8 text-zinc-200">
        <p>
          這是一段模擬新聞內文。測試時請先確認 Docker API 在
          <span class="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-cyan-200">http://127.0.0.1:18080</span>
          ，Vue 官網在
          <span class="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm text-cyan-200">http://127.0.0.1:15173</span>
          。
        </p>

        <p>
          將游標停在這個中央社測試連結：
          <a class="font-semibold text-cyan-200 underline decoration-cyan-300/50 underline-offset-4" :href="cnaUrl">
            中央社政治新聞測試連結
          </a>
          。停留約 300ms 後，插件應該顯示 TruthShield tooltip。
        </p>

        <p>
          也可以停在第二個新聞連結：
          <a class="font-semibold text-orange-200 underline decoration-orange-300/50 underline-offset-4" :href="secondUrl">
            公視新聞測試連結
          </a>
          ，用來確認多個新聞 domain 都會觸發 hover 檢查。
        </p>

        <p>
          真正投票不在 tooltip 裡，而是在頂部 TruthShield 橫幅開啟的面板中完成。請點橫幅的「查看結果 / 補證據」，或在頁面右鍵使用 TruthShield 選單，登入
          <span class="rounded bg-white/10 px-1.5 py-0.5 font-mono text-sm">tester@truthshield.local</span>
          後等待閱讀秒數達標，再送出標籤、證據連結與簡短說明。
        </p>

        <div class="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4 text-sm text-cyan-100">
          如果在真實 CNA HTTPS 頁面看不到本地 iframe modal，通常是瀏覽器阻擋 HTTPS 頁面載入 HTTP iframe。正式上線需要把 TruthShield Web/API 放到 HTTPS；本地請用此頁完整測試。
        </div>
      </section>
    </article>
  </main>
</template>
