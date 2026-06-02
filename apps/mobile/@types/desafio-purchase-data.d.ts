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
