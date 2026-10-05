import { defineStore } from 'pinia'
import { ref } from 'vue'

import {
  HEALTH_MAX_WAIT_TIME,
  HEALTH_RETRY_INTERVAL,
  HEALTH_SHOW_TOAST_AFTER,
  HEALTH_SUCCESS_TOAST_DURATION,
} from '@/constants/health'
import { checkHealth } from '@/services/health.service'
import type { HealthStatus } from '@/types/health'

export const useHealthStore = defineStore('health', () => {
  const status = ref<HealthStatus>('checking')
  const showToast = ref(false)

  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let toastTimer: ReturnType<typeof setTimeout> | null = null
  let successTimer: ReturnType<typeof setTimeout> | null = null
  let cancelled = false
  let errorLatched = false

  const clearTimer = (timer: ReturnType<typeof setTimeout> | null) => {
    if (timer) {
      clearTimeout(timer)
    }
  }

  const clearTimers = () => {
    clearTimer(retryTimer)
    clearTimer(toastTimer)
    clearTimer(successTimer)

    retryTimer = null
    toastTimer = null
    successTimer = null
  }

  const showCheckingToast = () => {
    toastTimer = setTimeout(() => {
      if (status.value === 'checking') {
        showToast.value = true
      }
    }, HEALTH_SHOW_TOAST_AFTER)
  }

  const showSuccessToast = () => {
    showToast.value = true

    successTimer = setTimeout(() => {
      showToast.value = false
      successTimer = null
    }, HEALTH_SUCCESS_TOAST_DURATION)
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
    showToast.value = false

    clearTimers()
    showCheckingToast()

    const startTime = Date.now()

    while (!cancelled) {
      try {
        await checkHealth()

        if (cancelled) {
          return
        }

        const wasToastVisible = showToast.value

        clearTimer(toastTimer)
        toastTimer = null

        status.value = 'ready'

        if (wasToastVisible) {
          showSuccessToast()
        }

        return
      } catch {
        const elapsed = Date.now() - startTime
        const remainingTime = HEALTH_MAX_WAIT_TIME - elapsed

        if (remainingTime <= 0 && !errorLatched) {
          clearTimer(toastTimer)
          toastTimer = null

          status.value = 'error'
          showToast.value = true

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
    showToast,
    initialize,
    reset,
  }
})
