export type DesafioData = Data[]

export interface Data {
  id: string
  userId: string
  desafioId: number
  progress: string
  completed: boolean
  desafio: Desafio
  isRegistered: boolean
}

export interface Desafio {
  id: number
  name: string
  description: string
  distance: number
  photo: string
}
