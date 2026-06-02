import { createWithEqualityFn as create } from 'zustand/traditional'

interface Task {
  id: number
  name: string
  environment: string
  date: null | string | Date
  duration: number
  calories: number | null
  local: null | string
  distanceKm: string
  inscriptionId: number
  usersId: string
  gpsTask: boolean
}

// Você pode ajustar essa interface para que corresponda à estrutura real do seu objeto "desafio"
interface Desafio {
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

interface DesafioStore {
  taskData: Task | null
  desafioSelecionado: Desafio | null // Para passar o desafio para a tela de criação de task
  setTaskData: (taskData: Task) => void
  clearTaskData: () => void
  setDesafioSelecionado: (desafio: Desafio | null) => void
  clearDesafioSelecionado: () => void
}

const useDesafioStore = create<DesafioStore>(set => ({
  taskData: null,
  desafioSelecionado: null,
  setTaskData: taskData => set({ taskData }),
  setDesafioSelecionado: desafio => set({ desafioSelecionado: desafio }),
  clearDesafioSelecionado: () => set({ desafioSelecionado: null }),
  clearTaskData: () => set({ taskData: null }),
}))

export default useDesafioStore
