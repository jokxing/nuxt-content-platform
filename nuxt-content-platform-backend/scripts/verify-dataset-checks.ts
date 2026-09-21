import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  let rangeRejected = false
  let distinctRejected = false

  try {
    await prisma.datasetPeriod.create({
      data: {
        periodCode: 'CHK_RANGE',
        releasedAt: new Date('2026-01-01T00:00:00.000Z'),
        value1: 0,
        value2: 2,
        value3: 3,
        value4: 4,
        value5: 5,
        value6: 6,
        extraValue: 7,
        status: 'DRAFT',
      },
    })
  }
  catch {
    rangeRejected = true
  }

  try {
    await prisma.datasetPeriod.create({
      data: {
        periodCode: 'CHK_DUP',
        releasedAt: new Date('2026-01-01T00:00:00.000Z'),
        value1: 1,
        value2: 2,
        value3: 3,
        value4: 4,
        value5: 5,
        value6: 6,
        extraValue: 1,
        status: 'DRAFT',
      },
    })
  }
  catch {
    distinctRejected = true
  }

  await prisma.datasetPeriod.deleteMany({
    where: { periodCode: { in: ['CHK_RANGE', 'CHK_DUP'] } },
  })

  console.log(JSON.stringify({ rangeRejected, distinctRejected }))
  if (!rangeRejected || !distinctRejected) {
    process.exit(1)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error: unknown) => {
    console.error(error instanceof Error ? error.message : 'check_failed')
    await prisma.$disconnect()
    process.exit(1)
  })
