import { Prisma } from '@prisma/client'
import { prisma } from '../db/prisma.js'
import { contentDirectoryLimitExceeded } from '../lib/errors.js'
import { toUnixMillis } from '../lib/time.js'
import { visiblePublishedWhere } from './articleVisibility.js'

export const CONTENT_DIRECTORY_LIMIT = 10_000

export type DirectoryArticleDto = {
  id: number
  parent_route: string
  status: 1
  publish_date: number
}

export type ContentDirectoryDto = {
  generated_at: number
  articles: DirectoryArticleDto[]
}

type ContentDirectoryOptions = {
  /** 仅测试可覆盖上限；HTTP 入口固定使用 CONTENT_DIRECTORY_LIMIT。 */
  limit?: number
}

/**
 * 预渲染/sitemap 用的完整可见快照：id 升序，可重复读事务。
 * 超过上限返回 50301，禁止截断导致漏路由。
 */
export async function getContentDirectory(
  now = new Date(),
  options?: ContentDirectoryOptions,
): Promise<ContentDirectoryDto> {
  const limit = options?.limit ?? CONTENT_DIRECTORY_LIMIT
  const where = visiblePublishedWhere(now)

  return prisma.$transaction(async (tx) => {
    const total = await tx.article.count({ where })
    if (total > limit) {
      throw contentDirectoryLimitExceeded()
    }

    const rows = await tx.article.findMany({
      where,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        publishedAt: true,
        category: {
          select: { parentRoute: true },
        },
      },
    })

    return {
      generated_at: toUnixMillis(now),
      articles: rows.map(row => ({
        id: row.id,
        parent_route: row.category.parentRoute,
        status: 1 as const,
        publish_date: toUnixMillis(row.publishedAt!),
      })),
    }
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
  })
}
