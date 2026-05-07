<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { createDonation, fetchDonation } from '../lib/api'

const route = useRoute()
const amounts = [100, 300, 500, 1000, 2000, 5000]
const form = reactive({
  amount: 300,
  donor_name: '',
  donor_email: '',
  message: '',
})
const loading = ref(false)
const error = ref('')
const checkout = ref(null)
const donation = ref(null)
const returnLoading = ref(false)
const isReturn = computed(() => route.path === '/donate/return')
const tradeNo = computed(() => String(route.query.trade_no || ''))

function submitCheckout(checkoutPayload) {
  const formEl = document.createElement('form')
  formEl.method = checkoutPayload.method || 'POST'
  formEl.action = checkoutPayload.url
  formEl.style.display = 'none'

  Object.entries(checkoutPayload.params || {}).forEach(([key, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = key
    input.value = String(value)
    formEl.appendChild(input)
  })

  document.body.appendChild(formEl)
  formEl.submit()
}

async function submitDonation() {
  loading.value = true
  error.value = ''
  checkout.value = null

  try {
    const payload = await createDonation({
      ...form,
      amount: Number(form.amount),
    })
    checkout.value = payload.checkout
    submitCheckout(payload.checkout)
  } catch (err) {
    error.value = err.message || '建立捐款訂單失敗'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (!isReturn.value || !tradeNo.value) return

  returnLoading.value = true
  try {
    donation.value = await fetchDonation(tradeNo.value)
  } catch (err) {
    error.value = err.message || '查詢捐款狀態失敗'
  } finally {
    returnLoading.value = false
  }
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <nav class="mb-8 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
        <RouterLink class="text-sm font-semibold text-white" to="/">TruthShield</RouterLink>
        <div class="flex flex-wrap gap-2">
          <RouterLink class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100" to="/transparency">透明儀表板</RouterLink>
          <RouterLink class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100" to="/profile">我的信用</RouterLink>
        </div>
      </nav>

      <div class="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <p class="text-sm font-semibold text-cyan-300">Support TruthShield</p>
          <h1 class="mt-3 text-4xl font-semibold text-white">支持真相護盾繼續運作</h1>
          <p class="mt-4 max-w-2xl leading-7 text-zinc-300">
            捐款會用於伺服器、Redis 快取、資料庫備份、插件測試與開源維護。TruthShield 不接受媒體改分、不販售個人資料，營運資金必須透明且分散。
          </p>

          <div v-if="isReturn" class="mt-8 rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <h2 class="text-xl font-semibold text-white">捐款狀態</h2>
            <p v-if="returnLoading" class="mt-4 text-sm text-zinc-400">查詢中...</p>
            <div v-else-if="donation?.donation" class="mt-4 rounded-md border border-emerald-300/30 bg-emerald-500/10 p-4">
              <p class="font-semibold text-emerald-100">
                {{ donation.donation.status === 'paid' ? '付款已完成，謝謝支持。' : '訂單已建立，付款狀態待確認。' }}
              </p>
              <p class="mt-2 text-sm text-emerald-100/75">訂單：{{ donation.donation.merchant_trade_no }}，金額 NT$ {{ donation.donation.amount }}</p>
            </div>
            <p v-if="error" class="mt-4 rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{{ error }}</p>
            <RouterLink class="mt-5 inline-flex rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" to="/donate">再次支持</RouterLink>
          </div>

          <form v-else class="mt-8 space-y-5 rounded-lg border border-white/10 bg-white/[0.03] p-5" @submit.prevent="submitDonation">
            <div>
              <label class="text-sm font-semibold text-white">捐款金額</label>
              <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button
                  v-for="amount in amounts"
                  :key="amount"
                  type="button"
                  class="rounded-md border px-4 py-3 text-sm font-semibold"
                  :class="form.amount === amount ? 'border-cyan-300 bg-cyan-300 text-zinc-950' : 'border-white/10 bg-zinc-900 text-zinc-300 hover:border-cyan-300/60'"
                  @click="form.amount = amount"
                >
                  NT$ {{ amount }}
                </button>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="text-sm text-zinc-300">
                顯示名稱
                <input v-model="form.donor_name" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-300" maxlength="80" placeholder="可留空匿名" />
              </label>
              <label class="text-sm text-zinc-300">
                Email
                <input v-model="form.donor_email" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-300" maxlength="160" placeholder="收據或通知用，可留空" type="email" />
              </label>
            </div>

            <label class="block text-sm text-zinc-300">
              留言
              <input v-model="form.message" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-300" maxlength="120" placeholder="給開源查證社群的一句話" />
            </label>

            <p v-if="error" class="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{{ error }}</p>

            <button class="w-full rounded-md bg-cyan-300 px-4 py-3 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading">
              {{ loading ? '建立綠界訂單中...' : '前往綠界付款' }}
            </button>
          </form>
        </section>

        <aside class="rounded-lg border border-cyan-300/20 bg-zinc-900 p-5">
          <h2 class="text-lg font-semibold text-white">捐款原則</h2>
          <div class="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
            <p>所有核心演算法與審核紀錄維持公開。</p>
            <p>付款由綠界處理，TruthShield 不保存信用卡號。</p>
            <p>正式上線前會公開每月基礎設施支出摘要。</p>
          </div>
          <div class="mt-5 rounded-md border border-white/10 bg-white/[0.03] p-4 text-xs leading-5 text-zinc-500">
            本機開發預設使用綠界測試環境。正式 MerchantID、HashKey、HashIV 請只放在 backend 環境變數。
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>
