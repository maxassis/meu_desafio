import type { TaskService } from './task.service'

import { Elysia } from 'elysia'
import { getRequiredSession } from '../auth/auth.middleware'
import {
  CheckCompletionSchema,
  CreateTaskSchema,
  DeleteTaskParamsSchema,
  GetTasksParamsSchema,
  ImportStravaTasksSchema,
  UpdateTaskSchema,
} from './schema'

export function makeTaskRoutes(taskService: TaskService) {
  return new Elysia({ prefix: '/tasks' })
    .decorate('taskService', taskService)
    .post(
      '/create',
      async ({ body, request, taskService }) => {
        const session = await getRequiredSession(request)

        return await taskService.create(body, session.user.id)
      },
      {
        body: CreateTaskSchema,
        detail: {
          tags: ['Tasks'],
          summary: 'Create a task for a user inscription',
        },
      },
    )
    .post(
      '/import-strava',
      async ({ body, request, taskService }) => {
        const session = await getRequiredSession(request)

        return await taskService.importStravaTasks(body, session.user.id)
      },
      {
        body: ImportStravaTasksSchema,
        detail: {
          tags: ['Tasks'],
          summary: 'Import selected Strava activities as tasks',
        },
      },
    )
    .get(
      '/get-tasks/:inscriptionId',
      async ({ params, request, taskService }) => {
        const session = await getRequiredSession(request)

        return taskService.getTasks(session.user.id, params.inscriptionId)
      },
      {
        params: GetTasksParamsSchema,
        detail: {
          tags: ['Tasks'],
          summary: 'Get user tasks by inscription',
        },
      },
    )
    .post(
      '/check-completion',
      async ({ body, request, taskService }) => {
        const session = await getRequiredSession(request)

        return await taskService.checkCompletion(session.user.id, body)
      },
      {
        body: CheckCompletionSchema,
        detail: {
          tags: ['Tasks'],
          summary: 'Check if a task distance completes the challenge',
        },
      },
    )
    .delete(
      '/delete-task/:taskId',
      async ({ params, request, taskService }) => {
        const session = await getRequiredSession(request)

        return taskService.delete(session.user.id, params.taskId)
      },
      {
        params: DeleteTaskParamsSchema,
        detail: {
          tags: ['Tasks'],
          summary: 'Delete a user task',
        },
      },
    )
    .patch(
      '/update-task/:taskId',
      async ({ body, params, request, taskService }) => {
        const session = await getRequiredSession(request)

        return taskService.update(session.user.id, params.taskId, body)
      },
      {
        body: UpdateTaskSchema,
        params: DeleteTaskParamsSchema,
        detail: {
          tags: ['Tasks'],
          summary: 'Update a user task',
        },
      },
    )
}
