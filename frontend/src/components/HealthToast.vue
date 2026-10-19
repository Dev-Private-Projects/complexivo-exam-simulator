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
          class="note-sheet flex items-center gap-2 rounded px-3 py-1.5 text-sm text-pencil"
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
          class="note-sheet flex items-center gap-2 rounded px-3 py-1.5 text-sm text-green-pen"
        >
          <CircleCheck :size="15" :stroke-width="1.8" aria-hidden="true" />

          <span>Conexión establecida correctamente</span>
        </div>

        <div
          v-else
          key="error"
          class="note-sheet flex items-center gap-2 rounded px-3 py-1.5 text-sm text-red-pen"
        >
          <ServerOff :size="15" :stroke-width="1.8" aria-hidden="true" />

          <span>No se pudo conectar con el servidor</span>
        </div>
      </Transition>
    </div>
  </Transition>
</template>
