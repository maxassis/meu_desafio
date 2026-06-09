import type { Prisma } from '../../../generated/prisma/client'
import type { prisma } from '../../../shared/db/prisma'
import type { EditUserDataInput } from '../users.types'

type UsersDatabase = typeof prisma | Prisma.TransactionClient

export class UsersRepository {
  constructor(private readonly db: UsersDatabase) {}

  transaction<T>(callback: (repository: UsersRepository) => Promise<T>) {
    return (this.db as typeof prisma).$transaction(tx => callback(new UsersRepository(tx)))
  }

  findUserByEmail(email: string) {
    return this.db.user.findUnique({
      where: { email },
      select: { id: true },
    })
  }

  findUserNameById(id: string) {
    return this.db.user.findUnique({
      where: { id },
      select: { name: true },
    })
  }

  findUserDataByUserId(userId: string) {
    return this.db.userData.findUnique({
      where: { userId },
    })
  }

  findUserDataForProfile(userId: string) {
    return this.db.userData.findUnique({
      where: { userId },
      select: {
        avatarFilename: true,
        bio: true,
        user: {
          select: { name: true },
        },
      },
    })
  }

  updateUserDataAvatar(userId: string, avatarFilename: string | null) {
    return this.db.userData.update({
      where: { userId },
      data: { avatarFilename },
    })
  }

  editUserData(userId: string, data: EditUserDataInput) {
    const userDataUpdate = {
      ...(data.avatarFilename !== undefined && { avatarFilename: data.avatarFilename }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.gender !== undefined && { gender: data.gender }),
      ...(data.sport !== undefined && { sport: data.sport }),
      ...(data.birthDate !== undefined && { birthDate: data.birthDate }),
    }

    return Promise.all([
      Object.keys(userDataUpdate).length > 0
        ? this.db.userData.update({
            where: { userId },
            data: userDataUpdate,
          })
        : this.db.userData.findUnique({
            where: { userId },
          }),
      data.name !== undefined
        ? this.db.user.update({
            where: { id: userId },
            data: { name: data.name },
          })
        : this.db.user.findUnique({ where: { id: userId } }),
    ])
  }

  countActiveInscriptions(userId: string) {
    return this.db.inscription.count({
      where: { userId, completed: false },
    })
  }

  countCompletedInscriptions(userId: string) {
    return this.db.inscription.count({
      where: { userId, completed: true },
    })
  }

  findUserInscriptionsWithDistances(userId: string) {
    return this.db.inscription.findMany({
      where: { userId },
      select: {
        completed: true,
        desafio: {
          select: { distance: true },
        },
        tasks: {
          select: { distanceKm: true },
        },
      },
    })
  }

  findRecentTasks(userId: string) {
    return this.db.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        environment: true,
        date: true,
        duration: true,
        calories: true,
        local: true,
        distanceKm: true,
        inscriptionId: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
        gpsTask: true,
      },
    })
  }

  findActiveInscriptions(userId: string) {
    return this.db.inscription.findMany({
      where: {
        userId,
        completed: false,
        desafio: { active: true },
      },
      select: {
        desafio: {
          select: {
            id: true,
            name: true,
            distance: true,
            photo: true,
          },
        },
        tasks: {
          select: { distanceKm: true },
        },
      },
    })
  }

  findCompletedChallenges(userId: string) {
    return this.db.inscription.findMany({
      where: { userId, completed: true },
      select: {
        completedAt: true,
        desafio: {
          select: {
            id: true,
            name: true,
            distance: true,
            photo: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    })
  }

  findChallengeForRanking(desafioId: string) {
    return this.db.desafio.findUnique({
      where: { id: desafioId },
      select: { id: true },
    })
  }

  findRankingTasks(desafioId: string, startDate: Date, endDate: Date) {
    return this.db.task.findMany({
      where: {
        inscription: { desafioId },
        OR: [
          {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          {
            date: null,
            createdAt: {
              gte: startDate,
              lte: endDate,
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
                  select: { avatarFilename: true },
                },
              },
            },
          },
        },
      },
    })
  }
}
