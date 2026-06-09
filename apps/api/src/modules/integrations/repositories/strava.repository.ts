import type { Prisma } from '../../../generated/prisma/client'
import type { prisma } from '../../../shared/db/prisma'

type StravaDatabase = typeof prisma | Prisma.TransactionClient

export class StravaRepository {
  constructor(private readonly db: StravaDatabase) {}

  findUserInscription(inscriptionId: number, userId: string) {
    return this.db.inscription.findFirst({
      where: {
        id: inscriptionId,
        userId,
      },
      select: {
        id: true,
        createdAt: true,
      },
    })
  }

  findImportedStravaTasks(inscriptionId: number, userId: string) {
    return this.db.task.findMany({
      where: { inscriptionId, userId },
      select: { stravaActivityId: true },
    })
  }

  findStravaAccount(userId: string) {
    return this.db.account.findFirst({
      where: { userId, providerId: 'strava' },
    })
  }

  deleteStravaAccount(id: string) {
    return this.db.account.delete({
      where: { id },
    })
  }
}
