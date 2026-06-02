import type {
  UsersEditUserdataRequest,
  UsersEditUserdataResponse,
} from '../@types/users-edit-userdata'
import type { RankData } from '../@types/users-get-ranking'
import type { UserData } from '../@types/users-get-user-data'
import type { UserProfile } from '../@types/users-get-user-profile'
import { apiClient, getErrorMessage } from './api-client'

export async function fetchUserData(): Promise<UserData> {
  try {
    const { data } = await apiClient.get<UserData>('/users/get-user-data')
    return data
  }
  catch (error) {
    throw new Error(getErrorMessage(error, 'Network response was not ok'))
  }
}

// Pega os dados do rank
export async function fetchRankData(desafioId: string | number): Promise<RankData[]> {
  try {
    const { data } = await apiClient.get<RankData[]>(
      `/users/get-ranking/${desafioId}`,
    )
    return data
  }
  catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to fetch ranking data'))
  }
}

export async function getProfile(id: string) {
  try {
    const { data } = await apiClient.get<UserProfile>(
      `/users/get-user-profile/${id}`,
    )
    return data
  }
  catch (error) {
    throw new Error(getErrorMessage(error, 'Network response was not ok'))
  }
}

export async function editUserData(payload: UsersEditUserdataRequest): Promise<UsersEditUserdataResponse> {
  try {
    const { data } = await apiClient.patch<UsersEditUserdataResponse>(
      '/users/edit-user-data',
      payload,
    )

    return data
  }
  catch (error: any) {
    console.error('[edit-user-data] erro na request', {
      message: error?.message,
      status: error?.response?.status,
      response: error?.response?.data,
    })

    throw new Error(getErrorMessage(error, 'Erro ao salvar alterações'))
  }
}
