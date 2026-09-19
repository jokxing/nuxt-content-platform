<script setup lang="ts">
interface Props {
  type?: string
  data: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  type: 'WebPage',
})

const jsonLd = computed(() => ({
  '@context': 'https://schema.org',
  '@type': props.type,
  ...props.data,
}))

useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: serializeJsonLd(jsonLd.value),
    },
  ],
}))
</script>

<template>
  <span hidden aria-hidden="true" />
</template>
