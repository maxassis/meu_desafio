import { Elysia } from 'elysia'

import { authPlugin } from '../modules/auth/auth.plugin'
import { makeDesafioModule } from '../modules/desafio/desafio.factory'
import { makeStravaModule } from '../modules/integrations/strava.factory'
import { makeTaskModule } from '../modules/task/task.factory'
import { makeUsersModule } from '../modules/users/users.factory'

export const routes = new Elysia()
  .use(authPlugin)
  .use(makeDesafioModule())
  .use(makeStravaModule())
  .use(makeUsersModule())
  .use(makeTaskModule())
