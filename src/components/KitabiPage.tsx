import { ChevronRight } from 'lucide-react'
import type {
  KnowledgeSection,
  KnowledgeTopic,
  SectionRewrites,
  StudentProfile,
  Subject,
} from '../types'
import { KitabiSection } from './KitabiSection'
import { SourcesFooter } from './SourcesFooter'

interface KitabiPageProps {
  topic: KnowledgeTopic
  subject: Subject
  profile: StudentProfile | null
  rewrites: SectionRewrites
  loadingSectionId: string | null
  error?: string | null
  errorSectionId?: string | null
  onLearnYourWay: (section: KnowledgeSection) => void
  onClearRewrite: (sectionId: string) => void
  onBack: () => void
}

export function KitabiPage({
  topic,
  subject,
  profile,
  rewrites,
  loadingSectionId,
  error = null,
  errorSectionId = null,
  onLearnYourWay,
  onClearRewrite,
  onBack,
}: KitabiPageProps) {
  return (
    <main className="kitabi-page" id="main-content">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <button type="button" className="breadcrumb-back" onClick={onBack}>
          {subject.title}
        </button>
        <ChevronRight size={14} aria-hidden="true" />
        <span aria-current="page">{topic.title}</span>
      </nav>

      <div className="subject-tag">
        <span
          className={'subject-dot subject-dot-' + subject.color}
          aria-hidden="true"
        />
        {subject.title}
      </div>
      <h1 className="kitabi-title">{topic.title}</h1>
      <p className="kitabi-subtitle">{topic.subtitle}</p>
      <div className="kitabi-divider" />

      {topic.sections.map((section) => {
        const rewrite = rewrites[topic.id + '::' + section.id] ?? null

        return (
          <KitabiSection
            key={section.id}
            section={section}
            rewrite={rewrite}
            isLoading={loadingSectionId === section.id}
            profile={profile}
            error={errorSectionId === section.id ? error : null}
            onLearnYourWay={() => onLearnYourWay(section)}
            onClearRewrite={() => onClearRewrite(section.id)}
          />
        )
      })}

      <SourcesFooter source={topic.source} />
    </main>
  )
}
