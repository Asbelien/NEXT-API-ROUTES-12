'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import Shelf, { type ShelfBook } from '@/components/Shelf'
import Drawer from '@/components/Drawer'
import ConfirmDialog from '@/components/ConfirmDialog'
import { Toast, useToast } from '@/components/Toast'
import { genreColor } from '@/lib/genres'

type Author = {
  id: string
  name: string
  email: string
  bio: string | null
  nationality: string | null
  birthYear: number | null
  books: ShelfBook[]
  _count: { books: number }
}

type AuthorForm = {
  name: string
  email: string
  nationality: string
  birthYear: string
  bio: string
}

const emptyForm: AuthorForm = {
  name: '',
  email: '',
  nationality: '',
  birthYear: '',
  bio: '',
}

function MiniSpines({ books }: { books: ShelfBook[] }) {
  return (
    <div className="flex h-14 items-end gap-1" aria-hidden="true">
      {books.slice(0, 8).map((b) => (
        <span
          key={b.id}
          className="w-2.5 rounded-t-sm"
          style={{
            height: b.pages
              ? 22 + Math.round((Math.min(b.pages, 700) / 700) * 32)
              : 32,
            background: genreColor(b.genre),
          }}
        />
      ))}
    </div>
  )
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

export default function Home() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editing, setEditing] = useState<Author | null>(null)
  const [form, setForm] = useState<AuthorForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  const [toDelete, setToDelete] = useState<Author | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { toast, show } = useToast()

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/authors')
      if (!res.ok) throw new Error()
      setAuthors(await res.json())
      setLoadError('')
    } catch {
      setLoadError('No se pudieron cargar los autores.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const allBooks = authors.flatMap((a) => a.books)
  const genreCount = new Set(
    allBooks.map((b) => b.genre).filter((g): g is string => !!g)
  ).size

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError('')
    setDrawerOpen(true)
  }

  const openEdit = (author: Author) => {
    setEditing(author)
    setForm({
      name: author.name,
      email: author.email,
      nationality: author.nationality ?? '',
      birthYear: author.birthYear ? String(author.birthYear) : '',
      bio: author.bio ?? '',
    })
    setFormError('')
    setDrawerOpen(true)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')

    try {
      const res = await fetch(
        editing ? `/api/authors/${editing.id}` : '/api/authors',
        {
          method: editing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            nationality: form.nationality || null,
            birthYear: form.birthYear || null,
            bio: form.bio || null,
          }),
        }
      )
      const data = await res.json()

      if (!res.ok) {
        setFormError(data.error || 'No se pudo guardar el autor.')
        return
      }

      setDrawerOpen(false)
      show(editing ? 'Autor actualizado' : 'Autor creado')
      await load()
    } catch {
      setFormError('No se pudo guardar el autor. Inténtalo otra vez.')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)

    try {
      const res = await fetch(`/api/authors/${toDelete.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      setToDelete(null)
      show('Autor eliminado')
      await load()
    } catch {
      setToDelete(null)
      show('No se pudo eliminar el autor. Inténtalo otra vez.', 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 pb-20 pt-10">
      <section className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            Todos tus libros en una sola repisa
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            {loading
              ? 'Cargando tu catálogo...'
              : `${plural(authors.length, 'autor', 'autores')} y ${plural(allBooks.length, 'libro', 'libros')} en ${plural(genreCount, 'género', 'géneros')}.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary" onClick={openCreate}>
            Nuevo autor
          </button>
          <Link href="/books" className="btn btn-ghost">
            Ver todos los libros
          </Link>
        </div>
      </section>

      <section className="panel mt-10 px-4 pb-6 pt-2">
        <Shelf books={allBooks} loading={loading} />
      </section>

      <section className="mt-14">
        <h2 className="mb-4 text-2xl font-bold">Autores</h2>

        {loadError && (
          <div className="panel mb-4 flex flex-wrap items-center justify-between gap-3 border-danger/30 bg-danger-soft p-4 text-danger">
            <p>{loadError}</p>
            <button className="btn btn-ghost btn-sm" onClick={load}>
              Reintentar
            </button>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
            <div className="skeleton h-28" />
          </div>
        )}

        {!loading && !loadError && authors.length === 0 && (
          <div className="panel flex flex-col items-start gap-4 p-8">
            <p className="text-lg font-semibold">Aún no hay autores</p>
            <p className="text-muted">
              Crea el primero y empieza a llenar la repisa con sus libros.
            </p>
            <button className="btn btn-primary" onClick={openCreate}>
              Crear autor
            </button>
          </div>
        )}

        <ul className="space-y-3">
          {authors.map((author) => (
            <li
              key={author.id}
              className="panel flex flex-col gap-5 p-5 sm:flex-row sm:items-center"
            >
              <div className="w-full shrink-0 sm:w-28">
                <MiniSpines books={author.books} />
                <p className="mt-2 text-xs font-semibold text-muted">
                  {author._count.books === 0
                    ? 'Sin libros'
                    : plural(author._count.books, 'libro', 'libros')}
                </p>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-bold">{author.name}</h3>
                <p className="text-sm text-muted">
                  {[
                    author.nationality,
                    author.birthYear ? `nació en ${author.birthYear}` : null,
                  ]
                    .filter(Boolean)
                    .join(', ') || 'Sin datos de origen'}
                </p>
                <p className="text-sm text-muted">{author.email}</p>
                {author.bio && (
                  <p className="mt-2 line-clamp-2 text-sm">{author.bio}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/authors/${author.id}`}
                  className="btn btn-soft btn-sm"
                >
                  Ver libros
                </Link>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => openEdit(author)}
                >
                  Editar
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => setToDelete(author)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editing ? 'Editar autor' : 'Nuevo autor'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {formError}
            </p>
          )}
          <div>
            <label className="field-label" htmlFor="name">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              className="field"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="field"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="nationality">
                Nacionalidad
              </label>
              <input
                id="nationality"
                name="nationality"
                className="field"
                value={form.nationality}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="birthYear">
                Año de nacimiento
              </label>
              <input
                id="birthYear"
                name="birthYear"
                type="number"
                className="field"
                value={form.birthYear}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="bio">
              Biografía
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              className="field"
              value={form.bio}
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
                : 'Crear autor'}
          </button>
        </form>
      </Drawer>

      <ConfirmDialog
        open={toDelete !== null}
        title="Eliminar autor"
        message={
          toDelete
            ? `Se eliminará a ${toDelete.name} y ${plural(toDelete._count.books, 'libro', 'libros')}. Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar autor"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />

      <Toast toast={toast} />
    </main>
  )
}
