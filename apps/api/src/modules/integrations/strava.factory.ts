import { prisma } from '../../shared/db/prisma'
import { StravaRepository } from './repositories/strava.repository'
import { makeStravaRoutes } from './strava.routes'
import { StravaService } from './strava.service'

export function makeStravaModule() {
  const stravaRepository = new StravaRepository(prisma)
  const stravaService = new StravaService(stravaRepository)

  return makeStravaRoutes(stravaService)
}
