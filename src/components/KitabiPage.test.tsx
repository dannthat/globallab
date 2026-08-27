// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { KnowledgeSection, KnowledgeTopic, Subject } from '../types'
import { KitabiPage } from './KitabiPage'

vi.mock('./RunningHeader', () => ({
  RunningHeader: () => <input aria-label={'Header lens'} />,
}))

vi.mock('./SourcesFooter', () => ({
  SourcesFooter: () => <footer>Sources</footer>,
}))

vi.mock('./TextbookSection', () => ({
  TextbookSection: ({ section }: { section: KnowledgeSection }) => (
    <article data-testid={'visible-section'}>{section.heading}</article>
  ),
}))

const sections: KnowledgeSection[] = [
  {
    id: 'section-one',
    heading: 'Section one',
    body: 'The first canonical explanation.',
    keyTerms: ['first'],
  },
  {
    id: 'section-two',
    heading: 'Section two',
    body: 'The second canonical explanation.',
    keyTerms: ['second'],
  },
  {
    id: 'section-three',
    heading: 'Section three',
    body: 'The third canonical explanation.',
    keyTerms: ['third'],
  },
]

const topic: KnowledgeTopic = {
  id: 'reader-topic',
  subjectId: 'biology',
  title: 'Reader topic',
  subtitle: 'A focused test topic',
  sections,
  source: {
    name: 'Test source',
    url: 'https://example.com/source',
    license: 'Public domain',
  },
}

const subject: Subject = {
  id: 'biology',
  title: 'Biology',
  description: 'Life science',
  color: '#168a72',
  topics: [topic],
}

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    })),
  )
}

function renderReader(options?: {
  onToggleDark?: () => void
  onSelectTopic?: Parameters<typeof KitabiPage>[0]['onSelectTopic']
}) {
  return render(
    <KitabiPage
      topic={topic}
      subject={subject}
      subjectColor={'#168a72'}
      profile={null}
      isDark={false}
      onToggleDark={options?.onToggleDark ?? vi.fn()}
      onSaveInterest={vi.fn()}
      rewrites={{}}
      loadingSectionId={null}
      onLearnYourWay={vi.fn()}
      onRefine={vi.fn()}
      onOutcome={vi.fn()}
      onQuizResult={vi.fn()}
      onClearRewrite={vi.fn()}
      onApplySuggestion={vi.fn()}
      onDeferSuggestion={vi.fn()}
      onNeverSuggest={vi.fn()}
      onSelectTopic={options?.onSelectTopic}
      onBack={vi.fn()}
    />,
  )
}

beforeEach(() => {
  vi.useFakeTimers()
  stubReducedMotion(false)
})

afterEach(() => {
  cleanup()
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('KitabiPage page turns', () => {
  it('opens the topic mastery dialog and suspends reader navigation while it is active', () => {
    renderReader()

    fireEvent.click(
      screen.getByRole('button', { name: 'Test Your Mastery' }),
    )
    expect(
      screen.getByRole('dialog', { name: 'Test your mastery' }),
    ).toBeTruthy()

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    act(() => vi.advanceTimersByTime(1200))
    expect(screen.getByTestId('visible-section').textContent).toBe(
      'Section one',
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(
      screen.queryByRole('dialog', { name: 'Test your mastery' }),
    ).toBeNull()
  })

  it('keeps the outgoing section visible until the turn midpoint', () => {
    const { container } = renderReader()

    expect(screen.getByTestId('visible-section').textContent).toBe(
      'Section one',
    )
    expect(container.querySelector('.boa-overlay')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Next section' }))

    expect(screen.getByTestId('visible-section').textContent).toBe(
      'Section one',
    )
    expect(container.querySelector('.textbook-page-turn')).toBeTruthy()

    act(() => vi.advanceTimersByTime(239))
    expect(screen.getByTestId('visible-section').textContent).toBe(
      'Section one',
    )

    act(() => vi.advanceTimersByTime(1))
    expect(screen.getByTestId('visible-section').textContent).toBe(
      'Section two',
    )
    expect(screen.getByRole('status').textContent).toContain(
      'Section 2 of 3: Section two',
    )

    const turningSheet = container.querySelector(
      '.textbook-page-turn-sheet',
    )
    expect(turningSheet).toBeTruthy()
    fireEvent.animationEnd(turningSheet as Element)
    expect(container.querySelector('.textbook-page-turn')).toBeNull()
  })

  it('finishes the turn through the timeout fallback', () => {
    const { container } = renderReader()

    fireEvent.click(screen.getByRole('button', { name: 'Next section' }))
    act(() => vi.advanceTimersByTime(1200))

    expect(screen.getByTestId('visible-section').textContent).toBe(
      'Section two',
    )
    expect(container.querySelector('.textbook-page-turn')).toBeNull()
  })

  it('switches immediately when reduced motion is requested', () => {
    stubReducedMotion(true)
    const { container } = renderReader()

    fireEvent.click(screen.getByRole('button', { name: 'Next section' }))

    expect(screen.getByTestId('visible-section').textContent).toBe(
      'Section two',
    )
    expect(container.querySelector('.textbook-page-turn')).toBeNull()
  })

  it('preserves arrow-key navigation while ignoring editable controls', () => {
    const { container } = renderReader()

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    act(() => vi.advanceTimersByTime(480))
    expect(screen.getByTestId('visible-section').textContent).toBe(
      'Section two',
    )

    const turningSheet = container.querySelector(
      '.textbook-page-turn-sheet',
    )
    fireEvent.animationEnd(turningSheet as Element)

    const headerInput = screen.getByRole('textbox', { name: 'Header lens' })
    fireEvent.keyDown(headerInput, { key: 'ArrowRight' })
    act(() => vi.advanceTimersByTime(1200))

    expect(screen.getByTestId('visible-section').textContent).toBe(
      'Section two',
    )

    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    act(() => vi.advanceTimersByTime(480))
    expect(screen.getByTestId('visible-section').textContent).toBe(
      'Section one',
    )
  })

  it('supports J/K, contents, dark-mode, and the global topic switcher', () => {
    const onToggleDark = vi.fn()
    const onSelectTopic = vi.fn()
    const { container } = renderReader({ onToggleDark, onSelectTopic })

    fireEvent.keyDown(window, { key: 'k', code: 'KeyK' })
    act(() => vi.advanceTimersByTime(240))
    expect(screen.getByTestId('visible-section').textContent).toBe(
      'Section two',
    )
    fireEvent.animationEnd(
      container.querySelector('.textbook-page-turn-sheet') as Element,
    )

    fireEvent.keyDown(window, { key: 'j', code: 'KeyJ' })
    act(() => vi.advanceTimersByTime(240))
    expect(screen.getByTestId('visible-section').textContent).toBe(
      'Section one',
    )
    fireEvent.animationEnd(
      container.querySelector('.textbook-page-turn-sheet') as Element,
    )

    fireEvent.keyDown(window, { key: 't', code: 'KeyT' })
    expect(
      screen.getByRole('dialog', { name: 'Table of contents' }),
    ).toBeTruthy()
    fireEvent.keyDown(window, { key: 't', code: 'KeyT' })
    expect(
      screen.queryByRole('dialog', { name: 'Table of contents' }),
    ).toBeNull()

    fireEvent.keyDown(window, { key: 'd', code: 'KeyD' })
    expect(onToggleDark).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(window, {
      key: 'k',
      code: 'KeyK',
      ctrlKey: true,
    })
    const search = screen.getByRole('combobox')
    fireEvent.change(search, { target: { value: 'quantum mechanics' } })
    fireEvent.keyDown(search, { key: 'Enter' })

    expect(onSelectTopic).toHaveBeenCalledTimes(1)
    expect(onSelectTopic.mock.calls[0][0].title).toBe('Quantum Mechanics')
    expect(onSelectTopic.mock.calls[0][1].title).toBe('Physics')
  })
})
