<script setup>
import { computed } from 'vue'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { createClaimant, fetchMyDataExport, fetchProfile, logout, markAllNotificationsRead, updateProfile } from '../lib/api'
import { useI18n } from '../i18n'

const TOKEN_KEY = 'truthshield_api_token'
const USER_KEY = 'truthshield_user'
const token = ref(localStorage.getItem(TOKEN_KEY) || '')
const profile = ref(null)
const loading = ref(false)
const exportMessage = ref('')
const profileMessage = ref('')
const claimantMessage = ref('')
const profileForm = ref({ display_name: '', is_real_name_public: false, profile_bio: '', email_preferences: {} })
const claimantForm = ref({ claim_type: 'subject', domain: '', proof_url: '', statement: '' })
const { t } = useI18n()

const nextAchievements = computed(() => (profile.value?.achievements || [])
  .filter((achievement) => !achievement.unlocked)
  .sort((a, b) => b.percentage - a.percentage)
  .slice(0, 3))
const newlyUnlocked = computed(() => {
  const slugs = profile.value?.achievement_summary?.unlocked_now || []
  return (profile.value?.achievements || []).filter((achievement) => slugs.includes(achievement.slug))
})
const contributionSuggestions = computed(() => [
  { to: '/news-search', title: t('profile.suggestRead'), description: t('profile.suggestReadDesc') },
  { to: '/community-tasks', title: t('profile.suggestCommunityTasks'), description: t('profile.suggestCommunityTasksDesc') },
  { to: '/report-domain', title: t('profile.suggestMaintain'), description: t('profile.suggestMaintainDesc') },
])
const emailPreferenceItems = computed(() => [
  { key: 'account', label: t('profile.emailPrefAccount') },
  { key: 'moderation', label: t('profile.emailPrefModeration') },
  { key: 'official_response', label: t('profile.emailPrefOfficial') },
  { key: 'donation', label: t('profile.emailPrefDonation') },
  { key: 'bug_report', label: t('profile.emailPrefBug') },
  { key: 'product', label: t('profile.emailPrefProduct') },
])

function claimantStatusLabel(status) {
  return t(`profile.claimStatus.${status}`) === `profile.claimStatus.${status}` ? status : t(`profile.claimStatus.${status}`)
}

function statusClass(status) {
  if (['approved', 'published'].includes(status)) return 'bg-emerald-500/15 text-emerald-100'
  if (['rejected', 'hidden'].includes(status)) return 'bg-red-500/15 text-red-100'
  return 'bg-amber-500/15 text-amber-100'
}

async function signOut() {
  if (token.value) await logout(token.value).catch(() => null)
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  token.value = ''
  profile.value = null
}

async function loadProfile() {
  if (!token.value) return
  loading.value = true
  try {
    profile.value = await fetchProfile(token.value)
    profileForm.value = {
      display_name: profile.value.user.display_name || profile.value.user.name || '',
      is_real_name_public: Boolean(profile.value.user.is_real_name_public),
      profile_bio: profile.value.user.profile_bio || '',
      email_preferences: { ...(profile.value.email_preferences || {}) },
    }
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  profileMessage.value = ''
  const payload = await updateProfile(token.value, profileForm.value)
  profile.value.user = payload.user
  localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
  profileMessage.value = t('profile.profileSaved')
}

async function submitClaimant() {
  claimantMessage.value = ''
  await createClaimant(token.value, {
    claim_type: claimantForm.value.claim_type,
    domain: claimantForm.value.domain || undefined,
    proof_url: claimantForm.value.proof_url || undefined,
    statement: claimantForm.value.statement,
  })
  claimantForm.value = { claim_type: 'subject', domain: '', proof_url: '', statement: '' }
  claimantMessage.value = t('profile.claimantSubmitted')
  await loadProfile()
}

async function markNotificationsRead() {
  if (!token.value) return
  await markAllNotificationsRead(token.value)
  await loadProfile()
}

async function exportMyData() {
  exportMessage.value = ''
  const payload = await fetchMyDataExport(token.value)
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'truthshield-my-data.json'
  anchor.click()
  URL.revokeObjectURL(url)
  exportMessage.value = t('profile.exportDone')
}

onMounted(async () => {
  await loadProfile()
})
</script>

<template>
  <main class="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
    <section class="mx-auto max-w-4xl">
      <nav class="mb-8 flex items-center justify-between border-b border-white/10 pb-5">
        <BrandLink />
        <button v-if="token" class="rounded-md border border-white/10 px-3 py-2 text-sm text-zinc-300" @click="signOut">{{ t('common.signOut') }}</button>
      </nav>

      <div v-if="!token" class="rounded-lg border border-white/10 bg-white/[0.03] p-5">
        <h1 class="text-2xl font-semibold text-white">{{ t('profile.notSignedIn') }}</h1>
        <p class="mt-2 text-sm leading-6 text-zinc-400">{{ t('profile.introSignedOut') }}</p>
        <RouterLink class="mt-4 inline-flex rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" to="/login?redirect=/profile">
          {{ t('profile.goSignIn') }}
        </RouterLink>
      </div>
      <div v-else-if="loading" class="rounded-lg border border-white/10 p-5 text-zinc-400">{{ t('common.loading') }}</div>

      <template v-else-if="profile">
        <div class="rounded-lg border border-cyan-300/20 bg-white/[0.03] p-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-cyan-300">{{ profile.title?.name || t('profile.observer') }}</p>
              <h1 class="mt-1 text-3xl font-semibold text-white">{{ profile.user.is_real_name_public ? profile.user.name : (profile.user.display_name || profile.user.name) }}</h1>
              <p v-if="profile.user.public_identity_label" class="mt-2 inline-flex rounded bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">{{ profile.user.public_identity_label }}</p>
              <p class="mt-2 max-w-xl text-sm leading-6 text-zinc-400">{{ profile.title?.description }}</p>
              <p class="mt-2 text-sm text-zinc-500">{{ profile.user.email }} · {{ t('profile.trust') }} {{ Number(profile.user.trust_score).toFixed(2) }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button class="rounded-md border border-cyan-300/30 px-3 py-1.5 text-xs font-semibold text-cyan-100" @click="exportMyData">{{ t('profile.exportData') }}</button>
              <RouterLink class="rounded-md border border-cyan-300/30 px-3 py-1.5 text-xs font-semibold text-cyan-100" to="/appeals">{{ t('profile.appeal') }}</RouterLink>
              <RouterLink class="rounded-md bg-cyan-300 px-3 py-1.5 text-xs font-semibold text-zinc-950" to="/donate">{{ t('profile.supportProject') }}</RouterLink>
            </div>
          </div>
          <div class="mt-4 grid gap-3 sm:grid-cols-3">
            <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <p class="text-xs text-zinc-500">{{ t('profile.unlockedBadges') }}</p>
              <p class="mt-1 text-2xl font-semibold text-white">{{ profile.achievement_summary?.unlocked_count || 0 }} / {{ profile.achievement_summary?.total_count || 0 }}</p>
            </div>
            <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <p class="text-xs text-zinc-500">{{ t('profile.voteContribution') }}</p>
              <p class="mt-1 text-2xl font-semibold text-white">{{ profile.stats.votes }}</p>
            </div>
            <div class="rounded-md border border-white/10 bg-zinc-950/70 p-3">
              <p class="text-xs text-zinc-500">{{ t('profile.evidenceContribution') }}</p>
              <p class="mt-1 text-2xl font-semibold text-white">{{ profile.stats.evidence_votes }}</p>
            </div>
          </div>
        </div>
        <p v-if="exportMessage" class="mt-3 rounded-md border border-emerald-400/40 bg-emerald-500/10 p-2 text-xs text-emerald-100">{{ exportMessage }}</p>
        <section class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 class="text-xl font-semibold text-white">{{ t('profile.publicIdentity') }}</h2>
          <p class="mt-1 text-sm text-zinc-500">{{ t('profile.publicIdentityDesc') }}</p>
          <div class="mt-4 grid gap-3 md:grid-cols-2">
            <label class="block text-xs text-zinc-400">
              {{ t('profile.displayName') }}
              <input v-model="profileForm.display_name" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" />
            </label>
            <label class="flex items-center gap-2 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-300">
              <input v-model="profileForm.is_real_name_public" type="checkbox" />
              {{ t('profile.showRealName') }}
            </label>
            <label class="block text-xs text-zinc-400 md:col-span-2">
              {{ t('profile.profileBio') }}
              <textarea v-model="profileForm.profile_bio" rows="3" class="mt-2 w-full resize-none rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"></textarea>
            </label>
          </div>
          <button class="mt-4 rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" @click="saveProfile">{{ t('profile.saveProfile') }}</button>
          <p v-if="profileMessage" class="mt-3 rounded-md border border-emerald-400/40 bg-emerald-500/10 p-2 text-xs text-emerald-100">{{ profileMessage }}</p>
        </section>

        <section class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 class="text-xl font-semibold text-white">{{ t('profile.emailPreferences') }}</h2>
          <p class="mt-1 text-sm text-zinc-500">{{ t('profile.emailPreferencesDesc') }}</p>
          <div class="mt-4 grid gap-2 md:grid-cols-2">
            <label
              v-for="item in emailPreferenceItems"
              :key="item.key"
              class="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-300"
            >
              <span>{{ item.label }}</span>
              <input v-model="profileForm.email_preferences[item.key]" type="checkbox" />
            </label>
          </div>
          <button class="mt-4 rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" @click="saveProfile">{{ t('profile.saveProfile') }}</button>
        </section>

        <section class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 class="text-xl font-semibold text-white">{{ t('profile.claimantVerification') }}</h2>
          <p class="mt-1 text-sm text-zinc-500">{{ t('profile.claimantVerificationDesc') }}</p>
          <div class="mt-4 grid gap-3 md:grid-cols-2">
            <label class="block text-xs text-zinc-400">
              {{ t('profile.claimType') }}
              <select v-model="claimantForm.claim_type" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300">
                <option value="subject">{{ t('profile.claimSubject') }}</option>
                <option value="author">{{ t('profile.claimAuthor') }}</option>
                <option value="media">{{ t('profile.claimMedia') }}</option>
                <option value="organization">{{ t('profile.claimOrganization') }}</option>
              </select>
            </label>
            <label class="block text-xs text-zinc-400">
              {{ t('profile.claimDomain') }}
              <input v-model="claimantForm.domain" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" placeholder="example.com" />
            </label>
            <label class="block text-xs text-zinc-400 md:col-span-2">
              {{ t('profile.proofUrl') }}
              <input v-model="claimantForm.proof_url" class="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" placeholder="https://..." />
            </label>
            <label class="block text-xs text-zinc-400 md:col-span-2">
              {{ t('profile.claimStatement') }}
              <textarea v-model="claimantForm.statement" rows="3" class="mt-2 w-full resize-none rounded-md border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-300"></textarea>
            </label>
          </div>
          <button class="mt-4 rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-zinc-950" @click="submitClaimant">{{ t('profile.submitClaimant') }}</button>
          <p v-if="claimantMessage" class="mt-3 rounded-md border border-emerald-400/40 bg-emerald-500/10 p-2 text-xs text-emerald-100">{{ claimantMessage }}</p>
          <div v-if="profile.verified_claimants?.length" class="mt-4 grid gap-2">
            <div v-for="claim in profile.verified_claimants" :key="claim.id" class="rounded-md border border-white/10 bg-zinc-950/70 p-3 text-sm">
              <span class="rounded px-2 py-1 text-xs font-semibold" :class="statusClass(claim.status)">{{ claimantStatusLabel(claim.status) }}</span>
              <span class="ml-2 text-zinc-200">{{ claim.claim_type }} · {{ claim.domain || claim.organization_name || '-' }}</span>
              <p v-if="claim.review_note" class="mt-2 text-xs leading-5 text-zinc-500">{{ claim.review_note }}</p>
              <RouterLink
                v-if="claim.status === 'rejected'"
                class="mt-2 inline-flex text-xs font-semibold text-cyan-200 underline"
                :to="{ path: '/appeals', query: { subject_type: 'verified_claimant', subject_id: claim.id, reason: t('profile.appealRejectedClaim') } }"
              >
                {{ t('profile.appealRejectedClaim') }}
              </RouterLink>
            </div>
          </div>
        </section>
        <section v-if="profile.official_responses?.length" class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 class="text-xl font-semibold text-white">{{ t('votePanel.officialResponses') }}</h2>
          <div class="mt-4 grid gap-2">
            <article v-for="response in profile.official_responses" :key="response.id" class="rounded-md border border-white/10 bg-zinc-950/70 p-3 text-sm">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded px-2 py-1 text-xs font-semibold" :class="statusClass(response.status)">{{ claimantStatusLabel(response.status) }}</span>
                <span class="text-zinc-200">{{ response.response_type }}</span>
                <RouterLink v-if="response.news_url" class="text-xs text-cyan-200 underline" :to="`/news/${response.news_url.id}`">{{ response.news_url.title_snapshot || response.news_url.normalized_url }}</RouterLink>
              </div>
              <p class="mt-2 line-clamp-3 text-xs leading-5 text-zinc-400">{{ response.response_text }}</p>
              <RouterLink
                v-if="['hidden', 'rejected'].includes(response.status)"
                class="mt-2 inline-flex text-xs font-semibold text-cyan-200 underline"
                :to="{ path: '/appeals', query: { subject_type: 'official_response', subject_id: response.id, reason: t('profile.appealRejectedResponse') } }"
              >
                {{ t('profile.appealRejectedResponse') }}
              </RouterLink>
            </article>
          </div>
        </section>
        <section class="mt-6 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.04] p-5">
          <h2 class="text-xl font-semibold text-white">{{ t('profile.nextContribution') }}</h2>
          <div class="mt-4 grid gap-3 md:grid-cols-3">
            <RouterLink v-for="item in contributionSuggestions" :key="item.to" :to="item.to" class="rounded-md border border-white/10 bg-zinc-950/70 p-4 hover:border-cyan-300/60">
              <p class="text-sm font-semibold text-cyan-100">{{ item.title }}</p>
              <p class="mt-2 text-xs leading-5 text-zinc-500">{{ item.description }}</p>
            </RouterLink>
          </div>
        </section>
        <section v-if="profile.community_roles?.length" class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-xl font-semibold text-white">{{ t('profile.communityRoles') }}</h2>
              <p class="mt-1 text-sm text-zinc-500">{{ t('profile.communityRolesDesc') }}</p>
            </div>
            <RouterLink class="rounded-md border border-cyan-300/40 px-3 py-2 text-xs font-semibold text-cyan-100" to="/community-tasks">{{ t('common.communityTasks') }}</RouterLink>
          </div>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div v-for="role in profile.community_roles" :key="role.key" class="rounded-md border border-cyan-300/20 bg-zinc-950/70 p-4">
              <p class="text-sm font-semibold text-cyan-100">{{ role.name }}</p>
              <p class="mt-2 text-xs leading-5 text-zinc-500">{{ role.description }}</p>
            </div>
          </div>
        </section>
        <div v-if="newlyUnlocked.length" class="mt-4 rounded-lg border border-cyan-300/40 bg-cyan-300/10 p-4">
          <p class="text-sm font-semibold text-cyan-100">{{ t('profile.newlyUnlocked', { count: newlyUnlocked.length }) }}</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <span v-for="achievement in newlyUnlocked" :key="achievement.slug" class="rounded-full bg-cyan-300 px-3 py-1 text-xs font-semibold text-zinc-950">
              {{ achievement.name }}
            </span>
          </div>
        </div>

        <section class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-xl font-semibold text-white">{{ t('profile.badgeWall') }}</h2>
            <span class="text-xs text-zinc-500">{{ t('profile.badgeHint') }}</span>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div
              v-for="achievement in profile.achievements"
              :key="achievement.slug"
              class="rounded-md border p-4"
              :class="achievement.unlocked ? 'bg-white/[0.045]' : 'border-white/10 bg-zinc-950/70 opacity-75'"
              :style="achievement.unlocked ? { borderColor: `${achievement.color}66` } : {}"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: achievement.color || '#67e8f9' }"></span>
                    <p class="text-sm font-semibold" :class="achievement.unlocked ? 'text-white' : 'text-zinc-300'">{{ achievement.name }}</p>
                  </div>
                  <p class="mt-1 text-xs leading-5 text-zinc-500">{{ achievement.description }}</p>
                </div>
                <span
                  class="rounded-full px-2 py-1 text-[11px] font-semibold"
                  :class="achievement.unlocked ? 'text-zinc-950' : 'bg-white/10 text-zinc-400'"
                  :style="achievement.unlocked ? { backgroundColor: achievement.color || '#67e8f9' } : {}"
                >
                  {{ achievement.unlocked ? t('profile.unlocked') : `${achievement.current}/${achievement.target}` }}
                </span>
              </div>
              <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div class="h-full rounded-full" :style="{ width: `${achievement.percentage}%`, backgroundColor: achievement.color || '#67e8f9' }"></div>
              </div>
            </div>
          </div>
        </section>

        <section v-if="nextAchievements.length" class="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-5">
          <h2 class="text-xl font-semibold text-white">{{ t('profile.nextGoal') }}</h2>
          <div class="mt-4 grid gap-3 sm:grid-cols-3">
            <div v-for="achievement in nextAchievements" :key="achievement.slug" class="rounded-md border border-white/10 bg-zinc-950/70 p-4">
              <p class="text-sm font-semibold text-white">{{ achievement.name }}</p>
              <p class="mt-1 text-xs leading-5 text-zinc-500">{{ achievement.description }}</p>
              <p class="mt-3 text-xs text-cyan-200">{{ achievement.current }} / {{ achievement.target }}</p>
              <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div class="h-full rounded-full" :style="{ width: `${achievement.percentage}%`, backgroundColor: achievement.color || '#67e8f9' }"></div>
              </div>
            </div>
          </div>
        </section>

        <div class="mt-6 grid gap-3 sm:grid-cols-4">
          <div v-for="(value, key) in profile.stats" :key="key" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <p class="text-xs text-zinc-500">{{ t(`profile.stats.${key}`) }}</p>
            <p class="mt-2 text-2xl font-semibold text-white">{{ value }}</p>
          </div>
        </div>

        <div class="mt-8 grid gap-6 lg:grid-cols-2">
          <section>
            <div class="mb-3 flex items-center justify-between">
              <h2 class="text-xl font-semibold text-white">{{ t('profile.notifications') }}</h2>
              <button class="rounded-md border border-white/10 px-3 py-2 text-xs text-zinc-300" @click="markNotificationsRead">{{ t('profile.markAllRead') }}</button>
            </div>
            <div class="space-y-2">
              <div v-for="item in profile.notifications" :key="item.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4" :class="item.read_at ? 'opacity-60' : ''">
                <div class="flex items-center justify-between gap-3">
                  <p class="text-sm font-semibold text-white">{{ item.title }}</p>
                  <span v-if="!item.read_at" class="rounded-full bg-cyan-300 px-2 py-0.5 text-[11px] font-semibold text-zinc-950">{{ t('profile.new') }}</span>
                </div>
                <p class="mt-1 text-xs leading-5 text-zinc-400">{{ item.body }}</p>
                <a v-if="item.action_url" :href="item.action_url" target="_blank" rel="noreferrer" class="mt-2 block truncate text-xs font-semibold text-cyan-200">{{ item.action_url }}</a>
              </div>
              <div v-if="!profile.notifications?.length" class="rounded-lg border border-white/10 p-4 text-sm text-zinc-500">{{ t('profile.noNotifications') }}</div>
            </div>
          </section>

          <section>
            <h2 class="mb-3 text-xl font-semibold text-white">{{ t('profile.recentVotes') }}</h2>
            <div class="space-y-2">
              <div v-for="vote in profile.recent_votes" :key="vote.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                <div class="flex items-center justify-between gap-3">
                  <span class="rounded bg-white/10 px-2 py-1 text-xs font-semibold text-zinc-200">{{ vote.tag?.name }}</span>
                  <span class="text-xs text-zinc-500">{{ t('profile.weight') }} {{ Number(vote.weight_score || 0).toFixed(2) }}</span>
                </div>
                <p class="mt-2 truncate text-sm text-zinc-300">{{ vote.news_url?.title_snapshot || vote.news_url?.normalized_url }}</p>
                <p v-if="vote.evidence_note" class="mt-1 text-xs leading-5 text-zinc-500">{{ vote.evidence_note }}</p>
              </div>
              <div v-if="!profile.recent_votes?.length" class="rounded-lg border border-white/10 p-4 text-sm text-zinc-500">{{ t('profile.noVotes') }}</div>
            </div>
          </section>
        </div>

        <h2 class="mt-8 text-xl font-semibold text-white">{{ t('profile.trustHistory') }}</h2>
        <div class="mt-3 space-y-2">
          <div v-for="row in profile.trust_history" :key="row.id" class="rounded-lg border border-white/10 bg-white/[0.03] p-4">
            <div class="flex items-center justify-between">
              <span class="text-sm text-zinc-300">{{ row.reason }}</span>
              <span :class="Number(row.delta) >= 0 ? 'text-emerald-300' : 'text-red-300'">{{ Number(row.delta).toFixed(4) }}</span>
            </div>
            <p class="mt-1 text-xs text-zinc-500">{{ row.details }}</p>
          </div>
        </div>
      </template>
    </section>
  </main>
</template>
