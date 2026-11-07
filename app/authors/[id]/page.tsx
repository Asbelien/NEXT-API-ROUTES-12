'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Shelf from '@/components/Shelf'
import Drawer from '@/components/Drawer'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Toast, useToast } from '@/components/Toast'
import { genreColor } from '@/lib/genres'

type Book = {
  id: string
  title: string
  description: string | null
  isbn: string | null
  publishedYear: number | null
  genre: string | null
  pages: number | null
}

type Author = {
  id: string
  name: string
  email: string
  bio: string | null
  nationality: string | null
  birthYear: number | null
  books: Book[]
  _count: { books: number }
}

type Stats = {
  totalBooks: number
  firstBook: { title: string; year: number | null } | null
  latestBook: { title: string; year: number | null } | null
  averagePages: number
  genres: string[]
  longestBook: { title: string; pages: number | null } | null
  shortestBook: { title: string; pages: number | null } | null
}

type AuthorForm = {
  name: string
  email: string
  nationality: string
  birthYear: string
  bio: string
}

type BookForm = {
  title: string
  description: string
  isbn: string
  publishedYear: string
  genre: string
  pages: string
}

const emptyBookForm: BookForm = {
  title: '',
  description: '',
  isbn: '',
  publishedYear: '',
  genre: '',
  pages: '',
}

export default function AuthorDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [author, setAuthor] = useState<Author | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState('')

  const [authorDrawer, setAuthorDrawer] = useState(false)
  const [authorForm, setAuthorForm] = useState<AuthorForm>({
    name: '',
    email: '',
    nationality: '',
    birthYear: '',
    bio: '',
  })
  const [authorError, setAuthorError] = useState('')

  const [bookDrawer, setBookDrawer] = useState(false)
  const [bookForm, setBookForm] = useState<BookForm>(emptyBookForm)
  const [bookError, setBookError] = useState('')

  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<Book | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { toast, show } = useToast()

  const load = useCallback(async () => {
    try {
      const [authorRes, statsRes] = await Promise.all([
        fetch(`/api/authors/${id}`),
        fetch(`/api/authors/${id}/stats`),
      ])

      if (authorRes.status === 404) {
        setNotFound(true)
        return
      }
      if (!authorRes.ok || !statsRes.ok) throw new Error()

      setAuthor(await authorRes.json())
      setStats(await statsRes.json())
      setLoadError('')
    } catch {
      setLoadError('No se pudo cargar la información del autor.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const closeAuthorDrawer = () => setAuthorDrawer(false)
  const closeBookDrawer = () => setBookDrawer(false)

  const openAuthorEdit = () => {
    if (!author) return
    setAuthorForm({
      name: author.name,
      email: author.email,
      nationality: author.nationality ?? '',
      birthYear: author.birthYear ? String(author.birthYear) : '',
      bio: author.bio ?? '',
    })
    setAuthorError('')
    setAuthorDrawer(true)
  }

  const openBookCreate = () => {
    setBookForm(emptyBookForm)
    setBookError('')
    setBookDrawer(true)
  }

  const handleAuthorChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setAuthorForm({ ...authorForm, [e.target.name]: e.target.value })
  }

  const handleBookChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setBookForm({ ...bookForm, [e.target.name]: e.target.value })
  }

  const saveAuthor = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setSaving(true)
    setAuthorError('')

    try {
      const res = await fetch(`/api/authors/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: authorForm.name,
          email: authorForm.email,
          nationality: authorForm.nationality || null,
          birthYear: authorForm.birthYear || null,
          bio: authorForm.bio || null,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setAuthorError(data.error || 'No se pudo actualizar el autor.')
        return
      }

      setAuthorDrawer(false)
      show('Autor actualizado')
      await load()
    } catch {
      setAuthorError('No se pudo actualizar el autor. Inténtalo otra vez.')
    } finally {
      setSaving(false)
    }
  }

  const saveBook = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setSaving(true)
    setBookError('')

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bookForm.title,
          description: bookForm.description || null,
          isbn: bookForm.isbn || null,
          publishedYear: bookForm.publishedYear || null,
          genre: bookForm.genre || null,
          pages: bookForm.pages || null,
          authorId: id,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setBookError(data.error || 'No se pudo crear el libro.')
        return
      }

      setBookDrawer(false)
      show('Libro creado')
      await load()
    } catch {
      setBookError('No se pudo crear el libro. Inténtalo otra vez.')
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
      setToDelete(null)
      show('Libro eliminado')
      await load()
    } catch {
      setToDelete(null)
      show('No se pudo eliminar el libro. Inténtalo otra vez.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl space-y-6 px-5 pb-20 pt-10">
        <div className="skeleton h-5 w-40" />
        <div className="skeleton h-16 w-2/3" />
        <div className="skeleton h-64" />
        <div className="skeleton h-40" />
      </main>
    )
  }

  if (notFound || !author) {
    return (
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-10">
        <div className="panel flex flex-col items-start gap-4 p-8">
          <p className="text-lg font-semibold">
            {notFound ? 'No encontramos a este autor' : loadError}
          </p>
          <p className="text-muted">
            {notFound
              ? 'Es posible que haya sido eliminado.'
              : 'Revisa tu conexión e inténtalo de nuevo.'}
          </p>
          <Link href="/" className="btn btn-primary">
            Volver a autores
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-5 pb-20 pt-8">
      <Link
        href="/"
        className="text-sm font-semibold text-brand hover:underline"
      >
        Volver a autores
      </Link>

      <header className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 max-w-2xl">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-6xl">
            {author.name}
          </h1>
          <p className="mt-3 text-lg text-muted">
            {[
              author.nationality,
              author.birthYear ? `nació en ${author.birthYear}` : null,
            ]
              .filter(Boolean)
              .join(', ') || 'Sin datos de origen'}
          </p>
          <p className="text-sm text-muted">{author.email}</p>
          {author.bio && <p className="mt-4 text-lg">{author.bio}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-ghost" onClick={openAuthorEdit}>
            Editar autor
          </button>
          <button className="btn btn-primary" onClick={openBookCreate}>
            Agregar libro
          </button>
        </div>
      </header>

      {loadError && (
        <p className="mt-6 rounded-lg bg-danger-soft px-4 py-3 text-danger">
          {loadError}
        </p>
      )}

      <section className="panel mt-10 px-4 pb-6 pt-2">
        <Shelf books={author.books} />
      </section>

      {stats && (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold">Estadísticas</h2>
          <dl className="panel grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-sm font-semibold text-muted">
                Libros publicados
              </dt>
              <dd className="text-2xl font-bold">{stats.totalBooks}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted">
                Promedio de páginas
              </dt>
              <dd className="text-2xl font-bold">{stats.averagePages}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted">Primer libro</dt>
              <dd className="font-semibold">
                {stats.firstBook
                  ? `${stats.firstBook.title} (${stats.firstBook.year})`
                  : 'Sin datos'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted">Último libro</dt>
              <dd className="font-semibold">
                {stats.latestBook
                  ? `${stats.latestBook.title} (${stats.latestBook.year})`
                  : 'Sin datos'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted">
                Libro más largo
              </dt>
              <dd className="font-semibold">
                {stats.longestBook
                  ? `${stats.longestBook.title} (${stats.longestBook.pages} páginas)`
                  : 'Sin datos'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-muted">
                Libro más corto
              </dt>
              <dd className="font-semibold">
                {stats.shortestBook
                  ? `${stats.shortestBook.title} (${stats.shortestBook.pages} páginas)`
                  : 'Sin datos'}
              </dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="mb-2 text-sm font-semibold text-muted">Géneros</dt>
              <dd className="flex flex-wrap gap-2">
                {stats.genres.length === 0 && (
                  <span className="text-muted">Sin géneros todavía</span>
                )}
                {stats.genres.map((g) => (
                  <span
                    key={g}
                    className="chip"
                    style={{ background: genreColor(g) }}
                  >
                    {g}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-4 text-2xl font-bold">
          Libros ({author.books.length})
        </h2>

        {author.books.length === 0 ? (
          <div className="panel flex flex-col items-start gap-4 p-8">
            <p className="text-lg font-semibold">Este autor no tiene libros</p>
            <p className="text-muted">
              Agrega el primero y aparecerá en la repisa.
            </p>
            <button className="btn btn-primary" onClick={openBookCreate}>
              Agregar libro
            </button>
          </div>
        ) : (
          <ul className="space-y-3">
            {author.books.map((book) => (
              <li key={book.id} className="panel flex overflow-hidden">
                <div
                  className="w-3 shrink-0"
                  style={{ background: genreColor(book.genre) }}
                />
                <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold">{book.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-muted">
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
                      {book.isbn && <span>ISBN {book.isbn}</span>}
                    </div>
                    {book.description && (
                      <p className="mt-2 text-sm">{book.description}</p>
                    )}
                  </div>
                  <button
                    className="btn btn-danger btn-sm self-start sm:self-center"
                    onClick={() => setToDelete(book)}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Drawer
        open={authorDrawer}
        onClose={closeAuthorDrawer}
        title="Editar autor"
      >
        <form onSubmit={saveAuthor} className="space-y-4">
          {authorError && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {authorError}
            </p>
          )}
          <div>
            <label className="field-label" htmlFor="a-name">
              Nombre
            </label>
            <input
              id="a-name"
              name="name"
              className="field"
              value={authorForm.name}
              onChange={handleAuthorChange}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="a-email">
              Email
            </label>
            <input
              id="a-email"
              name="email"
              type="email"
              className="field"
              value={authorForm.email}
              onChange={handleAuthorChange}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="a-nationality">
                Nacionalidad
              </label>
              <input
                id="a-nationality"
                name="nationality"
                className="field"
                value={authorForm.nationality}
                onChange={handleAuthorChange}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="a-birthYear">
                Año de nacimiento
              </label>
              <input
                id="a-birthYear"
                name="birthYear"
                type="number"
                className="field"
                value={authorForm.birthYear}
                onChange={handleAuthorChange}
              />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="a-bio">
              Biografía
            </label>
            <textarea
              id="a-bio"
              name="bio"
              rows={4}
              className="field"
              value={authorForm.bio}
              onChange={handleAuthorChange}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </Drawer>

      <Drawer
        open={bookDrawer}
        onClose={closeBookDrawer}
        title={`Nuevo libro de ${author.name}`}
      >
        <form onSubmit={saveBook} className="space-y-4">
          {bookError && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {bookError}
            </p>
          )}
          <div>
            <label className="field-label" htmlFor="b-title">
              Título
            </label>
            <input
              id="b-title"
              name="title"
              className="field"
              value={bookForm.title}
              onChange={handleBookChange}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="b-genre">
                Género
              </label>
              <input
                id="b-genre"
                name="genre"
                className="field"
                value={bookForm.genre}
                onChange={handleBookChange}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="b-isbn">
                ISBN
              </label>
              <input
                id="b-isbn"
                name="isbn"
                className="field"
                value={bookForm.isbn}
                onChange={handleBookChange}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="b-year">
                Año de publicación
              </label>
              <input
                id="b-year"
                name="publishedYear"
                type="number"
                className="field"
                value={bookForm.publishedYear}
                onChange={handleBookChange}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="b-pages">
                Páginas
              </label>
              <input
                id="b-pages"
                name="pages"
                type="number"
                min="1"
                className="field"
                value={bookForm.pages}
                onChange={handleBookChange}
              />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="b-description">
              Descripción
            </label>
            <textarea
              id="b-description"
              name="description"
              rows={4}
              className="field"
              value={bookForm.description}
              onChange={handleBookChange}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={saving}
          >
            {saving ? 'Guardando...' : 'Crear libro'}
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
