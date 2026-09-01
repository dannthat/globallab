import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPersonalizationServer } from './personalization-server.mjs'

const runningServers = []

const listen = async (server) => {
  runningServers.push(server)
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  return `http://127.0.0.1:${address.port}`
}

afterEach(async () => {
  vi.restoreAllMocks()
  await Promise.all(runningServers.splice(0).map(
    (server) => new Promise((resolve) => server.close(resolve)),
  ))
})

describe('Render personalization server', () => {
  it('exposes a safe health check', async () => {
    const baseUrl = await listen(createPersonalizationServer())
    const response = await fetch(`${baseUrl}/health`)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.ok).toBe(true)
    expect(body).not.toHaveProperty('apiKey')
  })

  it('supports browser preflight from the deployed frontend', async () => {
    const baseUrl = await listen(createPersonalizationServer())
    const response = await fetch(`${baseUrl}/api/personalize`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://globallab.netlify.app' },
    })

    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin'))
      .toBe('https://globallab.netlify.app')
  })

  it('forwards personalization requests to the shared handler', async () => {
    const handler = vi.fn(async () => Response.json({ text: '{"ok":true}' }))
    const baseUrl = await listen(createPersonalizationServer({ handler }))
    const response = await fetch(`${baseUrl}/api/personalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://globallab.netlify.app',
      },
      body: JSON.stringify({ prompt: 'test' }),
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ text: '{"ok":true}' })
    expect(handler).toHaveBeenCalledOnce()
  })

  it('rejects unknown browser origins', async () => {
    const handler = vi.fn()
    const baseUrl = await listen(createPersonalizationServer({ handler }))
    const response = await fetch(`${baseUrl}/api/personalize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://example.com',
      },
      body: '{}',
    })

    expect(response.status).toBe(403)
    expect(handler).not.toHaveBeenCalled()
  })
})
