// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  recognize: vi.fn(),
  terminate: vi.fn(),
  createWorker: vi.fn(),
}))

vi.mock('tesseract.js', () => ({
  OEM: { LSTM_ONLY: 1 },
  createWorker: mocks.createWorker,
}))

import { prewarmLocalOcr, recognizeLocalImage, terminateLocalOcr } from './localOcr'

afterEach(async () => {
  await terminateLocalOcr()
  mocks.recognize.mockReset()
  mocks.terminate.mockReset()
  mocks.createWorker.mockReset()
})

describe('local OCR', () => {
  it('uses only same-origin bundled assets and returns normalized extracted text', async () => {
    mocks.recognize.mockResolvedValue({
      data: { text: '  Cellular   respiration\r\n\r\n produces ATP.  ' },
    })
    mocks.createWorker.mockResolvedValue({
      recognize: mocks.recognize,
      terminate: mocks.terminate,
    })

    const text = await recognizeLocalImage({
      mimeType: 'image/jpeg',
      data: 'QUJDRA==',
    })

    expect(text).toBe('Cellular respiration\n\nproduces ATP.')
    expect(mocks.createWorker).toHaveBeenCalledWith(
      'eng',
      1,
      expect.objectContaining({
        workerPath: expect.stringMatching(/^http:\/\/localhost:\d+\/tesseract\/worker\.min\.js$/),
        corePath: expect.stringMatching(/^http:\/\/localhost:\d+\/tesseract\/core\/tesseract-core-lstm\.js$/),
        langPath: expect.stringMatching(/^http:\/\/localhost:\d+\/tesseract\/lang$/),
        workerBlobURL: false,
      }),
    )
    expect(mocks.recognize.mock.calls[0]?.[0]).toBeInstanceOf(Blob)
  })

  it('prewarms local OCR worker without throwing', async () => {
    mocks.createWorker.mockResolvedValue({
      recognize: mocks.recognize,
      terminate: mocks.terminate,
    })

    await expect(prewarmLocalOcr()).resolves.toBeUndefined()
    expect(mocks.createWorker).toHaveBeenCalled()
  })

  it('fails honestly when no readable text is found', async () => {
    mocks.recognize.mockResolvedValue({ data: { text: '  ' } })
    mocks.createWorker.mockResolvedValue({
      recognize: mocks.recognize,
      terminate: mocks.terminate,
    })

    await expect(recognizeLocalImage({
      mimeType: 'image/jpeg',
      data: 'QUJDRA==',
    })).rejects.toThrow('could not find enough readable text')
  })
})
