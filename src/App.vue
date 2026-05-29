<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LocaleSwitcher from './components/LocaleSwitcher.vue'
import TrustRewardToast from './components/TrustRewardToast.vue'

const route = useRoute()
const showLocaleSwitcher = computed(() => !String(route.name || '').startsWith('iframe-'))
</script>

<template>
  <RouterView />
  <TrustRewardToast v-if="showLocaleSwitcher" />
  <div v-if="showLocaleSwitcher" class="fixed right-4 top-4 z-[2147483000]">
    <LocaleSwitcher />
  </div>
</template>
