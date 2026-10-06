import config from '@/config/config'
import { HEALTH_TIMEOUT } from '@/constants/health'

export const checkHealth = async (): Promise<void> => {
  const controller = new AbortController()

  const timeout = setTimeout(() => {
    controller.abort()
  }, HEALTH_TIMEOUT)

  try {
    const response = await fetch(`${config.apiUrl}/health`, {
      signal: controller.signal,
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error('Health check failed')
    }
  } finally {
    clearTimeout(timeout)
  }
}
