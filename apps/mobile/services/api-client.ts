export function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.length > 0) {
      return message
    }
  }

  return fallback
}

export function getEdenErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'value' in error) {
    const value = (error as { value?: unknown }).value

    if (value && typeof value === 'object' && 'message' in value) {
      const message = (value as { message?: unknown }).message
      if (typeof message === 'string' && message.length > 0) {
        return message
      }
    }

    if (typeof value === 'string' && value.length > 0) {
      return value
    }
  }

  return fallback
}
