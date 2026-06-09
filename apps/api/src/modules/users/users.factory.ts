import { cacheService } from '../../lib/cache/cache'
import { r2Service } from '../../lib/storage/r2'
import { prisma } from '../../shared/db/prisma'
import { UsersRepository } from './repositories/users.repository'
import { makeUsersRoutes } from './users.routes'
import { UsersService } from './users.service'

export function makeUsersModule() {
  const usersRepository = new UsersRepository(prisma)
  const usersService = new UsersService(usersRepository, cacheService, r2Service)

  return makeUsersRoutes(usersService)
}
