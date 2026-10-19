import { defineStore } from 'pinia'
import { ref } from 'vue'

import { HEALTH_MAX_WAIT_TIME, HEALTH_RETRY_INTERVAL } from '@/constants/health'
import { checkHealth } from '@/services/health.service'
import type { HealthStatus } from '@/types/health'

export const useHealthStore = defineStore('health', () => {
  const status = ref<HealthStatus>('checking')

  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let cancelled = false
  let errorLatched = false

  const clearTimer = (timer: ReturnType<typeof setTimeout> | null) => {
    if (timer) {
      clearTimeout(timer)
    }
  }

  const clearTimers = () => {
    clearTimer(retryTimer)
    retryTimer = null
  }

  const wait = (milliseconds: number) => {
    return new Promise<void>((resolve) => {
      retryTimer = setTimeout(resolve, milliseconds)
    })
  }

  const initialize = async () => {
    cancelled = false
    errorLatched = false
    status.value = 'checking'

    clearTimers()

    const startTime = Date.now()

    while (!cancelled) {
      try {
        await checkHealth()

        if (cancelled) {
          return
        }

        status.value = 'ready'
        return
      } catch {
        const elapsed = Date.now() - startTime
        const remainingTime = HEALTH_MAX_WAIT_TIME - elapsed

        if (remainingTime <= 0 && !errorLatched) {
          status.value = 'error'
          errorLatched = true
        }

        if (errorLatched) {
          await wait(HEALTH_RETRY_INTERVAL)
        } else {
          await wait(Math.min(HEALTH_RETRY_INTERVAL, remainingTime))
        }
      }
    }
  }

  const reset = () => {
    cancelled = true
    clearTimers()
  }

  return {
    status,
    initialize,
    reset,
  }
})
