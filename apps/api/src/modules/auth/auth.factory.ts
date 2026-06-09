import { makeAuthPlugin } from './auth.plugin'

export function makeAuthModule() {
  return makeAuthPlugin()
}
