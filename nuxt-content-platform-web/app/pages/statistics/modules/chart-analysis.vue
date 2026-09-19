<script setup lang="ts">
/**
 * 间隔/遗漏图表模块（2.2-10）
 * BUSINESS_MAPPING.numberMiss → 间隔 / 遗漏类指标；保留分组切换与卸载清理
 */
import { Chart, registerables } from 'chart.js'
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix'

const props = defineProps<{
  period?: number
}>()

const api = useContentApi()

const { t } = useI18n()
const chartCanvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null
let chartJsRegistered = false

const currentPage = ref(1)
const currentNumberGroup = ref(1)
const chartType = ref<'bar' | 'matrix'>('bar')

const numberGroups = [
  { text: '01-10', value: 1 },
  { text: '11-20', value: 2 },
  { text: '21-30', value: 3 },
  { text: '31-40', value: 4 },
  { text: '41-49', value: 5 },
]

interface MissStat {
  number: number
  current_miss: number
  max_miss: number
  avg_miss: number
  most_freq_miss: number
  max_streak: number
}

const { data: chartData, error: fetchError, pending } = await useAsyncData(
  'chartAnalysisData',
  async () => {
    try {
      const result = await api.get<{ number_stats?: MissStat[] }>(
        '/api/number-miss',
        { params: { period: props.period || 10 } },
      )
      return result.number_stats || []
    }
    catch {
      throw createError({
        statusCode: 500,
        statusMessage: t('statistics.chart.fetch_failed'),
      })
    }
  },
  {
    default: () => [] as MissStat[],
    server: false,
    lazy: false,
    watch: [() => props.period],
  },
)

function ensureChartJs() {
  if (!chartJsRegistered && import.meta.client) {
    Chart.register(...registerables, MatrixController, MatrixElement)
    chartJsRegistered = true
  }
}

function destroyChart() {
  if (chart) {
    chart.destroy()
    chart = null
  }
}

function getNumberGroupRange(group: number) {
  const start = (group - 1) * 10 + 1
  const end = group === 5 ? 49 : start + 9
  return { start, end }
}

function getLabels(page: number) {
  const { start, end } = getNumberGroupRange(page)
  return Array.from({ length: end - start + 1 }, (_, i) => (start + i).toString().padStart(2, '0'))
}

function generateBarData(page: number) {
  const { start, end } = getNumberGroupRange(page)
  const pageNumbers = chartData.value?.slice(start - 1, end) || []

  return {
    labels: getLabels(page),
    datasets: [
      {
        label: t('statistics.chart.current_streak'),
        data: pageNumbers.map(item => item.current_miss),
        backgroundColor: '#0f766e',
        barPercentage: 0.6,
      },
      {
        label: t('statistics.chart.max_streak'),
        data: pageNumbers.map(item => item.max_miss),
        backgroundColor: '#ef4444',
        barPercentage: 0.6,
      },
      {
        label: t('statistics.chart.avg_streak'),
        data: pageNumbers.map(item => Number(Number(item.avg_miss ?? 0).toFixed(2))),
        backgroundColor: '#0ea5e9',
        barPercentage: 0.6,
      },
      {
        label: t('statistics.chart.most_frequent_streak'),
        data: pageNumbers.map(item => item.most_freq_miss),
        backgroundColor: '#8b5cf6',
        barPercentage: 0.6,
      },
    ],
  }
}

function generateMatrixData() {
  const { start, end } = getNumberGroupRange(currentNumberGroup.value)
  const groupNumbers = chartData.value?.slice(start - 1, end) || []

  return groupNumbers.map((item, index) => ({
    x: index,
    y: Math.min(13, Math.max(0, Math.ceil((item.current_miss - 5) / 5))),
    v: item.max_streak,
    number: item.number,
  }))
}

function isDarkMode() {
  return import.meta.client && document.documentElement.classList.contains('dark')
}

function createBarChart(ctx: CanvasRenderingContext2D) {
  const darkMode = isDarkMode()

  return new Chart(ctx, {
    type: 'bar',
    data: generateBarData(currentPage.value),
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            boxWidth: 12,
            padding: 15,
            font: { size: 12 },
            color: darkMode ? '#fff' : '#666',
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: darkMode ? '#fff' : '#666' },
        },
        y: {
          beginAtZero: true,
          grid: { color: darkMode ? '#444' : '#f0f0f0' },
          ticks: {
            stepSize: 1,
            color: darkMode ? '#fff' : '#666',
          },
        },
      },
    },
  })
}

function createMatrixChart(ctx: CanvasRenderingContext2D) {
  const missRanges = ['0-5', '6-10', '11-15', '16-20', '21-25', '26-30', '31-35', '36-40', '41-45', '46-50', '51-55', '56-60', '61-65', '66+']
  const { start, end } = getNumberGroupRange(currentNumberGroup.value)
  const darkMode = isDarkMode()

  return new Chart(ctx, {
    type: 'matrix',
    data: {
      datasets: [{
        label: t('statistics.chart.heatmap_title'),
        data: generateMatrixData(),
        width: ({ chart: c }) => ((c.chartArea || {}).width / (end - start + 1) - 1),
        height: ({ chart: c }) => ((c.chartArea || {}).height / missRanges.length - 1),
        backgroundColor(ctx) {
          const value = (ctx.dataset.data[ctx.dataIndex] as any)?.v || 0
          const alpha = Math.min(1, value / 3)
          return `rgba(15, 118, 110, ${alpha})`
        },
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'linear',
          offset: true,
          min: 0,
          max: end - start,
          ticks: {
            stepSize: 1,
            color: darkMode ? '#fff' : '#666',
            callback(value) {
              return (start + Number(value)).toString().padStart(2, '0')
            },
          },
          grid: { display: false },
          title: { display: false },
        },
        y: {
          type: 'linear',
          offset: true,
          min: 0,
          max: missRanges.length - 1,
          ticks: {
            stepSize: 1,
            padding: 5,
            color: darkMode ? '#fff' : '#666',
            callback(value) {
              return missRanges[Number(value)]
            },
          },
          grid: { display: false },
          title: {
            display: true,
            text: t('statistics.chart.miss_range'),
            color: darkMode ? '#fff' : '#666',
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            title() {
              return ''
            },
            label(ctx) {
              const data = ctx.dataset.data[ctx.dataIndex] as any
              if (!data)
                return []
              const stats = chartData.value?.[data.number - 1]
              if (!stats)
                return []
              return [
                `${t('statistics.chart.number')}: ${data.number}`,
                `${t('statistics.chart.current_miss')}: ${stats.current_miss}`,
                `${t('statistics.chart.max_streak')}: ${data.v}`,
              ]
            },
          },
        },
        legend: { display: false },
      },
    },
  })
}

function renderChart() {
  if (!import.meta.client || !chartCanvas.value)
    return
  ensureChartJs()
  destroyChart()
  const ctx = chartCanvas.value.getContext('2d')
  if (!ctx)
    return
  chart = chartType.value === 'bar' ? createBarChart(ctx) : createMatrixChart(ctx)
}

function switchChartType(type: 'bar' | 'matrix') {
  chartType.value = type
  renderChart()
}

function handleNumberGroupChange(group: number) {
  currentNumberGroup.value = group
  if (chartType.value === 'matrix')
    renderChart()
}

function handlePageChange(page: number) {
  currentPage.value = page
  if (chartType.value === 'bar' && chart) {
    chart.data = generateBarData(page)
    chart.update()
  }
}

watch(chartData, (newData) => {
  if (newData && newData.length > 0)
    nextTick(() => renderChart())
}, { immediate: true })

onMounted(() => {
  if (chartData.value?.length)
    renderChart()
})

onUnmounted(() => {
  destroyChart()
})
</script>

<template>
  <div class="chart_analysis">
    <div class="section_title mb-2">
      <van-icon name="chart-trending-o" color="#0f766e" size="20" />
      <span class="ml-2">{{ t('statistics.chart.title') }}</span>

      <div class="chart_type_switch ml-auto">
        <van-button-group>
          <van-button
            size="small"
            :color="chartType === 'bar' ? '#0f766e' : undefined"
            :type="chartType === 'bar' ? 'primary' : 'default'"
            @click="switchChartType('bar')"
          >
            {{ t('statistics.chart.occurrence') }}
          </van-button>
          <van-button
            size="small"
            :color="chartType === 'matrix' ? '#0f766e' : undefined"
            :type="chartType === 'matrix' ? 'primary' : 'default'"
            @click="switchChartType('matrix')"
          >
            {{ t('statistics.chart.heatmap') }}
          </van-button>
        </van-button-group>
      </div>
    </div>

    <div v-if="pending" class="chart_container state_box">
      <van-loading type="spinner" color="#0f766e" />
      <span class="state_box__text">{{ t('statistics.chart.loading') }}</span>
    </div>

    <div v-else-if="fetchError" class="chart_container state_box state_box--error">
      {{ t('statistics.chart.fetch_failed') }}
    </div>

    <div v-else-if="chartData && chartData.length > 0" class="chart_container">
      <canvas ref="chartCanvas" :height="chartType === 'matrix' ? 400 : 300" />
    </div>

    <div v-else class="chart_container state_box">
      {{ t('common.no_data') }}
    </div>

    <div
      v-if="chartType === 'bar' && chartData && chartData.length > 0"
      class="pagination mt-4 flex items-center justify-center"
    >
      <van-space>
        <van-button
          v-for="page in 5"
          :key="page"
          size="small"
          :color="currentPage === page ? '#0f766e' : undefined"
          :type="currentPage === page ? 'primary' : 'default'"
          @click="handlePageChange(page)"
        >
          {{ ((page - 1) * 10 + 1).toString().padStart(2, '0') }}-{{ page === 5 ? '49' : (page * 10).toString().padStart(2, '0') }}
        </van-button>
      </van-space>
    </div>

    <div
      v-if="chartType === 'bar' && chartData && chartData.length > 0"
      class="chart_description mt-4"
    >
      <p class="chart_description__title">
        {{ t('statistics.chart.indicators_title') }}
      </p>
      <ul class="chart_description__list">
        <li>{{ t('statistics.chart.current_miss_desc') }}</li>
        <li>{{ t('statistics.chart.max_miss_desc') }}</li>
        <li>{{ t('statistics.chart.avg_miss_desc') }}</li>
        <li>{{ t('statistics.chart.most_freq_miss_desc') }}</li>
      </ul>
    </div>

    <div
      v-if="chartType === 'matrix' && chartData && chartData.length > 0"
      class="number_group_tabs"
    >
      <van-space>
        <van-button
          v-for="group in numberGroups"
          :key="group.value"
          size="small"
          :color="currentNumberGroup === group.value ? '#0f766e' : undefined"
          :type="currentNumberGroup === group.value ? 'primary' : 'default'"
          @click="handleNumberGroupChange(group.value)"
        >
          {{ group.text }}
        </van-button>
      </van-space>
    </div>

    <div
      v-if="chartType === 'matrix' && chartData && chartData.length > 0"
      class="chart_description mt-6"
    >
      <p class="chart_description__body">
        {{ t('statistics.chart.heatmap_desc') }}
      </p>
      <p class="chart_description__tip">
        {{ t('statistics.chart.heatmap_tip') }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chart_analysis {
  padding: 8px;
  background: #fff;
  border-radius: 8px;
}

.section_title {
  display: flex;
  align-items: center;
  font-size: 16px;
  font-weight: 700;
  color: #333;
  padding: 8px;
}

.chart_type_switch {
  margin-left: auto;
}

.number_group_tabs {
  display: flex;
  justify-content: center;
  padding: 8px 0;
  margin-top: 8px;
}

.chart_container {
  position: relative;
  width: 100%;
  overflow-x: auto;
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  margin: 8px 0;
  min-height: 120px;
}

.state_box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 14px;

  &__text {
    margin-top: 12px;
    color: #999;
  }

  &--error {
    color: #ef4444;
  }
}

.chart_description {
  text-align: left;
  color: #666;
  font-size: 12px;
  line-height: 1.7;
  padding: 12px 16px;
  margin-top: 8px;
  background: #f8faf9;
  border-radius: 6px;

  &__title {
    margin: 0 0 10px;
    font-size: 13px;
    font-weight: 600;
    color: #4b5563;
    line-height: 1.5;
  }

  &__list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;

    li {
      margin: 0;
      padding: 0;
      color: #6b7280;
      font-size: 12px;
      line-height: 1.7;
    }
  }

  &__body {
    margin: 0;
    color: #4b5563;
    line-height: 1.7;
  }

  &__tip {
    margin: 10px 0 0;
    color: #6b7280;
    line-height: 1.7;
  }
}

.dark .chart_description {
  background: #333;
  color: #ccc;

  .chart_description__title {
    color: #e5e7eb;
  }

  .chart_description__list li,
  .chart_description__tip {
    color: #d1d5db;
  }

  .chart_description__body {
    color: #e5e7eb;
  }
}

.pagination {
  :deep(.van-button) {
    margin: 0 4px;
  }
}

.dark .chart_analysis {
  background: #2a2a2a;
}

.dark .section_title {
  color: #fff;
}

.dark .chart_container {
  border-color: #444;
}
</style>
