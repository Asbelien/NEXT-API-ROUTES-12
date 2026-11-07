'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Drawer from '@/components/Drawer'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Toast, useToast } from '@/components/Toast'
import { genreColor } from '@/lib/genres'

type AuthorOption = {
  id: string
  name: string
}

type Book = {
  id: string
  title: string
  description: string | null
  isbn: string | null
  publishedYear: number | null
  genre: string | null
  pages: number | null
  authorId: string
  author: { id: string; name: string; email: string }
}

type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

type Result = {
  key: string
  data: Book[]
  pagination: Pagination
}

type BookForm = {
  title: string
  description: string
  isbn: string
  publishedYear: string
  genre: string
  pages: string
  authorId: string
}

const LIMIT = 6

const emptyForm: BookForm = {
  title: '',
  description: '',
  isbn: '',
  publishedYear: '',
  genre: '',
  pages: '',
  authorId: '',
}

export default function BooksPage() {
  const [result, setResult] = useState<Result | null>(null)
  const [failedKey, setFailedKey] = useState('')
  const [refresh, setRefresh] = useState(0)

  const [authors, setAuthors] = useState<AuthorOption[]>([])
  const [genres, setGenres] = useState<string[]>([])

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [sortBy, setSortBy] = useState('createdAt')
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(1)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Book | null>(null)
  const [form, setForm] = useState<BookForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [toDelete, setToDelete] = useState<Book | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { toast, show } = useToast()

  const query = new URLSearchParams({
    page: String(page),
    limit: String(LIMIT),
    sortBy,
    order,
    ...(search ? { search } : {}),
    ...(genre ? { genre } : {}),
    ...(authorName ? { authorName } : {}),
  }).toString()

  const requestKey = `${query}|${refresh}`
  const failed = failedKey === requestKey
  const loading = result?.key !== requestKey && !failed
  const books = result?.data ?? []
  const pagination = result?.pagination ?? null
  const total = pagination?.total ?? 0

  const hasFilters =
    search !== '' ||
    genre !== '' ||
    authorName !== '' ||
    sortBy !== 'createdAt' ||
    order !== 'desc'

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let active = true

    Promise.all([fetch('/api/authors'), fetch('/api/books')])
      .then(async ([authorsRes, booksRes]) => {
        if (!authorsRes.ok || !booksRes.ok) return
        const authorsData: AuthorOption[] = await authorsRes.json()
        const booksData: Book[] = await booksRes.json()
        if (!active) return

        setAuthors(authorsData.map((a) => ({ id: a.id, name: a.name })))
        setGenres(
          [
            ...new Set(
              booksData.map((b) => b.genre).filter((g): g is string => !!g)
            ),
          ].sort()
        )
      })
      .catch(() => undefined)

    return () => {
      active = false
    }
  }, [refresh])

  useEffect(() => {
    const controller = new AbortController()

    fetch(`/api/books/search?${query}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((json) => {
        setResult({
          key: requestKey,
          data: json.data,
          pagination: json.pagination,
        })
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setFailedKey(requestKey)
      })

    return () => controller.abort()
  }, [query, requestKey])

  const closeDrawer = () => setDrawerOpen(false)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setDrawerOpen(true)
  }

  const openEdit = (book: Book) => {
    setEditing(book)
    setForm({
      title: book.title,
      description: book.description ?? '',
      isbn: book.isbn ?? '',
      publishedYear: book.publishedYear ? String(book.publishedYear) : '',
      genre: book.genre ?? '',
      pages: book.pages ? String(book.pages) : '',
      authorId: book.authorId,
    })
    setFormError('')
    setDrawerOpen(true)
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')

    try {
      const res = await fetch(
        editing ? `/api/books/${editing.id}` : '/api/books',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: form.title,
            description: form.description || null,
            isbn: form.isbn || null,
            publishedYear: form.publishedYear || null,
            genre: form.genre || null,
            pages: form.pages || null,
            authorId: form.authorId,
          }),
        }
      )
      const data = await res.json()

      if (!res.ok) {
        setFormError(data.error || 'No se pudo guardar el libro.')
        return
      }

      setDrawerOpen(false)
      show(editing ? 'Libro actualizado' : 'Libro creado')
      setRefresh((r) => r + 1)
    } catch {
      setFormError('No se pudo guardar el libro. Inténtalo otra vez.')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/books/${toDelete.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      if (books.length === 1 && page > 1) setPage(page - 1)
      setToDelete(null)
      show('Libro eliminado')
      setRefresh((r) => r + 1)
    } catch {
      setToDelete(null)
      show('No se pudo eliminar el libro. Inténtalo otra vez.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setGenre('')
    setAuthorName('')
    setSortBy('createdAt')
    setOrder('desc')
    setPage(1)
  }

  return (
    <main className="mx-auto max-w-6xl px-5 pb-20 pt-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">Libros</h1>
          <p className="mt-2 text-lg text-muted">
            Busca, filtra y administra todo el catálogo.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          Agregar libro
        </button>
      </header>

      <section className="panel mt-8 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="search">
              Buscar por título
            </label>
            <input
              id="search"
              className="field"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Escribe parte del título"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="genre-filter">
              Género
            </label>
            <select
              id="genre-filter"
              className="field"
              value={genre}
              onChange={(e) => {
                setGenre(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Todos</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="author-filter">
              Autor
            </label>
            <select
              id="author-filter"
              className="field"
              value={authorName}
              onChange={(e) => {
                setAuthorName(e.target.value)
                setPage(1)
              }}
            >
              <option value="">Todos</option>
              {authors.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="sort-by">
              Ordenar por
            </label>
            <select
              id="sort-by"
              className="field"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value)
                setPage(1)
              }}
            >
              <option value="createdAt">Fecha de creación</option>
              <option value="title">Título</option>
              <option value="publishedYear">Año de publicación</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="order">
              Orden
            </label>
            <select
              id="order"
              className="field"
              value={order}
              onChange={(e) => {
                setOrder(e.target.value)
                setPage(1)
              }}
            >
              <option value="desc">Descendente</option>
              <option value="asc">Ascendente</option>
            </select>
          </div>
          {hasFilters && (
            <div className="flex items-end">
              <button className="btn btn-ghost w-full" onClick={clearFilters}>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <p className="mb-4 font-semibold" aria-live="polite">
          {loading && !result
            ? 'Buscando libros...'
            : `${total} ${total === 1 ? 'libro encontrado' : 'libros encontrados'}${loading ? ', actualizando...' : ''}`}
        </p>

        {failed && (
          <div className="panel mb-4 flex flex-wrap items-center justify-between gap-3 border-danger/30 bg-danger-soft p-4 text-danger">
            <p>No se pudieron cargar los libros.</p>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setRefresh((r) => r + 1)}
            >
              Reintentar
            </button>
          </div>
        )}

        {loading && !result && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="skeleton h-44" />
            <div className="skeleton h-44" />
            <div className="skeleton h-44" />
            <div className="skeleton h-44" />
          </div>
        )}

        {!loading && !failed && books.length === 0 && (
          <div className="panel flex flex-col items-start gap-4 p-8">
            <p className="text-lg font-semibold">
              {hasFilters ? 'Ningún libro coincide' : 'Aún no hay libros'}
            </p>
            <p className="text-muted">
              {hasFilters
                ? 'Prueba con otras palabras o limpia los filtros.'
                : 'Agrega el primero y aparecerá aquí.'}
            </p>
            {hasFilters ? (
              <button className="btn btn-ghost" onClick={clearFilters}>
                Limpiar filtros
              </button>
            ) : (
              <button className="btn btn-primary" onClick={openCreate}>
                Agregar libro
              </button>
            )}
          </div>
        )}

        {books.length > 0 && (
          <div
            className={`grid gap-4 transition-opacity md:grid-cols-2 ${loading ? 'opacity-50' : ''}`}
          >
            {books.map((book) => (
              <article key={book.id} className="panel flex overflow-hidden">
                <div
                  className="w-3 shrink-0"
                  style={{ background: genreColor(book.genre) }}
                />
                <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-5">
                  <div>
                    <h3 className="text-xl font-bold leading-tight">
                      {book.title}
                    </h3>
                    <Link
                      href={`/authors/${book.author.id}`}
                      className="text-sm font-semibold text-brand hover:underline"
                    >
                      {book.author.name}
                    </Link>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted">
                      {book.genre && (
                        <span
                          className="chip"
                          style={{ background: genreColor(book.genre) }}
                        >
                          {book.genre}
                        </span>
                      )}
                      {book.publishedYear && (
                        <span>Publicado en {book.publishedYear}</span>
                      )}
                      {book.pages && <span>{book.pages} páginas</span>}
                    </div>
                    {book.description && (
                      <p className="mt-3 line-clamp-2 text-sm">
                        {book.description}
                      </p>
                    )}
                    {book.isbn && (
                      <p className="mt-2 text-xs text-muted">
                        ISBN {book.isbn}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => openEdit(book)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setToDelete(book)}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <nav
            aria-label="Paginación"
            className="mt-8 flex items-center justify-center gap-4"
          >
            <button
              className="btn btn-ghost"
              onClick={() => setPage(page - 1)}
              disabled={!pagination.hasPrev}
            >
              Anterior
            </button>
            <span className="text-sm font-semibold text-muted">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <button
              className="btn btn-ghost"
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasNext}
            >
              Siguiente
            </button>
          </nav>
        )}
      </section>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? 'Editar libro' : 'Nuevo libro'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}
          <div>
            <label className="field-label" htmlFor="title">
              Título
            </label>
            <input
              id="title"
              name="title"
              className="field"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="authorId">
              Autor
            </label>
            <select
              id="authorId"
              name="authorId"
              className="field"
              value={form.authorId}
              onChange={handleChange}
              required
            >
              <option value="">Elige un autor</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="genre">
                Género
              </label>
              <input
                id="genre"
                name="genre"
                list="genre-options"
                className="field"
                value={form.genre}
                onChange={handleChange}
              />
              <datalist id="genre-options">
                {genres.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="field-label" htmlFor="isbn">
                ISBN
              </label>
              <input
                id="isbn"
                name="isbn"
                className="field"
                value={form.isbn}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="publishedYear">
                Año de publicación
              </label>
              <input
                id="publishedYear"
                name="publishedYear"
                type="number"
                className="field"
                value={form.publishedYear}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="pages">
                Páginas
              </label>
              <input
                id="pages"
                name="pages"
                type="number"
                min="1"
                className="field"
                value={form.pages}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="description">
              Descripción
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="field"
              value={form.description}
              onChange={handleChange}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={saving}
          >
            {saving
              ? 'Guardando...'
              : editing
                ? 'Guardar cambios'
                : 'Crear libro'}
          </button>
        </form>
      </Drawer>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar libro"
        message={
          toDelete
            ? `Se eliminará "${toDelete.title}". Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar libro"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      <Toast toast={toast} />
    </main>
  )
}
