import { createContentDirectory } from './content-directory'

// Diagnostic only; Nuxt imports this directory without rewriting source files.
const routes = createContentDirectory()
console.log(JSON.stringify(routes.map(route => route.path), null, 2))
console.log(`[Prerender] ${routes.length} routes; no files changed`)
