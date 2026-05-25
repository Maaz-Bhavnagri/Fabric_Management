function normalize(input: unknown) {
  return String(input ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const v0 = new Array(b.length + 1).fill(0)
  const v1 = new Array(b.length + 1).fill(0)
  for (let i = 0; i <= b.length; i++) v0[i] = i

  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1
      v1[j + 1] = Math.min(
        v1[j] + 1,
        v0[j + 1] + 1,
        v0[j] + cost
      )
    }
    for (let j = 0; j <= b.length; j++) v0[j] = v1[j]
  }
  return v1[b.length]
}

function flattenToText(value: unknown): string {
  const seen = new Set<unknown>()
  const parts: string[] = []

  const walk = (v: unknown) => {
    if (v === null || v === undefined) return
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      parts.push(String(v))
      return
    }
    if (v instanceof Date) {
      parts.push(v.toISOString())
      return
    }
    if (typeof v !== 'object') return
    if (seen.has(v)) return
    seen.add(v)

    if (Array.isArray(v)) {
      for (const item of v) walk(item)
      return
    }

    for (const val of Object.values(v as Record<string, unknown>)) walk(val)
  }

  walk(value)
  return normalize(parts.join(' '))
}

export function fuzzyScore(query: string, candidate: string) {
  const q = normalize(query)
  const c = normalize(candidate)
  if (!q) return 0
  if (!c) return 1

  if (c.includes(q)) return 0

  const qWords = q.split(' ')
  const cWords = c.split(' ')
  let best = 1

  for (const qw of qWords) {
    let bestWord = 1
    for (const cw of cWords) {
      const dist = levenshtein(qw, cw)
      const denom = Math.max(qw.length, cw.length) || 1
      const score = dist / denom
      if (score < bestWord) bestWord = score
      if (bestWord === 0) break
    }
    // average-ish: keep the worst word match as overall score
    if (bestWord > best) best = bestWord
  }

  return best
}

export function filterRank<T>(items: T[], query: string, threshold = 0.6) {
  const q = normalize(query)
  if (!q) return items

  const scored = items
    .map((item) => {
      const text = flattenToText(item)
      return { item, score: fuzzyScore(q, text) }
    })
    .filter((x) => x.score <= threshold)
    .sort((a, b) => a.score - b.score)

  return scored.map((x) => x.item)
}

