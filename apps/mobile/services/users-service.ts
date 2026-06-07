import type {
  RankData,
  UserData,
  UserProfile,
  UsersEditUserdataRequest,
  UsersEditUserdataResponse,
} from './api-types'
import { getEdenErrorMessage } from './api-client'
import { API_BASE_URL } from './api-config'
import { authClient } from './auth-client'
import { edenClient } from './eden-client'

export async function fetchUserData(): Promise<UserData> {
  const { data, error } = await edenClient.users['get-user-data'].get()

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Network response was not ok'))
  }

  return data as UserData
}

// Pega os dados do rank
export async function fetchRankData(desafioId: string | number): Promise<RankData[]> {
  const { data, error } = await edenClient.users['get-ranking']({ desafioId: String(desafioId) }).get()

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Failed to fetch ranking data'))
  }

  return data as RankData[]
}

export async function getProfile(id: string) {
  const { data, error } = await edenClient.users['get-user-profile']({ id }).get()

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Network response was not ok'))
  }

  return data as unknown as UserProfile
}

export async function editUserData(payload: UsersEditUserdataRequest): Promise<UsersEditUserdataResponse> {
  const { data, error } = await edenClient.users['edit-user-data'].patch(payload)

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Erro ao salvar alterações'))
  }

  return data as UsersEditUserdataResponse
}

export async function uploadAvatar(formData: FormData) {
  const cookie = authClient.getCookie()
  const response = await fetch(`${API_BASE_URL}/users/upload-avatar`, {
    method: 'POST',
    headers: cookie ? { Cookie: cookie } : undefined,
    body: formData,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data && typeof data === 'object' && 'message' in data
      ? String(data.message)
      : 'Erro ao fazer upload do avatar'

    throw new Error(message)
  }

  return data
}

export async function deleteAvatar() {
  const { data, error } = await edenClient.users['delete-avatar'].delete()

  if (error) {
    throw new Error(getEdenErrorMessage(error, 'Erro ao deletar avatar'))
  }

  return data
}
