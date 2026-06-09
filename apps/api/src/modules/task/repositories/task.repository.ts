import type { Prisma } from '../../../generated/prisma/client'
import type { prisma } from '../../../shared/db/prisma'
import type { CreateTaskInput } from '../schema/create.schema'
import type { ImportStravaTasksInput } from '../schema/import-strava.schema'
import type { UpdateTaskInput } from '../schema/update.schema'

type TaskDatabase = typeof prisma | Prisma.TransactionClient

export class TaskRepository {
  constructor(private readonly db: TaskDatabase) {}

  transaction<T>(callback: (repository: TaskRepository) => Promise<T>) {
    return (this.db as typeof prisma).$transaction(tx => callback(new TaskRepository(tx)))
  }

  findUserInscription(inscriptionId: number, userId: string) {
    return this.db.inscription.findFirst({
      where: {
        id: inscriptionId,
        userId,
      },
      include: {
        desafio: {
          select: {
            id: true,
            distance: true,
          },
        },
      },
    })
  }

  findUserTask(taskId: number, userId: string) {
    return this.db.task.findFirst({
      where: {
        id: taskId,
        userId,
      },
      include: {
        inscription: {
          include: {
            desafio: {
              select: {
                distance: true,
                id: true,
              },
            },
          },
        },
      },
    })
  }

  findCurrentTaskDistance(userId: string, inscriptionId: number, taskId: number) {
    return this.db.task.findFirst({
      where: {
        id: taskId,
        userId,
        inscriptionId,
      },
      select: {
        distanceKm: true,
      },
    })
  }

  getTasks(userId: string, inscriptionId: number) {
    return this.db.task.findMany({
      where: {
        userId,
        inscriptionId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })
  }

  createTask(input: CreateTaskInput, userId: string) {
    return this.db.task.create({
      data: {
        name: input.name,
        environment: input.environment,
        date: input.date ? new Date(input.date) : null,
        duration: input.duration,
        calories: input.calories,
        local: input.local ?? null,
        distanceKm: input.distance,
        inscriptionId: input.inscriptionId,
        userId,
        gpsTask: input.gpsTask,
      },
    })
  }

  updateTask(taskId: number, input: UpdateTaskInput) {
    return this.db.task.update({
      where: {
        id: taskId,
      },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.environment !== undefined && { environment: input.environment }),
        ...(input.date !== undefined && { date: input.date ? new Date(input.date) : null }),
        ...(input.duration !== undefined && { duration: input.duration }),
        ...(input.calories !== undefined && { calories: input.calories }),
        ...(input.local !== undefined && { local: input.local }),
        ...(input.distanceKm !== undefined && { distanceKm: input.distanceKm }),
        ...(input.gpsTask !== undefined && { gpsTask: input.gpsTask }),
      },
    })
  }

  deleteTask(taskId: number) {
    return this.db.task.delete({
      where: {
        id: taskId,
      },
    })
  }

  async sumDistanceByInscription(userId: string, inscriptionId: number) {
    const tasks = await this.db.task.findMany({
      where: {
        userId,
        inscriptionId,
      },
      select: {
        distanceKm: true,
      },
    })

    return tasks.reduce(
      (sum, currentTask) => sum + Number(currentTask.distanceKm || 0),
      0,
    )
  }

  updateInscriptionProgress(
    inscriptionId: number,
    data: { progress: number, completed: boolean, completedAt: Date | null },
  ) {
    return this.db.inscription.update({
      where: { id: inscriptionId },
      data,
    })
  }

  createStravaTask(
    activity: ImportStravaTasksInput['activities'][number],
    inscriptionId: number,
    userId: string,
  ) {
    return this.db.task.create({
      data: {
        name: activity.name,
        environment: activity.environment,
        stravaActivityId: activity.stravaActivityId,
        date: activity.date,
        duration: activity.duration,
        calories: activity.calories ?? null,
        local: null,
        distanceKm: activity.distance,
        inscriptionId,
        userId,
        gpsTask: true,
      },
    })
  }
}
