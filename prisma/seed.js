const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const gabo = await prisma.author.upsert({
    where: { email: 'gabo@example.com' },
    update: {},
    create: {
      name: 'Gabriel García Márquez',
      email: 'gabo@example.com',
      nationality: 'Colombia',
      birthYear: 1927,
      bio: 'Premio Nobel de Literatura 1982',
    },
  })

  const cortazar = await prisma.author.upsert({
    where: { email: 'cortazar@example.com' },
    update: {},
    create: {
      name: 'Julio Cortázar',
      email: 'cortazar@example.com',
      nationality: 'Argentina',
      birthYear: 1914,
      bio: 'Autor de Rayuela',
    },
  })

  await prisma.book.createMany({
    skipDuplicates: true,
    data: [
      { title: 'Cien años de soledad', isbn: '978-0307474728', publishedYear: 1967, genre: 'Novela', pages: 417, authorId: gabo.id },
      { title: 'Crónica de una muerte anunciada', isbn: '978-0307475978', publishedYear: 1981, genre: 'Novela', pages: 120, authorId: gabo.id },
      { title: 'El coronel no tiene quien le escriba', isbn: '978-0307387301', publishedYear: 1961, genre: 'Novela', pages: 96, authorId: gabo.id },
      { title: 'Doce cuentos peregrinos', isbn: '978-0307475473', publishedYear: 1992, genre: 'Cuento', pages: 224, authorId: gabo.id },
      { title: 'Relato de un náufrago', isbn: '978-0307475916', publishedYear: 1970, genre: 'Periodismo', pages: 110, authorId: gabo.id },
      { title: 'El amor en los tiempos del cólera', isbn: '978-0307389732', publishedYear: 1985, genre: 'Novela', pages: 368, authorId: gabo.id },
      { title: 'Rayuela', isbn: '978-8437604572', publishedYear: 1963, genre: 'Novela', pages: 635, authorId: cortazar.id },
      { title: 'Bestiario', isbn: '978-8420471402', publishedYear: 1951, genre: 'Cuento', pages: 160, authorId: cortazar.id },
      { title: 'Final del juego', isbn: '978-8420471419', publishedYear: 1956, genre: 'Cuento', pages: 168, authorId: cortazar.id },
    ],
  })
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })