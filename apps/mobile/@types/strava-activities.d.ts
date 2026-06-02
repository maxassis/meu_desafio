export interface StravaActivity {
  stravaActivityId: string
  name: string
  distance: number
  duration: number
  date: string
  environment: 'livre' | 'esteira'
  calories?: number | null
}

export type StravaActivitiesResponse = StravaActivity[]

export interface StravaStatusResponse {
  connected: boolean
  athleteId?: string
}
