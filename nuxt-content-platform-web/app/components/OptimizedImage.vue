<script setup lang="ts">
interface Props {
  src: string
  alt?: string
  width?: number | string
  height?: number | string
  loading?: 'lazy' | 'eager'
  placeholder?: string
  className?: string
  sizes?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  loading: 'lazy',
  placeholder: '',
  className: '',
  sizes: '100vw',
})

const isLoaded = ref(false)
const hasError = ref(false)
const isExternal = computed(() => /^https?:\/\//.test(props.src))
// SVG is already scalable; sending it through the raster IPX pipeline breaks offline prerendering.
const useNativeImage = computed(() => isExternal.value || /\.svg(?:[?#]|$)/i.test(props.src))

watch(() => props.src, () => {
  isLoaded.value = false
  hasError.value = false
})

const containerStyle = computed(() => ({
  aspectRatio: props.width && props.height ? `${props.width}/${props.height}` : undefined,
}))

function onLoad() {
  isLoaded.value = true
}

function onError() {
  hasError.value = true
}
</script>

<template>
  <div class="optimized-image-container" :style="containerStyle">
    <nuxt-img
      v-if="!useNativeImage"
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="loading"
      :placeholder="placeholder"
      class="optimized-image"
      :class="className"
      :sizes="sizes"
      format="webp"
      quality="80"
      @load="onLoad"
      @error="onError"
    />
    <img
      v-else
      :src="src"
      :alt="alt"
      :width="width"
      :height="height"
      :loading="loading"
      class="optimized-image"
      :class="className"
      @load="onLoad"
      @error="onError"
    >
    <div v-if="loading === 'lazy'" class="image-placeholder" :class="{ 'is-loaded': isLoaded }">
      <van-loading v-if="!isLoaded && !hasError" type="spinner" size="24" />
      <van-icon v-if="hasError" name="warning-o" size="24" class="text-red" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.optimized-image-container {
  position: relative;
  overflow: hidden;
  background-color: #f5f5f5;

  .optimized-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.3s ease;
  }

  .image-placeholder {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    transition: opacity 0.3s ease;

    &.is-loaded {
      opacity: 0;
      pointer-events: none;
    }
  }
}
</style>
