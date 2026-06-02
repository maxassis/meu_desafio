import axios from 'axios'
import { API_BASE_URL } from './api-config'

export { API_BASE_URL }

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(async (config) => {
  try {
    const { authClient } = await import('./auth-client')
    const cookie = authClient.getCookie()

    if (cookie) {
      config.headers.Cookie = cookie
    }
  }
  catch (error) {
    console.error('[API] Erro ao recuperar cookie do Better Auth:', error)
  }

  return config
})

export function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback
  }
  return fallback
}

export function getEdenErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'value' in error) {
    const value = (error as { value?: unknown }).value

    if (value && typeof value === 'object' && 'message' in value) {
      const message = (value as { message?: unknown }).message
      if (typeof message === 'string' && message.length > 0) {
        return message
      }
    }

    if (typeof value === 'string' && value.length > 0) {
      return value
    }
  }

  return fallback
}
