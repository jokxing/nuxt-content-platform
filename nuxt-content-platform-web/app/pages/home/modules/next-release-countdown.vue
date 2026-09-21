<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { formatPublishDateForDisplay } from '~/utils/publishTime'
import { useDatasetStore } from '~/stores/dataset'
import { calculateTimeDifference } from '~/utils/timezone'

const { t, locale } = useI18n()
const datasetStore = useDatasetStore()
const countdown = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
})

let timer: ReturnType<typeof setInterval> | null = null
const countdownVisible = ref(false)

const scheduledLabel = computed(() => {
  const scheduledAt = datasetStore.nextRelease?.scheduled_at
  if (!scheduledAt)
    return ''
  const localeTag = locale.value === 'zh-CN' ? 'zh-CN' : locale.value === 'en-US' ? 'en-US' : 'zh-HK'
  return formatPublishDateForDisplay(scheduledAt, localeTag)
})
function calculateCountdown() {
  if (!datasetStore.nextReleaseDateTime) {
    countdownVisible.value = false
    return
  }

  const timeDiff = calculateTimeDifference(datasetStore.nextReleaseDateTime)

  if (timeDiff.total <= 0) {
    countdownVisible.value = false
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return
  }

  countdownVisible.value = true
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
  if (!countdownVisible.value)
    return
  timer = setInterval(() => {
    calculateCountdown()
  }, 1000)
}

watch(() => datasetStore.nextReleaseDateTime, () => {
  if (datasetStore.nextReleaseDateTime) {
    startCountdown()
  }
  else if (timer) {
    clearInterval(timer)
    timer = null
  }
})

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
</script>

<template>
  <VanCellGroup v-if="countdownVisible" class="!mt-10" inset>
    <VanCell>
      <template #title>
        <div class="text-center w-full">
          <div class="mb-2">
            <h3 class="text-base text-gray-800 font-medium dark:text-gray-200">
              {{ t('home.next_release.title') }}
            </h3>
          </div>
          <div class="text-xs text-gray-500 mb-4">
            {{ t('home.next_release.period_prefix') }}{{ datasetStore.nextRelease?.period_code }}{{ t('home.next_release.period_suffix') }}
            {{ t('home.next_release.draw_time') }}: {{ scheduledLabel }}
          </div>
          <div class="flex gap-4 items-center justify-center">
            <div class="flex items-center">
              <span class="countdown-number text-red-500">{{ countdown.days }}</span>
              <span class="text-xs text-gray-500">{{ t('home.next_release.days') }}</span>
            </div>
            <span class="text-16px text-gray-400 font-bold">:</span>
            <div class="flex items-center">
              <span class="countdown-number text-red-500">{{ countdown.hours }}</span>
              <span class="text-xs text-gray-500">{{ t('home.next_release.hours') }}</span>
            </div>
            <span class="text-16px text-gray-400 font-bold">:</span>
            <div class="flex items-center">
              <span class="countdown-number text-red-500">{{ countdown.minutes }}</span>
              <span class="text-xs text-gray-500">{{ t('home.next_release.minutes') }}</span>
            </div>
            <span class="text-16px text-gray-400 font-bold">:</span>
            <div class="flex items-center">
              <span class="countdown-number text-red-500">{{ countdown.seconds }}</span>
              <span class="text-xs text-gray-500">{{ t('home.next_release.seconds') }}</span>
            </div>
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
