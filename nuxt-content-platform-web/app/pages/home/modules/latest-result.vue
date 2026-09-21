<script setup lang="ts">
import { computed, watch } from 'vue'
import type { PropType } from 'vue'
import type { LatestDatasetDto } from '~/api/models'
import { formatHongKongDate, formatPublishDateForDisplay, hongKongWeekdayIndex } from '~/utils/publishTime'
import { useDatasetStore } from '~/stores/dataset'

const props = defineProps({
  result: {
    type: Object as PropType<LatestDatasetDto>,
    default: null,
  },
})

const { locale, t } = useI18n()
const datasetStore = useDatasetStore()

watch(() => props.result, (newResult) => {
  if (newResult)
    datasetStore.setRelease(newResult)
}, { immediate: true })

const localeTag = computed(() => locale.value === 'zh-CN' ? 'zh-CN' : locale.value === 'en-US' ? 'en-US' : 'zh-HK')

const dataUpdateTime = computed(() => {
  if (!props.result?.released_at)
    return null
  return formatPublishDateForDisplay(props.result.released_at, localeTag.value)
})

const releasedDateLabel = computed(() => {
  if (!props.result?.released_at)
    return ''
  return `${formatHongKongDate(props.result.released_at, localeTag.value)}(${getDayOfWeek(props.result.released_at)})`
})

const numbers = computed(() => {
  if (!props.result)
    return []
  return props.result.values
})

function getDayOfWeek(timestamp: number) {
  const keys = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const
  return t(`weekdays.${keys[hongKongWeekdayIndex(timestamp)]}`)
}
</script>

<template>
  <VanCellGroup inset>
    <h2 class="text-lg color-red-500 font-bold pt-16 text-center !mb-4">
      {{ t('home.latest_result.title') }}
    </h2>

    <template v-if="result">
      <VanCell>
        <template #title>
          <div class="text-center w-full">
            <div class="mb-3">
              <h3 class="text-base text-gray-800 font-medium dark:text-gray-200">
                {{ t('home.latest_result.dataset_values') }}
              </h3>
            </div>
            <div class="mb-4 flex flex-wrap gap-3 items-center justify-center">
              <BallNumber
                v-for="number in numbers"
                :key="number"
                :number="number"
              />
              <div class="text-xs text-gray-400 mx-2">
                /
              </div>
              <BallNumber
                :number="result.extra_value"
                is-special
              />
            </div>
          </div>
        </template>
      </VanCell>
      <VanCell
        :title="t('home.latest_result.period_code')"
        :value="result.period_code"
      />
      <VanCell
        :title="t('home.latest_result.released_at')"
        :value="releasedDateLabel"
      />
      <VanCell
        v-if="dataUpdateTime"
        :title="t('home.latest_result.data_updated_at')"
        :value="dataUpdateTime"
      />
    </template>
    <template v-else>
      <div class="text-gray-400 py-8 text-center">
        {{ t('common.no_data') }}
      </div>
    </template>
  </VanCellGroup>
</template>
