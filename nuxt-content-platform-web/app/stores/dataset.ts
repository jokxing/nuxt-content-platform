import type { ReleaseDto } from '~/api/models'
import { defineStore } from 'pinia'
import { toNextRelease } from '~/api/models'
import { toBeijingTimeString } from '~/utils/timezone'

export const useDatasetStore = defineStore('dataset', {
  state: () => ({ nextRelease: null as ReturnType<typeof toNextRelease> | null }),
  actions: {
    setRelease(dto: ReleaseDto) {
      this.nextRelease = toNextRelease(dto)
    },
  },
  getters: {
    nextReleaseDateTime(): string | null {
      return this.nextRelease ? toBeijingTimeString(this.nextRelease.date, this.nextRelease.time) : null
    },
  },
})
