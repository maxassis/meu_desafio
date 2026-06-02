export interface Coordinate {
  latitude: number
  longitude: number
}

export interface RouteResponse {
  id: string
  name: string
  location: string
  distance: string
  photo: string
  inscriptions: Inscription[]
}

export interface Inscription {
  user: User
  progress: string
  totalTasks: number
  totalCalories: number
  totalDistanceKm: number
  lastTaskDate: string
}

export interface User {
  id: string
  name: string
  avatar?: string
}

export interface DesafioGetDesafioParams {
  desafioId: string | number
}

export type DesafioGetDesafioResponse = RouteResponse
