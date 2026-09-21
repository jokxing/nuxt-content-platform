/**
 * B8.1 post-seed verification. Prints counts and invariants only — never connection strings.
 */
import { PrismaClient } from '@prisma/client'
import { DATASET_PERIOD_SEEDS, hongKongDateToUtc } from '../prisma/seed-dataset-data.js'

const prisma = new PrismaClient()

function fail(message: string): never {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}

async function main(): Promise<void> {
  const periodCount = await prisma.datasetPeriod.count()
  const publishedCount = await prisma.datasetPeriod.count({ where: { status: 'PUBLISHED' } })
  const scheduleCount = await prisma.datasetSchedule.count()
  const articleCount = await prisma.article.count()

  if (periodCount !== 120) fail(`expected 120 periods, got ${periodCount}`)
  if (publishedCount !== 120) fail(`expected 120 PUBLISHED, got ${publishedCount}`)
  if (scheduleCount !== 0) fail(`expected no seeded schedules, got ${scheduleCount}`)
  if (articleCount < 5) fail(`articles unexpectedly low: ${articleCount}`)

  const codes = await prisma.datasetPeriod.findMany({ select: { periodCode: true } })
  if (new Set(codes.map(r => r.periodCode)).size !== 120) fail('periodCode not unique in DB')

  const rows = await prisma.datasetPeriod.findMany({ orderBy: { releasedAt: 'desc' } })
  for (const row of rows) {
    const values = [row.value1, row.value2, row.value3, row.value4, row.value5, row.value6, row.extraValue]
    for (const value of values) {
      if (value < 1 || value > 49) fail(`out of range in ${row.periodCode}: ${value}`)
    }
    if (new Set(values).size !== 7) fail(`non-distinct values in ${row.periodCode}`)
  }

  const latest = rows[0]
  if (!latest || latest.periodCode !== '2026090') fail(`latest should be 2026090, got ${latest?.periodCode}`)
  const expectedReleased = hongKongDateToUtc('2026-09-16')
  if (latest.releasedAt.getTime() !== expectedReleased.getTime()) {
    fail(`UTC mismatch for 2026090: got ${latest.releasedAt.toISOString()}, want ${expectedReleased.toISOString()}`)
  }
  // 2026-09-16 00:00 +08 = 2026-09-15T16:00:00.000Z
  if (latest.releasedAt.toISOString() !== '2026-09-15T16:00:00.000Z') {
    fail(`unexpected ISO for 2026090: ${latest.releasedAt.toISOString()}`)
  }

  // Seed array matches DB for a spot-check of first and last
  const firstSeed = DATASET_PERIOD_SEEDS[0]!
  const lastSeed = DATASET_PERIOD_SEEDS[119]!
  const firstDb = await prisma.datasetPeriod.findUnique({ where: { periodCode: firstSeed.periodCode } })
  const lastDb = await prisma.datasetPeriod.findUnique({ where: { periodCode: lastSeed.periodCode } })
  if (!firstDb || firstDb.value1 !== firstSeed.value1 || firstDb.extraValue !== firstSeed.extraValue) {
    fail('first seed mismatch')
  }
  if (!lastDb || lastDb.periodCode !== '2025971' || lastDb.value1 !== lastSeed.value1) {
    fail('last seed mismatch')
  }

  // Idempotency: second seed already ran; counts stable
  console.log(JSON.stringify({
    ok: true,
    periods: periodCount,
    published: publishedCount,
    schedules: scheduleCount,
    articles: articleCount,
    latestPeriod: latest.periodCode,
    latestReleasedAtUtc: latest.releasedAt.toISOString(),
  }))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error: unknown) => {
    console.error(error instanceof Error ? error.message : 'verify_failed')
    await prisma.$disconnect()
    process.exit(1)
  })
