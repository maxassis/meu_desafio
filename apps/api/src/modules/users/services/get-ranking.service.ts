import { ENV } from 'varlock/env'
import { cacheService } from '../../../lib/cache/cache'
import { prisma } from '../../../shared/db/prisma'
import { NotFoundError } from '../../../shared/errors'

const CACHE_TTL_SECONDS = 600
const RANKING_WINDOW_DAYS = 15

function getAvatarUrl(avatarFilename: string | null) {
  if (!avatarFilename || !ENV.R2_PUBLIC_URL_AVATARS) {
    return null
  }

  return `${ENV.R2_PUBLIC_URL_AVATARS}/${avatarFilename}`
}

interface RankingItem {
  position: number
  userId: string
  userName: string
  userAvatar: string | null
  totalDistance: number
  totalDurationSeconds: number
  totalTasks: number
  avgSpeed: number
}

export async function getRanking(desafioId: string): Promise<RankingItem[]> {
  const cacheKey = `desafio:${desafioId}:ranking:15d`

  const cached = await cacheService.get<RankingItem[]>(cacheKey)
  if (cached) {
    return cached
  }

  const desafio = await prisma.desafio.findUnique({
    where: {
      id: desafioId,
    },
    select: {
      id: true,
    },
  })

  if (!desafio) {
    throw new NotFoundError(`Challenge with ID ${desafioId} not found`)
  }

  const now = new Date()
  const startDate = new Date(now)
  startDate.setDate(startDate.getDate() - RANKING_WINDOW_DAYS)

  const inscriptions = await prisma.inscription.findMany({
    where: {
      desafioId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          userData: {
            select: {
              avatarFilename: true,
            },
          },
        },
      },
      tasks: {
        where: {
          OR: [
            {
              date: {
                gte: startDate,
                lte: now,
              },
            },
            {
              date: null,
              createdAt: {
                gte: startDate,
                lte: now,
              },
            },
          ],
        },
        select: {
          createdAt: true,
          date: true,
          distanceKm: true,
          duration: true,
        },
        orderBy: [
          { date: 'asc' },
          { createdAt: 'asc' },
        ],
      },
    },
  })

  const rankings = inscriptions.map((inscription) => {
    const totalDistance = inscription.tasks.reduce(
      (sum, task) => sum + Number(task.distanceKm),
      0,
    )

    const totalDurationSeconds = inscription.tasks.reduce(
      (sum, task) => sum + Number(task.duration),
      0,
    )
    const avgSpeed = totalDurationSeconds > 0
      ? totalDistance / (totalDurationSeconds / 3600)
      : 0

    return {
      userId: inscription.user.id,
      userName: inscription.user.name,
      userAvatar: getAvatarUrl(inscription.user.userData?.avatarFilename ?? null),
      totalDistance: Number(totalDistance.toFixed(2)),
      totalDurationSeconds: Number(totalDurationSeconds.toFixed(2)),
      totalTasks: inscription.tasks.length,
      avgSpeed: Number(avgSpeed.toFixed(2)),
    }
  })

  const finalRankings = rankings
    .filter(user => user.totalTasks > 0)
    .sort((a, b) => {
      if (b.totalDistance !== a.totalDistance) {
        return b.totalDistance - a.totalDistance
      }

      if (a.totalDurationSeconds !== b.totalDurationSeconds) {
        return a.totalDurationSeconds - b.totalDurationSeconds
      }

      return b.totalTasks - a.totalTasks
    })
    .map((user, index) => ({
      position: index + 1,
      ...user,
    }))

  await cacheService.set(cacheKey, finalRankings, CACHE_TTL_SECONDS)

  return finalRankings
}
