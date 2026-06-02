import type { AllDesafios } from '../@types/desafio-get-all-desafio'
import type { RouteResponse } from '../@types/desafio-get-desafio'
import type { BuyData } from '../@types/desafio-purchase-data'
import { apiClient, getErrorMessage } from './api-client'

// pega todos os desafios
export async function fetchAllDesafios(): Promise<AllDesafios[]> {
  try {
    const { data } = await apiClient.get<AllDesafios[]>(
      '/desafio/get-all-desafio',
    )
    return data
  }
  catch (error) {
    throw new Error(getErrorMessage(error, 'Network response was not ok'))
  }
}

// pega os dados da rota
export async function fetchRouteData(desafioId: string | number): Promise<RouteResponse> {
  try {
    const { data } = await apiClient.get<RouteResponse>(
      `/desafio/${desafioId}`,
    )

    if (typeof data.location !== 'string') {
      throw new TypeError('Location is not a valid encoded polyline string')
    }

    return data
  }
  catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch route data'))
  }
}

export async function fetchPurchaseData(desafioId: string | number): Promise<BuyData> {
  try {
    const { data } = await apiClient.get<BuyData>(
      `/desafio/purchase-data/${desafioId}`,
    )
    return data
  }
  catch (error) {
    throw new Error(getErrorMessage(error, 'Network response was not ok'))
  }
}
