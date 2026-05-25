import { getPostgrestError } from '@/lib/database/errors'

export function toPublicErrorMessage(input: unknown): string {
  const message =
    typeof input === 'string'
      ? input
      : input instanceof Error
        ? input.message
        : 'Unknown error'

  if (isDatabaseUnavailableMessage(message)) {
    return 'Database is temporarily unavailable. Please try again in a moment.'
  }

  const pg = getPostgrestError(input)
  if (pg?.message?.includes('fetch failed') || pg?.message?.includes('Network')) {
    return 'Database is temporarily unavailable. Please try again in a moment.'
  }

  return message
}

export function isDatabaseUnavailableMessage(message: string) {
  return (
    message.includes("Can't reach database server") ||
    message.includes('ECONNREFUSED') ||
    message.includes('ETIMEDOUT') ||
    message.toLowerCase().includes('network error')
  )
}

export function isDatabaseUnavailable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '')
  if (isDatabaseUnavailableMessage(message)) return true
  const pg = getPostgrestError(error)
  return !!(pg?.message && isDatabaseUnavailableMessage(pg.message))
}
