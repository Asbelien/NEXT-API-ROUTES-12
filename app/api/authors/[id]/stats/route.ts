import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const author = await prisma.author.findUnique({
      where: { id },
      include: { books: true },
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    const books = author.books

    const withYear = books
      .filter((b) => b.publishedYear !== null)
      .sort((a, b) => a.publishedYear! - b.publishedYear!)

    const withPages = books.filter((b) => b.pages !== null)
    const sortedByPages = [...withPages].sort((a, b) => a.pages! - b.pages!)

    const firstBook = withYear[0]
    const latestBook = withYear[withYear.length - 1]
    const shortestBook = sortedByPages[0]
    const longestBook = sortedByPages[sortedByPages.length - 1]

    const averagePages = withPages.length
      ? Math.round(
          withPages.reduce((sum, b) => sum + b.pages!, 0) / withPages.length
        )
      : 0

    const genres = [
      ...new Set(books.map((b) => b.genre).filter((g): g is string => !!g)),
    ]

    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks: books.length,
      firstBook: firstBook
        ? { title: firstBook.title, year: firstBook.publishedYear }
        : null,
      latestBook: latestBook
        ? { title: latestBook.title, year: latestBook.publishedYear }
        : null,
      averagePages,
      genres,
      longestBook: longestBook
        ? { title: longestBook.title, pages: longestBook.pages }
        : null,
      shortestBook: shortestBook
        ? { title: shortestBook.title, pages: shortestBook.pages }
        : null,
    })
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas del autor' },
      { status: 500 }
    )
  }
}
