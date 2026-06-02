export interface PaymentsPaymentIntentRequest {
  amount: number
  currency: string
  userId?: string
  desafioId: string
}

export interface PaymentsPaymentIntentResponse {
  clientSecret: string
}
