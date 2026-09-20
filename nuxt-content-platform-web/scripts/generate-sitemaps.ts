import { writeFile } from 'node:fs/promises'
import process from 'node:process'
import { createContentDirectory, resolveContentArticlesForBuild } from './content-directory'
import { renderSitemap } from './sitemap-content'

// Local generation only; does not publish or change robots/noindex settings.
// 与 nuxt prerender 共用同一份快照（prepare-content-directory 写入），禁止各自独立请求。
const routes = createContentDirectory(resolveContentArticlesForBuild())
const xml = renderSitemap(routes, process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3666')
await writeFile(new URL('../public/sitemap.xml', import.meta.url), xml, 'utf8')
console.log(`[Sitemap] Generated ${routes.filter(route => route.sitemap).length} URLs`)
