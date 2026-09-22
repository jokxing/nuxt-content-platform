import type { LatestDatasetDto } from '~/api/models'
import { defineStore } from 'pinia'

export const useDatasetStore = defineStore('dataset', {
  state: () => ({
    latestPeriodCode: null as string | null,
    nextRelease: null as LatestDatasetDto['next_release'],
  }),
  actions: {
    setRelease(dto: LatestDatasetDto) {
      this.latestPeriodCode = dto.period_code
      this.nextRelease = dto.next_release
    },
  },
  getters: {
    nextReleaseDateTime(): string | null {
      return this.nextRelease ? new Date(this.nextRelease.scheduled_at).toISOString() : null
    },
  },
})
