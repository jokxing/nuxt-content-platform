<script setup lang="ts">
import { computed, watch } from 'vue'
import { useDatasetStore } from '~/stores/dataset'

const props = defineProps({
  result: {
    type: Object,
    default: null,
  },
})

const { locale, t } = useI18n()
const datasetStore = useDatasetStore()

watch(() => props.result, (newResult) => {
  if (newResult)
    datasetStore.setRelease(newResult as any)
}, { immediate: true })

const dataUpdateTime = computed(() => {
  if (!props.result?.draw_date)
    return null
  const localeTag = locale.value === 'zh-CN' ? 'zh-CN' : locale.value === 'en-US' ? 'en-US' : 'zh-HK'
  return new Date(props.result.draw_date).toLocaleString(localeTag)
})

function formatAmount(amount: any) {
  if (!amount && amount !== 0)
    return '-'
  const num = typeof amount === 'string' ? Number.parseFloat(amount) : amount
  const localeTag = locale.value === 'zh-CN' ? 'zh-CN' : locale.value === 'en-US' ? 'en-US' : 'zh-HK'
  return new Intl.NumberFormat(localeTag).format(num)
}

const numbers = computed(() => {
  if (!props.result)
    return []
  return [
    props.result.num1,
    props.result.num2,
    props.result.num3,
    props.result.num4,
    props.result.num5,
    props.result.num6,
  ]
})

function getDayOfWeek(dateStr: any) {
  const date = new Date(dateStr)
  const keys = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const
  return t(`weekdays.${keys[date.getDay()]}`)
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
                {{ t('home.latest_result.winning_numbers') }}
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
                :number="result.special_number"
                is-special
              />
            </div>
          </div>
        </template>
      </VanCell>
      <VanCell
        :title="t('home.latest_result.draw_number')"
        :value="result.draw_number"
      />
      <VanCell
        :title="t('home.latest_result.draw_date')"
        :value="`${result.draw_date}(${getDayOfWeek(result.draw_date)})`"
      />
      <VanCell
        v-if="dataUpdateTime"
        :title="t('home.latest_result.data_updated_at')"
        :value="dataUpdateTime"
      />
      <VanCell
        :title="t('home.latest_result.total_investment')"
        :value="formatAmount(result.total_sales)"
      />
      <VanCell
        :title="t('home.latest_result.first_prize')"
        :value="`${formatAmount(result.first_prize_amount)}(${result.first_prize_count || 0}${t('home.latest_result.winners')})`"
      />
      <VanCell
        :title="t('home.latest_result.second_prize')"
        :value="`${formatAmount(result.second_prize_amount)}(${result.second_prize_count || 0}${t('home.latest_result.winners')})`"
      />
      <VanCell
        :title="t('home.latest_result.third_prize')"
        :value="`${formatAmount(result.third_prize_amount)}(${result.third_prize_count || 0}${t('home.latest_result.winners')})`"
      />
    </template>
    <template v-else>
      <div class="text-gray-400 py-8 text-center">
        {{ t('common.no_data') }}
      </div>
    </template>
  </VanCellGroup>
</template>
