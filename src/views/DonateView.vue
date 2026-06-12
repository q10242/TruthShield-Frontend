<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { createDonation, fetchDonation, fetchDonationConfig, fetchDonationMonthly, fetchDonationSummary, fetchDonationSupporters } from '../lib/api'
import { useI18n } from '../i18n'
import AppNav from '../components/AppNav.vue'

const route = useRoute()
const { t, locale } = useI18n()
const zh = computed(() => locale.value !== 'en')
const amounts = ref([100, 300, 500, 1000, 2000, 5000])
const form = reactive({
  amount: 300,
  purpose: 'operations_ai',
  donor_name: '',
  donor_email: '',
  message: '',
})
const loading = ref(false)
const error = ref('')
const checkout = ref(null)
const donation = ref(null)
const returnLoading = ref(false)
const summary = ref(null)
const supporters = ref([])
const monthly = ref([])
const monthlyGoal = ref(15000)
const purposeOptions = ref([])
const isReturn = computed(() => route.path === '/donate/return')
const tradeNo = computed(() => String(route.query.trade_no || ''))
const defaultFundingPurposes = computed(() => [
  {
    key: 'operations_ai',
    label: zh.value ? '伺服器與 AI 營運' : 'Server and AI operations',
    label_en: 'Server and AI operations',
    description: zh.value
      ? '含金流手續費；達標代表這期雲端服務、備份、監控與 AI 輔助整理有社群支持。'
      : 'Includes payment processing fees; reaching this goal means this round of cloud services, backups, monitoring, and AI-assisted curation is community-supported.',
    description_en: 'Includes payment processing fees; reaching this goal means this round of cloud services, backups, monitoring, and AI-assisted curation is community-supported.',
    target_amount: 8000,
    period: 'monthly',
  },
  {
    key: 'safari_listing',
    label: zh.value ? 'Safari 上架基金' : 'Safari listing fund',
    label_en: 'Safari listing fund',
    description: zh.value
      ? 'Apple Developer Program 年費、Safari App Extension 封裝、TestFlight 與審核準備。'
      : 'Apple Developer Program fee, Safari App Extension packaging, TestFlight, and review preparation.',
    description_en: 'Apple Developer Program fee, Safari App Extension packaging, TestFlight, and review preparation.',
    target_amount: 4000,
    period: 'one_time',
  },
  {
    key: 'store_assets',
    label: zh.value ? '商店頁素材與截圖' : 'Store listing assets',
    label_en: 'Store listing assets',
    description: zh.value
      ? 'Chrome、Firefox、Safari 商店截圖、說明圖與審核補件素材。'
      : 'Screenshots, explainer images, and review assets for Chrome, Firefox, and Safari stores.',
    description_en: 'Screenshots, explainer images, and review assets for Chrome, Firefox, and Safari stores.',
    target_amount: 3000,
    period: 'one_time',
  },
  {
    key: 'event_curation',
    label: zh.value ? '公共事件頁整理' : 'Public event page curation',
    label_en: 'Public event page curation',
    description: zh.value
      ? '整理高公共性事件時間線、官方來源、關係圖與社群求證任務。'
      : 'Curating public event timelines, official sources, relationship graphs, and verification tasks.',
    description_en: 'Curating public event timelines, official sources, relationship graphs, and verification tasks.',
    target_amount: 5000,
    period: 'monthly',
  },
])
const normalizedPurposeOptions = computed(() => purposeOptions.value.length ? purposeOptions.value : defaultFundingPurposes.value)
const purposeBreakdownMap = computed(() => Object.fromEntries((summary.value?.purpose_breakdown || []).map((row) => [row.purpose, row])))
const fundingGoals = computed(() => normalizedPurposeOptions.value.map((purpose) => {
  const stats = purposeBreakdownMap.value[purpose.key] || {}
  const monthlyPurpose = purpose.period === 'monthly'
  const current = monthlyPurpose ? Number(stats.month_amount || 0) : Number(stats.amount || 0)
  return {
    ...purpose,
    labelText: purposeText(purpose, 'label'),
    descriptionText: purposeText(purpose, 'description'),
    target: Number(purpose.target_amount || 0),
    current,
    count: monthlyPurpose ? Number(stats.month_count || 0) : Number(stats.count || 0),
    periodText: monthlyPurpose ? (zh.value ? '本期目標' : 'Current goal') : (zh.value ? '一次性目標' : 'One-time goal'),
  }
}))

function fundingProgress(current, target) {
  if (!target) return 0
  return Math.min(100, Math.round((Number(current || 0) / Number(target)) * 100))
}

function currency(value) {
  return Number(value || 0).toLocaleString()
}

function purposeText(purpose, key) {
  return zh.value ? (purpose[key] || purpose[`${key}_en`] || '') : (purpose[`${key}_en`] || purpose[key] || '')
}

function purposeLabel(key) {
  const purpose = normalizedPurposeOptions.value.find((item) => item.key === key)
  return purpose ? purposeText(purpose, 'label') : key
}

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
    error.value = err.message || t('donate.createFailed')
  } finally {
    loading.value = false
  }
}

async function refreshDonationStatus() {
  if (!tradeNo.value) return

  returnLoading.value = true
  error.value = ''
  try {
    donation.value = await fetchDonation(tradeNo.value)
  } catch (err) {
    error.value = err.message || t('donate.queryFailed')
  } finally {
    returnLoading.value = false
  }
}

onMounted(async () => {
  fetchDonationSummary().then((payload) => {
    summary.value = payload
  }).catch(() => null)
  fetchDonationSupporters().then((payload) => {
    supporters.value = payload
  }).catch(() => null)
  fetchDonationMonthly().then((payload) => {
    monthly.value = payload
  }).catch(() => null)
  fetchDonationConfig().then((payload) => {
    amounts.value = payload.amounts?.length ? payload.amounts : amounts.value
    monthlyGoal.value = payload.monthly_goal || monthlyGoal.value
    purposeOptions.value = payload.purposes?.length ? payload.purposes : purposeOptions.value
    if (!normalizedPurposeOptions.value.some((purpose) => purpose.key === form.purpose)) {
      form.purpose = normalizedPurposeOptions.value[0]?.key || 'operations_ai'
    }
  }).catch(() => null)

  if (!isReturn.value || !tradeNo.value) return

  await refreshDonationStatus()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-8 text-zinc-100">
    <section class="mx-auto max-w-5xl">
      <AppNav>
        <RouterLink class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100" to="/transparency">{{ t('common.transparency') }}</RouterLink>
        <RouterLink class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:border-cyan-300/60 hover:text-cyan-100" to="/profile">{{ t('common.profile') }}</RouterLink>
      </AppNav>

      <div class="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section>
          <p class="text-sm font-semibold text-cyan-300">{{ t('donate.eyebrow') }}</p>
          <h1 class="mt-3 text-4xl font-semibold text-white">{{ t('donate.title') }}</h1>
          <p class="mt-4 max-w-2xl leading-7 text-zinc-300">
            {{ t('donate.intro') }}
          </p>

          <div v-if="isReturn" class="mt-8 rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <h2 class="text-xl font-semibold text-white">{{ t('donate.status') }}</h2>
            <p v-if="returnLoading" class="mt-4 text-sm text-zinc-400">{{ t('donate.checking') }}</p>
            <div v-else-if="donation?.donation" class="mt-4 rounded-md border border-emerald-300/30 bg-emerald-500/10 p-4">
              <p class="font-semibold text-emerald-100">
                {{ donation.donation.status === 'paid' ? t('donate.paid') : t('donate.pending') }}
              </p>
              <p class="mt-2 text-sm text-emerald-100/75">{{ t('donate.order') }}：{{ donation.donation.merchant_trade_no }}，{{ t('donate.amount') }} NT$ {{ donation.donation.amount }}</p>
            </div>
            <p v-if="error" class="mt-4 rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{{ error }}</p>
            <div class="mt-5 flex flex-wrap gap-2">
              <button class="rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-200 hover:border-cyan-300/60" :disabled="returnLoading" @click="refreshDonationStatus">
                {{ t('donate.refresh') }}
              </button>
              <RouterLink class="inline-flex rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" to="/donate">{{ t('donate.supportAgain') }}</RouterLink>
            </div>
          </div>

          <form v-else class="mt-8 space-y-5 rounded-lg border border-white/10 bg-white/[0.03] p-5" @submit.prevent="submitDonation">
            <div>
              <label class="text-sm font-semibold text-white">{{ t('donate.donationAmount') }}</label>
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

            <div>
              <label class="text-sm font-semibold text-white">{{ zh ? '支持用途' : 'Support purpose' }}</label>
              <div class="mt-3 grid gap-2 md:grid-cols-2">
                <button
                  v-for="purpose in normalizedPurposeOptions"
                  :key="purpose.key"
                  type="button"
                  class="rounded-md border p-3 text-left"
                  :class="form.purpose === purpose.key ? 'border-emerald-200 bg-emerald-300/15 text-emerald-50' : 'border-white/10 bg-zinc-950 text-zinc-300 hover:border-emerald-300/50'"
                  @click="form.purpose = purpose.key"
                >
                  <span class="block text-sm font-semibold">{{ purposeText(purpose, 'label') }}</span>
                  <span class="mt-1 block text-xs leading-5 text-zinc-500">{{ purposeText(purpose, 'description') }}</span>
                </button>
              </div>
              <p class="mt-2 text-xs leading-5 text-zinc-500">
                {{ zh ? '用途只影響公開進度統計，不影響投票權重或徽章。' : 'The purpose only affects public progress statistics, not vote weight or badges.' }}
              </p>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <label class="text-sm text-zinc-300">
                {{ t('donate.displayName') }}
                <input v-model="form.donor_name" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-300" maxlength="80" :placeholder="t('donate.anonymousPlaceholder')" />
              </label>
              <label class="text-sm text-zinc-300">
                {{ t('donate.email') }}
                <input v-model="form.donor_email" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-300" maxlength="160" :placeholder="t('donate.emailPlaceholder')" type="email" />
              </label>
            </div>

            <label class="block text-sm text-zinc-300">
              {{ t('donate.message') }}
              <input v-model="form.message" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-white outline-none focus:border-cyan-300" maxlength="120" :placeholder="t('donate.messagePlaceholder')" />
            </label>

            <p v-if="error" class="rounded-md border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-100">{{ error }}</p>

            <button type="submit" class="w-full rounded-md bg-cyan-300 px-4 py-3 text-sm font-semibold text-zinc-950 disabled:cursor-not-allowed disabled:opacity-60" :disabled="loading">
              {{ loading ? t('donate.creating') : t('donate.checkout') }}
            </button>
          </form>
        </section>

        <aside class="rounded-lg border border-cyan-300/20 bg-zinc-900 p-5">
          <h2 class="text-lg font-semibold text-white">{{ t('donate.principles') }}</h2>
          <div v-if="summary" class="mt-4 grid grid-cols-2 gap-2 text-center text-sm">
            <div class="rounded-md bg-white/[0.04] p-3">
              <div class="font-semibold text-white">NT$ {{ summary.total_amount }}</div>
              <div class="mt-1 text-xs text-zinc-500">{{ t('donate.totalSupport') }}</div>
            </div>
            <div class="rounded-md bg-white/[0.04] p-3">
              <div class="font-semibold text-white">{{ summary.paid_count }}</div>
              <div class="mt-1 text-xs text-zinc-500">{{ t('donate.paidCount') }}</div>
            </div>
          </div>
          <div v-if="summary" class="mt-4 rounded-md border border-white/10 bg-white/[0.03] p-4">
            <div class="flex items-center justify-between text-xs">
              <span class="text-zinc-400">{{ t('donate.monthlyGoal') }}</span>
              <span class="text-zinc-500">NT$ {{ summary.month_amount }} / {{ monthlyGoal }}</span>
            </div>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div class="h-full rounded-full bg-emerald-300" :style="{ width: `${Math.min(100, Math.round((summary.month_amount / monthlyGoal) * 100))}%` }"></div>
            </div>
          </div>
          <div class="mt-5">
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-sm font-semibold text-white">{{ zh ? '公開募款目標' : 'Public funding goals' }}</h3>
              <RouterLink class="text-xs font-semibold text-cyan-200 hover:text-cyan-100" to="/donate">{{ zh ? '支持' : 'Support' }}</RouterLink>
            </div>
            <div class="mt-3 space-y-3">
              <div v-for="goal in fundingGoals" :key="goal.key" class="rounded-md border border-white/10 bg-white/[0.03] p-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold text-white">{{ goal.labelText }}</p>
                    <p class="mt-1 text-xs leading-5 text-zinc-500">{{ goal.descriptionText }}</p>
                  </div>
                  <span class="shrink-0 rounded bg-white/10 px-2 py-1 text-[11px] font-semibold text-zinc-300">{{ goal.periodText }}</span>
                </div>
                <div class="mt-3 flex items-center justify-between text-xs">
                  <span class="text-zinc-400">NT$ {{ currency(goal.current) }} / {{ currency(goal.target) }}</span>
                  <span class="text-zinc-500">{{ fundingProgress(goal.current, goal.target) }}%</span>
                </div>
                <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div class="h-full rounded-full bg-cyan-300" :style="{ width: `${fundingProgress(goal.current, goal.target)}%` }"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-4 space-y-3 text-sm leading-6 text-zinc-400">
            <p>{{ t('donate.principleOpen') }}</p>
            <p>{{ t('donate.principlePayment') }}</p>
            <p>{{ t('donate.principleSummary') }}</p>
          </div>
          <div class="mt-5 rounded-md border border-white/10 bg-white/[0.03] p-4 text-xs leading-5 text-zinc-500">
            {{ t('donate.localNotice') }}
          </div>
          <div v-if="monthly.length" class="mt-5">
            <h3 class="text-sm font-semibold text-white">{{ t('donate.lastSixMonths') }}</h3>
            <div class="mt-3 space-y-2">
              <div v-for="row in monthly" :key="row.month" class="flex items-center justify-between rounded-md bg-white/[0.04] px-3 py-2 text-xs">
                <span class="text-zinc-400">{{ row.month }}</span>
                <span class="font-semibold text-white">NT$ {{ row.amount }}</span>
              </div>
            </div>
          </div>
          <div v-if="supporters.length" class="mt-5">
            <h3 class="text-sm font-semibold text-white">{{ t('donate.recentSupporters') }}</h3>
            <div class="mt-3 space-y-2">
              <div v-for="supporter in supporters.slice(0, 6)" :key="`${supporter.name}-${supporter.paid_at}`" class="rounded-md bg-white/[0.04] p-3 text-sm">
                <div class="flex items-center justify-between gap-3">
                  <span class="font-medium text-white">{{ supporter.name }}</span>
                  <span class="text-cyan-200">NT$ {{ supporter.amount }}</span>
                </div>
                <p v-if="supporter.purpose" class="mt-1 text-[11px] font-semibold text-emerald-100">{{ purposeLabel(supporter.purpose) }}</p>
                <p v-if="supporter.message" class="mt-1 text-xs text-zinc-500">{{ supporter.message }}</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </main>
</template>
