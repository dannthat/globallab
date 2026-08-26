import type { KnowledgeSection } from '../types'

interface TableOfContentsProps {
  sections: KnowledgeSection[]
  activeSectionId: string | null
}

export function TableOfContents({
  sections,
  activeSectionId,
}: TableOfContentsProps) {
  return (
    <nav aria-label="On this page">
      {sections.map((section) => {
        const isActive = section.id === activeSectionId

        return (
          <button
            type="button"
            className={'toc-item' + (isActive ? ' toc-item-active' : '')}
            key={section.id}
            aria-current={isActive ? 'location' : undefined}
            onClick={() =>
              document
                .getElementById(section.id)
                ?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            <span
              className={'toc-dot' + (isActive ? ' toc-dot-active' : '')}
              aria-hidden="true"
            />
            <span>{section.heading}</span>
          </button>
        )
      })}
    </nav>
  )
}
