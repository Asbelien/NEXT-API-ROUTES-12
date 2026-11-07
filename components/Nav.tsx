'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Autores' },
  { href: '/books', label: 'Libros' },
]

export default function Nav() {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/'
      ? pathname === '/' || pathname.startsWith('/authors')
      : pathname.startsWith(href)

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
            <rect x="2" y="7" width="6" height="17" rx="1.5" fill="var(--color-novela)" />
            <rect x="10" y="2" width="6" height="22" rx="1.5" fill="var(--color-cuento)" />
            <rect x="18" y="9" width="6" height="15" rx="1.5" fill="var(--color-periodismo)" />
          </svg>
          <span className="font-display text-xl font-bold tracking-tight">
            Biblioteca
          </span>
        </Link>

        <div className="flex gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                isActive(link.href)
                  ? 'bg-brand-soft text-brand-deep'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  )
}
