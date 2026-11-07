const KNOWN: Record<string, string> = {
  novela: 'var(--color-novela)',
  cuento: 'var(--color-cuento)',
  periodismo: 'var(--color-periodismo)',
}

const EXTRA = ['#3f8f5f', '#c4572e', '#7b4fa3', '#2f7fb5', '#8a6d3b']

export function genreColor(genre: string | null | undefined): string {
  if (!genre) return 'var(--color-otro)'

  const key = genre.trim().toLowerCase()
  if (KNOWN[key]) return KNOWN[key]

  let hash = 0
  for (const ch of key) {
    hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  }
  return EXTRA[hash % EXTRA.length]
}
