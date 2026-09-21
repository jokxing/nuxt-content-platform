<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { HistoryPageDto } from '~/api/models'
import { formatHongKongDate, hongKongWeekdayIndex } from '~/utils/publishTime'

const api = useContentApi()

const { t, locale } = useI18n()

const { data: historyRecords, error, pending } = await useAsyncData('historyRecords', async () => {
  const result = await api.get<HistoryPageDto>('/api/history', { params: { page: 1, page_size: 10 } })
  if (!Array.isArray(result.items))
    throw new Error('Invalid history data structure')
  return result.items
}, {
  server: true,
  lazy: false,
  default: () => [],
})

const historyRef = ref<HTMLElement | null>(null)

function goToStatistics() {
  const router = useRouter()
  const lang = locale.value === 'zh-HK' ? '' : `/${locale.value}`
  router.push(`${lang}/statistics/type/2`)
}

function getDayOfWeek(timestamp: number) {
  const keys = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const
  return t(`weekdays.${keys[hongKongWeekdayIndex(timestamp)]}`)
}

function formatReleasedAt(timestamp: number) {
  const localeTag = locale.value === 'zh-CN' ? 'zh-CN' : locale.value === 'en-US' ? 'en-US' : 'zh-HK'
  return formatHongKongDate(timestamp, localeTag)
}
</script>

<template>
  <VanCellGroup class="!mt-10" inset>
    <VanCell>
      <template #title>
        <div ref="historyRef" class="w-full">
          <div class="mb-3 text-center">
            <h3 class="text-base text-gray-800 font-medium dark:text-gray-200">
              {{ t('home.history.title') }}
            </h3>
          </div>

          <div v-if="pending" class="py-8 text-center">
            <VanLoading type="spinner" vertical>
              {{ t('common.loading') }}
            </VanLoading>
          </div>

          <div v-else-if="error" class="text-red-500 py-8 text-center">
            {{ error.message || t('home.history.fetch_failed') }}
          </div>

          <div v-else-if="historyRecords && historyRecords.length > 0" class="space-y-6">
            <div
              v-for="draw in historyRecords"
              :key="draw.period_code"
              class="pb-6 border-b border-gray-100 last:pb-0 last:border-0 dark:border-gray-800"
            >
              <div class="mb-3 flex items-center justify-between">
                <span class="text-sm text-gray-800 dark:text-gray-200">
                  {{ t('home.next_release.period', { period: draw.period_code }) }}
                </span>
                <span class="text-xs text-gray-500">
                  {{ formatReleasedAt(draw.released_at) }}({{ getDayOfWeek(draw.released_at) }})
                </span>
              </div>

              <div class="flex flex-wrap items-center justify-center">
                <div class="flex gap-6">
                  <BallNumber
                    v-for="number in draw.values"
                    :key="number"
                    :number="number"
                    :size="32"
                    class="mr-6 last:mr-0"
                  />
                </div>
                <div class="text-xs text-gray-400 mx-6">
                  /
                </div>
                <BallNumber
                  :number="draw.extra_value"
                  :size="32"
                  is-special
                />
              </div>
            </div>
          </div>

          <div v-else class="text-gray-400 py-8 text-center">
            {{ t('common.no_data') }}
          </div>

          <div class="mt-4 text-center">
            <button
              class="text-sm text-gray-600 px-4 py-2 inline-flex gap-1 items-center dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              @click="goToStatistics"
            >
              <span class="text-12px text-gray-500 mt-6">{{ t('home.history.view_more') }}</span>
              <div class="i-carbon:chevron-right h-4 w-4" />
            </button>
          </div>
        </div>
      </template>
    </VanCell>
  </VanCellGroup>
</template>
