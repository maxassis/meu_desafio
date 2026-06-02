import { expoClient } from '@better-auth/expo/client'
import { emailOTPClient, genericOAuthClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import * as SecureStore from 'expo-secure-store'
import { API_BASE_URL } from './api-client'

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  plugins: [
    expoClient({
      scheme: 'meudesafio2',
      storage: SecureStore,
    }),
    genericOAuthClient(),
    emailOTPClient(),
  ],
})
