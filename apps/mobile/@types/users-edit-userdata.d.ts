export interface UsersEditUserdataRequest {
  full_name?: string | null
  bio?: string | null
  gender?: string | null
  sport?: string | null
  birthDate?: string | null
}

export type UsersEditUserdataResponse = Record<string, unknown>
