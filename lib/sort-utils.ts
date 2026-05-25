export type SortDir = 'asc' | 'desc'

export function compare(a: unknown, b: unknown) {
  if (a === b) return 0
  if (a === null || a === undefined) return 1
  if (b === null || b === undefined) return -1

  // numbers
  if (typeof a === 'number' && typeof b === 'number') return a - b

  // dates (iso strings)
  const da = typeof a === 'string' ? Date.parse(a) : NaN
  const db = typeof b === 'string' ? Date.parse(b) : NaN
  if (!Number.isNaN(da) && !Number.isNaN(db)) return da - db

  return String(a).localeCompare(String(b))
}

export function sortByKey<T>(
  items: T[],
  key: keyof T,
  dir: SortDir = 'asc'
) {
  const mult = dir === 'asc' ? 1 : -1
  return [...items].sort((x, y) => mult * compare(x[key], y[key]))
}

