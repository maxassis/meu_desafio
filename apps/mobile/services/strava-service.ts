import type {
  StravaActivitiesResponse,
  StravaStatusResponse,
} from '@/@types/strava-activities'
import { apiClient, getErrorMessage } from './api-client'

export async function fetchStravaStatus(): Promise<StravaStatusResponse> {
  try {
    const { data } = await apiClient.get<StravaStatusResponse>('/integrations/strava/status')
    return data
  }
  catch (error) {
    throw new Error(getErrorMessage(error, 'Erro ao verificar conexão com Strava'))
  }
}

export async function disconnectStrava() {
  try {
    const { data } = await apiClient.delete('/integrations/strava')
    return data
  }
  catch (error) {
    throw new Error(getErrorMessage(error, 'Erro ao desconectar Strava'))
  }
}

export async function fetchStravaActivities(inscriptionId: number): Promise<StravaActivitiesResponse> {
  try {
    const { data } = await apiClient.get<StravaActivitiesResponse>(
      `/integrations/strava/activities?inscriptionId=${inscriptionId}`,
    )
    return data
  }
  catch (error) {
    throw new Error(getErrorMessage(error, 'Erro ao buscar atividades do Strava'))
  }
}
