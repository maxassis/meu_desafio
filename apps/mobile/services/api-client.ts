import axios from 'axios'
import Constants from 'expo-constants'

export const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl

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
