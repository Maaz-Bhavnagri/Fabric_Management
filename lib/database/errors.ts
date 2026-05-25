import type { PostgrestError } from '@supabase/supabase-js'

export const PG_UNIQUE_VIOLATION = '23505'
export const PG_FOREIGN_KEY_VIOLATION = '23503'

export function getPostgrestError(error: unknown): PostgrestError | null {
  if (!error || typeof error !== 'object') return null
  if (!('code' in error) || !('message' in error)) return null
  const e = error as PostgrestError
  if (typeof e.code === 'string' && typeof e.message === 'string') return e
  return null
}

export function isUniqueViolation(error: unknown): boolean {
  return getPostgrestError(error)?.code === PG_UNIQUE_VIOLATION
}

export function isForeignKeyViolation(error: unknown): boolean {
  return getPostgrestError(error)?.code === PG_FOREIGN_KEY_VIOLATION
}

export function isMissingRow(error: unknown): boolean {
  const e = getPostgrestError(error)
  if (!e) return false
  return e.code === 'PGRST116' || e.message?.toLowerCase().includes('no rows')
}

/**
 * Throws a normalized Error with Postgres code in message prefix for mappers that check string codes.
 */
export function assertNoError<T>(result: { data: T; error: PostgrestError | null }): asserts result is {
  data: T
  error: null
} {
  if (result.error) {
    const err = new Error(result.error.message)
    ;(err as Error & { code?: string }).code = result.error.code
    throw err
  }
}

/** PostgREST: table not exposed or does not exist (schema cache). */
export function isPostgrestTableMissing(error: unknown, tableName: string): boolean {
  const e = getPostgrestError(error)
  if (!e || e.code !== 'PGRST205') return false
  return e.message?.includes(tableName) ?? false
}

export const STITCH_TYPES_SETUP_HINT =
  'Run supabase/migrations/20260512140000_create_stitch_types.sql in the Supabase SQL Editor, then reload the API schema if needed (Dashboard → Settings → API).'
