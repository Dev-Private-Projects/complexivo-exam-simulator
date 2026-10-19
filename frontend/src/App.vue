<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

import { useHealthStore } from '@/stores/health.store'

const healthStore = useHealthStore()

onMounted(() => {
  healthStore.initialize()
})

onUnmounted(() => {
  healthStore.reset()
})
</script>

<template>
  <RouterView />
</template>
