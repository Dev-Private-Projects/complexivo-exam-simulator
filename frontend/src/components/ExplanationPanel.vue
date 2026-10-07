<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'

const props = defineProps<{ text: string; open?: boolean }>()

const displayed = ref('')
const visible = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

const startType = () => {
  stopTimer()
  displayed.value = ''
  let i = 0
  timer = setInterval(() => {
    if (i >= props.text.length) {
      stopTimer()
      return
    }
    displayed.value += props.text.charAt(i)
    i++
  }, 16)
}

const startErase = () => {
  stopTimer()
  timer = setInterval(() => {
    if (displayed.value.length === 0) {
      stopTimer()
      visible.value = false
      return
    }
    displayed.value = displayed.value.slice(0, -1)
  }, 12)
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      visible.value = true
      startType()
    } else if (visible.value) {
      startErase()
    }
  },
  { immediate: true },
)

onUnmounted(stopTimer)
</script>

<template>
  <div v-show="visible" class="rounded-lg bg-gray-50 p-3">
    <p class="text-sm leading-relaxed text-gray-600">
      {{ displayed }}<span v-if="visible" class="animate-pulse">▍</span>
    </p>
  </div>
</template>
