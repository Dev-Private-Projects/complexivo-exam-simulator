import config from '@/config/config'

type AiRequest = {
  pregunta: string
  opcionSeleccionada: string
  opcionCorrecta: string
  esCorrecta: boolean
}

export const getAiExplanation = async (body: AiRequest): Promise<string> => {
  const response = await fetch(`${config.apiUrl}/ai/explicacion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })

  const payload = (await response.json()) as {
    success: boolean
    message: string
    data: { explanation: string } | null
  }

  if (!response.ok || !payload.data) {
    throw new Error(payload.message || 'Error al obtener la explicación de IA')
  }

  return payload.data.explanation
}
