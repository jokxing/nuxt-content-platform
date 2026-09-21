import type { Locale } from './domainConstants.js'

/** 样例版本时间：Asia/Hong_Kong 2026-09-17 12:00。不是请求时间。 */
export const FIXED_SAMPLE_GENERATED_AT = 1_789_617_600_000

type LocalizedText = Record<Locale, string>
type LocalizedTags = Record<Locale, readonly string[]>

type RecommendationSeed = {
  numbers: readonly [number, number, number, number, number, number]
  reason: LocalizedText
  tags: LocalizedTags
}

const RECOMMENDATION_SEEDS: readonly RecommendationSeed[] = [
  {
    numbers: [3, 12, 18, 27, 33, 41],
    reason: {
      'zh-HK': '區間分佈較均衡的固定樣例（演示，不是預測）',
      'zh-CN': '区间分布较均衡的固定样例（演示，不是预测）',
      'en-US': 'Balanced sample across ranges (demo data, not a prediction)',
    },
    tags: {
      'zh-HK': ['演示'],
      'zh-CN': ['演示'],
      'en-US': ['demo'],
    },
  },
  {
    numbers: [5, 9, 21, 28, 36, 44],
    reason: {
      'zh-HK': '高低頻搭配的固定樣例（演示，不是預測）',
      'zh-CN': '高低频搭配的固定样例（演示，不是预测）',
      'en-US': 'High and low frequency sample (demo data, not a prediction)',
    },
    tags: {
      'zh-HK': ['演示'],
      'zh-CN': ['演示'],
      'en-US': ['demo'],
    },
  },
  {
    numbers: [1, 14, 22, 30, 38, 49],
    reason: {
      'zh-HK': '間隔對照的固定樣例（演示，不是預測）',
      'zh-CN': '间隔对照的固定样例（演示，不是预测）',
      'en-US': 'Interval comparison sample (demo data, not a prediction)',
    },
    tags: {
      'zh-HK': ['演示'],
      'zh-CN': ['演示'],
      'en-US': ['demo'],
    },
  },
  {
    numbers: [6, 11, 19, 25, 34, 47],
    reason: {
      'zh-HK': '相鄰與分散組合的固定樣例（演示，不是預測）',
      'zh-CN': '相邻与分散组合的固定样例（演示，不是预测）',
      'en-US': 'Adjacent and scattered sample (demo data, not a prediction)',
    },
    tags: {
      'zh-HK': ['演示'],
      'zh-CN': ['演示'],
      'en-US': ['demo'],
    },
  },
  {
    numbers: [2, 13, 20, 24, 39, 48],
    reason: {
      'zh-HK': '對照用固定樣例（演示，不是預測）',
      'zh-CN': '对照用固定样例（演示，不是预测）',
      'en-US': 'Fixed control sample (demo data, not a prediction)',
    },
    tags: {
      'zh-HK': ['演示'],
      'zh-CN': ['演示'],
      'en-US': ['demo'],
    },
  },
]

const HOME_SAMPLE = {
  numbers: [11, 21, 29, 32, 35, 49] as const,
  tags: {
    'zh-HK': ['頻次樣例', '區間均衡', '相鄰樣例'],
    'zh-CN': ['频次样例', '区间均衡', '相邻样例'],
    'en-US': ['Frequency sample', 'Balanced ranges', 'Adjacent sample'],
  } satisfies LocalizedTags,
  reason: {
    'zh-HK': '固定樣例，僅供作品展示，不是預測。',
    'zh-CN': '固定样例，仅供作品展示，不是预测。',
    'en-US': 'Fixed sample for portfolio demonstration only; not a prediction.',
  } satisfies LocalizedText,
}

export type FixedRecommendation = {
  numbers: number[]
  reason: string
  tags: string[]
}

export type DemoCombinationsDto = {
  source: 'fixed_demo'
  is_generated: false
  generated_at: number
  featured: FixedRecommendation
  items: FixedRecommendation[]
}

export function demoCombinations(locale: Locale): DemoCombinationsDto {
  return {
    source: 'fixed_demo',
    is_generated: false,
    generated_at: FIXED_SAMPLE_GENERATED_AT,
    featured: {
      numbers: [...HOME_SAMPLE.numbers],
      tags: [...HOME_SAMPLE.tags[locale]],
      reason: HOME_SAMPLE.reason[locale],
    },
    items: RECOMMENDATION_SEEDS.map(item => ({
      numbers: [...item.numbers],
      reason: item.reason[locale],
      tags: [...item.tags[locale]],
    })),
  }
}
