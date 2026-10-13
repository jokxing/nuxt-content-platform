import { matchContentUpstreamPath } from '../../app/api/upstream-routes'

interface ApiContext {
  request: Request
  env: { NUXT_CONTENT_API_BASE_URL?: string }
}

function fail(status: number, msg: string) {
  return Response.json({ code: status, msg, data: null }, { status })
}

/** 静态 Pages 的同源只读 API；与 Nitro 共用路径白名单，不转发认证信息。 */
export async function onRequest({ request, env }: ApiContext): Promise<Response> {
  if (request.method !== 'GET')
    return fail(405, 'Method not allowed')

  const incoming = new URL(request.url)
  const route = matchContentUpstreamPath(incoming.pathname.replace(/^\/api\/?/, '').replace(/\/$/, ''))
  if (!route)
    return fail(404, 'Unsupported content API path')

  const base = env.NUXT_CONTENT_API_BASE_URL
  if (!base)
    return fail(503, 'Content API upstream is not configured')

  const upstream = new URL(route.upstreamPath, base)
  for (const [key, value] of incoming.searchParams) {
    if (!route.queryKeys.includes(key) || !value || incoming.searchParams.getAll(key).length !== 1)
      return fail(400, 'Unsupported, empty or duplicate query parameter')
    upstream.searchParams.set(key, value)
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const response = await fetch(upstream, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller.signal,
      redirect: 'manual',
    })
    if ((response.status >= 300 && response.status < 400) || !response.headers.get('content-type')?.includes('application/json'))
      return fail(502, 'Content API upstream returned a non-JSON response')
    return new Response(response.body, {
      status: response.status,
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
    })
  }
  catch {
    return fail(503, 'Content API upstream unavailable')
  }
  finally {
    clearTimeout(timeout)
  }
}
