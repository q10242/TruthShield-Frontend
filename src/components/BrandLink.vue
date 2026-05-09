<script setup>
defineProps({
  to: {
    type: String,
    default: '/',
  },
  compact: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <RouterLink
    :to="to"
    class="inline-flex min-w-0 items-center gap-2 rounded-md text-sm font-semibold text-white hover:text-cyan-100"
  >
    <img
      class="shrink-0"
      :class="compact ? 'h-6 w-6' : 'h-8 w-8'"
      src="/brand/truthshield-mark.svg"
      alt=""
    />
    <span class="truncate">TruthShield</span>
  </RouterLink>
</template>
