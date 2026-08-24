export type StudyMode = 'cram' | 'explorer'

export type PersonaPreset = 'neutral' | 'gaming' | 'sports' | 'music'

export type PersonaSelection = PersonaPreset | 'custom'

export interface AnalogySet {
  neutral: string
  gaming: string
  sports: string
  music: string
}

export interface ExplorerStep {
  question: string
  groundedAnswer: string
  analogies: AnalogySet
}

export interface CramContent {
  definition: string
  stages: string[]
  examFacts: string[]
  commonMistakes: string[]
}

export interface Topic {
  id: string
  title: string
  subtitle: string
  cram: CramContent
  explorer: ExplorerStep[]
}

export interface TopicPreference {
  preferredMode: StudyMode
  savedAt: string
}

export type TopicPreferences = Record<string, TopicPreference>

export interface CustomExplorerStep {
  question: string
  groundedAnswer: string
  analogy: string
}

export interface CustomPersonaResult {
  interest: string
  isMock: boolean
  steps: CustomExplorerStep[]
}
