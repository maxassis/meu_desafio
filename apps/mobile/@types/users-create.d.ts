export interface UsersCreateRequest {
  name: string
  email: string
  password: string
}

export type UsersCreateResponse = Record<string, unknown>
