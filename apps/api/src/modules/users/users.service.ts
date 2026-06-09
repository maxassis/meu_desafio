import type { cacheService } from '../../lib/cache/cache'
import type { r2Service } from '../../lib/storage/r2'
import type { UsersRepository } from './repositories/users.repository'
import { Buffer } from 'node:buffer'
import { ENV } from 'varlock/env'
import { BadRequestError, NotFoundError, ServiceUnavailableError } from '../../shared/errors'

const USER_DATA_CACHE_TTL_SECONDS = 3600
const USER_PROFILE_CACHE_TTL_SECONDS = 300
const RANKING_CACHE_TTL_SECONDS = 600
const RANKING_WINDOW_DAYS = 15
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024
const AVATAR_BUCKET_NAME = 'avatars'

const allowedAvatarTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const

export interface AvatarUploadFile {
  type: string
  size: number
  arrayBuffer: () => Promise<ArrayBuffer>
}

type UserDataCache = {
  id: string
  avatarFilename: string | null
  bio: string | null
  gender: 'homem' | 'mulher' | 'nao_binario' | 'prefiro_nao_responder' | null
  sport: 'corrida' | 'bicicleta' | null
  birthDate: string | null
  createdAt: Date
  userId: string
} | null

interface UserProfileResponse {
  name: string
  avatarFilename: string | null
  bio: string | null
  activeInscriptions: number
  completedChallengesCount: number
  completedChallenges: Array<{
    id: string
    name: string
    totalDistance: number
    completedAt: Date | null
    photo: string
  }>
  totalDistance: number
  recentTasks: Array<{
    id: number
    name: string
    environment: string
    date: Date | null
    duration: unknown
    calories: number | null
    local: string | null
    distanceKm: unknown
    inscriptionId: number
    userId: string | null
    createdAt: Date
    updatedAt: Date
    gpsTask: boolean | null
  }>
  activeChallenges: Array<{
    id: string
    name: string
    totalDistance: number
    distanceCovered: number
    completionPercentage: number
    photo: string
  }>
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

interface EditUserDataInput {
  avatarFilename?: string | null
  bio?: string | null
  gender?: 'homem' | 'mulher' | 'nao_binario' | 'prefiro_nao_responder' | null
  sport?: 'corrida' | 'bicicleta' | null
  birthDate?: string | null
  name?: string
}

export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly cache: typeof cacheService,
    private readonly storage: typeof r2Service,
  ) {}

  async checkEmailExists(email: string) {
    const user = await this.usersRepository.findUserByEmail(email)

    return { exists: !!user }
  }

  async getUserData(userId: string) {
    const cacheKey = `user:${userId}:data`

    const user = await this.usersRepository.findUserNameById(userId)

    if (!user) {
      throw new NotFoundError('User not found')
    }

    const cachedUserData = await this.cache.get<UserDataCache>(cacheKey)
    if (cachedUserData) {
      return mapUserDataResponse(cachedUserData, user.name)
    }

    const userData = await this.usersRepository.findUserDataByUserId(userId)

    await this.cache.set(cacheKey, userData, USER_DATA_CACHE_TTL_SECONDS)

    return mapUserDataResponse(userData, user.name)
  }

  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    const cacheKey = `user:profile:${userId}`

    const cachedProfile = await this.cache.get<UserProfileResponse>(cacheKey)
    if (cachedProfile) {
      return cachedProfile
    }

    const userData = await this.usersRepository.findUserDataForProfile(userId)

    if (!userData) {
      throw new NotFoundError('User not found')
    }

    const [activeCount, completedCount, allInscriptions, recentTasks, activeInscriptions, completedChallengesList]
      = await Promise.all([
        this.usersRepository.countActiveInscriptions(userId),
        this.usersRepository.countCompletedInscriptions(userId),
        this.usersRepository.findUserInscriptionsWithDistances(userId),
        this.usersRepository.findRecentTasks(userId),
        this.usersRepository.findActiveInscriptions(userId),
        this.usersRepository.findCompletedChallenges(userId),
      ])

    const totalDistance = allInscriptions.reduce((sum, inscription) => {
      if (inscription.completed) {
        return sum + Number(inscription.desafio.distance)
      }

      const taskDistance = inscription.tasks.reduce(
        (taskSum, task) => taskSum + Number(task.distanceKm),
        0,
      )

      return sum + taskDistance
    }, 0)

    const activeChallenges = activeInscriptions.map((inscription) => {
      const totalChallengeDistance = Number(inscription.desafio.distance)
      const distanceCovered = inscription.tasks.reduce(
        (sum, task) => sum + Number(task.distanceKm),
        0,
      )

      const completionPercentage = totalChallengeDistance > 0
        ? Math.min(Math.round((distanceCovered / totalChallengeDistance) * 100), 100)
        : 0

      return {
        id: inscription.desafio.id,
        name: inscription.desafio.name,
        totalDistance: totalChallengeDistance,
        distanceCovered,
        completionPercentage,
        photo: inscription.desafio.photo,
      }
    })

    const completedChallenges = completedChallengesList.map(inscription => ({
      id: inscription.desafio.id,
      name: inscription.desafio.name,
      totalDistance: Number(inscription.desafio.distance),
      completedAt: inscription.completedAt,
      photo: inscription.desafio.photo,
    }))

    const profile: UserProfileResponse = {
      name: userData.user.name,
      avatarFilename: userData.avatarFilename,
      bio: userData.bio,
      activeInscriptions: activeCount,
      completedChallengesCount: completedCount,
      completedChallenges,
      totalDistance,
      recentTasks,
      activeChallenges,
    }

    await this.cache.set(cacheKey, profile, USER_PROFILE_CACHE_TTL_SECONDS)

    return profile
  }

  async getRanking(desafioId: string): Promise<RankingItem[]> {
    const cacheKey = `desafio:${desafioId}:ranking:15d`

    const cached = await this.cache.get<RankingItem[]>(cacheKey)
    if (cached) {
      return cached
    }

    const desafio = await this.usersRepository.findChallengeForRanking(desafioId)

    if (!desafio) {
      throw new NotFoundError(`Challenge with ID ${desafioId} not found`)
    }

    const now = new Date()
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - RANKING_WINDOW_DAYS)

    const tasks = await this.usersRepository.findRankingTasks(desafioId, startDate, now)
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

    await this.cache.set(cacheKey, finalRankings, RANKING_CACHE_TTL_SECONDS)

    return finalRankings
  }

  async editUserData(userId: string, data: EditUserDataInput) {
    const user = await this.usersRepository.transaction(async (usersRepository) => {
      const [userData, userRecord] = await usersRepository.editUserData(userId, data)

      return {
        ...userData,
        full_name: userRecord?.name ?? null,
        username: userRecord?.name ?? null,
      }
    })

    await this.cache.del(`user:${userId}:data`)
    await this.cache.del(`user:profile:${userId}`)

    return user
  }

  async uploadAvatar(userId: string, file: AvatarUploadFile) {
    if (!file.type) {
      throw new BadRequestError('No file provided or invalid format')
    }

    const fileExtension = validateAvatarFile(file)
    const userData = await this.usersRepository.findUserDataByUserId(userId)

    if (!userData) {
      throw new NotFoundError('User not found')
    }

    const fileName = `${userId}-avatar-${Date.now()}.${fileExtension}`
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    let avatarUrl: string

    try {
      avatarUrl = await this.storage.uploadFile(
        fileName,
        fileBuffer,
        file.type,
        AVATAR_BUCKET_NAME,
      )
    }
    catch (error) {
      console.error('Avatar upload to R2 failed:', error)
      throw new ServiceUnavailableError('Avatar upload is unavailable. Please try again later')
    }

    if (userData.avatarFilename) {
      this.storage.deleteFile(userData.avatarFilename, AVATAR_BUCKET_NAME).catch((error: unknown) => {
        console.warn('Error deleting previous avatar:', error)
      })
    }

    await this.usersRepository.updateUserDataAvatar(userId, fileName)

    await Promise.all([
      this.cache.del(`user:${userId}:data`),
      this.cache.del(`user:profile:${userId}`),
    ])

    return {
      avatar_url: avatarUrl,
      avatar_filename: fileName,
    }
  }

  async deleteAvatar(userId: string) {
    const userData = await this.usersRepository.findUserDataByUserId(userId)

    if (!userData) {
      throw new NotFoundError('User not found')
    }

    if (!userData.avatarFilename) {
      return { success: true }
    }

    try {
      await this.storage.deleteFile(userData.avatarFilename, AVATAR_BUCKET_NAME)
    }
    catch (error) {
      console.warn('Error deleting avatar from R2:', error)
    }

    await this.usersRepository.updateUserDataAvatar(userId, null)

    await Promise.all([
      this.cache.del(`user:${userId}:data`),
      this.cache.del(`user:profile:${userId}`),
    ])

    return { success: true }
  }
}

function validateAvatarFile(file: AvatarUploadFile) {
  const extension = allowedAvatarTypes[file.type as keyof typeof allowedAvatarTypes]

  if (!extension) {
    throw new BadRequestError('The uploaded file must be a JPEG, PNG, or WEBP image')
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new BadRequestError('Avatar file size must be 2MB or less')
  }

  return extension
}

function getAvatarUrl(avatarFilename: string | null) {
  if (!avatarFilename || !ENV.R2_PUBLIC_URL_AVATARS) {
    return null
  }

  return `${ENV.R2_PUBLIC_URL_AVATARS}/${avatarFilename}`
}

function mapUserDataResponse(userData: UserDataCache, name: string) {
  const avatarUrl = getAvatarUrl(userData?.avatarFilename ?? null)
  const { avatarFilename: _avatarFilename, userId: _userId, ...rest } = userData ?? {}

  return {
    ...rest,
    avatar_filename: userData?.avatarFilename ?? null,
    avatar_url: avatarUrl,
    full_name: name,
    username: name,
    usersId: userData?.userId ?? null,
  }
}
