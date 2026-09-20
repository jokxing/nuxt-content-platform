import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import process from 'node:process'

const publicDir = join(process.cwd(), '.output', 'public')
const sitemapPath = join(publicDir, 'sitemap.xml')

assert.ok(existsSync(sitemapPath), 'Missing .output/public/sitemap.xml; run build first')

const sitemap = readFileSync(sitemapPath, 'utf8')
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => match[1])
assert.ok(sitemapUrls.length > 0, 'Sitemap contains no URLs')
const siteOrigin = new URL(sitemapUrls[0]).origin

function listIndexHtml(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? listIndexHtml(path) : entry.name === 'index.html' ? [path] : []
  })
}

function routeFromFile(file) {
  const name = relative(publicDir, file).split(sep).join('/')
  return name === 'index.html' ? '/' : `/${name.replace(/\/index\.html$/, '')}`
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([:\w-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]))
}

const htmlByRoute = new Map(listIndexHtml(publicDir).map(file => [routeFromFile(file), readFileSync(file, 'utf8')]))
const failures = []

for (const absoluteUrl of sitemapUrls) {
  const url = new URL(absoluteUrl)
  const route = url.pathname || '/'
  const html = htmlByRoute.get(route)
  if (!html) {
    failures.push(`${route}: sitemap URL has no prerendered index.html`)
    continue
  }

  const links = [...html.matchAll(/<link\b[^>]*>/g)].map(match => attributes(match[0]))
  const canonicals = links.filter(link => link.rel === 'canonical')
  if (canonicals.length !== 1 || canonicals[0].href !== `${siteOrigin}${route === '/' ? '/' : route}`)
    failures.push(`${route}: canonical missing, duplicated or mismatched`)

  const basePath = route.replace(/^\/(zh-CN|en-US)(?=\/|$)/, '') || '/'
  const expectedAlternates = {
    'zh-HK': `${siteOrigin}${basePath}`,
    'zh-CN': `${siteOrigin}/zh-CN${basePath === '/' ? '' : basePath}`,
    'en-US': `${siteOrigin}/en-US${basePath === '/' ? '' : basePath}`,
    'x-default': `${siteOrigin}${basePath}`,
  }
  const alternates = links.filter(link => link.rel === 'alternate' && link.hreflang)
  for (const [lang, href] of Object.entries(expectedAlternates)) {
    const matches = alternates.filter(link => link.hreflang === lang)
    if (matches.length !== 1 || matches[0].href !== href)
      failures.push(`${route}: hreflang ${lang} missing, duplicated or mismatched`)
  }

  const schemas = [...html.matchAll(/<script(?=[\s>])[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  if (schemas.length === 0) {
    failures.push(`${route}: JSON-LD missing`)
  }
  for (const schema of schemas) {
    try {
      JSON.parse(schema[1])
    }
    catch {
      failures.push(`${route}: invalid JSON-LD`)
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'))
  process.exit(1)
}

const generatedOnly = [...htmlByRoute.keys()].filter(route => !sitemapUrls.includes(`${siteOrigin}${route}`))
console.log(`PASS: ${sitemapUrls.length} sitemap URLs have prerendered HTML, canonical, four hreflang links and valid JSON-LD`)
console.log(`INFO: ${generatedOnly.length} prerendered redirect/compatibility routes are intentionally outside sitemap`)
if (generatedOnly.length > 0)
  console.log(`INFO: excluded routes: ${generatedOnly.sort().join(', ')}`)
