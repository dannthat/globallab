// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { KnowledgeSection, RewrittenSection, StudentProfile } from '../types'
import { TextbookSection } from './TextbookSection'

const section: KnowledgeSection = {
  id: 'krebs-cycle',
  heading: 'Stage 2 — The Krebs Cycle',
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
  it('keeps a compact analogy on the source page and expands it into a reversible study sheet', async () => {
    const user = userEvent.setup()
    const { container } = renderSection()
    const leftPage = container.querySelector<HTMLElement>('.textbook-page-left')

    expect(leftPage).not.toBeNull()
    const compactCompanion = within(leftPage as HTMLElement).getByRole(
      'complementary',
      { name: 'Personalized learning companion' },
    )
    expect(compactCompanion.classList.contains('tbp-sticky-analogy--note')).toBe(
      true,
    )
    expect(
      within(compactCompanion).getByText(rewrite.content),
    ).toBeTruthy()

    const figurePage = screen.getByRole('region', {
      name: `Visual references for ${section.heading}`,
    })
    expect(
      within(figurePage).getByRole('img', { name: section.diagram?.alt }),
    ).toBeTruthy()
    expect(
      within(figurePage).queryByRole('complementary', {
        name: 'Personalized learning companion',
      }),
    ).toBeNull()

    await user.click(
      within(compactCompanion).getByRole('button', {
        name: 'Open this help as a full study sheet',
      }),
    )

    expect(
      within(leftPage as HTMLElement).queryByRole('complementary', {
        name: 'Personalized learning companion',
      }),
    ).toBeNull()
    const studySheetPage = screen.getByRole('region', {
      name: `Personalized study sheet for ${section.heading}`,
    })
    const fullCompanion = within(studySheetPage).getByRole('complementary', {
      name: 'Personalized learning companion',
    })
    expect(fullCompanion.classList.contains('tbp-sticky-analogy--page')).toBe(
      true,
    )
    expect(
      studySheetPage.querySelector('.tbp-reference-hero--companion-page'),
    ).not.toBeNull()
    expect(
      studySheetPage.querySelector('.tbp-reference-notes-grid--companion-hidden'),
    ).not.toBeNull()

    await user.click(
      within(fullCompanion).getByRole('button', {
        name: 'Return to the scientific figure',
      }),
    )

    const restoredFigurePage = screen.getByRole('region', {
      name: `Visual references for ${section.heading}`,
    })
    expect(
      within(restoredFigurePage).getByRole('img', {
        name: section.diagram?.alt,
      }),
    ).toBeTruthy()
    expect(
      within(leftPage as HTMLElement).getByRole('complementary', {
        name: 'Personalized learning companion',
      }).classList.contains('tbp-sticky-analogy--note'),
    ).toBe(true)
  })

  it('keeps dense reading and Learn Your Way reachable with a visible page control', async () => {
    const user = userEvent.setup()
    const rendered = render(
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
    const leftScroller = rendered.container.querySelector(
      '.tbp-page-scroll--left',
    ) as HTMLDivElement
    const scrollFlow = leftScroller.querySelector(
      '.tbp-page-scroll-flow',
    ) as HTMLDivElement

    expect(
      leftScroller.contains(rendered.container.querySelector('.tbp-body')),
    ).toBe(true)
    expect(
      within(leftScroller).getByRole('button', { name: 'Learn your way' }),
    ).toBeTruthy()
    expect(
      screen.queryByRole('button', {
        name: /Show more of .* reading page/i,
      }),
    ).toBeNull()

    Object.defineProperties(leftScroller, {
      clientHeight: { configurable: true, value: 300 },
      scrollHeight: { configurable: true, value: 900 },
      scrollTop: { configurable: true, value: 0, writable: true },
    })
    Object.defineProperty(scrollFlow, 'scrollHeight', {
      configurable: true,
      value: 900,
    })
    const scrollTo = vi.fn((options: ScrollToOptions) => {
      leftScroller.scrollTop = Number(options.top ?? 0)
    })
    Object.defineProperty(leftScroller, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    })

    fireEvent.resize(window)

    const moreButton = await waitFor(() =>
      screen.getByRole('button', {
        name: /Show more of .* reading page/i,
      }),
    )
    expect(moreButton.getAttribute('aria-controls')).toBe(leftScroller.id)

    await user.click(moreButton)
    expect(scrollTo).toHaveBeenLastCalledWith({
      top: 216,
      behavior: 'smooth',
    })

    leftScroller.scrollTop = 600
    fireEvent.scroll(leftScroller)

    const topButton = await waitFor(() =>
      screen.getByRole('button', {
        name: /Return to the top of .* reading page/i,
      }),
    )
    await user.click(topButton)
    expect(scrollTo).toHaveBeenLastCalledWith({
      top: 0,
      behavior: 'smooth',
    })
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
