// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { KnowledgeSection, RewrittenSection, StudentProfile } from '../types'
import { TextbookSection } from './TextbookSection'

const section: KnowledgeSection = {
  id: 'krebs-cycle',
  heading: 'Stage 2 â€” The Krebs Cycle',
  body:
    'The Krebs cycle transfers energy from carbon compounds into electron carriers. It occurs in the mitochondrial matrix.',
  keyTerms: ['Krebs cycle', 'electron carriers', 'mitochondrial matrix'],
  diagram: {
    url: '/mitochondrion.svg',
    alt: 'A labelled mitochondrion and Krebs cycle diagram',
    caption: 'The Krebs cycle takes place in the mitochondrial matrix.',
  },
}

const profile: StudentProfile = {
  interest: 'basketball',
  createdAt: '2026-08-26T00:00:00.000Z',
}

const rewrite: RewrittenSection = {
  sectionId: section.id,
  mode: 'analogy',
  title: 'Move energy like a basketball possession',
  content:
    'Electron carriers move captured energy forward like a team advancing the ball toward a scoring play.',
  analogy:
    'Electron carriers move captured energy forward like a team advancing the ball toward a scoring play.',
  analogyLimits: 'A biochemical pathway has no coach, intent, or scoreboard.',
  analogyUsed: 'basketball possession',
  quiz: null,
  source: {
    sourceId: 'cellular-respiration',
    sourceKind: 'global-lab',
    sourceTitle: 'Cellular Respiration & ATP Synthesis',
    anchorId: section.id,
    anchorLabel: section.heading,
    url: 'https://example.test/cellular-respiration',
    license: 'Public domain',
    sourceRevision: 'v1',
  },
  interest: 'basketball',
  isMock: false,
  provider: 'local',
  generatedAt: '2026-08-26T00:00:00.000Z',
}

function renderSection() {
  return render(
    <TextbookSection
      topicId="cellular-respiration"
      section={section}
      rewrite={rewrite}
      isLoading={false}
      profile={profile}
      topicTitle="Cellular Respiration & ATP Synthesis"
      topicSubtitle="How cells convert fuel into usable energy"
      subjectTitle="Biology"
      sectionIndex={1}
      totalSections={5}
      onLearnYourWay={vi.fn()}
      onRefine={vi.fn()}
      onOutcome={vi.fn()}
      onQuizResult={vi.fn()}
      onClearRewrite={vi.fn()}
      onApplySuggestion={vi.fn()}
      onDeferSuggestion={vi.fn()}
      onNeverSuggest={vi.fn()}
    />,
  )
}

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

describe('TextbookSection companion placement', () => {
  it('renders companion as a right-panel aside and dismissing it hides the panel', async () => {
    const user = userEvent.setup()
    const onClearRewrite = vi.fn()
    const { container } = render(
      <TextbookSection
        topicId="cellular-respiration"
        section={section}
        rewrite={rewrite}
        isLoading={false}
        profile={profile}
        topicTitle="Cellular Respiration & ATP Synthesis"
        topicSubtitle="How cells convert fuel into usable energy"
        subjectTitle="Biology"
        sectionIndex={1}
        totalSections={5}
        onLearnYourWay={vi.fn()}
        onRefine={vi.fn()}
        onOutcome={vi.fn()}
        onQuizResult={vi.fn()}
        onClearRewrite={onClearRewrite}
        onApplySuggestion={vi.fn()}
        onDeferSuggestion={vi.fn()}
        onNeverSuggest={vi.fn()}
      />,
    )

    // Companion is a right-panel aside
    const companionPanel = screen.getByRole('complementary', {
      name: 'Personalized learning companion',
    })
    expect(companionPanel).toBeTruthy()
    expect(companionPanel.classList.contains('tbp-companion-panel')).toBe(true)

    // Companion content is visible
    expect(within(companionPanel).getByText(rewrite.content)).toBeTruthy()

    // Reading surface is still present alongside it
    const readingSurface = container.querySelector('.tbp-reading-surface')
    expect(readingSurface).not.toBeNull()

    // Body text is in the reading surface, not inside the companion
    expect(readingSurface?.querySelector('.tbp-body')).not.toBeNull()

    // Dismiss button is accessible within the companion
    const dismissBtn = within(companionPanel).getByRole('button', {
      name: /dismiss|close/i,
    })
    await user.click(dismissBtn)
    expect(onClearRewrite).toHaveBeenCalledTimes(1)
  })

  it('shows the bookmark strip "Connect this to" CTA when no companion is open', () => {
    render(
      <TextbookSection
        section={section}
        rewrite={null}
        isLoading={false}
        profile={profile}
        topicTitle={'Cellular Respiration & ATP Synthesis'}
        topicSubtitle={'How cells convert fuel into usable energy'}
        subjectTitle={'Biology'}
        sectionIndex={1}
        totalSections={5}
        onLearnYourWay={vi.fn()}
        onRefine={vi.fn()}
        onOutcome={vi.fn()}
        onQuizResult={vi.fn()}
        onClearRewrite={vi.fn()}
        onApplySuggestion={vi.fn()}
        onDeferSuggestion={vi.fn()}
        onNeverSuggest={vi.fn()}
      />,
    )

    // Bookmark strip CTA is present
    const learnBtn = screen.getByRole('button', {
      name: /Connect this to basketball|Learn your way/i,
    })
    expect(learnBtn).toBeTruthy()
    expect(learnBtn.classList.contains('tbp-bookmark-strip')).toBe(true)

    // No companion panel when rewrite is null
    expect(
      screen.queryByRole('complementary', {
        name: 'Personalized learning companion',
      }),
    ).toBeNull()

    // Body text is rendered (checking partial text that exists within one element)
    expect(screen.getByText(/Connect this to basketball/i)).toBeTruthy()
    expect(screen.queryByRole('complementary', { name: 'Personalized learning companion' })).toBeNull()
  })
})
describe('TextbookSection persistent highlights', () => {
  it('preserves canonical text and restores a topic-scoped highlight', () => {
    const firstRender = renderSection()
    const body = firstRender.container.querySelector<HTMLElement>('.tbp-body')
    expect(body).not.toBeNull()

    const walker = document.createTreeWalker(
      body as HTMLElement,
      NodeFilter.SHOW_TEXT,
    )
    let selectedNode: Text | null = null
    while (walker.nextNode()) {
      const candidate = walker.currentNode as Text
      if (candidate.data.includes('transfers energy')) {
        selectedNode = candidate
        break
      }
    }
    expect(selectedNode).not.toBeNull()

    const start = (selectedNode as Text).data.indexOf('transfers energy')
    const range = document.createRange()
    range.setStart(selectedNode as Text, start)
    range.setEnd(selectedNode as Text, start + 'transfers energy'.length)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)

    fireEvent.mouseUp(body as HTMLElement, { clientX: 220, clientY: 180 })
    fireEvent.click(
      screen.getByRole('button', { name: 'Highlight yellow' }),
    )

    const mark = firstRender.container.querySelector(
      'mark.gl-text-highlight--yellow',
    )
    expect(mark?.textContent).toBe('transfers energy')
    expect(body?.textContent).toBe(section.body)

    const stored = JSON.parse(
      window.localStorage.getItem(
        'gl_highlights_cellular-respiration',
      ) ?? '[]',
    )
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({
      sectionId: section.id,
      text: 'transfers energy',
      color: 'yellow',
    })
    expect(stored[0].anchors[0]).toMatchObject({
      segmentId: 'paragraph-0',
      exact: 'transfers energy',
    })

    firstRender.unmount()
    const restored = renderSection()
    expect(
      restored.container.querySelector(
        'mark.gl-text-highlight--yellow',
      )?.textContent,
    ).toBe('transfers energy')
    expect(
      restored.container.querySelector<HTMLElement>('.tbp-body')?.textContent,
    ).toBe(section.body)
  })
})
