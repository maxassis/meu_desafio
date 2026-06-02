export interface RankData {
  position: number
  userId: string
  userName: string
  userAvatar: string
  totalDistance: number
  totalDurationSeconds: number
  avgSpeed: number
}

export interface UsersGetRankingParams {
  desafioId: string | number
}

export type UsersGetRankingResponse = RankData[]
