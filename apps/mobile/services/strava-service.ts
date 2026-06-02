import type {
  StravaActivitiesResponse,
  StravaStatusResponse,
} from './api-types'
import { getEdenErrorMessage } from './api-client'
import { edenClient } from './eden-client'

export async function fetchStravaStatus(): Promise<StravaStatusResponse> {
  const { data, error } = await edenClient.integrations.strava.status.get()

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Erro ao verificar conexão com Strava'))
  }

  return data as StravaStatusResponse
}

export async function disconnectStrava() {
  const { data, error } = await edenClient.integrations.strava.delete()

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Erro ao desconectar Strava'))
  }

  return data
}

export async function fetchStravaActivities(inscriptionId: number): Promise<StravaActivitiesResponse> {
  const { data, error } = await edenClient.integrations.strava.activities.get({
    query: { inscriptionId },
  })

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Erro ao buscar atividades do Strava'))
  }

  return data as unknown as StravaActivitiesResponse
}
