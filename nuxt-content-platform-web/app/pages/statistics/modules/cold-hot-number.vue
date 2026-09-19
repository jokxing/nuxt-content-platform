<script setup lang="ts">
/**
 * 频次/分布模块（2.2-9）
 * BUSINESS_MAPPING.coldHot → 频次与分布统计；图表子组件留给 2.2-10
 */
import ChartAnalysis from './chart-analysis.vue'

const api = useContentApi()

const { t } = useI18n()

const isDarkMode = computed(() => {
  if (import.meta.client)
    return document.documentElement.classList.contains('dark')
  return false
})

const periodOptions = computed(() => [
  { text: t('statistics.period_selector.recent', { count: 10 }), value: 10 },
  { text: t('statistics.period_selector.recent', { count: 20 }), value: 20 },
  { text: t('statistics.period_selector.recent', { count: 30 }), value: 30 },
  { text: t('statistics.period_selector.recent', { count: 50 }), value: 50 },
  { text: t('statistics.period_selector.recent', { count: 100 }), value: 100 },
])

interface PickerOption {
  text: string
  value: number
}

const selectedPeriod = ref(10)
const selectedText = computed(() => t('statistics.period_selector.recent', { count: selectedPeriod.value }))
const showPicker = ref(false)

const { data: analysisData, error: fetchError, pending } = await useAsyncData(
  'coldHotAnalysis',
  async () => {
    try {
      const result = await api.get<{
        hot_numbers?: Array<{ number: number, frequency: number }>
        cold_numbers?: Array<{ number: number, frequency: number }>
        rising_numbers?: Array<{ number: number, frequency: number }>
        duplicate_numbers?: Array<{ duplicate_tail: number, frequency: number }>
        consecutive_numbers?: Array<{ consecutive_pair: number[], frequency: number }>
      }>('/api/analysis', {
        params: { period: selectedPeriod.value },
      })

      return {
        hotNumbers: result.hot_numbers || [],
        coldNumbers: result.cold_numbers || [],
        risingNumbers: result.rising_numbers || [],
        doubleNumbers: result.duplicate_numbers || [],
        consecutiveNumbers: result.consecutive_numbers || [],
      }
    }
    catch {
      throw createError({
        statusCode: 500,
        statusMessage: t('statistics.cold_hot.fetch_failed'),
      })
    }
  },
  {
    default: () => ({
      hotNumbers: [],
      coldNumbers: [],
      risingNumbers: [],
      doubleNumbers: [],
      consecutiveNumbers: [],
    }),
    server: true,
    lazy: false,
    watch: [selectedPeriod],
  },
)

async function onConfirm({ selectedOptions }: { selectedOptions: PickerOption[] }) {
  if (!selectedOptions?.[0])
    return

  selectedPeriod.value = selectedOptions[0].value
  showPicker.value = false
  // useAsyncData watches selectedPeriod; do not issue a duplicate refresh.
}

function onCancel() {
  showPicker.value = false
}

function freqLabel(count: number | undefined) {
  return `${count ?? 0}${t('statistics.cold_hot.times')}`
}
</script>

<template>
  <div class="freq_distribution">
    <div class="period_selector mb-6">
      <van-cell
        :title="t('statistics.period_selector.title')"
        :value="selectedText"
        is-link
        @click="showPicker = true"
      />

      <van-popup
        v-model:show="showPicker"
        round
        position="bottom"
      >
        <van-picker
          :columns="[periodOptions]"
          :title="t('statistics.period_selector.picker_title')"
          :confirm-button-text="t('confirm')"
          :cancel-button-text="t('cancel')"
          @confirm="onConfirm"
          @cancel="onCancel"
        />
      </van-popup>
    </div>

    <div v-if="pending" class="state_box">
      <van-loading type="spinner" color="#0f766e" />
      <span class="state_box__text">{{ t('common.loading') }}</span>
    </div>

    <div v-else-if="fetchError" class="state_box state_box--error">
      {{ t('statistics.cold_hot.fetch_failed') }}
    </div>

    <template v-else-if="analysisData">
      <div class="section mb-6">
        <div class="section__title">
          <van-icon name="fire-o" color="#0f766e" size="20" />
          <span class="ml-2">{{ t('statistics.cold_hot.hot_numbers') }}</span>
        </div>
        <div v-if="analysisData.hotNumbers.length" class="numbers_grid">
          <div
            v-for="item in analysisData.hotNumbers"
            :key="item.number"
            class="number_item"
          >
            <BallNumber :number="item.number" :size="40" />
            <div class="number_item__count">
              {{ freqLabel(item.frequency) }}
            </div>
          </div>
        </div>
        <div v-else class="empty_tip">
          {{ t('common.no_data') }}
        </div>
      </div>

      <van-divider
        :style="{
          borderColor: isDarkMode ? '#444' : '#ebedf0',
          padding: '0 16px',
          margin: '0 0 24px 0',
        }"
      />

      <div class="section mb-6">
        <div class="section__title">
          <van-icon name="underway-o" color="#0ea5e9" size="20" />
          <span class="ml-2">{{ t('statistics.cold_hot.cold_numbers') }}</span>
          <span class="section__sub ml-2">{{ t('statistics.cold_hot.cold_numbers_subtitle') }}</span>
        </div>
        <div v-if="analysisData.coldNumbers.length" class="numbers_grid">
          <div
            v-for="item in analysisData.coldNumbers"
            :key="item.number"
            class="number_item"
          >
            <BallNumber :number="item.number" :size="40" />
            <div class="number_item__count">
              {{ freqLabel(item.frequency) }}
            </div>
          </div>
        </div>
        <div v-else class="empty_tip">
          {{ t('common.no_data') }}
        </div>
      </div>

      <van-divider
        :style="{
          borderColor: isDarkMode ? '#444' : '#ebedf0',
          padding: '0 16px',
          margin: '0 0 24px 0',
        }"
      />

      <div class="section rising mb-6">
        <div class="section__title">
          <div class="i-carbon:analytics text-20 text-#0f766e" />
          <span class="ml-2">{{ t('statistics.cold_hot.rising_numbers') }}</span>
          <span class="section__sub ml-2">{{ t('statistics.cold_hot.rising_numbers_subtitle') }}</span>
        </div>
        <div v-if="analysisData.risingNumbers.length" class="numbers_grid">
          <div
            v-for="item in analysisData.risingNumbers"
            :key="item.number"
            class="number_item"
          >
            <BallNumber :number="item.number" :size="40" />
            <div class="number_item__count">
              {{ freqLabel(item.frequency) }}
            </div>
          </div>
        </div>
        <div v-else class="empty_tip">
          {{ t('statistics.cold_hot.empty_rising') }}
        </div>
      </div>

      <van-divider
        :style="{
          borderColor: isDarkMode ? '#444' : '#ebedf0',
          padding: '0 16px',
          margin: '0 0 24px 0',
        }"
      />

      <div class="section mb-6">
        <div class="section__title">
          <div class="i-carbon:repeat text-20 text-#0f766e" />
          <span class="ml-2">{{ t('statistics.cold_hot.double_numbers') }}</span>
        </div>
        <div v-if="analysisData.doubleNumbers.length" class="numbers_grid">
          <div
            v-for="item in analysisData.doubleNumbers"
            :key="item.duplicate_tail"
            class="number_item"
          >
            <BallNumber :number="item.duplicate_tail" :size="40" />
            <div class="number_item__count">
              {{ freqLabel(item.frequency) }}
            </div>
          </div>
        </div>
        <div v-else class="empty_tip">
          {{ t('statistics.cold_hot.empty_double') }}
        </div>
      </div>

      <van-divider
        :style="{
          borderColor: isDarkMode ? '#444' : '#ebedf0',
          padding: '0 16px',
          margin: '0 0 24px 0',
        }"
      />

      <div class="section consecutive">
        <div class="section__title">
          <div class="i-carbon:list-numbered text-20 text-#0f766e" />
          <span class="ml-2">{{ t('statistics.cold_hot.consecutive_numbers') }}</span>
        </div>
        <div v-if="analysisData.consecutiveNumbers.length" class="numbers_grid">
          <div
            v-for="item in analysisData.consecutiveNumbers"
            :key="item.consecutive_pair.join('-')"
            class="number_pair"
          >
            <div class="number_pair__balls">
              <BallNumber
                v-for="num in item.consecutive_pair"
                :key="num"
                :number="num"
                :size="40"
              />
            </div>
            <div class="number_item__count">
              {{ freqLabel(item.frequency) }}
            </div>
          </div>
        </div>
        <div v-else class="empty_tip">
          {{ t('statistics.cold_hot.empty_consecutive') }}
        </div>
      </div>

      <van-divider
        :style="{
          borderColor: isDarkMode ? '#444' : '#ebedf0',
          padding: '0 16px',
          margin: '0 0 24px 0',
        }"
      />

      <!-- 图表模块正文脱敏留给 2.2-10 -->
      <ClientOnly>
        <ChartAnalysis :period="selectedPeriod" />
      </ClientOnly>
    </template>
  </div>
</template>

<style scoped lang="scss">
.freq_distribution {
  padding: 16px;
  background: var(--van-gray-1);
}

.period_selector {
  margin-bottom: 24px;
}

.state_box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 0;

  &__text {
    margin-top: 12px;
    color: #999;
    font-size: 14px;
  }

  &--error {
    color: #ef4444;
    font-size: 14px;
  }
}

.section {
  &__title {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 16px;
    color: #333;
  }

  &__sub {
    font-size: 12px;
    color: #999;
    font-weight: 400;
  }
}

.numbers_grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  padding: 8px 0;
}

.number_item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  &__count {
    font-size: 11px;
    color: #666;
    white-space: nowrap;
  }
}

.number_pair {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  &__balls {
    display: flex;
    gap: 4px;
  }
}

.empty_tip {
  color: #999;
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
}

.rising .numbers_grid {
  grid-template-columns: repeat(4, 1fr);
}

.consecutive .numbers_grid {
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.dark .freq_distribution {
  background: #1a1a1a;
}

.dark .section__title {
  color: #fff;
}

.dark .section__sub,
.dark .empty_tip {
  color: #aaa;
}

.dark .number_item__count {
  color: #ccc;
}
</style>
