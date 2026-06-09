import { Elysia } from 'elysia'

import { authPlugin } from '../modules/auth/auth.plugin'
import { makeDesafioModule } from '../modules/desafio/desafio.factory'
import { stravaRoutes } from '../modules/integrations/strava.routes'
import { makeTaskModule } from '../modules/task/task.factory'
import { makeUsersModule } from '../modules/users/users.factory'

export const routes = new Elysia()
  .use(authPlugin)
  .use(makeDesafioModule())
  .use(stravaRoutes)
  .use(makeUsersModule())
  .use(makeTaskModule())
