export interface TasksCheckCompletionRequest {
  inscriptionId: number
  distance: number
}

export interface TasksCheckCompletionResponse {
  willCompleteChallenge: boolean
}
