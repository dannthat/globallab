import { createServer } from 'node:http'
import { pathToFileURL } from 'node:url'
import personalize from '../netlify/functions/personalize.mjs'

const MAX_REQUEST_BYTES = 5 * 1024 * 1024
const DEFAULT_ALLOWED_ORIGINS = [
  'https://globallab.netlify.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

const json = (response, status, body, headers = {}) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  })
  response.end(JSON.stringify(body))
}

const parseAllowedOrigins = (value) => new Set(
  (value || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
)

const corsHeaders = (origin) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
})

const readBody = async (request) => {
  const chunks = []
  let totalBytes = 0

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalBytes += buffer.byteLength
    if (totalBytes > MAX_REQUEST_BYTES) throw new Error('REQUEST_TOO_LARGE')
    chunks.push(buffer)
  }

  return Buffer.concat(chunks)
}

const writeWebResponse = async (nodeResponse, webResponse, extraHeaders = {}) => {
  const headers = Object.fromEntries(webResponse.headers.entries())
  const body = Buffer.from(await webResponse.arrayBuffer())
  nodeResponse.writeHead(webResponse.status, { ...headers, ...extraHeaders })
  nodeResponse.end(body)
}

export function createPersonalizationServer({
  handler = personalize,
  allowedOrigins = process.env.ALLOWED_ORIGINS,
} = {}) {
  const origins = parseAllowedOrigins(allowedOrigins)

  return createServer(async (request, response) => {
    const host = request.headers.host || 'localhost'
    const url = new URL(request.url || '/', `http://${host}`)

    if (url.pathname === '/health') {
      json(response, 200, {
        ok: true,
        providerConfigured: Boolean((process.env.GEMINI_API_KEY || '').trim()),
        model: (process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite').trim(),
      })
      return
    }

    if (url.pathname !== '/api/personalize') {
      json(response, 404, { error: 'Not found.' })
      return
    }

    const origin = request.headers.origin
    if (origin && !origins.has(origin)) {
      json(response, 403, {
        error: 'This origin is not allowed to use the personalization API.',
        code: 'ORIGIN_NOT_ALLOWED',
      })
      return
    }

    const responseCorsHeaders = origin ? corsHeaders(origin) : {}
    if (request.method === 'OPTIONS') {
      response.writeHead(204, responseCorsHeaders)
      response.end()
      return
    }

    try {
      const body = await readBody(request)
      const webRequest = new Request(`http://${host}/api/personalize`, {
        method: request.method,
        headers: request.headers,
        body,
      })
      const webResponse = await handler(webRequest)
      await writeWebResponse(response, webResponse, responseCorsHeaders)
    } catch (cause) {
      const tooLarge = cause instanceof Error && cause.message === 'REQUEST_TOO_LARGE'
      console.error('[personalization-server] Request failed', {
        code: tooLarge ? 'REQUEST_TOO_LARGE' : 'SERVER_ERROR',
        message: cause instanceof Error ? cause.message : 'Unknown error',
      })
      json(
        response,
        tooLarge ? 413 : 500,
        {
          error: tooLarge
            ? 'The selected source excerpt is too large.'
            : 'The personalization server could not process this request.',
          code: tooLarge ? 'REQUEST_TOO_LARGE' : 'SERVER_ERROR',
        },
        responseCorsHeaders,
      )
    }
  })
}

export function startPersonalizationServer() {
  const port = Number(process.env.PORT || 8787)
  const server = createPersonalizationServer()
  server.listen(port, '0.0.0.0', () => {
    console.log(`[personalization-server] Listening on port ${port}`)
  })
  return server
}

const launchedDirectly = process.argv[1]
  && import.meta.url === pathToFileURL(process.argv[1]).href

if (launchedDirectly) startPersonalizationServer()
