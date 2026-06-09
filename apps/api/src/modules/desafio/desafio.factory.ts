import { cacheService } from '../../lib/cache/cache'
import { r2Service } from '../../lib/storage/r2'
import { prisma } from '../../shared/db/prisma'
import { makeDesafioRoutes } from './desafio.routes'
import { DesafioService } from './desafio.service'
import { DesafioRepository } from './repositories/desafio.repository'

export function makeDesafioModule() {
  const desafioRepository = new DesafioRepository(prisma)
  const desafioService = new DesafioService(desafioRepository, cacheService, r2Service)

  return makeDesafioRoutes(desafioService)
}
