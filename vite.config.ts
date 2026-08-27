import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const MAX_PERSONALIZATION_BODY_BYTES = 16 * 1024 * 1024
const PERSONALIZATION_TIMEOUT_MS = 30_000

interface PersonalizationProxyRequest {
  prompt?: unknown
  image?: {
    mimeType?: unknown
    data?: unknown
  }
}

function sendJson(
  response: ServerResponse,
  status: number,
  body: Record<string, unknown>,
) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(body))
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = []
  let totalBytes = 0

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    totalBytes += buffer.byteLength
    if (totalBytes > MAX_PERSONALIZATION_BODY_BYTES) {
      throw new Error('REQUEST_TOO_LARGE')
    }
    chunks.push(buffer)
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as PersonalizationProxyRequest
}

function retryDelay(response: Response, attempt: number) {
  const retryAfter = Number(response.headers.get('retry-after'))
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, 2_500)
  }
  return 500 + attempt * 350
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function personalizationProxy(apiKey: string, model: string): Plugin {
  const handler = async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'POST') {
      sendJson(response, 405, { error: 'Use POST for personalization requests.' })
      return
    }

    if (!apiKey) {
      sendJson(response, 503, {
        error: 'Personalization provider is not configured on this local server.',
        code: 'PROVIDER_NOT_CONFIGURED',
      })
      return
    }

    let body: PersonalizationProxyRequest
    try {
      body = await readJsonBody(request)
    } catch (cause) {
      const tooLarge = cause instanceof Error && cause.message === 'REQUEST_TOO_LARGE'
      sendJson(response, tooLarge ? 413 : 400, {
        error: tooLarge
          ? 'The selected source excerpt is too large. Select a smaller section.'
          : 'The personalization request was not valid JSON.',
      })
      return
    }

    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
    const parts: Array<Record<string, unknown>> = []

    if (prompt) {
      parts.push({ text: prompt })
    }

    if (
      body.image &&
      typeof body.image.data === 'string' &&
      typeof body.image.mimeType === 'string'
    ) {
      parts.push({
        inlineData: {
          mimeType: body.image.mimeType,
          data: body.image.data,
        },
      })
    }

    if (parts.length === 0) {
      sendJson(response, 400, {
        error: 'The personalization request is empty.',
      })
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), PERSONALIZATION_TIMEOUT_MS)

    try {
      let providerResponse: Response | null = null
      for (let attempt = 0; attempt < 2; attempt += 1) {
        providerResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 2000,
                responseMimeType: 'application/json',
              },
            }),
            signal: controller.signal,
          },
        )

        if (
          providerResponse.ok ||
          ![429, 500, 502, 503, 504].includes(providerResponse.status) ||
          attempt === 1
        ) {
          break
        }
        await wait(retryDelay(providerResponse, attempt))
      }

      if (!providerResponse?.ok) {
        const status = providerResponse?.status ?? 502
        sendJson(response, status === 429 ? 429 : 502, {
          error:
            status === 429
              ? 'The personalization service is busy. Try again shortly.'
              : 'The personalization provider could not complete this request.',
          code: status === 429 ? 'RATE_LIMITED' : 'PROVIDER_ERROR',
        })
        return
      }

      const providerData = (await providerResponse.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      const text = providerData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
      if (!text) {
        sendJson(response, 502, {
          error: 'The personalization provider returned an empty response.',
          code: 'EMPTY_PROVIDER_RESPONSE',
        })
        return
      }

      sendJson(response, 200, { text, model })
    } catch (cause) {
      const timedOut = cause instanceof Error && cause.name === 'AbortError'
      sendJson(response, timedOut ? 504 : 502, {
        error: timedOut
          ? 'Personalization timed out. Try a smaller source selection.'
          : 'The local personalization proxy could not reach its provider.',
        code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
      })
    } finally {
      clearTimeout(timeout)
    }
  }

  return {
    name: 'global-lab-personalization-proxy',
    configureServer(server) {
      server.middlewares.use('/api/personalize', (request, response) => {
        void handler(request, response)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/personalize', (request, response) => {
        void handler(request, response)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = (env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || '').trim()
  const model = (env.GEMINI_MODEL || 'gemini-3.1-flash-lite').trim()

  return {
    plugins: [react(), tailwindcss(), personalizationProxy(apiKey, model)],
  }
})
