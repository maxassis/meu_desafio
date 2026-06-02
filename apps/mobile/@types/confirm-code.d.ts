export interface ConfirmCodeRequest {
  code: string
  email: string
}

export interface ConfirmCodeResponse {
  message: string
}
