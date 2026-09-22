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
export function isValidCoverImage(value: string, mediaPublicBaseUrl?: string | null): boolean {
  if (!value || value.length > 500)
    return false
  if (value === '/logo.svg')
    return true
  if (
    value.startsWith('/images/')
    && !value.includes('..')
    && !value.includes('\\')
    && !value.includes('//')
  ) {
    return true
  }
  if (mediaPublicBaseUrl)
    return isTrustedMediaAssetUrl(value, mediaPublicBaseUrl)
  return false
}

/**
 * 用 URL 解析比较 protocol/origin/path 边界，避免 startsWith 被 evil 子域绕过。
 * 允许路径形如 {basePath}/covers/{yyyy}/{mm}/{id}.webp
 */
export function isTrustedMediaAssetUrl(value: string, mediaPublicBaseUrl: string): boolean {
  if (!value || !mediaPublicBaseUrl || value.length > 500)
    return false
  if (value.includes('..') || value.includes('\\'))
    return false

  let candidate: URL
  let base: URL
  try {
    candidate = new URL(value)
    base = new URL(mediaPublicBaseUrl)
  }
  catch {
    return false
  }

  if (candidate.username || candidate.password)
    return false
  if (candidate.protocol !== base.protocol)
    return false
  if (candidate.origin !== base.origin)
    return false

  const basePath = base.pathname.replace(/\/+$/, '') || ''
  const path = candidate.pathname
  const prefix = basePath === '' ? '/covers/' : `${basePath}/covers/`
  if (!path.startsWith(prefix))
    return false
  const rest = path.slice(prefix.length)
  return /^[0-9]{4}\/[0-9]{2}\/[A-Za-z0-9]+\.webp$/.test(rest)
}

export function normalizeCoverImage(value: string, mediaPublicBaseUrl?: string | null): string {
  if (isValidCoverImage(value, mediaPublicBaseUrl))
    return value
  return '/logo.svg'
}
