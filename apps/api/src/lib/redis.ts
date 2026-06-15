import Redis from 'ioredis'

import { ENV } from 'varlock/env'

export const redis = new Redis(ENV.REDIS_URL, {
  connectTimeout: 5000,
  maxRetriesPerRequest: 1,
  retryStrategy: times => Math.min(times * 100, 2000),
})

redis.on('error', (error) => {
  console.error('[Redis] connection error:', error)
})
