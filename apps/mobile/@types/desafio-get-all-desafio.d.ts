export interface AllDesafios {
  id: string
  name: string
  description: string
  distance: string
  isRegistered: boolean
  completed: boolean
  completedAt: null | Date
  progressPercentage: number
  totalDistanceCompleted: number
  photo: string
  tasksCount: number
  totalDuration: number
  inscriptionId: number
}

export type DesafioGetAllDesafioRequest = void

export type DesafioGetAllDesafioResponse = AllDesafios[]
