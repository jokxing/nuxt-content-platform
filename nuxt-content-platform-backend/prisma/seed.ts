import { PrismaClient } from '@prisma/client'
import { ARTICLE_SEEDS, CATEGORY_SEEDS, LOCALES, shanghaiLocalToUtc } from './seed-data.js'
import {
  assertDistinctValues,
  DATASET_PERIOD_SEEDS,
  hongKongDateToUtc,
} from './seed-dataset-data.js'

const prisma = new PrismaClient()

async function seedCategories(): Promise<Map<string, number>> {
  const slugToId = new Map<string, number>()

  for (const category of CATEGORY_SEEDS) {
    const existing = await prisma.category.findUnique({ where: { slug: category.slug } })
    let categoryId: number

    if (existing) {
      categoryId = existing.id
    }
    else {
      const created = await prisma.category.create({
        data: {
          slug: category.slug,
          parentRoute: category.parentRoute,
          sortOrder: category.sortOrder,
        },
      })
      categoryId = created.id
    }

    slugToId.set(category.slug, categoryId)

    for (const locale of LOCALES) {
      const translation = await prisma.categoryTranslation.findUnique({
        where: {
          categoryId_locale: { categoryId, locale },
        },
      })
      if (!translation) {
        await prisma.categoryTranslation.create({
          data: {
            categoryId,
            locale,
            name: category.names[locale],
          },
        })
      }
    }
  }

  return slugToId
}

async function seedArticles(slugToId: Map<string, number>): Promise<void> {
  for (const article of ARTICLE_SEEDS) {
    const categoryId = slugToId.get(article.categorySlug)
    if (categoryId === undefined) {
      throw new Error(`Missing category for slug ${article.categorySlug}`)
    }

    const existing = await prisma.article.findUnique({ where: { id: article.id } })
    if (!existing) {
      await prisma.article.create({
        data: {
          id: article.id,
          slug: article.slug,
          categoryId,
          author: article.author,
          coverImage: article.coverImage,
          status: 'PUBLISHED',
          publishedAt: shanghaiLocalToUtc(article.publishedAtShanghai),
        },
      })
    }

    for (const locale of LOCALES) {
      const translation = await prisma.articleTranslation.findUnique({
        where: {
          articleId_locale: { articleId: article.id, locale },
        },
      })
      if (!translation) {
        await prisma.articleTranslation.create({
          data: {
            articleId: article.id,
            locale,
            title: article.titles[locale],
            content: article.contents[locale],
          },
        })
      }
    }
  }
}

/** Insert missing DatasetPeriod rows only; never overwrite manual edits. */
async function seedDatasetPeriods(): Promise<void> {
  if (DATASET_PERIOD_SEEDS.length !== 120) {
    throw new Error(`Expected 120 dataset period seeds, got ${DATASET_PERIOD_SEEDS.length}`)
  }

  for (const seed of DATASET_PERIOD_SEEDS) {
    assertDistinctValues(seed)
    const existing = await prisma.datasetPeriod.findUnique({
      where: { periodCode: seed.periodCode },
    })
    if (existing) {
      continue
    }

    await prisma.datasetPeriod.create({
      data: {
        periodCode: seed.periodCode,
        releasedAt: hongKongDateToUtc(seed.releasedDateHk),
        value1: seed.value1,
        value2: seed.value2,
        value3: seed.value3,
        value4: seed.value4,
        value5: seed.value5,
        value6: seed.value6,
        extraValue: seed.extraValue,
        status: 'PUBLISHED',
      },
    })
  }
}

async function main(): Promise<void> {
  const slugToId = await seedCategories()
  await seedArticles(slugToId)
  await seedDatasetPeriods()
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error: unknown) => {
    const message = error instanceof Error ? error.message : 'seed_failed'
    console.error(message)
    await prisma.$disconnect()
    process.exit(1)
  })
