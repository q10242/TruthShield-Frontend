<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-3xl">
      <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
      <h1 class="mt-8 text-3xl font-semibold text-white">安全漏洞回報</h1>
      <div class="mt-6 space-y-5 text-sm leading-7 text-zinc-300">
        <p>請優先回報登入 token、後台權限、綠界 callback 驗簽、證據 URL SSRF、插件 iframe/postMessage 等問題。</p>
        <p>正式上線前應提供私密通報信箱；公開 issue 不應包含真實 token、付款識別碼或私人證據連結。</p>
        <p>目標回應時間：72 小時內確認收到，7 天內完成初步嚴重度分級。</p>
      </div>
    </section>
  </main>
</template>
