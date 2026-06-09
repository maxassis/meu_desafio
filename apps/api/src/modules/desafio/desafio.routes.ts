import type { DesafioService } from './desafio.service'
import { Elysia } from 'elysia'

import { getRequiredSession } from '../auth/auth.middleware'
import { CreateDesafioMultipartSchema, GetDesafioParamsSchema } from './schema'

export function makeDesafioRoutes(desafioService: DesafioService) {
  return new Elysia({ prefix: '/desafio' })
    .decorate('desafioService', desafioService)
    .get(
      '/get-all-desafio',
      async ({ request, desafioService }) => {
        const session = await getRequiredSession(request)

        return desafioService.getAll(session.user.id)
      },
      {
        detail: {
          tags: ['Desafio'],
          summary: 'List user challenges',
        },
      },
    )
    .post(
      '/create',
      async ({ body, desafioService }) => {
        const files = Array.isArray(body.images)
          ? body.images
          : body.images
            ? [body.images]
            : []

        const result = await desafioService.create(
          {
            name: body.name,
            location: body.location,
            distance: body.distance,
            active: body.active,
            priceId: body.priceId,
            purchaseData: body.purchaseData,
          },
          files,
        )

        return result
      },
      {
        body: CreateDesafioMultipartSchema,
        detail: {
          tags: ['Desafio'],
          summary: 'Create challenge',
        },
      },
    )
    .post(
      '/register-user-desafio/:id',
      async ({ params, request, desafioService }) => {
        const session = await getRequiredSession(request)

        return await desafioService.registerUser(params.id, session.user.id)
      },
      {
        params: GetDesafioParamsSchema,
        detail: {
          tags: ['Desafio'],
          summary: 'Register authenticated user in a challenge',
        },
      },
    )
    .get(
      '/:id',
      async ({ params, request, desafioService }) => {
        await getRequiredSession(request)

        const resultado = await desafioService.getById(params.id)
        return resultado
      },
      {
        params: GetDesafioParamsSchema,
        detail: {
          tags: ['Desafio'],
          summary: 'Get challenge by ID',
        },
      },
    )
    .get(
      '/purchase-data/:id',
      async ({ params, request, desafioService }) => {
        await getRequiredSession(request)

        return await desafioService.getPurchaseData(params.id)
      },
      {
        params: GetDesafioParamsSchema,
        detail: {
          tags: ['Desafio'],
          summary: 'Get challenge purchase data',
        },
      },
    )
}
