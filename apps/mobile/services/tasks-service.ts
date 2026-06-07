import type { StravaActivity, TasksGetResponse } from './api-types'
import { getEdenErrorMessage } from './api-client'
import { edenClient } from './eden-client'

type TaskEnvironment = 'livre' | 'esteira'

interface CreateTaskPayload {
  name: string
  environment: TaskEnvironment
  date?: string | Date | null
  duration: number
  calories?: number
  local?: string | null
  distance: number
  inscriptionId: number
  gpsTask?: boolean
}

interface CheckTaskCompletionPayload {
  inscriptionId: number
  distance: number
}

interface UpdateTaskPayload {
  name?: string
  environment?: TaskEnvironment
  date?: string | Date | null
  duration?: number
  calories?: number | null
  local?: string | null
  distanceKm?: number
  gpsTask?: boolean | null
}

export async function fetchTasks(inscriptionId: number): Promise<TasksGetResponse> {
  const { data, error } = await edenClient.tasks['get-tasks']({ inscriptionId }).get()

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Failed to fetch tasks'))
  }

  return data as TasksGetResponse
}

export async function deleteTask(id: number) {
  const { data, error } = await edenClient.tasks['delete-task']({ taskId: id }).delete()

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Failed to delete task'))
  }

  return data
}

export async function createTask(payload: CreateTaskPayload) {
  const { data, error } = await edenClient.tasks.create.post(payload)

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Falha ao criar tarefa'))
  }

  return data
}

export async function checkTaskCompletion(payload: CheckTaskCompletionPayload) {
  const { data, error } = await edenClient.tasks['check-completion'].post(payload)

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Erro ao verificar conclusão do desafio'))
  }

  return data
}

export async function updateTask(id: number, payload: UpdateTaskPayload) {
  const { data, error } = await edenClient.tasks['update-task']({ taskId: id }).patch(payload)

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Falha ao atualizar tarefa'))
  }

  return data
}

export async function importStravaActivities(inscriptionId: number, activities: StravaActivity[]) {
  const payload = {
    inscriptionId,
    activities: activities.map(a => ({
      stravaActivityId: a.stravaActivityId,
      name: a.name,
      environment: a.environment,
      distance: a.distance,
      duration: a.duration,
      calories: a.calories,
      date: new Date(a.date),
    })),
  }

  const { data, error } = await edenClient.tasks['import-strava'].post(payload)

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Failed to import Strava activities'))
  }

  return data
}
