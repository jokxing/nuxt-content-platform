<script setup lang="ts">
/**
 * 组合与占比类进阶统计（2.2-11）
 * 数据字段与公开后端契约保持一致。
 */
import type { CoreScaleOptions, Scale } from 'chart.js'
import type { AdvancedStatsPayload, ConsecutiveCombination } from '~/api/models'
import { Chart, registerables } from 'chart.js'

const api = useContentApi()

type AdvancedStats = AdvancedStatsPayload

const { t, locale } = useI18n()

const periodOptions = computed(() => [
  { text: t('statistics.period_selector.recent', { count: 10 }), value: 10 },
  { text: t('statistics.period_selector.recent', { count: 30 }), value: 30 },
  { text: t('statistics.period_selector.recent', { count: 50 }), value: 50 },
  { text: t('statistics.period_selector.recent', { count: 100 }), value: 100 },
])

const selectedPeriod = ref(10)
const selectedText = computed(() => t('statistics.period_selector.recent', { count: selectedPeriod.value }))
const showPicker = ref(false)

const { data: advancedData, error: fetchError, pending, refresh } = await useAsyncData(
  'advancedStatisticsData',
  async () => {
    try {
      const dto = await api.get<AdvancedStatsPayload>('/api/advanced-stats', {
        params: { period: selectedPeriod.value },
      })
      return dto
    }
    catch {
      throw createError({
        statusCode: 500,
        statusMessage: t('statistics.advanced.fetch_failed'),
      })
    }
  },
  {
    default: () => ({
      tail_distribution: {},
      group_distribution: {},
      odd_even_ratio: { odd_count: 0, even_count: 0 },
      consecutive_analysis: {
        consecutive_combinations: [],
        consecutive_count: 0,
        total_draws: 0,
        consecutive_ratio: 0,
      },
      top_combinations: [],
    }) as AdvancedStats,
    server: false,
    lazy: false,
  },
)

const chartTypes = useState<Record<string, 'pie' | 'bar'>>('advancedStatisticsChartTypes', () => ({
  tail: 'pie',
  group: 'pie',
  oddEven: 'pie',
  consecutive: 'bar',
  combination: 'bar',
}))

const analysisTypes = computed(() => [
  { text: t('statistics.advanced.tail_distribution'), value: 'tail' as const },
  { text: t('statistics.advanced.group_distribution'), value: 'group' as const },
  { text: t('statistics.advanced.odd_even_ratio'), value: 'oddEven' as const },
  { text: t('statistics.advanced.consecutive_analysis'), value: 'consecutive' as const },
  { text: t('statistics.advanced.combination_analysis'), value: 'combination' as const },
])

type AnalysisType = 'tail' | 'group' | 'oddEven' | 'consecutive' | 'combination'

const analysisDescriptions = computed(() => {
  const ca = advancedData.value?.consecutive_analysis
  return {
    tail: t('statistics.advanced.tail_description'),
    group: t('statistics.advanced.group_description'),
    oddEven: t('statistics.advanced.odd_even_description'),
    consecutive: t('statistics.advanced.consecutive_description', {
      count: ca?.consecutive_count ?? 0,
      total: ca?.total_draws ?? 0,
      ratio: Number(ca?.consecutive_ratio ?? 0).toFixed(1),
    }),
    combination: t('statistics.advanced.combination_description'),
  } as Record<AnalysisType, string>
})

const chartData = computed(() => {
  const data = advancedData.value
  if (!data) {
    return {
      tail: { labels: [] as string[], data: [] as number[] },
      group: { labels: [] as string[], data: [] as number[] },
      oddEven: { labels: [] as string[], data: [] as number[] },
      consecutive: { labels: [] as string[], data: [] as number[] },
      combination: { labels: [] as string[], data: [] as number[] },
    }
  }

  return {
    tail: {
      labels: Object.keys(data.tail_distribution || {}),
      data: Object.values(data.tail_distribution || {}),
    },
    group: {
      labels: Object.keys(data.group_distribution || {}),
      data: Object.values(data.group_distribution || {}),
    },
    oddEven: {
      labels: [t('statistics.advanced.single'), t('statistics.advanced.double')],
      data: [data.odd_even_ratio?.odd_count || 0, data.odd_even_ratio?.even_count || 0],
    },
    consecutive: {
      labels: (data.consecutive_analysis?.consecutive_combinations || []).map(
        (item: ConsecutiveCombination) => item.combination.join('-'),
      ),
      data: (data.consecutive_analysis?.consecutive_combinations || []).map(
        (item: ConsecutiveCombination) => item.frequency,
      ),
    },
    combination: {
      labels: (data.top_combinations || []).map(item => item.combination.join(',')),
      data: (data.top_combinations || []).map(item => item.frequency),
    },
  }
})

const chartColors = {
  pie: [
    '#0f766e',
    '#0ea5e9',
    '#f59e0b',
    '#10b981',
    '#6366f1',
    '#ec4899',
    '#84cc16',
    '#14b8a6',
    '#f97316',
    '#8b5cf6',
    '#06b6d4',
    '#eab308',
  ],
  bar: '#0f766e',
}

const charts = new Map<string, Chart>()
let chartJsRegistered = false

function ensureChartJs() {
  if (!chartJsRegistered && import.meta.client) {
    Chart.register(...registerables)
    chartJsRegistered = true
  }
}

function destroyChart(type: string, canvas?: HTMLCanvasElement | null) {
  const mapped = charts.get(type)
  if (mapped) {
    mapped.destroy()
    charts.delete(type)
  }
  if (canvas) {
    const existing = Chart.getChart(canvas)
    existing?.destroy()
  }
}

function createChart(type: string, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')
  if (!ctx)
    return

  ensureChartJs()
  destroyChart(type, canvas)

  const currentData = chartData.value[type as keyof typeof chartData.value]
  const chartType = chartTypes.value[type]

  if (!currentData.labels.length || !currentData.data.length)
    return
  if (currentData.labels.length !== currentData.data.length)
    return

  const chart = new Chart(ctx, {
    type: chartType as 'pie' | 'bar',
    data: {
      labels: currentData.labels,
      datasets: [{
        label: analysisTypes.value.find(item => item.value === type)?.text || '',
        data: currentData.data,
        backgroundColor: chartType === 'pie' ? chartColors.pie : chartColors.bar,
        borderWidth: chartType === 'pie' ? 2 : 0,
        borderColor: chartType === 'pie' ? '#ffffff' : undefined,
        maxBarThickness: 100,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: chartType === 'pie' ? 'right' : 'top',
          labels: {
            padding: 10,
            font: { size: 11 },
          },
        },
        title: {
          display: true,
          font: { size: 14 },
          padding: { top: 0, bottom: 10 },
        },
      },
      scales: chartType === 'bar'
        ? {
            y: {
              beginAtZero: true,
              grid: { color: '#f0f0f0' },
              ticks: {
                stepSize: 1,
                callback(this: Scale<CoreScaleOptions>, value: number | string) {
                  return Math.floor(Number(value))
                },
              },
              max: type === 'consecutive' ? 8 : undefined,
            },
          }
        : undefined,
    },
  })

  charts.set(type, chart)
}

function recreateVisibleCharts() {
  if (!import.meta.client)
    return
  nextTick(() => {
    analysisTypes.value.forEach((type) => {
      const current = chartData.value[type.value]
      if (!current.labels.length || !current.data.length)
        return
      const canvas = document.querySelector(`#chart-${type.value}`) as HTMLCanvasElement | null
      if (canvas)
        createChart(type.value, canvas)
    })
  })
}

watch(chartData, () => {
  recreateVisibleCharts()
}, { immediate: true })

watch(locale, () => {
  recreateVisibleCharts()
})

async function onConfirm({ selectedOptions }: { selectedOptions: { text: string, value: number }[] }) {
  if (!selectedOptions?.[0])
    return

  selectedPeriod.value = selectedOptions[0].value
  showPicker.value = false
  await refresh()
}

function onCancel() {
  showPicker.value = false
}

function switchChartType(type: string, chartType: 'pie' | 'bar') {
  if (!import.meta.client)
    return
  if (chartTypes.value[type] === chartType)
    return

  chartTypes.value[type] = chartType

  const currentData = chartData.value[type as keyof typeof chartData.value]
  if (!currentData.labels.length || !currentData.data.length)
    return

  nextTick(() => {
    const canvas = document.querySelector(`#chart-${type}`) as HTMLCanvasElement | null
    if (canvas)
      createChart(type, canvas)
  })
}

function cleanupAllCharts() {
  charts.forEach((chart) => {
    chart.destroy()
  })
  charts.clear()

  analysisTypes.value.forEach((type) => {
    const canvas = document.querySelector(`#chart-${type.value}`) as HTMLCanvasElement | null
    if (canvas)
      Chart.getChart(canvas)?.destroy()
  })
}

onMounted(() => {
  if (import.meta.client && advancedData.value) {
    ensureChartJs()
    recreateVisibleCharts()
  }
})

onUnmounted(() => {
  cleanupAllCharts()
})
</script>

<template>
  <div class="advanced_statistics">
    <div class="period_selector mb-4">
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
      <VanLoading type="spinner" vertical>
        {{ t('statistics.advanced.loading') }}
      </VanLoading>
    </div>

    <div v-else-if="fetchError" class="state_box">
      <div class="state_box__error">
        {{ fetchError.message || t('statistics.advanced.fetch_failed') }}
      </div>
    </div>

    <div v-else-if="advancedData" class="analysis_modules">
      <div
        v-for="type in analysisTypes"
        :key="type.value"
        class="analysis_module"
      >
        <div class="module_header">
          <h5 class="module_title">
            {{ type.text }}
          </h5>
          <div class="button_group">
            <van-button
              size="mini"
              :type="chartTypes[type.value] === 'pie' ? 'primary' : 'default'"
              @click="switchChartType(type.value, 'pie')"
            >
              {{ t('statistics.advanced.pie_chart') }}
            </van-button>
            <van-button
              size="mini"
              :type="chartTypes[type.value] === 'bar' ? 'primary' : 'default'"
              @click="switchChartType(type.value, 'bar')"
            >
              {{ t('statistics.advanced.bar_chart') }}
            </van-button>
          </div>
        </div>
        <div class="chart_wrapper">
          <canvas :id="`chart-${type.value}`" />
        </div>
        <div class="chart_description">
          {{ analysisDescriptions[type.value] }}
        </div>
      </div>
    </div>

    <div v-else class="state_box">
      <div class="state_box__empty">
        {{ t('statistics.advanced.empty') }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.advanced_statistics {
  padding: 12px;
  background-color: #f7f8fa;
  min-height: 100vh;
  max-width: 600px;
  margin: 0 auto;
}

.dark .advanced_statistics {
  background-color: #1a1a1a;
}

.state_box {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  background: #fff;
  border-radius: 6px;
  margin: 12px 0;
  padding: 20px;

  &__error {
    color: #ef4444;
    text-align: center;
  }

  &__empty {
    color: #6b7280;
    text-align: center;
  }
}

.dark .state_box {
  background: #2a2a2a;
}

.analysis_modules {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background-color: #fff;
}

.dark .analysis_modules {
  background-color: #2a2a2a;
}

.analysis_module {
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

.dark .analysis_module {
  background: #333;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

.module_header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: nowrap;
  gap: 8px;
}

.module_title {
  font-size: 14px !important;
  font-weight: 500;
  margin: 0 !important;
  color: #333;
}

.dark .module_title {
  color: #fff;
}

.button_group {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.chart_wrapper {
  position: relative;
  height: 320px;

  canvas {
    width: 100% !important;
    height: 100% !important;
  }
}

.chart_description {
  margin-top: 12px;
  padding: 8px;
  color: #666;
  font-size: 13px;
  line-height: 1.5;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.dark .chart_description {
  color: #ccc;
  background-color: #444;
}

:deep(.van-button--mini) {
  min-width: 40px;
  padding: 0 8px;
  font-size: 12px;
  height: 24px;
  line-height: 22px;
}

:deep(.van-button--primary) {
  background-color: #0f766e;
  border-color: #0f766e;
}
</style>
