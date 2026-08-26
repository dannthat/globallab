import type {
  ApprovedPresentationPreferences,
  PersonalizationMode,
  SourceExcerpt,
} from './types'
import type { StudentProfile } from '../types'

export interface CompanionQuiz {
  question: string
  options: [string, string, string, string]
  correctIndex: number
  explanation: string
  evidence: string
}

export interface LearningCompanionArtifact {
  id: string
  mode: PersonalizationMode
  title: string
  content: string
  limitations: string
  excerpt: SourceExcerpt
  quiz?: CompanionQuiz
  provider: 'preset' | 'gemini' | 'local'
  model?: string
  createdAt: string
}

export interface LearningCompanionRequest {
  excerpt: SourceExcerpt
  mode: PersonalizationMode
  profile: StudentProfile
  approvedPresentation: ApprovedPresentationPreferences
  presetAnalogy?: string
  /** Uploaded-source privacy boundary: return deterministic local help before fetch. */
  localOnly?: boolean
  signal?: AbortSignal
}
