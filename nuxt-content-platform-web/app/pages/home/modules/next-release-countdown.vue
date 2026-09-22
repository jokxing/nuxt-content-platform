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

const isRefreshing = ref(false)
const countdownVisible = ref(false)
let countdownTimer: ReturnType<typeof setInterval> | null = null
let pollingTimer: ReturnType<typeof setInterval> | null = null
const POLLING_INTERVAL_MS = 60_000

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
    stopCountdown()
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

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

function stopPolling() {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

async function refreshLatest() {
  if (isRefreshing.value || (import.meta.client && document.hidden))
    return
  isRefreshing.value = true
  try {
    await refreshNuxtData('latestResult')
  }
  finally {
    isRefreshing.value = false
  }
}

function startPolling() {
  stopPolling()
  if (!import.meta.client || countdownVisible.value || document.hidden)
    return
  pollingTimer = setInterval(() => void refreshLatest(), POLLING_INTERVAL_MS)
}

function startCountdown() {
  stopPolling()
  calculateCountdown()
  stopCountdown()
  if (!countdownVisible.value) {
    startPolling()
    return
  }
  countdownTimer = setInterval(() => {
    calculateCountdown()
    if (!countdownVisible.value) {
      void refreshLatest()
      startPolling()
    }
  }, 1000)
}

watch(() => datasetStore.nextReleaseDateTime, () => {
  if (datasetStore.nextReleaseDateTime) {
    startCountdown()
  }
  else {
    countdownVisible.value = false
    stopCountdown()
    startPolling()
  }
})

if (datasetStore.nextReleaseDateTime)
  calculateCountdown()

onMounted(() => {
  if (datasetStore.nextReleaseDateTime)
    startCountdown()
  else
    startPolling()
})

function onVisibilityChange() {
  if (document.hidden) {
    stopPolling()
    return
  }
  void refreshLatest()
  if (!countdownVisible.value)
    startPolling()
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
})

onUnmounted(() => {
  stopCountdown()
  stopPolling()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <VanCellGroup class="!mt-10" inset>
    <VanCell>
      <template #title>
        <div class="text-center w-full">
          <div class="mb-2">
            <h3 class="text-base text-gray-800 font-medium dark:text-gray-200">
              {{ t(countdownVisible ? 'home.next_release.title' : 'home.next_release.waiting_title') }}
            </h3>
          </div>
          <div v-if="countdownVisible" class="text-xs text-gray-500 mb-4">
            {{ t('home.next_release.period_prefix') }}{{ datasetStore.nextRelease?.period_code }}{{ t('home.next_release.period_suffix') }}
            {{ t('home.next_release.draw_time') }}: {{ scheduledLabel }}
          </div>
          <div v-if="countdownVisible" class="flex gap-4 items-center justify-center">
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
          <div v-else class="text-sm text-gray-500">
            <p class="!my-2">
              {{ t('home.next_release.waiting_description', { period: datasetStore.latestPeriodCode || '-' }) }}
            </p>
            <VanButton
              class="!mt-2"
              size="small"
              type="primary"
              :loading="isRefreshing"
              @click="refreshLatest"
            >
              {{ t('home.next_release.check_now') }}
            </VanButton>
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
