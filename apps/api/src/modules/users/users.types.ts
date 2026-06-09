export interface EditUserDataInput {
  avatarFilename?: string | null
  bio?: string | null
  gender?: 'homem' | 'mulher' | 'nao_binario' | 'prefiro_nao_responder' | null
  sport?: 'corrida' | 'bicicleta' | null
  birthDate?: string | null
  name?: string
}
