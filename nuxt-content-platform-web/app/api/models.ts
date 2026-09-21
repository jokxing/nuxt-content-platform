export interface DatasetRowDto {
  period_code: string
  released_at: number
  values: number[]
  extra_value: number
}

export interface LatestDatasetDto extends DatasetRowDto {
  next_release: {
    period_code: string
    scheduled_at: number
  } | null
}

export interface HistoryPageDto {
  items: DatasetRowDto[]
  total: number
  page: number
  page_size: number
  total_pages: number
  filter_options: { years: number[], period_codes: string[] }
}

export interface ConsecutiveCombination {
  combination: number[]
  frequency: number
  combination_type: string
}

export interface AdvancedStatsPayload {
  tail_distribution?: Record<string, number>
  group_distribution?: Record<string, number>
  odd_even_ratio?: { odd_count?: number, even_count?: number }
  consecutive_analysis?: {
    consecutive_combinations?: ConsecutiveCombination[]
    consecutive_count?: number
    total_draws?: number
    consecutive_ratio?: number
  }
  top_combinations?: { combination: number[], frequency: number }[]
}

export interface DemoCombinationItem {
  numbers: number[]
  reason: string
  tags: string[]
}

export interface DemoCombinationsDto {
  source: 'fixed_demo'
  is_generated: false
  generated_at: number
  featured: DemoCombinationItem
  items: DemoCombinationItem[]
}
