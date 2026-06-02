import { cacheService } from '../../../lib/cache/cache'
import { r2Service } from '../../../lib/storage/r2'
import { prisma } from '../../../shared/db/prisma'
import { NotFoundError } from '../../../shared/errors'

export async function deleteAvatar(userId: string) {
  const bucketName = 'avatars'

  const userData = await prisma.userData.findUnique({
    where: {
      userId,
    },
  })

  if (!userData) {
    throw new NotFoundError('User not found')
  }

  if (!userData.avatarFilename) {
    return { success: true }
  }

  try {
    await r2Service.deleteFile(userData.avatarFilename, bucketName)
  }
  catch (error) {
    console.warn('Error deleting avatar from R2:', error)
  }

  await prisma.userData.update({
    where: {
      userId,
    },
    data: {
      avatarFilename: null,
    },
  })

  await Promise.all([
    cacheService.del(`user:${userId}:data`),
    cacheService.del(`user:profile:${userId}`),
  ])

  return { success: true }
}
