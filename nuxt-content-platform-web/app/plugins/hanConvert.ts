import { defineNuxtPlugin } from '#app'
import { toTraditional } from 'chinese-simple2traditional'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      convertToTraditional: (text: string) => {
        try {
          return toTraditional(text)
        }
        catch (error) {
          console.error('Traditional conversion failed:', error)
          return text
        }
      },
    },
  }
})
