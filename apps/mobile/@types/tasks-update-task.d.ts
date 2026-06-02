export interface TasksUpdateTaskParams {
  id: number | string
}

export interface TasksUpdateTaskRequest {
  name: string
  distanceKm: number
  environment: string
  date: string
  duration: number
  local?: string | null
}

export interface TasksUpdateTaskResponse {
  message?: string
  task?: Record<string, unknown>
}
