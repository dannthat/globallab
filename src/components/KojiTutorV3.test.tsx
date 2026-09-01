// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { TutorSessionController } from '../hooks/useTutorSession'
import type { SourceAnchor } from '../personalization/types'
import { TutorConversation } from './KojiTutorV3'

const sourceAnchor: SourceAnchor = {
  sourceId: 'student-notes',
  sourceKind: 'upload',
  sourceTitle: 'My notes.pdf',
  anchorId: 'selection-1',
  anchorLabel: 'Selected text',
  page: 4,
  sourceFingerprint: 'notes-v1',
}

function createSession() {
  const send = vi.fn().mockResolvedValue(undefined)
  const session = {
    messages: [
      {
        id: 'opening',
        role: 'tutor',
        text: 'Let us work through only the selected sentence.',
        phase: 'diagnose',
        intent: 'start',
        createdAt: '2026-08-29T00:00:00.000Z',
      },
    ],
    activeActivity: null,
    activityGrade: null,
    isLoading: false,
    error: null,
    lastTurn: null,
    send,
    retry: vi.fn(),
    submitActivity: vi.fn(),
  } as unknown as TutorSessionController

  return { session, send }
}

afterEach(cleanup)

describe('KojiTutorV3', () => {
  it('sends ordinary chat and changes strategy after Still stuck', async () => {
    const user = userEvent.setup()
    const { session, send } = createSession()
    const onOutcome = vi.fn()
    const onDismiss = vi.fn()

    render(
      <TutorConversation
        session={session}
        sourceAnchor={sourceAnchor}
        interest={'gaming'}
        cloudAllowed={true}
        onOutcome={onOutcome}
        onDismiss={onDismiss}
        stuckSupport={'walk-through'}
      />,
    )

    const composer = screen.getByLabelText('Ask Koji about this source')
    await user.type(composer, 'Why does this step happen?')
    await user.click(screen.getByRole('button', { name: 'Send message to Koji' }))

    await waitFor(() => {
      expect(send).toHaveBeenCalledWith('ask', 'Why does this step happen?')
    })

    await user.click(screen.getByRole('button', { name: 'Still stuck' }))
    expect(onOutcome).toHaveBeenCalledWith(false)
    expect(screen.getByText('Show me where the thread broke.')).toBeTruthy()

    const stuckComposer = screen.getByLabelText('What exactly lost you?')
    await user.type(stuckComposer, 'I lose the thread after the second equation.')
    await user.click(screen.getByRole('button', { name: 'Send message to Koji' }))

    await waitFor(() => {
      expect(send).toHaveBeenLastCalledWith(
        'step-by-step',
        'I lose the thread after the second equation.',
      )
    })

    await user.click(screen.getByRole('button', { name: 'Got it' }))
    expect(onOutcome).toHaveBeenCalledWith(true)
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('keeps upload sharing explicit and closes from the header', async () => {
    const user = userEvent.setup()
    const { session } = createSession()
    const onCloudAllowedChange = vi.fn()
    const onDismiss = vi.fn()

    render(
      <TutorConversation
        session={session}
        sourceAnchor={sourceAnchor}
        interest={'neutral'}
        cloudAllowed={false}
        onCloudAllowedChange={onCloudAllowedChange}
        onDismiss={onDismiss}
      />,
    )

    expect(screen.getByText('This selection stays local')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Use AI for this selection' }))
    expect(onCloudAllowedChange).toHaveBeenCalledWith(true)

    await user.click(screen.getByRole('button', { name: 'Close Koji' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
