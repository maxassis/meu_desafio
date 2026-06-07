import { prisma } from '../../../shared/db/prisma'
import { NotFoundError } from '../../../shared/errors'

export async function checkCompletion(
  userId: string,
  inscriptionId: number,
  distanceCovered: number,
  taskId?: number,
) {
  const inscription = await prisma.inscription.findFirst({
    where: {
      id: inscriptionId,
      userId,
    },
    include: {
      desafio: {
        select: {
          distance: true,
        },
      },
    },
  })

  if (!inscription) {
    throw new NotFoundError('Inscription not found or does not belong to the user')
  }

  const currentProgress = Number(inscription.progress)
  const currentTaskDistance = taskId
    ? await getCurrentTaskDistance(userId, inscriptionId, taskId)
    : 0
  const totalProgress = currentProgress - currentTaskDistance + distanceCovered
  const challengeDistance = Number(inscription.desafio.distance)

  return {
    willCompleteChallenge: totalProgress >= challengeDistance,
  }
}

async function getCurrentTaskDistance(
  userId: string,
  inscriptionId: number,
  taskId: number,
) {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      userId,
      inscriptionId,
    },
    select: {
      distanceKm: true,
    },
  })

  if (!task) {
    throw new NotFoundError('Task not found or does not belong to the user')
  }

  return Number(task.distanceKm)
}
