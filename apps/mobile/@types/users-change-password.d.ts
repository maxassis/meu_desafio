export interface UsersChangePasswordRequest {
  email: string
  new_password: string
}

export type UsersChangePasswordResponse = Record<string, unknown>
