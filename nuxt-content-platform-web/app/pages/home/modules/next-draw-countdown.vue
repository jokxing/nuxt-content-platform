<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { MOCK_CLOCK_ISO } from '~/mock/brand'
import { useDatasetStore } from '~/stores/dataset'
import { calculateTimeDifference } from '~/utils/timezone'

const { locale, t } = useI18n()
const datasetStore = useDatasetStore()
const runtimeConfig = useRuntimeConfig()

const countdown = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
})

/** Mock：从固定时钟起算，客户端每秒推进，SSR/首屏一致 */
const mockElapsedMs = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

function getNowMs() {
  if (runtimeConfig.public.useMock !== false)
    return new Date(MOCK_CLOCK_ISO).getTime() + mockElapsedMs.value
  return undefined
}

function calculateCountdown() {
  if (!datasetStore.nextReleaseDateTime)
    return

  const timeDiff = calculateTimeDifference(datasetStore.nextReleaseDateTime, getNowMs())

  if (timeDiff.total <= 0) {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return
  }

  countdown.value = {
    days: timeDiff.days,
    hours: timeDiff.hours,
    minutes: timeDiff.minutes,
    seconds: timeDiff.seconds,
  }
}

function startCountdown() {
  calculateCountdown()
  if (timer)
    clearInterval(timer)
  timer = setInterval(() => {
    if (runtimeConfig.public.useMock !== false)
      mockElapsedMs.value += 1000
    calculateCountdown()
  }, 1000)
}

watch(() => datasetStore.nextReleaseDateTime, (newVal) => {
  if (newVal)
    startCountdown()
})

// SSR / 首屏：用 Mock 时钟算出一致初值，避免水合闪烁
if (datasetStore.nextReleaseDateTime)
  calculateCountdown()

onMounted(() => {
  if (datasetStore.nextReleaseDateTime)
    startCountdown()
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

function formatMetric(value: number) {
  const localeTag = locale.value === 'zh-CN' ? 'zh-CN' : locale.value === 'en-US' ? 'en-US' : 'zh-HK'
  return new Intl.NumberFormat(localeTag).format(value)
}
</script>

<template>
  <VanCellGroup class="!mt-10" inset>
    <VanCell>
      <template #title>
        <div class="text-center w-full">
          <div class="mb-2">
            <h3 class="text-base text-gray-800 font-medium dark:text-gray-200">
              {{ t('home.next_draw.title') }}
            </h3>
          </div>
          <div class="text-xs text-gray-500 mb-4">
            {{ t('home.next_draw.period_prefix') }}{{ datasetStore.nextRelease?.number }}{{ t('home.next_draw.period_suffix') }}
            {{ t('home.next_draw.draw_time') }}: {{ datasetStore.nextReleaseDateTime }}
          </div>
          <div class="flex gap-4 items-center justify-center">
            <div class="flex items-center">
              <span class="countdown-number text-red-500">{{ countdown.days }}</span>
              <span class="text-xs text-gray-500">{{ t('home.next_draw.days') }}</span>
            </div>
            <span class="text-16px text-gray-400 font-bold">:</span>
            <div class="flex items-center">
              <span class="countdown-number text-red-500">{{ countdown.hours }}</span>
              <span class="text-xs text-gray-500">{{ t('home.next_draw.hours') }}</span>
            </div>
            <span class="text-16px text-gray-400 font-bold">:</span>
            <div class="flex items-center">
              <span class="countdown-number text-red-500">{{ countdown.minutes }}</span>
              <span class="text-xs text-gray-500">{{ t('home.next_draw.minutes') }}</span>
            </div>
            <span class="text-16px text-gray-400 font-bold">:</span>
            <div class="flex items-center">
              <span class="countdown-number text-red-500">{{ countdown.seconds }}</span>
              <span class="text-xs text-gray-500">{{ t('home.next_draw.seconds') }}</span>
            </div>
          </div>

          <div v-if="datasetStore.nextRelease" class="text-base text-red-500 font-bold mt-4">
            {{ t('home.next_draw.jackpot') }}: {{ formatMetric(datasetStore.nextRelease.target) }}
          </div>
        </div>
      </template>
    </VanCell>
  </VanCellGroup>
</template>

<style>
.countdown-number {
  font-size: var(--font-size-2xl);
  line-height: var(--line-height-none);
  font-weight: 700;
  min-width: 2.5ch;
  text-align: center;
}
</style>
