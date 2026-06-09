import type { StravaService } from './strava.service'
import { Elysia } from 'elysia'

import { getRequiredSession } from '../auth/auth.middleware'
import { ListStravaActivitiesQuerySchema } from './schema'

export function makeStravaRoutes(stravaService: StravaService) {
  return new Elysia({ prefix: '/integrations/strava' })
    .decorate('stravaService', stravaService)
    .get('/activities', async ({ query, request, stravaService }) => {
      const session = await getRequiredSession(request)

      return stravaService.listActivities(query.inscriptionId, session.user.id)
    }, {
      query: ListStravaActivitiesQuerySchema,
      detail: {
        tags: ['Integrations'],
        summary: 'List Strava activities for authenticated user',
      },
    })
    .get('/test-token', async ({ request, stravaService }) => {
      const session = await getRequiredSession(request)

      return stravaService.testToken(session.user.id)
    })
    .get('/status', async ({ request, stravaService }) => {
      const session = await getRequiredSession(request)

      return stravaService.getStatus(session.user.id)
    }, {
      detail: {
        tags: ['Integrations'],
        summary: 'Check Strava connection status',
      },
    })
    .delete('/', async ({ request, stravaService }) => {
      const session = await getRequiredSession(request)

      return stravaService.disconnect(session.user.id)
    }, {
      detail: {
        tags: ['Integrations'],
        summary: 'Disconnect Strava account for authenticated user',
      },
    })
}
