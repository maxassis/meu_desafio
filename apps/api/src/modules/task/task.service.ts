import type { cacheService } from '../../lib/cache/cache'
import type { TaskRepository } from './repositories/task.repository'
import type { CheckCompletionInput } from './schema/check-completion.schema'
import type { CreateTaskInput } from './schema/create.schema'
import type { ImportStravaTasksInput } from './schema/import-strava.schema'
import type { UpdateTaskInput } from './schema/update.schema'
import { BadRequestError, ForbiddenError, NotFoundError } from '../../shared/errors'
import { calculateChallengeProgress, willCompleteChallenge } from './domain/challenge-progress'

const CACHE_TTL_SECONDS = 120

interface RecalculateInscriptionProgressInput {
  challengeDistance: number
  completedAt: Date | null
  inscriptionId: number
  userId: string
}

export class TaskService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly cache: typeof cacheService,
  ) {}

  async create(input: CreateTaskInput, userId: string) {
    const userInscription = await this.taskRepository.findUserInscription(input.inscriptionId, userId)

    if (!userInscription) {
      throw new ForbiddenError('User is not registered for this challenge')
    }

    if (userInscription.completed) {
      throw new BadRequestError('This challenge is already completed. You cannot add more tasks.')
    }

    const result = await this.taskRepository.transaction(async (taskRepository) => {
      const task = await taskRepository.createTask(input, userId)
      const progress = await this.recalculateInscriptionProgress(taskRepository, {
        challengeDistance: Number(userInscription.desafio.distance),
        completedAt: new Date(),
        inscriptionId: input.inscriptionId,
        userId,
      })

      return {
        message: 'Task created successfully',
        challengeCompleted: progress.completed,
        task,
      }
    })

    await Promise.allSettled([
      this.cache.del(`desafio:${userInscription.desafio.id}`),
      this.cache.del(`desafio:${userInscription.desafio.id}:ranking:15d`),
      this.cache.del(`user:${userId}:desafios`),
      this.cache.del(`user:${userId}:inscription:${input.inscriptionId}:tasks`),
    ])

    return result
  }

  async importStravaTasks(input: ImportStravaTasksInput, userId: string) {
    const userInscription = await this.taskRepository.findUserInscription(input.inscriptionId, userId)

    if (!userInscription) {
      throw new ForbiddenError('User is not registered for this challenge')
    }

    if (userInscription.completed) {
      throw new BadRequestError('This challenge is already completed. You cannot add more tasks.')
    }

    const result = await this.taskRepository.transaction(async (taskRepository) => {
      const createdTasks: Array<{ id: number, stravaActivityId: string }> = []
      let skipped = 0

      for (const activity of input.activities) {
        if (activity.date < userInscription.createdAt) {
          skipped += 1
          continue
        }

        try {
          const task = await taskRepository.createStravaTask(activity, input.inscriptionId, userId)

          createdTasks.push({
            id: task.id,
            stravaActivityId: activity.stravaActivityId,
          })
        }
        catch (error) {
          if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
            skipped += 1
            continue
          }

          throw error
        }
      }

      if (createdTasks.length > 0) {
        await this.recalculateInscriptionProgress(taskRepository, {
          challengeDistance: Number(userInscription.desafio.distance),
          completedAt: new Date(),
          inscriptionId: input.inscriptionId,
          userId,
        })
      }

      return {
        imported: createdTasks.length,
        skipped,
        createdTasks,
      }
    })

    await Promise.allSettled([
      this.cache.del(`desafio:${userInscription.desafio.id}`),
      this.cache.del(`desafio:${userInscription.desafio.id}:ranking:15d`),
      this.cache.del(`user:${userId}:desafios`),
      this.cache.del(`user:${userId}:inscription:${input.inscriptionId}:tasks`),
    ])

    return {
      message: 'Strava activities imported successfully',
      ...result,
    }
  }

  async getTasks(userId: string, inscriptionId: number) {
    const cacheKey = `user:${userId}:inscription:${inscriptionId}:tasks`

    const cachedTasks = await this.cache.get<unknown[]>(cacheKey)
    if (cachedTasks) {
      return cachedTasks
    }

    const tasks = await this.taskRepository.getTasks(userId, inscriptionId)

    await this.cache.set(cacheKey, tasks, CACHE_TTL_SECONDS)

    return tasks
  }

  async checkCompletion(userId: string, input: CheckCompletionInput) {
    const inscription = await this.taskRepository.findUserInscription(input.inscriptionId, userId)

    if (!inscription) {
      throw new NotFoundError('Inscription not found or does not belong to the user')
    }

    const currentTaskDistance = input.taskId
      ? await this.getCurrentTaskDistance(userId, input.inscriptionId, input.taskId)
      : 0

    return {
      willCompleteChallenge: willCompleteChallenge(
        Number(inscription.progress),
        currentTaskDistance,
        input.distance,
        Number(inscription.desafio.distance),
      ),
    }
  }

  async delete(userId: string, taskId: number) {
    const task = await this.taskRepository.findUserTask(taskId, userId)

    if (!task) {
      throw new NotFoundError('Task not found')
    }

    const inscriptionId = task.inscriptionId

    await this.taskRepository.transaction(async (taskRepository) => {
      await taskRepository.deleteTask(taskId)
      await this.recalculateInscriptionProgress(taskRepository, {
        challengeDistance: Number(task.inscription.desafio.distance),
        completedAt: task.inscription.completedAt,
        inscriptionId,
        userId,
      })
    })

    await Promise.allSettled([
      this.cache.del(`desafio:${task.inscription.desafio.id}`),
      this.cache.del(`desafio:${task.inscription.desafio.id}:ranking:15d`),
      this.cache.del(`user:${userId}:desafios`),
      this.cache.del(`user:${userId}:inscription:${inscriptionId}:tasks`),
      this.cache.del(`user:profile:${userId}`),
    ])

    return {
      message: 'Task deleted successfully',
    }
  }

  async update(userId: string, taskId: number, input: UpdateTaskInput) {
    const task = await this.taskRepository.findUserTask(taskId, userId)

    if (!task) {
      throw new NotFoundError('Task not found')
    }

    const result = await this.taskRepository.transaction(async (taskRepository) => {
      const updatedTask = await taskRepository.updateTask(taskId, input)
      await this.recalculateInscriptionProgress(taskRepository, {
        challengeDistance: Number(task.inscription.desafio.distance),
        completedAt: task.inscription.completedAt,
        inscriptionId: task.inscriptionId,
        userId,
      })

      return {
        message: 'Task updated successfully',
        task: updatedTask,
        progressUpdated: true,
      }
    })

    await Promise.allSettled([
      this.cache.del(`desafio:${task.inscription.desafio.id}`),
      this.cache.del(`desafio:${task.inscription.desafio.id}:ranking:15d`),
      this.cache.del(`user:${userId}:desafios`),
      this.cache.del(`user:${userId}:inscription:${task.inscriptionId}:tasks`),
      this.cache.del(`user:profile:${userId}`),
    ])

    return result
  }

  private async getCurrentTaskDistance(userId: string, inscriptionId: number, taskId: number) {
    const task = await this.taskRepository.findCurrentTaskDistance(userId, inscriptionId, taskId)

    if (!task) {
      throw new NotFoundError('Task not found or does not belong to the user')
    }

    return Number(task.distanceKm)
  }

  private async recalculateInscriptionProgress(
    taskRepository: TaskRepository,
    input: RecalculateInscriptionProgressInput,
  ) {
    const totalDistance = await taskRepository.sumDistanceByInscription(input.userId, input.inscriptionId)
    const progress = calculateChallengeProgress(totalDistance, input.challengeDistance)

    await taskRepository.updateInscriptionProgress(input.inscriptionId, {
      progress: progress.progress,
      completed: progress.completed,
      completedAt: progress.completed ? input.completedAt ?? new Date() : null,
    })

    return progress
  }
}
