<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import {
  CircleCheck,
  Coffee,
  LoaderCircle,
  RefreshCcw,
  ServerOff,
  Sparkles,
  Timer,
} from '@lucide/vue'

import { HEALTH_MESSAGE_INTERVAL } from '@/constants/health'
import type { HealthStatus } from '@/types/health'

const messages = [
  {
    text: 'Tómate un café',
    icon: Coffee,
  },
  {
    text: 'Preparando el simulador',
    icon: Sparkles,
  },
  {
    text: 'Cargando todo lo necesario',
    icon: LoaderCircle,
  },
  {
    text: 'Ya casi estamos listos',
    icon: Timer,
  },
  {
    text: 'Un momento, estamos preparando todo',
    icon: RefreshCcw,
  },
]

const props = defineProps<{
  status: HealthStatus
}>()

const currentMessageIndex = ref(0)

let messageTimer: ReturnType<typeof setInterval> | null = null

const startMessageRotation = () => {
  if (messageTimer) {
    return
  }

  messageTimer = setInterval(() => {
    currentMessageIndex.value = (currentMessageIndex.value + 1) % messages.length
  }, HEALTH_MESSAGE_INTERVAL)
}

const stopMessageRotation = () => {
  if (messageTimer) {
    clearInterval(messageTimer)
    messageTimer = null
  }
}

watch(
  () => props.status,
  (status) => {
    if (status === 'checking') {
      startMessageRotation()
      return
    }

    stopMessageRotation()
  },
  { immediate: true },
)

onUnmounted(() => {
  stopMessageRotation()
})
</script>

<template>
  <Transition
    appear
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="-translate-y-2 opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="-translate-y-2 opacity-0"
  >
    <div class="fixed left-1/2 top-5 z-50 -translate-x-1/2" role="status" aria-live="polite">
      <Transition
        mode="out-in"
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-1 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-1 opacity-0"
      >
        <div
          v-if="status === 'checking'"
          :key="currentMessageIndex"
          class="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm"
        >
          <component
            :is="messages[currentMessageIndex]?.icon"
            :size="15"
            :stroke-width="1.8"
            class="shrink-0 text-gray-400"
            aria-hidden="true"
          />

          <span>
            {{ messages[currentMessageIndex]?.text }}
          </span>

          <span class="inline-flex w-3 overflow-hidden" aria-hidden="true">
            <span class="animate-pulse">.</span>
            <span class="animate-pulse [animation-delay:200ms]">.</span>
            <span class="animate-pulse [animation-delay:400ms]">.</span>
          </span>
        </div>

        <div
          v-else-if="status === 'ready'"
          key="ready"
          class="flex items-center gap-2 rounded-full border border-green-100 bg-white px-4 py-2 text-sm font-medium text-green-600 shadow-sm"
        >
          <CircleCheck :size="15" :stroke-width="1.8" aria-hidden="true" />

          <span>Conexión establecida correctamente</span>
        </div>

        <div
          v-else
          key="error"
          class="flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm"
        >
          <ServerOff :size="15" :stroke-width="1.8" aria-hidden="true" />

          <span>No se pudo conectar con el servidor</span>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
