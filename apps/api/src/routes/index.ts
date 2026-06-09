import { Elysia } from 'elysia'

import { makeAuthModule } from '../modules/auth/auth.factory'
import { makeDesafioModule } from '../modules/desafio/desafio.factory'
import { makeStravaModule } from '../modules/integrations/strava.factory'
import { makeTaskModule } from '../modules/task/task.factory'
import { makeUsersModule } from '../modules/users/users.factory'

export const routes = new Elysia()
  .use(makeAuthModule())
  .use(makeDesafioModule())
  .use(makeStravaModule())
  .use(makeUsersModule())
  .use(makeTaskModule())
