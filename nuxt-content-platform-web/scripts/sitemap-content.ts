import type { ContentRoute } from './content-directory'

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', '\'': '&apos;' })[char]!)
}

export function renderSitemap(routes: readonly ContentRoute[], siteUrl: string) {
  const base = new URL(siteUrl)
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash || base.pathname !== '/')
    throw new Error('Site URL must be an HTTP(S) origin without credentials, path, query or fragment')
  const entries = routes.filter(route => route.sitemap)
  if (new Set(entries.map(route => route.path)).size !== entries.length)
    throw new Error('Duplicate sitemap routes')
  const urls = entries.map((route) => {
    if (!route.path.startsWith('/') || route.path.startsWith('//') || /[?#\\]/.test(route.path))
      throw new Error('Invalid sitemap path')
    const loc = escapeXml(new URL(route.path, base).href)
    const lastmod = route.lastmod ? `<lastmod>${escapeXml(route.lastmod)}</lastmod>` : ''
    return `  <url><loc>${loc}</loc>${lastmod}</url>`
  })
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}
