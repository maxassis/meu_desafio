import type { AllDesafios } from '../@types/desafio-get-all-desafio'
import type { RouteResponse } from '../@types/desafio-get-desafio'
import type { BuyData } from '../@types/desafio-purchase-data'
import { getEdenErrorMessage } from './api-client'
import { edenClient } from './eden-client'

// pega todos os desafios
export async function fetchAllDesafios(): Promise<AllDesafios[]> {
  const { data, error } = await edenClient.desafio['get-all-desafio'].get()

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Network response was not ok'))
  }

  return data as AllDesafios[]
}

// pega os dados da rota
export async function fetchRouteData(desafioId: string | number): Promise<RouteResponse> {
  const { data, error } = await edenClient.desafio({ id: String(desafioId) }).get()

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Failed to fetch route data'))
  }

  if (typeof data.location !== 'string') {
    throw new TypeError('Location is not a valid encoded polyline string')
  }

  return data as unknown as RouteResponse
}

export async function fetchPurchaseData(desafioId: string | number): Promise<BuyData> {
  const { data, error } = await edenClient.desafio['purchase-data']({ id: String(desafioId) }).get()

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Network response was not ok'))
  }

  return data as BuyData
}
