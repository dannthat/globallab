import { ArrowLeft } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { KnowledgeTopic, Subject } from '../types'

interface BookContentsProps {
  subject: Subject
  subjectColor: string
  onSelectTopic: (topic: KnowledgeTopic) => void
  onBack: () => void
}

function countLabel(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function BookContents({
  subject,
  subjectColor,
  onSelectTopic,
  onBack,
}: BookContentsProps) {
  const totalSections = subject.topics.reduce(
    (total, topic) => total + topic.sections.length,
    0,
  )
  const citedSources = new Set(
    subject.topics.map((topic) => topic.source.url || topic.source.name),
  ).size
  const idPrefix = `gl-toc-${subject.id}`
  const volumeTitleId = `${idPrefix}-title`
  const contentsTitleId = `${idPrefix}-contents-title`
  const sourcePolicyTitleId = `${idPrefix}-source-policy-title`

  return (
    <main
      className="book-contents-shell gl-toc"
      id="main-content"
      style={{ '--subject-color': subjectColor } as CSSProperties}
      aria-labelledby={volumeTitleId}
    >
      <article
        className="book-contents-inner gl-toc__spread"
        data-subject-title={subject.title}
        data-subject-description={subject.description}
      >
        <section
          className="book-toc-frontmatter gl-toc__page gl-toc__page--frontmatter"
          aria-labelledby={volumeTitleId}
        >
          <div className="book-frontmatter-running-head gl-toc__running-head">
            <span>Global Lab field library</span>
            <span>Digital textbook</span>
          </div>
          <div className="book-frontmatter-mark gl-toc__monogram" aria-hidden="true">
            {subject.title.slice(0, 2).toUpperCase()}
          </div>
          <header className="book-frontmatter-copy gl-toc__identity">
            <p className="gl-toc__eyebrow">Curated subject volume</p>
            <h1 id={volumeTitleId}>{subject.title}</h1>
            <p className="gl-toc__description">{subject.description}</p>
          </header>

          <dl className="gl-toc__stats" aria-label="Volume statistics">
            <div className="gl-toc__stat"><dt>Chapters</dt><dd>{subject.topics.length}</dd></div>
            <div className="gl-toc__stat"><dt>Sections</dt><dd>{totalSections}</dd></div>
            <div className="gl-toc__stat"><dt>Cited sources</dt><dd>{citedSources}</dd></div>
          </dl>

          <aside className="gl-toc__source-policy" aria-labelledby={sourcePolicyTitleId}>
            <h2 id={sourcePolicyTitleId}>Source policy</h2>
            <p>
              Every chapter names its source. Learning companions appear
              separately and never replace the original explanation.
            </p>
          </aside>

          <a className="gl-toc__mobile-next" href={`#${contentsTitleId}`}>
            Open table of contents <span aria-hidden="true">→</span>
          </a>

          <footer
            className="book-frontmatter-footer gl-toc__frontmatter-footer"
            aria-hidden="true"
          >
            <span>{countLabel(subject.topics.length, 'chapter')}</span>
            <span>{countLabel(totalSections, 'section')}</span>
            <span>{countLabel(citedSources, 'cited source')}</span>
          </footer>
        </section>

        <div className="book-contents-spine gl-toc__spine" aria-hidden="true" />

        <section
          className="book-toc-column gl-toc__page gl-toc__page--contents"
          aria-labelledby={contentsTitleId}
        >
          <button type="button" className="book-toc-back gl-toc__back" onClick={onBack}>
            <ArrowLeft size={13} aria-hidden="true" />
            Back to library
          </button>

          <header className="book-toc-header gl-toc__header">
            <p className="book-toc-subject-label gl-toc__subject-label">{subject.title}</p>
            <h2 className="book-toc-title gl-toc__title" id={contentsTitleId}>
              Table of Contents
            </h2>
            <p className="book-toc-description gl-toc__contents-description">
              Choose a chapter to open its first two-page spread.
            </p>
          </header>

          <nav className="gl-toc__nav" aria-labelledby={contentsTitleId}>
            <ol className="book-toc-list gl-toc__list">
              {subject.topics.map((topic, index) => {
                const descriptionId = `${idPrefix}-topic-${topic.id}-description`
                const metaId = `${idPrefix}-topic-${topic.id}-meta`
                return (
                  <li key={topic.id} className="book-toc-entry gl-toc__item">
                    <button
                      type="button"
                      className="book-toc-entry-btn gl-toc__topic"
                      onClick={() => onSelectTopic(topic)}
                      aria-label={`Open chapter ${index + 1}: ${topic.title}`}
                      aria-describedby={`${descriptionId} ${metaId}`}
                    >
                      <span className="book-toc-num gl-toc__topic-number" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="book-toc-entry-body gl-toc__topic-body">
                        <span className="book-toc-entry-title gl-toc__topic-title">{topic.title}</span>
                        <span className="book-toc-entry-sub gl-toc__topic-subtitle" id={descriptionId}>
                          {topic.subtitle}
                        </span>
                        <span className="book-toc-entry-meta gl-toc__topic-meta" id={metaId}>
                          {countLabel(topic.sections.length, 'section')}
                        </span>
                      </span>
                      <span className="book-toc-entry-arrow gl-toc__topic-arrow" aria-hidden="true">→</span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </nav>
        </section>

        <div className="book-chapter-tabs gl-toc__edge-tabs" aria-hidden="true">
          {subject.topics.map((topic, index) => (
            <span key={topic.id} className="book-chapter-tab gl-toc__edge-tab">
              <span className="book-chapter-tab-num">{String(index + 1).padStart(2, '0')}</span>
            </span>
          ))}
        </div>
      </article>
    </main>
  )
}
