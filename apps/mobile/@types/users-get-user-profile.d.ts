export interface UserProfile {
  name: string
  avatarUrl: string
  fullName: string | null
  bio: string | null
  activeInscriptions: number
  completedChallengesCount: number
  completedChallenges: CompletedChallenge[]
  totalDistance: number
  recentTasks: RecentTask[]
  activeChallenges: ActiveChallenge[]
}

export interface CompletedChallenge {
  id: string
  name: string
  totalDistance: number
  completedAt: string
  photo: string
}

export interface RecentTask {
  id: number
  name: string
  environment: string
  date: Date
  duration: string
  calories: number
  local: string
  distanceKm: string
  inscriptionId: number
  usersId: string
  createdAt: string
  updatedAt: string
  gpsTask: boolean
}

export interface ActiveChallenge {
  id: string
  name: string
  totalDistance: number
  distanceCovered: number
  completionPercentage: number
  photo: string
  createdAt: string
}

export interface UsersGetUserProfileParams {
  id: string
}

export type UsersGetUserProfileResponse = UserProfile
