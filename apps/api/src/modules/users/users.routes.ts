import type { AvatarUploadFile, UsersService } from './users.service'
import { Elysia, t } from 'elysia'

import { BadRequestError } from '../../shared/errors'
import { getRequiredSession } from '../auth/auth.middleware'
import {
  EditUserDataSchema,
  GetRankingParamsSchema,
  GetUserProfileParamsSchema,
} from './schema'

function isAvatarUploadFile(value: unknown): value is AvatarUploadFile {
  return Boolean(
    value
    && typeof value === 'object'
    && 'type' in value
    && typeof value.type === 'string'
    && 'size' in value
    && typeof value.size === 'number'
    && 'arrayBuffer' in value
    && typeof value.arrayBuffer === 'function',
  )
}

export function makeUsersRoutes(usersService: UsersService) {
  return new Elysia({ prefix: '/users' })
    .decorate('usersService', usersService)
    .post(
      '/check-email',
      async ({ body, usersService }) => {
        const { email } = body as { email: string }
        return usersService.checkEmailExists(email)
      },
      {
        body: t.Object({
          email: t.String({ format: 'email' }),
        }),
        response: t.Object({
          exists: t.Boolean(),
        }),
        detail: {
          tags: ['Users'],
          summary: 'Check if email exists',
        },
      },
    )
    .get(
      '/get-user-data',
      async ({ request, usersService }) => {
        const session = await getRequiredSession(request)

        return usersService.getUserData(session.user.id)
      },
      {
        detail: {
          tags: ['Users'],
          summary: 'Get authenticated user data',
        },
      },
    )
    .get(
      '/get-user-profile/:id',
      async ({ params, request, usersService }) => {
        await getRequiredSession(request)

        return await usersService.getUserProfile(params.id)
      },
      {
        params: GetUserProfileParamsSchema,
        detail: {
          tags: ['Users'],
          summary: 'Get user profile by ID',
        },
      },
    )
    .get(
      '/get-ranking/:desafioId',
      async ({ params, request, usersService }) => {
        await getRequiredSession(request)

        return await usersService.getRanking(params.desafioId)
      },
      {
        params: GetRankingParamsSchema,
        detail: {
          tags: ['Users'],
          summary: 'Get challenge ranking by ID',
        },
      },
    )
    .patch(
      '/edit-user-data',
      async ({ body, request, usersService }) => {
        const session = await getRequiredSession(request)

        return usersService.editUserData(session.user.id, {
          avatarFilename: body.avatar_filename,
          bio: body.bio,
          gender: body.gender,
          sport: body.sport,
          birthDate: body.birthDate,
          name: body.full_name ?? undefined,
        })
      },
      {
        body: EditUserDataSchema,
        detail: {
          tags: ['Users'],
          summary: 'Update authenticated user data',
        },
      },
    )
    .post(
      '/upload-avatar',
      async ({ body, request, usersService }) => {
        const session = await getRequiredSession(request)
        const file = body instanceof FormData
          ? body.get('file')
          : body && typeof body === 'object' && 'file' in body
            ? body.file
            : undefined

        if (!isAvatarUploadFile(file)) {
          throw new BadRequestError('No file provided or invalid format')
        }

        return await usersService.uploadAvatar(session.user.id, file)
      },
      {
        detail: {
          tags: ['Users'],
          summary: 'Upload authenticated user avatar',
        },
      },
    )
    .delete(
      '/delete-avatar',
      async ({ request, usersService }) => {
        const session = await getRequiredSession(request)

        return await usersService.deleteAvatar(session.user.id)
      },
      {
        detail: {
          tags: ['Users'],
          summary: 'Delete authenticated user avatar',
        },
      },
    )
}
