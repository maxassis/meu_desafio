import type { SecondaryStorage } from 'better-auth'

import { redis } from './redis'

function getAuthCacheKey(key: string) {
  return `better-auth:${key}`
}

export const authSecondaryStorage: SecondaryStorage = {
  async get(key) {
    return redis.get(getAuthCacheKey(key))
  },

  async set(key, value, ttl) {
    if (ttl !== undefined) {
      await redis.set(getAuthCacheKey(key), value, 'EX', ttl)
      return
    }

    await redis.set(getAuthCacheKey(key), value)
  },

  async delete(key) {
    await redis.del(getAuthCacheKey(key))
  },
}
