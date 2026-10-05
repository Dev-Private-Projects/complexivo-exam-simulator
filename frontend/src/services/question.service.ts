import config from '@/config/config'
import type { Category } from '@/types/category'
import type { Question } from '@/types/question'

type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
}

const fetchApi = async (input: string) => {
  try {
    return await fetch(input, { cache: 'no-store' })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté encendido.')
  }
}

const readData = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    throw new Error(`Error ${response.status} al consultar la API`)
  }

  const body = (await response.json()) as ApiResponse<T>

  if (!body.success) {
    throw new Error(body.message)
  }

  return body.data
}

export const getCategories = async (): Promise<Category[]> => {
  const response = await fetchApi(`${config.apiUrl}/categories`)
  return readData<Category[]>(response)
}

export const getQuestions = async (categoryIds: number[], search: string): Promise<Question[]> => {
  const params = new URLSearchParams()

  if (categoryIds.length > 0) {
    params.set('categoryId', categoryIds.join(','))
  }
  if (search.trim() !== '') {
    params.set('search', search.trim())
  }

  const query = params.toString()
  const url = query ? `${config.apiUrl}/questions?${query}` : `${config.apiUrl}/questions`
  const response = await fetchApi(url)
  return readData<Question[]>(response)
}
