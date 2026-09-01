// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { subjects } from './knowledge'
import { LEARNER_MODEL_STORAGE_KEY } from './personalization/learnerModel'
import type { LearnerModelState } from './personalization/types'
import type { StudentProfile } from './types'

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}))
vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}))

function seedProfile() {
  const profile: StudentProfile = {
    interest: 'basketball',
    gradeLevel: 'Grade 10',
    createdAt: '2026-08-24T00:00:00.000Z',
  }
  window.localStorage.setItem('globallab_profile', JSON.stringify(profile))
}

async function openFirstSection(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /^Biology/ }))
  await user.click(
    await screen.findByRole('button', {
      name: /Cellular Respiration & ATP Synthesis/,
    }),
  )
  await screen.findByRole('heading', {
    level: 1,
    name: subjects[0].topics[0].sections[0].heading,
  })
  return document.getElementById(subjects[0].topics[0].sections[0].id) as HTMLElement
}

function readLearnerModel() {
  return JSON.parse(
    window.localStorage.getItem(LEARNER_MODEL_STORAGE_KEY) ?? '{}',
  ) as LearnerModelState
}

beforeEach(() => {
  window.localStorage.clear()
  seedProfile()
  // Guard against jsdom crash on getComputedStyle with complex CSS custom properties
  const nativeGetComputedStyle = window.getComputedStyle.bind(window)
  const safeStub = { getPropertyValue: () => '', length: 0 } as unknown as CSSStyleDeclaration
  vi.spyOn(window, 'getComputedStyle').mockImplementation((elt, pseudo) => {
    try { return nativeGetComputedStyle(elt, pseudo) } catch { return safeStub }
  })
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ code: 'PROVIDER_NOT_CONFIGURED' }),
    }),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('curated textbook learner-model integration', () => {
  it('records Still stuck refinements and helpful outcomes against the source', async () => {
    const user = userEvent.setup()
    render(<App />)
    const section = await openFirstSection(user)

    await user.click(
      within(section).getByRole('button', { name: /Connect this to|Learn your way/i }),
    )
    await within(section).findByLabelText('Personalized learning companion')

    await user.click(within(section).getByRole('button', { name: 'Still stuck' }))
    const composer = within(section).getByRole('textbox', { name: 'What exactly lost you?' })
    await user.type(composer, 'I lost the thread where glucose becomes usable energy.')
    await user.click(within(section).getByRole('button', { name: 'Send message to Koji' }))

    await waitFor(() => {
      expect(within(section).getByRole('button', { name: 'Got it' })).toBeTruthy()
    })
    await user.click(within(section).getByRole('button', { name: 'Got it' }))

    await waitFor(() => {
      const model = readLearnerModel()
      expect(model.evidence.map((entry) => entry.kind)).toEqual([
        'helpful',
        'refinement',
        'helpful',
      ])
      expect(model.evidence.every((entry) => entry.anchor.sourceKind === 'global-lab')).toBe(
        true,
      )
      expect(model.evidence.every((entry) => entry.anchor.sourceId === 'cellular-respiration')).toBe(
        true,
      )
      expect(model.evidence.every((entry) => entry.anchor.anchorId === 'overview')).toBe(
        true,
      )
    })
  })
})
