export interface AuthSigninRequest {
  email: string
  password: string
}

export interface AuthSigninUser {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: string
  updatedAt: string
}

export interface AuthSigninResponse {
  redirect: boolean
  token: string
  user: AuthSigninUser
}

export interface AuthTokenResponse {
  token: string
}

export interface AuthAccessTokenResponse {
  access_token: string
}

export interface UsersEditUserdataRequest {
  full_name?: string | null
  bio?: string | null
  gender?: 'homem' | 'mulher' | 'nao_binario' | 'prefiro_nao_responder' | null
  sport?: 'corrida' | 'bicicleta' | null
  birthDate?: string | null
}

export type UsersEditUserdataResponse = Record<string, unknown>

export interface UserData {
  id: string
  avatar_url: string | null
  avatar_filename: string | null
  full_name: string | null
  bio: string | null
  gender: string | null
  sport: string | null
  createdAt: Date
  usersId: string
  username: string
  birthDate: string | null
}

export type UsersGetUserDataRequest = void
export type UsersGetUserDataResponse = UserData

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

export interface StravaActivity {
  stravaActivityId: string
  name: string
  distance: number
  duration: number
  date: string
  environment: 'livre' | 'esteira'
  calories?: number | null
}

export type StravaActivitiesResponse = StravaActivity[]

export interface StravaStatusResponse {
  connected: boolean
  athleteId?: string
}

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

export interface BuyData {
  userId: string
  name: string
  price: string
  rules: string[]
  images: string[]
  benefits: string[]
  description: string
  howParticipate: string
  shortDescription: string
  distance: string
}

export interface DesafioPurchaseDataParams {
  desafioId: string | number
}

export type DesafioPurchaseDataResponse = BuyData
