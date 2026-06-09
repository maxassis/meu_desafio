import { Elysia } from 'elysia'

import { auth } from '../../lib/auth'

export function makeAuthPlugin() {
  return new Elysia({ name: 'auth' }).mount(auth.handler)
}
