export interface UsersEditUserdataRequest {
  full_name?: string | null
  bio?: string | null
  gender?: 'homem' | 'mulher' | 'nao_binario' | 'prefiro_nao_responder' | null
  sport?: 'corrida' | 'bicicleta' | null
  birthDate?: string | null
}

export type UsersEditUserdataResponse = Record<string, unknown>
