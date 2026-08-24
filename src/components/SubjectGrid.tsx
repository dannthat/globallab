import { Atom, Dna, FlaskConical, Sigma } from 'lucide-react'
import type { Subject } from '../types'

interface SubjectGridProps {
  subjects: Subject[]
  onSelect: (subject: Subject) => void
}

const subjectIcons = {
  biology: Dna,
  physics: Atom,
  chemistry: FlaskConical,
  mathematics: Sigma,
}

export function SubjectGrid({ subjects, onSelect }: SubjectGridProps) {
  return (
    <div className="subject-grid">
      {subjects.map((subject) => {
        const Icon = subjectIcons[subject.id as keyof typeof subjectIcons] ?? FlaskConical

        return (
          <button
            key={subject.id}
            type="button"
            className={'subject-card ' + (subject.comingSoon ? 'subject-card-disabled' : '')}
            aria-label={
              subject.title +
              ', ' +
              (subject.comingSoon ? 'Coming soon' : subject.topics.length + ' topics')
            }
            disabled={subject.comingSoon}
            onClick={() => onSelect(subject)}
          >
            <span
              className={'subject-accent subject-accent-' + subject.color}
              aria-hidden="true"
            />
            <span className="subject-card-topline">
              <span
                className={'subject-icon subject-icon-' + subject.color}
                aria-hidden="true"
              >
                <Icon size={20} strokeWidth={2} />
              </span>
              <span className="subject-status">
                {subject.comingSoon ? 'Coming soon' : subject.topics.length + ' topics'}
              </span>
            </span>
            <span>
              <span className="subject-title">{subject.title}</span>
              <span className="subject-description">{subject.description}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
