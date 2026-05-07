<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchApiDocs } from '../lib/api'
import { useI18n } from '../i18n'

const docs = ref(null)
const { locale, t } = useI18n()

const zhEndpointDescriptions = {
  'POST /api/auth/{provider}/callback': 'Facebook、Google 或 GitHub OAuth callback 的 token 交換。',
  'GET /api/openapi.json': '機器可讀取的 OpenAPI 規格。',
  'GET /api/vision-readiness': '願景級上線準備清單、新聞學分類、證據準則、參與迴圈與營運劇本。',
  'GET /api/news/status': '回傳指定 URL 的加權信譽狀態。',
  'POST /api/news/snapshot': '記錄新聞中繼資料快照，偵測標題、內容與可用性變更，不保存完整受版權保護文字。',
  'POST /api/news/change-reports': '回報新聞被刪除、修改、轉址、付費牆或需要封存等狀態。',
  'POST /api/news/read-session': '記錄登入使用者投票前的新聞閱讀秒數。',
  'POST /api/vote': '建立或更新同一使用者對同一 URL 的唯一投票。',
  'GET /api/news/evidence': '取得證據列表，包含加權有用度與預覽中繼資料。',
  'GET /api/news/official-responses': '取得指定 URL 已發布的官方、本人、作者或答辯權澄清。',
  'GET /api/me/profile': '取得登入使用者個人頁、徽章、身份申請、官方澄清與貢獻摘要。',
  'PUT /api/me/profile': '更新公開暱稱、身份顯示、個人簡介與真名公開偏好。',
  'POST /api/me/claimants': '申請作者、媒體、當事人或機構代表身份。',
  'POST /api/official-responses': '提交官方或本人澄清，等待後台審核。',
  'POST /api/official-responses/{officialResponse}/reaction': '以信用權重評分已發布官方澄清是否有幫助。',
  'GET /api/evidence-library': '公開證據庫，支援標籤、網域、來源篩選與有用度、品質、爭議或最新排序。',
  'GET /api/news-domain-reports/status': '查詢未收錄新聞網域是否已被回報。',
  'GET /api/me/notifications': '登入使用者通知列表。',
  'POST /api/me/notifications/read-all': '將登入使用者所有通知標記為已讀。',
  'GET /api/me/export': '以 JSON 匯出登入使用者資料。',
  'GET /api/me/appeals': '列出登入使用者的申訴。',
  'POST /api/me/appeals': '針對證據、信用或帳號限制決策建立申訴。',
  'GET /api/moderation-events': '公開透明審核事件摘要。',
  'POST /api/extension/events': '記錄插件相容性遙測事件。',
  'GET /api/extension/coverage': '依網域彙整插件相容性覆蓋狀態。',
  'GET /api/account-graph/summary': '登入使用者可查看的反濫用帳號關聯摘要。',
  'POST /api/auth/{provider}/begin': '建立正式 OAuth 登入用的短期 state。',
  'POST /api/auth/{provider}/link': '將第三方 provider 身份綁定到目前登入帳號。',
  'GET /api/trusted-evidence-sources': '列出啟用中的可信證據來源 host。',
  'GET /api/rate-limit-policies': '列出啟用中的公開限流政策摘要。',
  'GET /api/extension/selector-checks': '列出插件 selector 相容性檢查。',
  'GET /api/bot/config': '公開 bot 防護設定，供前端 challenge 元件使用。',
  'GET /api/extension/nonce': '發行短期插件 nonce，供本地插件請求簽章使用。',
  'POST /api/extension/selector-checks': '記錄插件執行期間的 selector 檢查結果。',
  'GET /api/me/api-clients': '列出登入使用者的 API clients。',
  'POST /api/me/api-clients': '建立資料整合用的 API key。',
  'POST /api/me/api-clients/{client}/revoke': '撤銷目前使用者擁有的 API client。',
  'POST /api/admin/evidences/{evidence}/hide': '管理員隱藏證據並發布審核摘要。',
  'POST /api/admin/abuse-events/{event}/review': '管理員審核濫用事件，並可調整風險狀態。',
  'POST /api/admin/users/{user}/trust-adjustment': '管理員調整信用分，必須提供原因。',
  'GET /api/leaderboard/media': '媒體排行榜。',
  'GET /api/exports/news.csv': '已追蹤新聞 CSV 匯出。',
  'GET /api/exports/evidence.csv': '證據 CSV 匯出。',
  'GET /api/exports/news-snapshots.csv': '新聞中繼資料快照 CSV 匯出。',
  'GET /api/exports/news-change-reports.csv': '新聞變更回報 CSV 匯出。',
  'GET /api/exports/governance-events.csv': '治理與審核事件 CSV 匯出。',
  'POST /api/donations/ecpay': '建立綠界捐款 checkout payload。',
  'POST /api/donations/ecpay/notify': '綠界伺服器通知 callback，包含 CheckMacValue 驗證。',
  'GET /api/donations/summary': '透明頁用的公開捐款彙總。',
  'GET /api/exports/donations.csv': '營運用捐款 CSV 匯出。',
  'POST /api/user-data-requests': '提交隱私資料匯出、刪除或更正請求。',
  'GET /api/algorithm': '公開演算法摘要。',
}

const endpoints = computed(() => (docs.value?.endpoints || []).map((endpoint) => {
  const key = `${endpoint.method} ${endpoint.path}`
  return {
    ...endpoint,
    localizedDescription: locale.value === 'zh-TW'
      ? zhEndpointDescriptions[key] || endpoint.description
      : endpoint.description,
  }
}))

onMounted(async () => {
  docs.value = await fetchApiDocs()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-4xl">
      <nav class="mb-8 border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
      </nav>
      <h1 class="text-3xl font-semibold text-white">{{ t('remaining.apiDocsTitle') }}</h1>
      <p class="mt-3 text-sm leading-6 text-zinc-400">{{ t('remaining.apiDocsIntro') }}</p>
      <div v-if="docs" class="mt-6 space-y-2">
        <article v-for="endpoint in endpoints" :key="`${endpoint.method}-${endpoint.path}`" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <p class="font-mono text-sm text-cyan-200">{{ endpoint.method }} {{ endpoint.path }}</p>
          <p class="mt-2 text-sm text-zinc-400">{{ endpoint.localizedDescription }}</p>
        </article>
      </div>
    </section>
  </main>
</template>
