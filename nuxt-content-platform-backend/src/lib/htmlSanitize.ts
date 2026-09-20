import sanitizeHtml from 'sanitize-html'

const ALLOWED_TAGS = [
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
] as const

export const CONTENT_LIMIT = 100_000

function hasControlChar(value: string): boolean {
  for (const char of value) {
    const code = char.charCodeAt(0)
    if (code <= 31 || code === 127) {
      return true
    }
  }
  return false
}

/** a.href：仅 https?/mailto 与站内相对路径；拒绝 javascript、协议相对、..、控制字符。 */
export function isSafeHref(url: string): boolean {
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
 * 公开正文白名单清理：基于 sanitize-html（htmlparser2），不用手写正则拼标签。
 * 允许标签与 a.href 规则与契约一致；拒绝脚本、事件属性、SVG/MathML、危险协议。
 */
export function sanitizeArticleHtml(input: string): string {
  const cleaned = sanitizeHtml(input, {
    allowedTags: [...ALLOWED_TAGS],
    // 仅 a 可带 href；其它标签无属性 → 事件处理器等一律剥离
    allowedAttributes: {
      a: ['href'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    // 相对路径由 transformTags + isSafeHref 再校验（含 .. 拒绝）
    allowVulnerableTags: false,
    disallowedTagsMode: 'discard',
    selfClosing: ['br'],
    transformTags: {
      a: (_tagName, attribs) => {
        const href = typeof attribs.href === 'string' ? attribs.href : ''
        if (!isSafeHref(href)) {
          // 去掉危险 href，保留链接文本（与旧实现 <a>text</a> 一致）
          return { tagName: 'a', attribs: {} }
        }
        return {
          tagName: 'a',
          attribs: { href: href.trim() },
        }
      },
    },
  })

  return cleaned
}

/** cover_image：仅 /logo.svg 或 /images/ 下无 .. 的相对路径。 */
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
