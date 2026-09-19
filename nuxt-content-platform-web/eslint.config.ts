import antfu from '@antfu/eslint-config'
import nuxt from './.nuxt/eslint.config.mjs'

export default nuxt(
  await antfu({
    // ESLint checks code; do not enforce CSS utility ordering or format Markdown/JSON.
    unocss: false,
    formatters: false,
    rules: {
      'no-console': 'off',
      // Import/member order and declaration style are preferences, not correctness checks.
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-named-imports': 'off',
      'perfectionist/sort-named-exports': 'off',
      'antfu/top-level-function': 'off',
      'style/quote-props': ['error', 'as-needed'],
    },
  }),
)
