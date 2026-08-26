import { ExternalLink } from 'lucide-react'
import type { KnowledgeSource } from '../types'

interface SourcesFooterProps {
  source: KnowledgeSource
}

export function SourcesFooter({ source }: SourcesFooterProps) {
  return (
    <footer className="sources-footer">
      <p className="sources-text">
        According to{' '}
        <a
          className="sources-link"
          href={source.url}
          target="_blank"
          rel="noreferrer"
        >
          {source.name}
          <ExternalLink className="ml-1 inline" size={11} aria-hidden="true" />
        </a>{' '}
        ({source.license}), the core material is presented without changing the scientific facts.
      </p>
    </footer>
  )
}
