import { Elysia } from 'elysia'

import { authPlugin } from '../modules/auth/auth.plugin'
import { desafioRoutes } from '../modules/desafio/desafio.routes'
import { stravaRoutes } from '../modules/integrations/strava.routes'
import { makeTaskModule } from '../modules/task/task.factory'
import { usersRoutes } from '../modules/users/users.routes'

export const routes = new Elysia()
  .use(authPlugin)
  .use(desafioRoutes)
  .use(stravaRoutes)
  .use(usersRoutes)
  .use(makeTaskModule())
