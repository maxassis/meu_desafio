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

  const tasks = await prisma.task.findMany({
    where: {
      inscription: {
        desafioId,
      },
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
      distanceKm: true,
      duration: true,
      inscription: {
        select: {
          id: true,
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
        },
      },
    },
  })

  const rankingsByInscription = new Map<number, Omit<RankingItem, 'position'>>()

  for (const task of tasks) {
    const { inscription } = task
    const current = rankingsByInscription.get(inscription.id) ?? {
      userId: inscription.user.id,
      userName: inscription.user.name,
      userAvatar: getAvatarUrl(inscription.user.userData?.avatarFilename ?? null),
      totalDistance: 0,
      totalDurationSeconds: 0,
      totalTasks: 0,
      avgSpeed: 0,
    }

    current.totalDistance += Number(task.distanceKm)
    current.totalDurationSeconds += Number(task.duration)
    current.totalTasks += 1

    rankingsByInscription.set(inscription.id, current)
  }

  const rankings = Array.from(rankingsByInscription.values()).map((user) => {
    const totalDistance = user.totalDistance
    const totalDurationSeconds = user.totalDurationSeconds
    const avgSpeed = totalDurationSeconds > 0
      ? totalDistance / (totalDurationSeconds / 3600)
      : 0

    return {
      ...user,
      totalDistance: Number(totalDistance.toFixed(2)),
      totalDurationSeconds: Number(totalDurationSeconds.toFixed(2)),
      avgSpeed: Number(avgSpeed.toFixed(2)),
    }
  })

  const finalRankings = rankings
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
