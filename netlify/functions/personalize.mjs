const MAX_REQUEST_BYTES = 5 * 1024 * 1024
const MAX_UPLOAD_SELECTION_CHARACTERS = 4_000
const PROVIDER_TIMEOUT_MS = 40_000

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  },
})

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

const retryDelay = (response, attempt) => {
  const retryAfter = Number(response.headers.get('retry-after'))
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, 2_500)
  }
  return 500 + attempt * 350
}

const providerFailureDetails = async (response) => {
  let providerCode = null
  let providerMessage = null

  try {
    const body = await response.clone().json()
    providerCode = typeof body?.error?.status === 'string'
      ? body.error.status
      : null
    providerMessage = typeof body?.error?.message === 'string'
      ? body.error.message.slice(0, 500)
      : null
  } catch {
    // Provider bodies are not guaranteed to be JSON. The HTTP status still
    // gives operators a useful, non-secret diagnostic.
  }

  return {
    providerStatus: response.status,
    providerCode,
    providerMessage,
  }
}

const providerFailureResponse = (status) => {
  if (status === 429) {
    return {
      status: 429,
      code: 'RATE_LIMITED',
      error: 'The personalization service is busy. Try again shortly.',
    }
  }
  if ([401, 403].includes(status)) {
    return {
      status: 502,
      code: 'PROVIDER_AUTH_FAILED',
      error: 'The personalization deployment could not authenticate with Gemini.',
    }
  }
  if (status === 404) {
    return {
      status: 502,
      code: 'PROVIDER_MODEL_UNAVAILABLE',
      error: 'The configured personalization model is unavailable.',
    }
  }
  if (status === 400) {
    return {
      status: 502,
      code: 'PROVIDER_REQUEST_REJECTED',
      error: 'Gemini rejected the personalization request.',
    }
  }
  return {
    status: 502,
    code: 'PROVIDER_UNAVAILABLE',
    error: 'The personalization provider could not complete this request.',
  }
}

function validatePrivacy(body) {
  const privacy = body?.privacy
  if (
    !privacy ||
    !['global-lab', 'upload'].includes(privacy.sourceKind) ||
    !['section', 'selection'].includes(privacy.scope)
  ) {
    return json({
      error: 'A valid source privacy scope is required.',
      code: 'PRIVACY_SCOPE_REQUIRED',
    }, 400)
  }

  if (privacy.sourceKind !== 'upload') return null

  const selectionCharacters = Number(privacy.selectionCharacters)
  if (
    privacy.scope !== 'selection' ||
    !Number.isInteger(selectionCharacters) ||
    selectionCharacters < 1 ||
    selectionCharacters > MAX_UPLOAD_SELECTION_CHARACTERS
  ) {
    return json({
      error: 'Uploaded sources may use cloud Koji only for an exact selection of 4,000 characters or fewer.',
      code: 'UPLOAD_SELECTION_REQUIRED',
    }, 403)
  }

  if (body.image) {
    return json({
      error: 'Uploaded page images stay local. Select text instead.',
      code: 'UPLOAD_IMAGE_BLOCKED',
    }, 403)
  }

  return null
}

export default async function personalize(request) {
  if (request.method !== 'POST') {
    return json({ error: 'Use POST for personalization requests.' }, 405)
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim()
  if (!apiKey) {
    return json({
      error: 'Personalization is not configured on this deployment.',
      code: 'PROVIDER_NOT_CONFIGURED',
    }, 503)
  }

  const declaredLength = Number(request.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return json({
      error: 'The selected source excerpt is too large. Select a smaller section.',
      code: 'REQUEST_TOO_LARGE',
    }, 413)
  }

  let body
  try {
    const rawBody = await request.text()
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return json({
        error: 'The selected source excerpt is too large. Select a smaller section.',
        code: 'REQUEST_TOO_LARGE',
      }, 413)
    }
    body = JSON.parse(rawBody)
  } catch {
    return json({ error: 'The personalization request was not valid JSON.' }, 400)
  }

  const privacyError = validatePrivacy(body)
  if (privacyError) return privacyError

  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : ''
  const parts = []
  if (prompt) parts.push({ text: prompt })

  if (
    body?.image &&
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
    return json({ error: 'The personalization request is empty.' }, 400)
  }

  const model = (process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite').trim()
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS)

  try {
    let providerResponse = null
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
              maxOutputTokens: 2500,
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
      const failure = providerFailureResponse(status)
      const details = providerResponse
        ? await providerFailureDetails(providerResponse)
        : { providerStatus: status, providerCode: null, providerMessage: null }
      console.error('[personalize] Gemini request failed', {
        model,
        ...details,
      })
      return json({
        error: failure.error,
        code: failure.code,
        providerStatus: status,
      }, failure.status)
    }

    const providerData = await providerResponse.json()
    const text = providerData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    if (!text) {
      return json({
        error: 'The personalization provider returned an empty response.',
        code: 'EMPTY_PROVIDER_RESPONSE',
      }, 502)
    }

    return json({ text, model })
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.name === 'AbortError'
    return json({
      error: timedOut
        ? 'Personalization timed out. Try a smaller source selection.'
        : 'The personalization service could not reach its provider.',
      code: timedOut ? 'TIMEOUT' : 'NETWORK_ERROR',
    }, timedOut ? 504 : 502)
  } finally {
    clearTimeout(timeout)
  }
}

export const config = {
  path: '/api/personalize',
}
