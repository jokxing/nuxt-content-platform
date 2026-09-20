const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'ul',
  'ol',
  'li',
  'blockquote',
  'h2',
  'h3',
  'a',
])

const CONTENT_LIMIT = 100_000

function escapeAttr(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function hasControlChar(value: string): boolean {
  for (const char of value) {
    const code = char.charCodeAt(0)
    if (code <= 31 || code === 127) {
      return true
    }
  }
  return false
}

function isSafeHref(url: string): boolean {
  const value = url.trim()
  if (!value || value.includes('..') || value.includes('\\') || hasControlChar(value)) {
    return false
  }
  if (/^(https?:\/\/|mailto:)/i.test(value)) {
    return !/^javascript:/i.test(value)
  }
  return value.startsWith('/') && !value.startsWith('//')
}

/**
 * 公开正文白名单清理：去掉脚本/事件属性/危险 URL，限制标签集合。
 * 当前为手写实现；更强安全加固见后续 B7.1。
 */
export function sanitizeArticleHtml(input: string): string {
  let html = input.replace(/<!--[\s\S]*?-->/g, '')
  html = html.replace(
    /<\s*(script|style|iframe|object|embed|link|meta)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    '',
  )
  html = html.replace(/<\s*(script|style|iframe|object|embed|link|meta)\b[^>]*\/?\s*>/gi, '')

  html = html.replace(/<\/?([a-zA-Z][\w:-]*)\b([^>]*)>/g, (full, rawTag: string, rawAttrs: string) => {
    const tag = rawTag.toLowerCase()
    if (!ALLOWED_TAGS.has(tag)) {
      return ''
    }
    const closing = full.startsWith('</')
    if (closing) {
      return tag === 'br' ? '' : `</${tag}>`
    }
    if (tag === 'br') {
      return '<br>'
    }
    if (tag === 'a') {
      const match = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(rawAttrs)
      const href = match?.[1] ?? match?.[2] ?? match?.[3] ?? ''
      if (!isSafeHref(href)) {
        return '<a>'
      }
      return `<a href="${escapeAttr(href.trim())}">`
    }
    return `<${tag}>`
  })

  return html.slice(0, CONTENT_LIMIT)
}

export function normalizeCoverImage(value: string): string {
  if (value === '/logo.svg') {
    return value
  }
  if (
    value.startsWith('/images/')
    && !value.includes('..')
    && !value.includes('\\')
    && !value.includes('//')
  ) {
    return value
  }
  return '/logo.svg'
}
