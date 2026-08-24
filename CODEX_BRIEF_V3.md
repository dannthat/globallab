# CODEX BRIEF — Global Lab v3
> Read every section before writing a single line. v3 is a significant UX rearchitecture. You are not adding features on top of v2 — you are replacing the primary interaction model while keeping the underlying content and API logic.

---

## WHAT V1 AND V2 BUILT (CONTEXT — DO NOT SKIP)

**V1:** One biology topic. Cram mode / Explorer mode toggle. Four persona preset chips (Gaming, Sports, Music, Neutral). Custom persona via Gemini API. Per-topic mode memory in localStorage.

**V2:** Real Gemini API wired. Four additional biology topics. Topic selector UI. Flat `Topic[]` data model.

**What was RIGHT in v1/v2:**
- The underlying content structure (definitions, mechanisms, analogies)
- The Gemini API integration in `personaService.ts`
- The persona prompt logic (selective analogy substitution)
- Per-topic memory in `useTopicMemory.ts`
- The analogy quality in the hand-written content

**What was WRONG in v1/v2:**
- Students had to pick a mode every time. Personalization was manual (chip selection), not profile-driven.
- "Cram Mode" and "Explorer Mode" as named UX patterns were arbitrary — not how students actually study.
- Persona chips were always visible — felt like a filter, not a personalized experience.
- Data model was hardcoded in `topics.ts` instead of a structured knowledge base.
- Flat topic list with no subject hierarchy — not ready for STEM expansion.

---

## V3 — THE CORE RETHINK IN ONE PARAGRAPH

The primary experience is a **Kitabi** — a clean, premium textbook page. The student opens a topic and just reads. No mode selection, no persona chips. When they hit a section they do not understand, they press **"Learn it your way"** on that specific section. The system reads that section's content and the student's personal profile (set once at onboarding, never asked again) and rewrites that section in their language and analogy style — inline, replacing the original text. They can tap "Back to original" at any time. That is the whole product.

---

## WHAT GETS DELETED — DO THIS FIRST

Delete these files entirely. Their logic is replaced by the new architecture:
- `src/components/ModeToggle.tsx`
- `src/components/PersonaBar.tsx`
- `src/components/CramView.tsx`
- `src/components/ExplorerView.tsx`
- `src/components/ExplorerStep.tsx`
- `src/components/CustomPersonaModal.tsx`
- `src/data/topics.ts`

**Do NOT delete:**
- `src/components/AnalogyCard.tsx` — repurposed in "Learn it your way" output
- `src/components/HelpfulButton.tsx` — repurposed ("Did this help?")
- `src/services/personaService.ts` — updated, not replaced
- `src/hooks/useTopicMemory.ts` — kept as-is

---

## NEW ARCHITECTURE OVERVIEW

```
src/
├── knowledge/
│   ├── biology/
│   │   ├── cellular-respiration.ts
│   │   ├── cell-membrane.ts
│   │   ├── dna-expression.ts
│   │   ├── action-potential.ts
│   │   └── enzyme-kinetics.ts
│   └── index.ts
├── types/index.ts                  UPDATED
├── hooks/
│   ├── useTopicMemory.ts           UNCHANGED
│   ├── useStudentProfile.ts        NEW
│   └── useLearnYourWay.ts          NEW
├── services/personaService.ts      UPDATED
├── components/
│   ├── AnalogyCard.tsx             UNCHANGED
│   ├── HelpfulButton.tsx           UNCHANGED
│   ├── OnboardingFlow.tsx          NEW
│   ├── SubjectGrid.tsx             NEW
│   ├── KitabiPage.tsx              NEW
│   ├── KitabiSection.tsx           NEW
│   ├── LearnYourWayPanel.tsx       NEW
│   └── SourcesFooter.tsx           NEW
└── App.tsx                         UPDATED
```

---

## NEW TYPES — Replace `src/types/index.ts` entirely

```typescript
export type StudyMode = 'cram' | 'explorer' // kept for localStorage backward-compat only

export type PersonaPreset = 'neutral' | 'gaming' | 'sports' | 'music'

export interface StudentProfile {
  interest: string       // free text e.g. "Formula 1", "K-pop"
  gradeLevel?: string    // optional: "Grade 10", "University"
  createdAt: string      // ISO date string
}

export interface KnowledgeSource {
  name: string           // "NIH National Institute of General Medical Sciences"
  url: string
  license: string        // "Public Domain" | "CC BY 3.0"
}

export interface KnowledgeSection {
  id: string
  heading: string
  body: string           // canonical text, 2-4 paragraphs
  keyTerms: string[]
  equation?: string      // LaTeX string for KaTeX, if applicable
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
  color: string          // Tailwind color name: 'emerald' | 'blue' | 'amber' | 'violet'
  topics: KnowledgeTopic[]
  comingSoon?: boolean
}

export interface RewrittenSection {
  sectionId: string
  rewrittenBody: string
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
```

---

## KNOWLEDGE BASE — `src/knowledge/biology/cellular-respiration.ts`

```typescript
import type { KnowledgeTopic } from '../../types'

export const cellularRespiration: KnowledgeTopic = {
  id: 'cellular-respiration',
  subjectId: 'biology',
  title: 'Cellular Respiration & ATP Synthesis',
  subtitle: 'How cells extract and store energy from glucose',
  source: {
    name: 'NIH National Institute of General Medical Sciences',
    url: 'https://www.nigms.nih.gov/education/fact-sheets/Pages/cell-biology.aspx',
    license: 'Public Domain',
  },
  sections: [
    {
      id: 'overview',
      heading: 'What is Cellular Respiration?',
      body: 'Cellular respiration is the process by which cells break down glucose and other organic molecules to produce adenosine triphosphate (ATP) — the universal energy currency of the cell. The overall equation is: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + approximately 30–32 ATP. The process occurs in three connected stages: glycolysis (cytoplasm), the Krebs cycle (mitochondrial matrix), and the electron transport chain (inner mitochondrial membrane). Each stage extracts energy progressively, transferring it into ATP molecules that power every cellular activity from muscle contraction to protein synthesis.',
      keyTerms: ['ATP', 'glucose', 'cellular respiration', 'energy currency', 'mitochondria'],
      equation: 'C_6H_{12}O_6 + 6O_2 \\rightarrow 6CO_2 + 6H_2O + {\\approx}30\\text{–}32\\text{ ATP}',
      presetAnalogies: {
        neutral: 'ATP is the cell\'s universal energy currency — like a standardised rechargeable battery that every cellular machine is built to use, regardless of where the original energy came from.',
        gaming: 'Glucose is a large resource cache the cell cannot spend directly. Cellular respiration converts it into ATP — the in-game currency every ability, movement, and repair action actually runs on.',
        sports: 'Glucose is a full fuel tank — potential energy stored but not yet usable. Cellular respiration is the engine that converts it into actual drive reaching the wheels. ATP is that usable output.',
        music: 'Glucose is a raw, unprocessed audio file. Cellular respiration is the mastering chain that processes it stage by stage into clean, controlled output — each ATP molecule a perfectly levelled usable unit.',
      },
    },
    {
      id: 'glycolysis',
      heading: 'Stage 1 — Glycolysis',
      body: 'Glycolysis occurs in the cytoplasm and requires no oxygen — it is the only stage that can proceed anaerobically. One molecule of glucose (6 carbons) is split into two molecules of pyruvate (3 carbons each) through a series of enzyme-catalysed reactions. The net energy yield is 2 ATP and 2 NADH per glucose molecule. NADH is an electron carrier that will deliver high-energy electrons to the electron transport chain in stage 3. Glycolysis evolved before oxygen was abundant in Earth\'s atmosphere and is shared by nearly every living organism on Earth.',
      keyTerms: ['glycolysis', 'cytoplasm', 'pyruvate', 'anaerobic', 'NADH', 'electron carrier'],
      presetAnalogies: {
        neutral: 'Glycolysis is the first processing stage in a refinery — crude input split into smaller, more manageable intermediates before deeper energy extraction can begin.',
        gaming: 'Glycolysis is the initial resource split — one large node broken into two smaller ones, with a small immediate reward (2 ATP). The two smaller nodes then feed into the higher-yield processing stages downstream.',
        sports: 'Glycolysis is the body\'s fast energy system — it fires immediately without oxygen. It is the explosive sprint energy, not the endurance engine.',
        music: 'Glycolysis is like splitting a stereo master into two mono channels — initial processing that yields a small efficiency gain and sets up the richer signal processing that follows.',
      },
    },
    {
      id: 'krebs',
      heading: 'Stage 2 — The Krebs Cycle',
      body: 'The Krebs cycle (citric acid cycle) occurs in the mitochondrial matrix. Each pyruvate from glycolysis is first converted to acetyl-CoA (2 carbons), releasing one CO₂ and producing one NADH. Acetyl-CoA then enters the cycle, which regenerates a 4-carbon molecule through a series of reactions, releasing 2 more CO₂ and producing 3 NADH, 1 FADH₂, and 1 ATP per turn. Because glycolysis produces two pyruvates per glucose, the Krebs cycle turns twice per glucose molecule, yielding 6 NADH, 2 FADH₂, and 2 ATP from this stage. The primary role of the Krebs cycle is not direct ATP production — it is harvesting high-energy electrons into carrier molecules (NADH and FADH₂) for delivery to the electron transport chain.',
      keyTerms: ['Krebs cycle', 'citric acid cycle', 'mitochondrial matrix', 'acetyl-CoA', 'FADH₂', 'CO₂'],
      equation: '2 \\times \\text{Pyruvate} \\rightarrow 6\\text{ NADH} + 2\\text{ FADH}_2 + 2\\text{ ATP} + 4\\text{ CO}_2',
      presetAnalogies: {
        neutral: 'The Krebs cycle is a harvesting loop — it strips high-energy electrons from carbon compounds and loads them into carrier vehicles (NADH, FADH₂) for delivery to where the real power generation happens.',
        gaming: 'The Krebs cycle is the resource processing loop — it extracts valuable components into transportable containers (NADH, FADH₂) and routes them to the final high-yield production facility. The cycle itself outputs little power directly.',
        sports: 'The Krebs cycle is the conditioning phase between sprint sessions — not the explosive output, but the system loading the body\'s carriers with everything needed for the sustained main effort.',
        music: 'The Krebs cycle is the mid-chain signal processor — extracting harmonic content into separate buses and routing them to the master section where real output power is generated.',
      },
    },
    {
      id: 'etc',
      heading: 'Stage 3 — Electron Transport Chain & ATP Synthase',
      body: 'The electron transport chain (ETC) is embedded in the inner mitochondrial membrane and produces approximately 26–28 of the 30–32 ATP generated per glucose. NADH and FADH₂ deliver electrons to protein complexes in the chain. As electrons move through these complexes, the released energy pumps protons (H⁺) from the mitochondrial matrix into the intermembrane space, creating a steep proton gradient — the proton-motive force. Protons flow back into the matrix through ATP synthase, a molecular rotor whose rotation drives ATP synthesis from ADP and inorganic phosphate. This mechanism — using a proton gradient to power ATP synthesis — is called chemiosmosis. Oxygen is the final electron acceptor, combining with electrons and protons to form water. Without oxygen, the ETC stalls and ATP production collapses to the 2 ATP of glycolysis alone.',
      keyTerms: ['electron transport chain', 'ATP synthase', 'chemiosmosis', 'proton gradient', 'proton-motive force', 'inner mitochondrial membrane', 'ADP'],
      presetAnalogies: {
        neutral: 'ATP synthase works like a water turbine in a dam. The proton gradient is the water held behind the dam wall. Protons rushing through the synthase spin its rotor the way water spins a turbine — converting controlled flow into usable mechanical energy output.',
        gaming: 'The ETC pressurises protons into a high-density zone. ATP synthase is the only controlled release gate — as protons rush through, the rotating mechanism mints ATP. More pressure built = faster ATP output rate.',
        sports: 'The proton gradient is a hydraulic system under pressure. ATP synthase is the valve — the rush of pressure through the turbine generates power on demand. No oxygen means no release pathway, and the whole system stalls at 2 ATP.',
        music: 'The ETC builds tension across the membrane like a long sustained chord before resolution. ATP synthase is the release — proton flow turns the rotor in steady rhythm, converting built-up potential into a continuous stream of ATP output.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Exam Mistakes',
      body: 'Four mistakes appear consistently across cellular respiration exams. First: glycolysis occurs in the cytoplasm, not the mitochondria — the most frequently lost point on location questions. Second: the correct ATP yield per glucose is approximately 30–32, not 36 or 38 as stated in older textbooks; the higher numbers assumed 100% proton gradient efficiency, which does not occur in living cells. Third: fermentation is not a stage of cellular respiration — it is an emergency anaerobic pathway that regenerates NAD⁺ to keep glycolysis running when no oxygen is available, producing only 2 ATP per glucose and no ETC involvement. Fourth: CO₂ is released during pyruvate oxidation and the Krebs cycle, not during glycolysis.',
      keyTerms: ['fermentation', 'NAD⁺', 'ATP yield', 'cytoplasm', 'anaerobic'],
      presetAnalogies: {
        neutral: 'Fermentation is the cell\'s emergency generator — it keeps minimum functions running during a power outage (no oxygen) but outputs a fraction of normal capacity and cannot sustain full cellular operation.',
        gaming: 'Fermentation is low-power safe mode — the cell keeps basic processes running when the main power system (ETC) is offline. Temporary, drastically reduced output, no substitute for the real system.',
        sports: 'Fermentation is the team playing pure defence with no offensive plays — conserving what they can when the main game plan breaks down. Sustainable for short bursts; not a viable long-term strategy.',
        music: 'Fermentation is the acoustic backup set when the main PA fails — stripped down, lower output, keeps the show running but nowhere near full production quality.',
      },
    },
  ],
}
```

---

## MIGRATE THE OTHER 4 BIOLOGY TOPICS

Create the same structure for each remaining topic. Migrate content from the deleted `topics.ts` as follows:

**Mapping rule:**
- `topic.cram.definition` → first section `body` (overview)
- Each `ExplorerStep.groundedAnswer` → a section `body`
- Each `ExplorerStep.analogies` → that section's `presetAnalogies`
- `topic.cram.examFacts` + `topic.cram.commonMistakes` → last section (exam-traps) `body`
- `topic.cram.stages` → one section per stage or integrated into relevant section bodies

**Topic-to-file mapping:**
- `src/knowledge/biology/cell-membrane.ts` — id: `cell-membrane`, subjectId: `biology`
  - Sections: overview, phospholipid-bilayer, passive-transport, active-transport, exam-traps
  - Source: `{ name: 'NIH National Institute of General Medical Sciences', url: 'https://www.nigms.nih.gov', license: 'Public Domain' }`

- `src/knowledge/biology/dna-expression.ts` — id: `dna-expression`
  - Sections: overview, transcription, rna-processing, translation, mutations, exam-traps

- `src/knowledge/biology/action-potential.ts` — id: `action-potential`
  - Sections: overview, resting-potential, depolarization, repolarization, synaptic-transmission, exam-traps

- `src/knowledge/biology/enzyme-kinetics.ts` — id: `enzyme-kinetics`
  - Sections: overview, enzyme-substrate, inhibition, allosteric-regulation, temperature-ph, exam-traps

All 4 files use this source block:
```typescript
source: {
  name: 'NIH National Institute of General Medical Sciences',
  url: 'https://www.nigms.nih.gov/education',
  license: 'Public Domain',
},
```

---

## KNOWLEDGE INDEX — `src/knowledge/index.ts`

```typescript
import type { Subject } from '../types'
import { cellularRespiration } from './biology/cellular-respiration'
import { cellMembrane } from './biology/cell-membrane'
import { dnaExpression } from './biology/dna-expression'
import { actionPotential } from './biology/action-potential'
import { enzymeKinetics } from './biology/enzyme-kinetics'

export const subjects: Subject[] = [
  {
    id: 'biology',
    title: 'Biology',
    description: 'Life processes, cells, genetics, and organisms',
    color: 'emerald',
    topics: [cellularRespiration, cellMembrane, dnaExpression, actionPotential, enzymeKinetics],
  },
  {
    id: 'physics',
    title: 'Physics',
    description: 'Forces, energy, waves, and the physical world',
    color: 'blue',
    topics: [],
    comingSoon: true,
  },
  {
    id: 'chemistry',
    title: 'Chemistry',
    description: 'Matter, reactions, and molecular interactions',
    color: 'amber',
    topics: [],
    comingSoon: true,
  },
  {
    id: 'mathematics',
    title: 'Mathematics',
    description: 'Calculus, algebra, statistics, and abstract reasoning',
    color: 'violet',
    topics: [],
    comingSoon: true,
  },
]
```

---

## `src/hooks/useStudentProfile.ts`

```typescript
import { useCallback, useState } from 'react'
import type { StudentProfile } from '../types'

const STORAGE_KEY = 'globallab_profile'

function readProfile(): StudentProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as StudentProfile) : null
  } catch {
    return null
  }
}

export function useStudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(readProfile)

  const saveProfile = useCallback((data: Omit<StudentProfile, 'createdAt'>) => {
    const next: StudentProfile = { ...data, createdAt: new Date().toISOString() }
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    setProfile(next)
  }, [])

  const clearProfile = useCallback(() => {
    try { window.localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    setProfile(null)
  }, [])

  return { profile, hasProfile: profile !== null, saveProfile, clearProfile }
}
```

---

## `src/hooks/useLearnYourWay.ts`

```typescript
import { useCallback, useState } from 'react'
import { rewriteSection } from '../services/personaService'
import type { KnowledgeSection, KnowledgeTopic, RewrittenSection, SectionRewrites, StudentProfile } from '../types'

export function useLearnYourWay(topic: KnowledgeTopic) {
  const [rewrites, setRewrites] = useState<SectionRewrites>({})
  const [loadingSectionId, setLoadingSectionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rewriteKey = (sectionId: string) => `${topic.id}::${sectionId}`

  const learn = useCallback(
    async (section: KnowledgeSection, profile: StudentProfile) => {
      const key = rewriteKey(section.id)
      if (rewrites[key]) return rewrites[key] // cached — no re-fetch

      setLoadingSectionId(section.id)
      setError(null)

      try {
        const result = await rewriteSection(section, profile)
        setRewrites((prev) => ({ ...prev, [key]: result }))
        return result
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : 'Could not rewrite this section. Try again.'
        setError(message)
        return null
      } finally {
        setLoadingSectionId(null)
      }
    },
    [rewrites, topic.id],
  )

  const clearRewrite = useCallback(
    (sectionId: string) => {
      setRewrites((prev) => {
        const next = { ...prev }
        delete next[rewriteKey(sectionId)]
        return next
      })
    },
    [topic.id],
  )

  return {
    rewrites,
    loadingSectionId,
    error,
    learn,
    clearRewrite,
    getRewrite: (sectionId: string) => rewrites[rewriteKey(sectionId)] ?? null,
  }
}
```

---

## Replace `src/services/personaService.ts` entirely

```typescript
import type { KnowledgeSection, PersonaPreset, RewrittenSection, StudentProfile } from '../types'

const GEMINI_MODEL = 'gemini-2.0-flash'
const MOCK_DELAY_MS = 900

// Keyword detection for quality preset fallback (no API call needed)
const PRESET_KEYWORDS: Record<PersonaPreset, string[]> = {
  gaming: ['gaming', 'game', 'video game', 'gamer', 'esports', 'minecraft', 'fortnite', 'pokemon', 'roblox', 'league', 'valorant'],
  sports: ['sport', 'basketball', 'football', 'soccer', 'tennis', 'athletics', 'gym', 'fitness', 'running', 'swimming', 'cricket'],
  music: ['music', 'guitar', 'piano', 'singing', 'rap', 'hip hop', 'kpop', 'jazz', 'drums', 'producer', 'dj', 'violin'],
  neutral: [],
}

function detectPreset(interest: string): PersonaPreset | null {
  const lower = interest.toLowerCase()
  for (const [preset, keywords] of Object.entries(PRESET_KEYWORDS) as [PersonaPreset, string[]][]) {
    if (preset === 'neutral') continue
    if (keywords.some((kw) => lower.includes(kw))) return preset
  }
  return null
}

function buildSectionRewritePrompt(section: KnowledgeSection, profile: StudentProfile): string {
  return `You are rewriting one section of a STEM textbook for a student with this profile:
- Interest: ${profile.interest}
- Grade level: ${profile.gradeLevel ?? 'not specified'}

Section heading: ${section.heading}

Original section text:
${section.body}

Rewrite this section following these STRICT rules:
1. Keep every scientific fact, term, and mechanism exactly accurate — do not change or omit any.
2. Preserve the same paragraph structure and full coverage.
3. Replace only the explanatory analogies and examples with ones drawn from "${profile.interest}".
4. Maximum one analogy per concept — do not saturate the text with themed references.
5. If you cannot find a genuine illuminating analogy for "${profile.interest}", use a neutral analogy instead. Never force a bad one.
6. Do not use slang, forced puns, or cringeworthy themed language.
7. Return ONLY valid JSON with no surrounding text, no markdown, no code fences:
{"rewrittenBody": "...", "analogyUsed": "one sentence describing the main analogy used"}`
}

export async function rewriteSection(
  section: KnowledgeSection,
  profile: StudentProfile,
): Promise<RewrittenSection> {
  const interest = profile.interest.trim()
  if (!interest || interest === 'neutral') {
    // No personalisation needed — return original
    return {
      sectionId: section.id,
      rewrittenBody: section.body,
      analogyUsed: 'Original explanation (neutral)',
      interest,
      isMock: false,
    }
  }

  // Quality fallback: detected preset → use hand-vetted analogy instantly, no API call
  const preset = detectPreset(interest)
  if (preset && section.presetAnalogies) {
    await new Promise((resolve) => window.setTimeout(resolve, 250))
    const analogyText = section.presetAnalogies[preset]
    return {
      sectionId: section.id,
      rewrittenBody: `${section.body}\n\n${analogyText}`,
      analogyUsed: analogyText,
      interest,
      isMock: false,
    }
  }

  // Custom interest → Gemini API
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  if (!apiKey || apiKey === 'PASTE_YOUR_NEW_KEY_HERE') {
    await new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS))
    return {
      sectionId: section.id,
      rewrittenBody: `[Mock — no API key set] ${section.body}`,
      analogyUsed: `Mock analogy using ${interest}`,
      interest,
      isMock: true,
    }
  }

  const prompt = buildSectionRewritePrompt(section, profile)
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.65, maxOutputTokens: 1024, responseMimeType: 'application/json' },
      }),
    },
  )

  if (!response.ok) {
    if (response.status === 429) throw new Error('Too many requests — wait a moment and try again.')
    if (response.status === 400) throw new Error('This section could not be rewritten. Try again.')
    throw new Error('Could not reach the personalisation service. Try again in a moment.')
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) throw new Error('Empty response from personalisation service.')

  let parsed: { rewrittenBody: string; analogyUsed: string }
  try { parsed = JSON.parse(rawText) } catch {
    throw new Error('Response could not be parsed. Try again.')
  }

  return {
    sectionId: section.id,
    rewrittenBody: parsed.rewrittenBody,
    analogyUsed: parsed.analogyUsed,
    interest,
    isMock: false,
  }
}
```

---

## NEW COMPONENTS

### `src/components/OnboardingFlow.tsx`

Full-page screen — shown only on first visit when profile is null. Not a modal.

Props: `{ onComplete: (interest: string, gradeLevel?: string) => void }`

Layout (centred, max-w-md card on stone-50 background):
1. FlaskConical icon + "Global Lab" brand at top of card
2. H1: "Make every explanation yours"
3. Subtext: "Tell us one thing you're into. We'll use it to rewrite any explanation in your language — and we'll never ask again."
4. Label: "What are you into?" — Input: text, maxLength 60, autoFocus, placeholder "Formula 1, baking, K-pop, basketball…"
5. Label: "Your level (optional)" — Select: "Grade 9" / "Grade 10" / "Grade 11" / "Grade 12" / "University" / "Prefer not to say"
6. Submit button: "Start studying →" — disabled if interest is empty
7. Skip link below button (small, muted): "Skip for now" — calls `onComplete('neutral')`

### `src/components/SubjectGrid.tsx`

Props: `{ subjects: Subject[], onSelect: (subject: Subject) => void }`

Renders a 2×2 responsive grid. Each subject card:
- Top accent bar in the subject color
- Subject title (bold, large)
- Subject description (small, stone-500)
- If `!comingSoon`: topic count badge ("5 topics")
- If `comingSoon`: "Coming soon" pill badge
- Full card clickable if `!comingSoon` — visually disabled (opacity-40, cursor-not-allowed, pointer-events-none) if `comingSoon`

### `src/components/KitabiPage.tsx`

Props:
```typescript
interface KitabiPageProps {
  topic: KnowledgeTopic
  subject: Subject
  profile: StudentProfile | null
  rewrites: SectionRewrites
  loadingSectionId: string | null
  onLearnYourWay: (section: KnowledgeSection) => void
  onClearRewrite: (sectionId: string) => void
  onBack: () => void
}
```

Layout:
1. Breadcrumb: "[Subject title] → [Topic title]" — subject title is a back button
2. Subject tag pill (coloured dot + subject name)
3. H1 topic title (large, editorial — text-4xl font-bold tracking-tight)
4. Topic subtitle (stone-500, mt-2)
5. Horizontal divider
6. One `KitabiSection` per `topic.sections` entry
7. `SourcesFooter` at bottom

### `src/components/KitabiSection.tsx`

Props:
```typescript
interface KitabiSectionProps {
  section: KnowledgeSection
  rewrite: RewrittenSection | null
  isLoading: boolean
  profile: StudentProfile | null
  onLearnYourWay: () => void
  onClearRewrite: () => void
}
```

Layout:
1. H3 section heading
2. Equation block (KaTeX rendered) — only if `section.equation` exists
3. Body text — if `rewrite` exists: show `rewrite.rewrittenBody`; otherwise show `section.body`. Bold all occurrences of each term in `section.keyTerms` by splitting and wrapping with `<strong>`.
4. Bottom action row:
   - If NO rewrite: right-aligned "Learn it your way" button (WandSparkles icon + label). Shows spinner + "Rewriting…" text while `isLoading`. Hidden if profile is null or profile.interest === 'neutral'.
   - If rewrite active: left side shows "Rewritten for [interest]" badge; right side shows "Back to original" text button (X icon).
5. If rewrite active and `rewrite.analogyUsed`: small muted text below: "Analogy: [rewrite.analogyUsed]"
6. If rewrite is mock (`rewrite.isMock`): show a small amber pill "Preview — API key not set"

### `src/components/SourcesFooter.tsx`

Props: `{ source: KnowledgeSource }`

Renders at the bottom of KitabiPage:
```
Sources: [source.name] ([source.license])  ←  linked to source.url
```
Small (text-xs), stone-400, with an ExternalLink icon. Full content: "Content grounded in [linked source name] ([license]). Scientific facts are unmodified."

---

## KATEX INSTALLATION

```bash
npm install katex @types/katex
```

Top of `src/index.css`:
```css
@import 'katex/dist/katex.min.css';
```

Usage in `KitabiSection.tsx`:
```typescript
import katex from 'katex'

// In JSX:
{section.equation && (
  <div
    className="equation-block"
    dangerouslySetInnerHTML={{
      __html: katex.renderToString(section.equation, {
        throwOnError: false,
        displayMode: true,
      }),
    }}
  />
)}
```

---

## UPDATED `src/App.tsx`

State:
```typescript
const { profile, hasProfile, saveProfile } = useStudentProfile()
const [activeSubject, setActiveSubject] = useState<Subject | null>(null)
const [activeTopic, setActiveTopic] = useState<KnowledgeTopic | null>(null)
```

Rendering tree:
```
!hasProfile
  → <OnboardingFlow onComplete={(interest, grade) => saveProfile({ interest, gradeLevel: grade })} />

hasProfile && !activeSubject
  → Header + <SubjectGrid subjects={subjects} onSelect={setActiveSubject} />

hasProfile && activeSubject && !activeTopic
  → Header + topic list (mapped buttons) + back link to SubjectGrid

hasProfile && activeSubject && activeTopic
  → Header + <KitabiPage ... /> with useLearnYourWay(activeTopic)
```

Header (shown whenever `hasProfile`):
- Left: FlaskConical icon + "Global Lab"
- Right: Small chip showing profile.interest with a pencil/edit icon. Clicking the chip opens an inline popover with a text input to update the interest and a save button. Saving calls `saveProfile({ ...profile, interest: newInterest })`.

The `useLearnYourWay` hook is called when `activeTopic` is set. Pass its `learn`, `getRewrite`, `clearRewrite`, `rewrites`, `loadingSectionId` to `KitabiPage`.

When a topic is selected:
- Set `activeTopic`
- The `useLearnYourWay` hook resets automatically since it is called with the new topic

---

## CSS — Append to `src/index.css`

```css
/* Kitabi */
.kitabi-page   { @apply mx-auto max-w-3xl px-4 py-10 sm:px-6; }
.kitabi-section { @apply border-b border-stone-100 py-10 last:border-0; }
.section-heading { @apply text-xl font-semibold tracking-[-0.02em] text-stone-900 sm:text-2xl; }
.section-body { @apply mt-4 text-[15.5px] leading-8 text-stone-600 sm:leading-9; }
.equation-block { @apply my-6 overflow-x-auto rounded-2xl bg-stone-50 px-6 py-5 text-center; }

/* Learn it your way */
.liyw-button {
  @apply flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-500 shadow-sm transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 disabled:opacity-50;
}
.rewrite-badge {
  @apply flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100;
}
.back-to-original {
  @apply flex items-center gap-1 text-xs text-stone-400 underline decoration-stone-300 underline-offset-2 hover:text-stone-600;
}
.analogy-note { @apply mt-3 text-xs leading-5 text-stone-400 italic; }
.mock-badge { @apply inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100; }

/* Subject grid */
.subject-grid { @apply grid grid-cols-1 gap-4 sm:grid-cols-2; }
.subject-card {
  @apply flex cursor-pointer flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-6 transition-all duration-150 hover:border-stone-300 hover:shadow-md;
}
.subject-card-disabled { @apply cursor-not-allowed opacity-40 hover:border-stone-200 hover:shadow-none; }

/* Onboarding */
.onboarding-shell { @apply flex min-h-svh flex-col items-center justify-center bg-stone-50 px-4 py-16; }
.onboarding-card { @apply w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-100; }

/* Sources footer */
.sources-footer { @apply mt-12 border-t border-stone-100 pt-6; }
.sources-text { @apply text-xs leading-6 text-stone-400; }
.sources-link { @apply underline decoration-stone-200 underline-offset-2 hover:text-stone-600 transition-colors; }

/* Breadcrumb */
.breadcrumb { @apply flex items-center gap-2 text-sm text-stone-400 mb-8; }
.breadcrumb-back { @apply hover:text-stone-700 transition-colors cursor-pointer; }
```

---

## BUILD ORDER

1. `npm install katex @types/katex`
2. Delete all deprecated files listed at top of this brief
3. Replace `src/types/index.ts` with new types
4. Create `src/knowledge/` directory and all 5 biology files + `index.ts`
5. Create `src/hooks/useStudentProfile.ts`
6. Create `src/hooks/useLearnYourWay.ts`
7. Replace `src/services/personaService.ts`
8. Create `src/components/OnboardingFlow.tsx`
9. Create `src/components/SubjectGrid.tsx`
10. Create `src/components/KitabiPage.tsx`
11. Create `src/components/KitabiSection.tsx`
12. Create `src/components/SourcesFooter.tsx`
13. Rewrite `src/App.tsx`
14. Add KaTeX import + new CSS to `src/index.css`
15. `npm run build` — must exit with code 0, zero TypeScript errors

---

## DONE WHEN

- [ ] First visit → OnboardingFlow shown. Student enters interest, grade (optional). Saved to localStorage.
- [ ] Subsequent visits → OnboardingFlow skipped. Goes to SubjectGrid home.
- [ ] SubjectGrid shows Biology (5 topics, active) + Physics, Chemistry, Mathematics (coming soon, disabled).
- [ ] Selecting Biology shows topic list. Selecting a topic opens KitabiPage.
- [ ] KitabiPage renders all sections as clean textbook. Headings, body text, equations (KaTeX), key terms bolded.
- [ ] Each section has "Learn it your way" button (hidden for neutral profile).
- [ ] Clicking button on a gaming/sports/music-matching interest → instant hand-vetted analogy, no API call.
- [ ] Clicking button on a custom interest → Gemini API call → loading state → rewritten body renders inline.
- [ ] Rewrite replaces section body. "Back to original" restores original text.
- [ ] Rewrite is cached per section — pressing Learn it your way again on same section does NOT re-call API.
- [ ] Analogy note visible below rewritten section.
- [ ] Mock badge shown if API key not set.
- [ ] Sources footer visible at bottom of every KitabiPage.
- [ ] Profile interest chip in header. Clicking edits interest inline. Changing interest clears all cached rewrites for the active topic.
- [ ] Back navigation: Topic → Subject topic list → SubjectGrid.
- [ ] `npm run build` exits with code 0.
