import { BookOpenText, Compass } from 'lucide-react'
import type { StudyMode, Topic, TopicPreferences } from '../types'

interface TopicSelectorProps {
  topics: Topic[]
  activeTopic: Topic
  preferences: TopicPreferences
  onSelect: (topic: Topic) => void
}

export function TopicSelector({
  topics,
  activeTopic,
  preferences,
  onSelect,
}: TopicSelectorProps) {
  return (
    <nav className="topic-selector" aria-label="Biology topics">
      <p className="eyebrow mb-3">Topics</p>
      <ul className="topic-list">
        {topics.map((topic, index) => {
          const isActive = topic.id === activeTopic.id
          const remembered = preferences[topic.id]?.preferredMode as StudyMode | undefined

          return (
            <li key={topic.id}>
              <button
                type="button"
                className={`topic-card ${isActive ? 'topic-card-active' : ''}`}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => onSelect(topic)}
              >
                <span className="topic-order" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-sm font-semibold leading-snug text-stone-900">
                    {topic.title}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-stone-500">
                    {topic.subtitle}
                  </span>
                </span>
                {remembered && (
                  <span className="topic-memory-badge" aria-label={`${remembered} preferred`}>
                    {remembered === 'cram' ? (
                      <BookOpenText size={11} aria-hidden="true" />
                    ) : (
                      <Compass size={11} aria-hidden="true" />
                    )}
                    {remembered === 'cram' ? 'Cram' : 'Explorer'}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
