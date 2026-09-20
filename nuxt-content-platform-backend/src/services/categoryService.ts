import { prisma } from '../db/prisma.js'
import type { Locale } from '../lib/lang.js'

export type CategoryDto = {
  slug: string
  name: string
  parent_route: string
}

const PARENT_ORDER: Record<string, number> = {
  education: 0,
  analysis: 1,
  story: 2,
}

export async function listCategories(locale: Locale): Promise<CategoryDto[]> {
  const rows = await prisma.category.findMany({
    include: {
      translations: {
        where: { locale },
        take: 1,
      },
    },
  })

  const mapped = rows
    .map((row) => {
      const translation = row.translations[0]
      if (!translation) {
        return null
      }
      return {
        slug: row.slug,
        name: translation.name,
        parent_route: row.parentRoute,
        parentRank: PARENT_ORDER[row.parentRoute] ?? Number.MAX_SAFE_INTEGER,
        sortOrder: row.sortOrder,
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)

  mapped.sort((a, b) => {
    if (a.parentRank !== b.parentRank) {
      return a.parentRank - b.parentRank
    }
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder
    }
    return a.slug.localeCompare(b.slug)
  })

  return mapped.map(({ slug, name, parent_route }) => ({ slug, name, parent_route }))
}
