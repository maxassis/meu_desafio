import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client'
import AsyncStorage from '@react-native-async-storage/async-storage'

const CACHE_KEY = 'REACT_QUERY_OFFLINE_CACHE'

export const persister: Persister = {
  persistClient: async (client: PersistedClient) => {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(client))
  },
  restoreClient: async () => {
    const value = await AsyncStorage.getItem(CACHE_KEY)
    return value ? (JSON.parse(value) as PersistedClient) : undefined
  },
  removeClient: async () => {
    await AsyncStorage.removeItem(CACHE_KEY)
  },
}
