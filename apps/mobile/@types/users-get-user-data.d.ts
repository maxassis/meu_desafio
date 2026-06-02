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
