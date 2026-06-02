export interface TasksGetTask {
  id: number
  name: string
  environment: string
  date: string | Date
  duration: number
  calories: number | null
  local: string | null
  distanceKm: string
  inscriptionId: number
  usersId: string
  gpsTask: boolean
}

export type TasksGetResponse = TasksGetTask[]
