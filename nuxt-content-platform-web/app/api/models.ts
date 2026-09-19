/** Wire compatibility stays at this boundary; views use neutral names. */
export interface ReleaseDto {
  next_draw_date: string
  next_draw_number: string
  next_jackpot: number
}

export function toNextRelease(dto: ReleaseDto) {
  return { date: dto.next_draw_date, number: dto.next_draw_number, target: dto.next_jackpot, time: '21:30:00' }
}

export function toGroupStatistics<T extends { zodiac_distribution?: Record<string, number> }>(dto: T) {
  const { zodiac_distribution, ...rest } = dto
  return { ...rest, group_distribution: zodiac_distribution || {} }
}
export interface ConsecutiveCombination {
  combination: number[]
  frequency: number
  combination_type: string
}

export interface AdvancedStatsPayload {
  tail_distribution?: Record<string, number>
  zodiac_distribution?: Record<string, number>
  odd_even_ratio?: { odd_count?: number, even_count?: number }
  consecutive_analysis?: {
    consecutive_combinations?: ConsecutiveCombination[]
    consecutive_count?: number
    total_draws?: number
    consecutive_ratio?: number
  }
  top_combinations?: { combination: number[], frequency: number }[]
}
