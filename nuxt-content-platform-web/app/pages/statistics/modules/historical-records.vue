<script setup lang="ts">
/**
 * 历史记录模块（2.2-8）
 * BUSINESS_MAPPING.historyDraws → 历史记录列表；字段名仍兼容 draw_* Mock
 */
import { MOCK_CLOCK_ISO } from '~/mock/brand'
import { MOCK_HISTORY } from '~/mock/data/catalog'

const api = useContentApi()

const { t } = useI18n()

const error = ref<string | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = ref(0)
const isRequesting = ref(false)

interface FormData {
  recent?: string
  year?: number
  period?: string
  specific_number?: number
  special_type?: string
}

const formData = ref<FormData>({
  recent: '20',
})

const hasInitialized = ref(false)

const { data: records, error: fetchError, pending } = await useAsyncData(
  'historicalRecords',
  async () => {
    if (isRequesting.value)
      return []

    isRequesting.value = true

    try {
      const params: Record<string, string | number> = {
        page: currentPage.value,
        page_size: pageSize.value,
      }

      if (formData.value.recent)
        params.periods = Number(formData.value.recent)
      if (formData.value.year)
        params.year = formData.value.year
      if (formData.value.period)
        params.draw_number = formData.value.period
      if (formData.value.specific_number)
        params.number = formData.value.specific_number

      const result = await api.get<{
        data: Array<Record<string, any>>
        total: number
        total_pages: number
      }>('/api/history', { params })

      const formattedRecords = (result.data || []).map(item => ({
        id: item.draw_number,
        date: item.draw_date,
        numbers: [
          formatNumber(item.num1),
          formatNumber(item.num2),
          formatNumber(item.num3),
          formatNumber(item.num4),
          formatNumber(item.num5),
          formatNumber(item.num6),
        ],
        special: formatNumber(item.special_number),
      }))

      total.value = result.total
      totalPages.value = result.total_pages
      error.value = null
      return formattedRecords
    }
    catch (err) {
      error.value = t('statistics.history.fetch_failed')
      throw err
    }
    finally {
      isRequesting.value = false
    }
  },
  {
    default: () => [],
    server: true,
    lazy: false,
    watch: [currentPage, () => formData.value],
    transform: data => data || [],
  },
)

watch(() => formData.value, () => {
  if (hasInitialized.value)
    currentPage.value = 1
}, { deep: true, immediate: true })

const mockYear = Number(MOCK_CLOCK_ISO.slice(0, 4)) || 2026

function generatePeriodOptions() {
  return MOCK_HISTORY.map((row) => {
    const value = row.draw_number
    return {
      label: t('statistics.history.form.period_label', { period: value }),
      value,
    }
  })
}

function generateYearOptions() {
  return Array.from({ length: 3 }, (_, i) => {
    const year = mockYear - i
    return {
      label: t('statistics.history.form.year_label', { year }),
      value: year,
    }
  })
}

function generateNumberOptions() {
  return Array.from({ length: 49 }, (_, i) => {
    const num = i + 1
    return {
      label: String(num).padStart(2, '0'),
      value: num,
    }
  })
}

const recentOptions = [
  { label: t('statistics.history.form.recent_10'), value: '10' },
  { label: t('statistics.history.form.recent_20'), value: '20' },
  { label: t('statistics.history.form.recent_30'), value: '30' },
  { label: t('statistics.history.form.recent_50'), value: '50' },
  { label: t('statistics.history.form.recent_100'), value: '100' },
]

const formConfig = [
  {
    type: 'select',
    title: t('statistics.history.form.recent'),
    field: 'recent',
    props: { options: recentOptions },
  },
  {
    type: 'select',
    title: t('statistics.history.form.year'),
    field: 'year',
    props: { options: generateYearOptions() },
  },
  {
    type: 'select',
    title: t('statistics.history.form.period'),
    field: 'period',
    props: { options: generatePeriodOptions() },
  },
  {
    type: 'select',
    title: t('statistics.history.form.specific_number'),
    field: 'specific_number',
    props: { options: generateNumberOptions() },
  },
]

function formatNumber(num: number): string {
  return String(num).padStart(2, '0')
}

function handleSearch() {
  // BasicForm submit：watch 已驱动刷新
}

watch(records, (newRecords, oldRecords) => {
  if (import.meta.client && newRecords?.length && oldRecords?.length) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
})

watch(fetchError, (err) => {
  if (err && currentPage.value > 1)
    currentPage.value = currentPage.value - 1
})

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value)
    currentPage.value = page
}

function getVisiblePages() {
  const pages: number[] = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let i = 1; i <= total; i++)
      pages.push(i)
  }
  else if (current <= 4) {
    for (let i = 1; i <= 5; i++)
      pages.push(i)
    pages.push(-1, total)
  }
  else if (current >= total - 3) {
    pages.push(1, -1)
    for (let i = total - 4; i <= total; i++)
      pages.push(i)
  }
  else {
    pages.push(1, -1)
    for (let i = current - 1; i <= current + 1; i++)
      pages.push(i)
    pages.push(-1, total)
  }

  return pages
}

function handleFieldChange(_change: { field: string, value: any, oldValue: any }) {
  // v-model 已更新 formData
}

function handleQuickSearch() {
  formData.value = { recent: '20' }
}

onMounted(() => {
  hasInitialized.value = true
})
</script>

<template>
  <div class="historical_records">
    <BasicForm
      v-model:value="formData"
      :form-config="formConfig"
      :show-label="false"
      @submit="handleSearch"
      @field-change="handleFieldChange"
    >
      <template #buttons>
        <van-button
          class="quick_view_btn"
          color="#0f766e"
          @click="handleQuickSearch"
        >
          {{ t('statistics.history.form.recent_20') }}
        </van-button>
      </template>
    </BasicForm>

    <div v-if="pending" class="state_box">
      <van-loading type="spinner" size="24px" color="#0f766e" />
      <span class="state_box__text">{{ t('common.loading') }}</span>
    </div>

    <div v-else-if="fetchError || error" class="state_box">
      <van-empty :description="t('statistics.history.fetch_failed')" />
    </div>

    <div v-else-if="records && records.length > 0" class="records_list">
      <div
        v-for="record in records"
        :key="record.id"
        class="record_item"
      >
        <div class="record_item__header">
          <span class="record_item__id">{{ record.id }}</span>
          <span class="record_item__date">{{ record.date }}</span>
        </div>
        <div class="record_item__numbers">
          <BallNumber
            v-for="(number, index) in record.numbers"
            :key="index"
            :number="number"
            :size="36"
          />
          <div class="record_item__sep">
            +
          </div>
          <BallNumber
            :number="record.special"
            :size="36"
          />
        </div>
      </div>

      <div v-if="totalPages > 1" class="pagination">
        <van-button
          :disabled="currentPage <= 1"
          size="small"
          @click="goToPage(currentPage - 1)"
        >
          {{ t('statistics.history.prev_page') }}
        </van-button>

        <div class="pagination__pages">
          <template v-for="page in getVisiblePages()" :key="page">
            <van-button
              v-if="page !== -1"
              :type="page === currentPage ? 'primary' : 'default'"
              :color="page === currentPage ? '#0f766e' : undefined"
              size="small"
              @click="goToPage(page)"
            >
              {{ page }}
            </van-button>
            <span v-else class="pagination__ellipsis">...</span>
          </template>
        </div>

        <van-button
          :disabled="currentPage >= totalPages"
          size="small"
          @click="goToPage(currentPage + 1)"
        >
          {{ t('statistics.history.next_page') }}
        </van-button>
      </div>
    </div>

    <div v-else class="state_box">
      <van-empty :description="t('common.no_data')" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.historical_records {
  padding: 16px;
  background-color: #f7f8fa;
  min-height: 100vh;
}

:deep(.basic-form) {
  padding: 0;
}

.state_box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;

  &__text {
    margin-top: 12px;
    color: #999;
    font-size: 14px;
  }
}

.records_list {
  .record_item {
    background: #fff;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    &__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    &__id {
      font-weight: 600;
      color: #333;
      font-size: 16px;
    }

    &__date {
      color: #666;
      font-size: 14px;
    }

    &__numbers {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    &__sep {
      color: #999;
      font-size: 16px;
      margin: 0 4px;
    }
  }
}

.quick_view_btn {
  margin-left: 12px;
  height: 34px;
  border-radius: 8px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &__pages {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__ellipsis {
    color: #999;
    padding: 0 8px;
  }
}

.dark .historical_records {
  background-color: #1a1a1a;

  .record_item {
    background: #2a2a2a !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2) !important;

    &__id {
      color: #fff !important;
    }

    &__date {
      color: #ccc !important;
    }

    &__sep {
      color: #aaa !important;
    }
  }
}
</style>
