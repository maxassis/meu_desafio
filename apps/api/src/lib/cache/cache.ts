import { redis } from '../redis'

const DEFAULT_CACHE_TTL_SECONDS = 60 * 5

class CacheService {
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key)

      if (value === null) {
        return null
      }

      return JSON.parse(value) as T
    }
    catch (error) {
      console.error('[Cache] get error:', error)
      return null
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds ?? DEFAULT_CACHE_TTL_SECONDS)
    }
    catch (error) {
      console.error('[Cache] set error:', error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    }
    catch (error) {
      console.error('[Cache] del error:', error)
    }
  }

  async disconnect(): Promise<void> {
    redis.disconnect()
  }
}

export const cacheService = new CacheService()
