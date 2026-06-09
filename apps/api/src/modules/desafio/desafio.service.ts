import type { cacheService } from '../../lib/cache/cache'
import type { r2Service } from '../../lib/storage/r2'
import type { DesafioRepository } from './repositories/desafio.repository'
import type { CreateDesafioInput, CreateDesafioResponse } from './schema/create.schema'
import type { GetDesafioResponse } from './schema/get.schema'
import { randomUUID } from 'node:crypto'
import { ENV } from 'varlock/env'
import { Prisma } from '../../generated/prisma/client'
import { BadRequestError, DomainError, NotFoundError } from '../../shared/errors'

const DESAFIO_LIST_CACHE_TTL_SECONDS = 600
const DESAFIO_CACHE_TTL_SECONDS = 300
const PURCHASE_DATA_CACHE_TTL_SECONDS = 60
const MAX_DESAFIO_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const DESAFIO_BUCKET_NAME = 'desafios'

const allowedImageTypes = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
} as const

export class DesafioService {
  constructor(
    private readonly desafioRepository: DesafioRepository,
    private readonly cache: typeof cacheService,
    private readonly storage: typeof r2Service,
  ) {}

  async getAll(userId: string) {
    const cacheKey = `user:${userId}:desafios`

    const cachedDesafios = await this.cache.get<unknown[]>(cacheKey)
    if (cachedDesafios) {
      return cachedDesafios
    }

    const desafios = await this.desafioRepository.findManyForListing()
    const inscriptions = await this.desafioRepository.findUserInscriptions(userId)
    const inscriptionsMap = new Map<
      string,
      {
        inscriptionId: number
        completed: boolean
        completedAt: Date | null
        progress: number
        totalDistanceKm: number
        tasksCount: number
        totalDuration: number
      }
    >()

    for (const inscription of inscriptions) {
      const totalDistanceKm = inscription.tasks.reduce(
        (sum, task) => sum + Number(task.distanceKm || 0),
        0,
      )

      const tasksCount = inscription.tasks.length
      const totalDuration = inscription.tasks.reduce(
        (sum, task) => sum + Number(task.duration || 0),
        0,
      )

      inscriptionsMap.set(inscription.desafioId, {
        inscriptionId: inscription.id,
        completed: inscription.completed,
        completedAt: inscription.completedAt,
        progress: Number(inscription.progress),
        totalDistanceKm,
        tasksCount,
        totalDuration,
      })
    }

    const desafiosComStatus = desafios.map((desafio) => {
      const inscription = inscriptionsMap.get(desafio.id)

      let progressPercentage = 0
      let totalDistanceCompleted = 0

      if (inscription) {
        const challengeDistance = Number(desafio.distance)

        totalDistanceCompleted = inscription.completed
          ? challengeDistance
          : inscription.totalDistanceKm

        progressPercentage
          = challengeDistance > 0
            ? Math.min(100, (inscription.progress / challengeDistance) * 100)
            : 0
      }

      return {
        ...desafio,
        isRegistered: Boolean(inscription),
        inscriptionId: inscription?.inscriptionId ?? null,
        completed: inscription?.completed ?? false,
        completedAt: inscription?.completedAt ?? null,
        progressPercentage,
        totalDistanceCompleted,
        tasksCount: inscription?.tasksCount ?? 0,
        totalDuration: inscription?.totalDuration ?? 0,
      }
    })

    await this.cache.set(cacheKey, desafiosComStatus, DESAFIO_LIST_CACHE_TTL_SECONDS)

    return desafiosComStatus
  }

  async create(input: CreateDesafioInput, files: File[]): Promise<CreateDesafioResponse> {
    const { name, location, distance, active, priceId, purchaseData } = input

    const existingDesafio = await this.desafioRepository.findByName(name)

    if (existingDesafio) {
      throw new BadRequestError('Name already exists')
    }

    const imageUrls: string[] = []
    const uploadedFileNames: string[] = []

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const extension = validateImageFile(file)
          const fileName = `${randomUUID()}.${extension}`
          const arrayBuffer = await file.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)

          const publicUrl = await this.storage.uploadFile(
            fileName,
            buffer,
            file.type,
            DESAFIO_BUCKET_NAME,
          )

          uploadedFileNames.push(fileName)
          imageUrls.push(publicUrl)
        }
        catch (error: unknown) {
          if (error instanceof DomainError) {
            throw error
          }

          const errorMessage
            = error instanceof Error ? error.message : 'Unknown error'
          if (errorMessage.includes('R2 not configured')) {
            throw new Error('Upload is unavailable: R2 is not configured on the server')
          }

          console.error('Error processing file:', file.name, error)

          await this.cleanupUploadedImages(uploadedFileNames)

          if (errorMessage.includes('File must') || errorMessage.includes('File size')) {
            throw new Error(errorMessage)
          }

          throw new Error(`Error processing file ${file.name}: ${errorMessage}`)
        }
      }
    }

    const updatedPurchaseData = {
      ...purchaseData,
      distance,
      images: imageUrls,
    }

    const mainPhoto = imageUrls.length > 0 ? imageUrls[0] : ''

    try {
      const result = await this.desafioRepository.create({
        name,
        location,
        distance,
        active,
        priceId,
        purchaseData: updatedPurchaseData,
        mainPhoto,
      })

      return {
        message: 'Challenge created successfully',
        id: result.id,
        imagesUploaded: imageUrls.length,
        mainPhoto,
        imageUrls,
      }
    }
    catch (error) {
      console.error('Database error:', error)

      if (uploadedFileNames.length > 0) {
        console.log('Attempting to cleanup uploaded images...')
        await this.cleanupUploadedImages(uploadedFileNames)
      }

      const errorMessage
        = error instanceof Error ? error.message : 'Unknown database error'
      throw new Error(`Error creating desafio in database: ${errorMessage}`)
    }
  }

  async registerUser(desafioId: string, userId: string) {
    const desafio = await this.desafioRepository.findByIdWithUserInscription(desafioId, userId)

    if (!desafio) {
      throw new NotFoundError(`Challenge with ID ${desafioId} not found`)
    }

    if (desafio.inscriptions.length > 0) {
      throw new BadRequestError('User already registered for this challenge')
    }

    try {
      await this.desafioRepository.createInscription(desafioId, userId)
    }
    catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BadRequestError('User already registered for this challenge')
      }

      throw error
    }

    await Promise.all([
      this.cache.del(`desafio:${desafioId}`),
      this.cache.del(`user:${userId}:desafios`),
      this.cache.del(`user:profile:${userId}`),
    ])

    return {
      message: 'User registered successfully',
    }
  }

  async getById(desafioId: string): Promise<GetDesafioResponse> {
    const cacheKey = `desafio:${desafioId}`

    const cachedDesafio = await this.cache.get<GetDesafioResponse>(cacheKey)
    if (cachedDesafio) {
      return cachedDesafio
    }

    const desafio = await this.desafioRepository.findByIdWithActiveInscriptions(desafioId)

    if (!desafio) {
      throw new NotFoundError(`Desafio with ID ${desafioId} not found`)
    }

    const inscriptionsWithStats = await Promise.all(
      desafio.inscriptions.map(async (inscription) => {
        const tasks = await this.desafioRepository.findTasksStatsByInscription(inscription.id)
        const lastTaskDate = tasks.length > 0 ? tasks[0].createdAt : null
        const totalCalories = tasks.reduce(
          (sum, task) => sum + (task.calories || 0),
          0,
        )
        const totalDistanceKm = tasks.reduce(
          (sum, task) => sum + (Number(task.distanceKm) || 0),
          0,
        )

        return {
          user: {
            id: inscription.user.id,
            name: inscription.user.name,
            avatar: getAvatarUrl(inscription.user.userData?.avatarFilename ?? null),
          },
          progress: inscription.progress,
          totalTasks: tasks.length,
          totalCalories,
          totalDistanceKm,
          lastTaskDate,
        }
      }),
    )

    const result: GetDesafioResponse = {
      id: desafio.id,
      name: desafio.name,
      location: desafio.location,
      distance: desafio.distance,
      photo: desafio.photo,
      inscriptions: inscriptionsWithStats,
    }

    await this.cache.set(cacheKey, result, DESAFIO_CACHE_TTL_SECONDS)

    return result
  }

  async getPurchaseData(desafioId: string) {
    const cacheKey = `desafio:${desafioId}:purchaseData`

    const cachedPurchaseData = await this.cache.get<unknown>(cacheKey)
    if (cachedPurchaseData) {
      return cachedPurchaseData
    }

    const desafio = await this.desafioRepository.findPurchaseData(desafioId)

    if (!desafio) {
      throw new NotFoundError('Challenge not found')
    }

    await this.cache.set(cacheKey, desafio.purchaseData, PURCHASE_DATA_CACHE_TTL_SECONDS)

    return desafio.purchaseData
  }

  private async cleanupUploadedImages(fileNames: string[]) {
    for (const fileName of fileNames) {
      try {
        await this.storage.deleteFile(fileName, DESAFIO_BUCKET_NAME)
      }
      catch {
        console.error('Error cleaning up image:', fileName)
      }
    }
  }
}

function validateImageFile(file: File) {
  const extension = allowedImageTypes[file.type as keyof typeof allowedImageTypes]

  if (!extension) {
    throw new BadRequestError('File must be a JPEG, PNG, or WEBP image')
  }

  if (file.size > MAX_DESAFIO_IMAGE_SIZE_BYTES) {
    throw new BadRequestError('File size must be 5MB or less')
  }

  return extension
}

function getAvatarUrl(avatarFilename: string | null) {
  if (!avatarFilename || !ENV.R2_PUBLIC_URL_AVATARS) {
    return null
  }

  return `${ENV.R2_PUBLIC_URL_AVATARS}/${avatarFilename}`
}
