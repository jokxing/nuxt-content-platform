import type { LatestDatasetDto } from '~/api/models'
import { defineStore } from 'pinia'

export const useDatasetStore = defineStore('dataset', {
  state: () => ({ nextRelease: null as LatestDatasetDto['next_release'] }),
  actions: {
    setRelease(dto: LatestDatasetDto) {
      this.nextRelease = dto.next_release
    },
  },
  getters: {
    nextReleaseDateTime(): string | null {
      return this.nextRelease ? new Date(this.nextRelease.scheduled_at).toISOString() : null
    },
  },
})
