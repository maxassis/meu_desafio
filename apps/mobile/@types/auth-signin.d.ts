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
