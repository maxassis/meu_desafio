import type { App } from '@meu-desafio/api/eden'
import { treaty } from '@elysia/eden'
import { API_BASE_URL } from './api-config'
import { authClient } from './auth-client'

export const edenClient = treaty<App>(API_BASE_URL, {
  parseDate: false,
  headers: () => {
    const cookie = authClient.getCookie()

    return cookie ? { Cookie: cookie } : {}
  },
})
