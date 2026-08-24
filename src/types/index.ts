export type StudyMode = 'cram' | 'explorer'

export type PersonaPreset = 'neutral' | 'gaming' | 'sports' | 'music'

// Retained so the unchanged V2 AnalogyCard remains available for reuse.
export type PersonaSelection = PersonaPreset | 'custom'

export interface StudentProfile {
  interest: string
  gradeLevel?: string
  createdAt: string
  subjectPreferences?: Record<string, string>
}

export interface KnowledgeSource {
  name: string
  url: string
  license: string
}

export interface KnowledgeSection {
  id: string
  heading: string
  body: string
  keyTerms: string[]
  equation?: string
  presetAnalogies?: {
    neutral: string
    gaming: string
    sports: string
    music: string
  }
}

export interface KnowledgeTopic {
  id: string
  subjectId: string
  title: string
  subtitle: string
  sections: KnowledgeSection[]
  source: KnowledgeSource
}

export interface Subject {
  id: string
  title: string
  description: string
  color: string
  topics: KnowledgeTopic[]
  comingSoon?: boolean
}

export interface RewrittenSection {
  sectionId: string
  analogy: string
  analogyUsed: string
  interest: string
  isMock: boolean
}

export type SectionRewrites = Record<string, RewrittenSection>

export interface TopicPreference {
  preferredMode: StudyMode
  savedAt: string
}

export type TopicPreferences = Record<string, TopicPreference>
