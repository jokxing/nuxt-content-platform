<script setup lang="ts">
import type { DemoCombinationsDto } from '~/api/models'
import { formatPublishDateForDisplay } from '~/utils/publishTime'

const api = useContentApi()

const { locale, t } = useI18n()

const { data: sample, error, pending } = await useAsyncData(() => `luckyNumber-${locale.value}`, async () => {
  const lang = locale.value === 'zh-CN' ? 'sc' : locale.value === 'en-US' ? 'en' : 'tc'
  const result = await api.get<DemoCombinationsDto>('/api/demo-combinations', { params: { lang } })
  if (!result?.featured || !Array.isArray(result.featured.numbers) || result.featured.numbers.length === 0)
    throw new Error('Invalid sample number data structure')
  if (result.is_generated !== false || result.source !== 'fixed_demo')
    throw new Error('Invalid sample number data structure')
  return result
}, {
  server: true,
  lazy: false,
  default: () => null,
})

const updateTimeLabel = computed(() => {
  if (!sample.value?.generated_at)
    return ''
  const localeTag = locale.value === 'zh-CN' ? 'zh-CN' : locale.value === 'en-US' ? 'en-US' : 'zh-HK'
  return formatPublishDateForDisplay(sample.value.generated_at, localeTag)
})

function formatReason(text: string) {
  if (!text)
    return ''

  text = text.replace(/\*\*([^*]+)\*\*/g, '<span class="font-medium text-gray-800 dark:text-gray-200">$1</span>')
  text = text.replace(/\*\*(\d+(?:-\d+)*)\*\*/g, '<span class="font-medium text-red-500">$1</span>')
  text = text.replace(/^(\s*)-\s/gm, '$1• ')
  text = text.split('\n').map(line => line.trim()).join('\n')
  return text
}
</script>

<template>
  <VanCellGroup class="!mt-10" inset>
    <VanCell>
      <template #title>
        <div class="text-center w-full">
          <div class="mb-3">
            <h3 class="text-base text-gray-800 font-medium dark:text-gray-200">
              {{ t('home.recommend.numbers_title') }}
            </h3>
          </div>

          <div v-if="pending" class="py-8 text-center">
            <VanLoading type="spinner" vertical>
              {{ t('common.loading') }}
            </VanLoading>
          </div>

          <div v-else-if="error" class="text-red-500 py-8 text-center">
            {{ error.message || t('home.recommend.fetch_failed') }}
          </div>

          <div v-else-if="!sample" class="text-gray-400 py-8 text-center">
            {{ t('common.no_data') }}
          </div>

          <template v-else>
            <div class="text-xs text-gray-500 mb-3">
              {{ t('home.recommend.fixed_sample') }} · is_generated={{ sample.is_generated }}
            </div>
            <div class="mb-4 flex flex-wrap gap-2 justify-center">
              <span
                v-for="tag in sample.featured.tags"
                :key="tag"
                class="text-xs text-gray-600 mx-2 px-4 py-2 b-rd-4 bg-gray-100 dark:text-gray-300 dark:bg-gray-800"
              >
                {{ tag }}
              </span>
            </div>

            <div class="my-10 flex flex-wrap gap-3 items-center justify-center">
              <BallNumber
                v-for="number in sample.featured.numbers"
                :key="number"
                :number="number"
              />
            </div>

            <div class="p-4 text-left rounded-lg dark:bg-gray-800">
              <h4 class="text-base text-gray-800 font-medium dark:text-gray-200 !mb-4">
                {{ t('home.recommend.recommendation_explanation') }}：
              </h4>
              <div
                class="text-xs text-gray-600 leading-relaxed whitespace-pre-line dark:text-gray-300"
                v-html="formatReason(sample.featured.reason)"
              />
            </div>

            <div class="text-xs text-gray-400 mt-3">
              {{ t('home.recommend.update_time') }}：{{ updateTimeLabel }}
            </div>
          </template>
        </div>
      </template>
    </VanCell>
  </VanCellGroup>
</template>

<style scoped>
:deep(.font-medium) {
  font-weight: 500;
}
</style>
