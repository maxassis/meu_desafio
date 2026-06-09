import { cacheService } from '../../lib/cache/cache'
import { prisma } from '../../shared/db/prisma'
import { TaskRepository } from './repositories/task.repository'
import { makeTaskRoutes } from './task.routes'
import { TaskService } from './task.service'

export function makeTaskModule() {
  const taskRepository = new TaskRepository(prisma)
  const taskService = new TaskService(taskRepository, cacheService)

  return makeTaskRoutes(taskService)
}
