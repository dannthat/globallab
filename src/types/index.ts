import type {
  CompanionSourceScope,
  PersonalizationMode,
  SourceAnchor,
  SourceExcerpt,
} from '../personalization/types'

export type StudyMode = 'cram' | 'explorer'

export interface LearningQuiz {
  question: string
  options: [string, string, string, string]
  correctIndex: number
  explanation: string
  evidence: string
}

export interface TopicQuizQuestion {
  id: string
  sectionId: string
  question: string
  options: [string, string, string, string]
  correctIndex: number
  explanation: string
  sourceEvidence: string
  misconceptionTargeted: string
}

export interface TopicQuizPool {
  topicId: string
  subjectId: string
  questions: TopicQuizQuestion[]
}

export interface TopicMasteryRecord {
  topicId: string
  bestScore: number
  totalQuestions: number
  attemptsCount: number
  lastAttemptAt: string
  completedQuestionIds: string[]
}

export type PersonaPreset = 'neutral' | 'gaming' | 'sports' | 'music'

// Retained so the unchanged V2 AnalogyCard remains available for reuse.
export type PersonaSelection = PersonaPreset | 'custom'

export interface StudentProfile {
  interest: string
  gradeLevel?: string
  preferredLanguage?: string
  learningGoals?: string[]
  startingSupport?: 'quick' | 'balanced' | 'guided'
  stuckSupport?: 'hint' | 'different-explanation' | 'walk-through'
  onboardingVersion?: number
  createdAt: string
  subjectPreferences?: Record<string, string>
}

export interface KnowledgeSource {
  name: string
  url: string
  license: string
}

export interface KnowledgeDiagram {
  url: string
  caption: string
  alt: string
}

export interface KnowledgeCallout {
  type: 'key-insight' | 'real-world' | 'did-you-know'
  heading: string
  body: string
}

export interface KnowledgeSection {
  id: string
  heading: string
  body: string
  keyTerms: string[]
  equation?: string
  diagram?: KnowledgeDiagram
  callouts?: KnowledgeCallout[]
  presetAnalogies?: {
    neutral: string
    gaming: string
    sports: string
    music: string
    [interest: string]: string
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
  mode: PersonalizationMode
  title: string
  content: string
  analogy: string
  analogyLimits: string
  analogyUsed: string
  quiz: LearningQuiz | null
  source: SourceAnchor
  /** Preserves the exact target for retries and refinement actions. */
  excerpt?: SourceExcerpt
  scope?: CompanionSourceScope
  interest: string
  isMock: boolean
  provider: 'preset' | 'gemini' | 'local'
  generatedAt: string
}

export type SectionRewrites = Record<string, RewrittenSection>

export interface TopicPreference {
  preferredMode: StudyMode
  savedAt: string
}

export type TopicPreferences = Record<string, TopicPreference>

export interface UserBookSection {
  index: number
  heading: string
  text: string
}

export type UserBookFileType =
  | 'pdf'
  | 'image'
  | 'text'
  | 'markdown'
  | 'code'
  | 'data'
  | 'document'
  | 'presentation'
  | 'spreadsheet'
  | 'ebook'
  | 'media'
  | 'archive'
  | 'unknown'
  // Kept only so metadata written by the pre-original-preservation importer loads safely.
  | 'docx'

export type UserBookPreviewKind =
  | 'pdf'
  | 'image'
  | 'text'
  | 'markdown'
  | 'code'
  | 'data'
  | 'media'
  | 'conversion-required'
  | 'unsupported'

export interface UserBook {
  id: string
  title: string
  fileName: string
  fileType: UserBookFileType
  /** The safe renderer the reader may use. Uploaded source is never executed. */
  previewKind: UserBookPreviewKind
  /** Honest capability copy for formats that need conversion or cannot be previewed. */
  previewMessage: string
  fileExtension: string
  mimeType: string
  fileSize: number
  pageCount: number
  /** PDFs are stored immediately and counted by the reader when first opened. */
  pageCountKnown: boolean
  /** False only for legacy DOCX imports whose earlier importer kept generated HTML. */
  originalStored: boolean
  /** Stable content fingerprint used by companion sidecars and cache invalidation. */
  sourceFingerprint?: string
  color: string       // #RRGGBB — cover color
  spineColor: string  // #RRGGBB — darker variant (pre-computed, safe for Tailwind)
  innerColor: string  // #RRGGBB — lighter variant
  addedAt: string
}
