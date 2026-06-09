export function calculateChallengeProgress(totalDistance: number, challengeDistance: number) {
  const completed = totalDistance >= challengeDistance
  const progress = completed ? challengeDistance : totalDistance

  return {
    completed,
    progress,
  }
}

export function willCompleteChallenge(
  currentProgress: number,
  currentTaskDistance: number,
  distanceCovered: number,
  challengeDistance: number,
) {
  return currentProgress - currentTaskDistance + distanceCovered >= challengeDistance
}
