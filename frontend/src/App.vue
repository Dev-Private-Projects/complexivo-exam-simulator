<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

import HealthToast from '@/components/HealthToast.vue'
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
  <HealthToast v-if="healthStore.showToast" :status="healthStore.status" />

  <RouterView />
</template>
