import type { SecondaryStorage } from 'better-auth'
import { LRUCache } from 'lru-cache'

const authCache = new LRUCache<string, string>({
  max: 5000,
  allowStale: false,
})

function getAuthCacheKey(key: string) {
  return `better-auth:${key}`
}

export const authSecondaryStorage: SecondaryStorage = {
  async get(key) {
    return authCache.get(getAuthCacheKey(key)) ?? null
  },

  async set(key, value, ttl) {
    if (ttl !== undefined) {
      authCache.set(getAuthCacheKey(key), value, { ttl: ttl * 1000 })
      return
    }

    authCache.set(getAuthCacheKey(key), value)
  },

  async delete(key) {
    authCache.delete(getAuthCacheKey(key))
  },
}
