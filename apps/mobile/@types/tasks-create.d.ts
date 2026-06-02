export interface TasksCreateRequest {
  name: string
  distance: number
  environment: string
  calories: number
  inscriptionId: number
  date: string | null
  duration: number
  gpsTask?: boolean
  local?: string | null
}

export interface TasksCreateTask {
  id?: number
  name: string
  environment: string
  date: string | null
  duration: number
  calories?: number | null
  local?: string | null
  distanceKm?: string | number
  distance?: number
  inscriptionId: number
  usersId?: string
  gpsTask?: boolean
}

export interface TasksCreateResponse {
  message?: string
  task?: TasksCreateTask
  challengeCompleted?: boolean
}
