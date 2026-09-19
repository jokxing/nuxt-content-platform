/** Capture during setup, then use the instance in async handlers without looking up Nuxt context. */
export function useContentApi() {
  return useNuxtApp().$contentApi
}
