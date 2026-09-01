import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import personalize from './personalize.mjs'

const request = () => new Request('http://localhost/api/personalize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Return valid JSON.',
    privacy: {
      sourceKind: 'global-lab',
      scope: 'section',
      selectionCharacters: 0,
    },
  }),
})

describe('personalization provider diagnostics', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key'
    process.env.GEMINI_MODEL = 'gemini-test-model'
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete process.env.GEMINI_API_KEY
    delete process.env.GEMINI_MODEL
  })

  it('returns a safe authentication code and logs the provider cause', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      error: {
        status: 'PERMISSION_DENIED',
        message: 'The supplied API key is not permitted.',
      },
    }, { status: 403 })))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await personalize(request())
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body).toEqual({
      error: 'The personalization deployment could not authenticate with Gemini.',
      code: 'PROVIDER_AUTH_FAILED',
      providerStatus: 403,
    })
    expect(errorSpy).toHaveBeenCalledWith(
      '[personalize] Gemini request failed',
      expect.objectContaining({
        model: 'gemini-test-model',
        providerStatus: 403,
        providerCode: 'PERMISSION_DENIED',
      }),
    )
  })

  it('distinguishes an unavailable model', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      error: { status: 'NOT_FOUND', message: 'Model was not found.' },
    }, { status: 404 })))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const response = await personalize(request())
    const body = await response.json()

    expect(response.status).toBe(502)
    expect(body.code).toBe('PROVIDER_MODEL_UNAVAILABLE')
    expect(body.providerStatus).toBe(404)
  })
})
