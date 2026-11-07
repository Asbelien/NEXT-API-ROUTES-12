import { genreColor } from '@/lib/genres'

export type ShelfBook = {
  id: string
  title: string
  genre: string | null
  pages: number | null
}

const SKELETON_HEIGHTS = [130, 170, 110, 190, 150, 120, 180, 140, 160, 115]

function spineHeight(pages: number | null) {
  if (!pages) return 120
  return Math.round(90 + (Math.min(pages, 700) / 700) * 110)
}

export default function Shelf({
  books,
  loading = false,
}: {
  books: ShelfBook[]
  loading?: boolean
}) {
  const genres = [
    ...new Set(books.map((b) => b.genre).filter((g): g is string => !!g)),
  ]

  return (
    <div>
      <div
        role="list"
        aria-label="Libros en la repisa"
        className="flex items-end gap-1.5 overflow-x-auto px-6 pt-16 sm:px-20"
      >
        {loading &&
          SKELETON_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className="skeleton w-9 shrink-0 rounded-b-none"
              style={{ height: h }}
            />
          ))}

        {!loading && books.length === 0 && (
          <p className="pb-6 text-muted">
            Todavía no hay libros. Agrega el primero y aparecerá aquí.
          </p>
        )}

        {!loading &&
          books.map((book, index) => (
            <div
              key={book.id}
              role="listitem"
              tabIndex={0}
              aria-label={`${book.title}${book.pages ? `, ${book.pages} páginas` : ''}`}
              className="spine-wrap group relative shrink-0 outline-none"
            >
              <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-48 -translate-x-1/2 rounded-md bg-ink px-2.5 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <p className="font-semibold">{book.title}</p>
                <p className="text-white/70">
                  {book.genre ?? 'Sin género'}
                  {book.pages ? `, ${book.pages} páginas` : ''}
                </p>
              </div>

              <div
                className="spine relative w-9 overflow-hidden rounded-t-md"
                style={
                  {
                    height: spineHeight(book.pages),
                    background: genreColor(book.genre),
                    '--i': index,
                  } as React.CSSProperties
                }
              >
                <span className="absolute inset-x-0 top-2.5 h-px bg-white/40" />
                <span className="absolute inset-x-0 top-4 h-px bg-white/25" />
                <span className="absolute inset-x-0 bottom-2.5 h-px bg-white/40" />
                <span className="absolute inset-x-0 bottom-6 top-8 flex items-center justify-center overflow-hidden px-1 text-[11px] font-semibold text-white [writing-mode:vertical-rl] rotate-180">
                  <span className="max-h-full truncate">{book.title}</span>
                </span>
              </div>
            </div>
          ))}
      </div>

      <div className="shelf-plank" />

      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-1 text-sm text-muted">
        <span>Color según el género, altura según las páginas.</span>
        {genres.map((g) => (
          <span key={g} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: genreColor(g) }}
            />
            {g}
          </span>
        ))}
      </div>
    </div>
  )
}

