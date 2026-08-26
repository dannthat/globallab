// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { subjects } from '../knowledge'
import { BookContents } from './BookContents'

afterEach(cleanup)

describe('BookContents', () => {
  const subject = subjects[0]

  it('renders a semantic two-page front matter spread with truthful volume data', () => {
    const { container } = render(
      <BookContents
        subject={subject}
        subjectColor="#0d8267"
        onSelectTopic={vi.fn()}
        onBack={vi.fn()}
      />,
    )

    expect(screen.getByRole('main', { name: subject.title })).toBeTruthy()
    expect(
      screen.getByRole('heading', { level: 1, name: subject.title }),
    ).toBeTruthy()
    expect(
      screen.getByRole('heading', { level: 2, name: 'Table of Contents' }),
    ).toBeTruthy()
    expect(container.querySelectorAll('.gl-toc__page')).toHaveLength(2)

    const totalSections = subject.topics.reduce(
      (total, topic) => total + topic.sections.length,
      0,
    )
    const citedSources = new Set(
      subject.topics.map((topic) => topic.source.url || topic.source.name),
    ).size
    const stats = screen.getByLabelText('Volume statistics')

    expect(stats.textContent).toContain(`Chapters${subject.topics.length}`)
    expect(stats.textContent).toContain(`Sections${totalSections}`)
    expect(stats.textContent).toContain(`Cited sources${citedSources}`)
    expect(screen.getByText(`${subject.topics.length} chapters`)).toBeTruthy()
    expect(screen.getByText(`${totalSections} sections`)).toBeTruthy()
    expect(
      screen.getByText(
        `${citedSources} cited source${citedSources === 1 ? '' : 's'}`,
      ),
    ).toBeTruthy()
    expect(
      screen.getByText(/Learning companions appear separately and never replace/),
    ).toBeTruthy()
  })

  it('exposes every chapter as real navigation and keeps decorative tabs inert', async () => {
    const onSelectTopic = vi.fn()
    const user = userEvent.setup()
    const { container } = render(
      <BookContents
        subject={subject}
        subjectColor="#0d8267"
        onSelectTopic={onSelectTopic}
        onBack={vi.fn()}
      />,
    )

    const navigation = screen.getByRole('navigation', {
      name: 'Table of Contents',
    })
    const topicButtons = within(navigation).getAllByRole('button')
    expect(topicButtons).toHaveLength(subject.topics.length)
    expect(topicButtons[0].getAttribute('aria-describedby')).toBeTruthy()

    await user.click(
      within(navigation).getByRole('button', {
        name: `Open chapter 1: ${subject.topics[0].title}`,
      }),
    )
    expect(onSelectTopic).toHaveBeenCalledWith(subject.topics[0])

    const decorativeTabs = container.querySelector('.gl-toc__edge-tabs')
    expect(decorativeTabs?.getAttribute('aria-hidden')).toBe('true')
    expect(decorativeTabs?.querySelectorAll('button')).toHaveLength(0)
    expect(container.querySelectorAll('[aria-hidden="true"] button')).toHaveLength(0)
  })

  it('returns to the library from the first actionable control', async () => {
    const onBack = vi.fn()
    const user = userEvent.setup()
    render(
      <BookContents
        subject={subject}
        subjectColor="#0d8267"
        onSelectTopic={vi.fn()}
        onBack={onBack}
      />,
    )

    const back = screen.getByRole('button', { name: 'Back to library' })
    expect(document.querySelector('button')).toBe(back)
    await user.click(back)
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
