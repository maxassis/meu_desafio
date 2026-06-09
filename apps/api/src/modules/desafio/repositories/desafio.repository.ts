import type { Prisma } from '../../../generated/prisma/client'
import type { prisma } from '../../../shared/db/prisma'
import type { CreateDesafioInput } from '../schema/create.schema'

type DesafioDatabase = typeof prisma | Prisma.TransactionClient

interface CreateDesafioData extends CreateDesafioInput {
  mainPhoto: string
  purchaseData: CreateDesafioInput['purchaseData'] & {
    distance: number
    images: string[]
  }
}

export class DesafioRepository {
  constructor(private readonly db: DesafioDatabase) {}

  findByName(name: string) {
    return this.db.desafio.findFirst({
      where: { name },
    })
  }

  create(data: CreateDesafioData) {
    return this.db.desafio.create({
      data: {
        name: data.name,
        location: data.location,
        distance: data.distance,
        photo: data.mainPhoto,
        purchaseData: data.purchaseData,
        priceId: data.priceId,
        active: data.active,
      },
    })
  }

  findManyForListing() {
    return this.db.desafio.findMany({
      select: {
        id: true,
        name: true,
        distance: true,
        photo: true,
      },
    })
  }

  findUserInscriptions(userId: string) {
    return this.db.inscription.findMany({
      where: { userId },
      select: {
        id: true,
        desafioId: true,
        completed: true,
        completedAt: true,
        progress: true,
        tasks: {
          select: {
            distanceKm: true,
            duration: true,
            id: true,
          },
        },
      },
    })
  }

  findByIdWithActiveInscriptions(id: string) {
    return this.db.desafio.findUnique({
      where: { id },
      include: {
        inscriptions: {
          where: { completed: false },
          include: {
            user: {
              include: {
                userData: {
                  select: { avatarFilename: true },
                },
              },
            },
          },
        },
      },
    })
  }

  findTasksStatsByInscription(inscriptionId: number) {
    return this.db.task.findMany({
      where: { inscriptionId },
      select: {
        createdAt: true,
        calories: true,
        distanceKm: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  findPurchaseData(id: string) {
    return this.db.desafio.findUnique({
      where: { id },
      select: { purchaseData: true },
    })
  }

  findByIdWithUserInscription(id: string, userId: string) {
    return this.db.desafio.findUnique({
      where: { id },
      include: {
        inscriptions: {
          where: { userId },
          select: { id: true },
        },
      },
    })
  }

  createInscription(desafioId: string, userId: string) {
    return this.db.inscription.create({
      data: {
        desafioId,
        progress: 0,
        userId,
      },
    })
  }
}
