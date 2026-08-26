# CODEX BRIEF — Global Lab v4

> Read every section before writing a single line. v4 is a visual and structural upgrade — no new subjects, no new topics. Everything built here makes the existing 5 biology topics look and feel like a premium textbook. v3 must be complete and building cleanly before starting v4.

---

## WHAT V4 DOES IN ONE SENTENCE

Replace the functional-but-plain v3 UI with a design system-driven textbook layout: editorial typography, subject color identity, a sticky table of contents, a running header, diagram blocks, structured callout boxes, and "where this analogy breaks down" notes on every personalized rewrite.

---

## WHAT DOES NOT CHANGE IN V4

- All v3 logic: student profile, useLearnYourWay, personaService, useStudentProfile, useTopicMemory
- Navigation flow (OnboardingFlow → SubjectGrid → Topic list → KitabiPage)
- SourcesFooter (kept as-is)
- AnalogyCard, HelpfulButton (kept as-is)
- No new subjects, no new topics, no PDF upload, no animations

---

## STEP 1 — FONT INSTALLATION

Add to `index.html` `<head>` (before closing `</head>`):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;0,6..72,700;1,6..72,400&family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;1,14..32,400&family=Plus+Jakarta+Sans:wght@500;600&display=swap" rel="stylesheet">
```

---

## STEP 2 — UPDATED TYPES — Replace `src/types/index.ts` entirely

```typescript
export type StudyMode = 'cram' | 'explorer'
export type PersonaPreset = 'neutral' | 'gaming' | 'sports' | 'music'

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

export interface KnowledgeDiagram {
  url: string       // e.g. /diagrams/biology/cellular-respiration.png
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
  analogy: string           // ONLY the analogy text — body is NEVER replaced
  analogyLimits: string     // one sentence on where the analogy stops mapping
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

## STEP 3 — UPDATED `src/services/personaService.ts` — Replace entirely

```typescript
import type { KnowledgeSection, PersonaPreset, RewrittenSection, StudentProfile } from '../types'

const GEMINI_MODEL = 'gemini-2.0-flash'
const MOCK_DELAY_MS = 900

const PRESET_KEYWORDS: Record<PersonaPreset, string[]> = {
  gaming: ['gaming', 'game', 'video game', 'gamer', 'esports', 'minecraft', 'fortnite', 'pokemon', 'roblox', 'league', 'valorant'],
  sports: ['sport', 'basketball', 'football', 'soccer', 'tennis', 'athletics', 'gym', 'fitness', 'running', 'swimming', 'cricket'],
  music: ['music', 'guitar', 'piano', 'singing', 'rap', 'hip hop', 'kpop', 'jazz', 'drums', 'producer', 'dj', 'violin'],
  neutral: [],
}

function detectPreset(interest: string): PersonaPreset | null {
  const lower = interest.toLowerCase()
  const words = lower.split(/\b/)
  for (const [preset, keywords] of Object.entries(PRESET_KEYWORDS) as [PersonaPreset, string[]][]) {
    if (preset === 'neutral') continue
    if (keywords.some((kw) => words.some((w) => w === kw))) return preset
  }
  return null
}

function buildAnalogyPrompt(section: KnowledgeSection, profile: StudentProfile): string {
  const vocabInstruction =
    profile.gradeLevel?.startsWith('Grade 9') || profile.gradeLevel?.startsWith('Grade 10')
      ? 'Use simple everyday language. Short sentences. No jargon.'
      : profile.gradeLevel?.startsWith('University')
        ? 'Use precise undergraduate-level vocabulary.'
        : 'Use standard secondary school vocabulary.'

  return `You are writing a SHORT analogical addition for a student interested in "${profile.interest}".
Grade level: ${profile.gradeLevel ?? 'not specified'}. ${vocabInstruction}

The student has just read this science section:
Heading: ${section.heading}
Body: ${section.body}

Your task:
1. Write ONE analogy (2-4 sentences) connecting a mechanism in this section to "${profile.interest}".
2. The analogy must illuminate a real mechanism — not just mention the interest superficially.
3. Write ONE sentence stating exactly where the analogy breaks down (where it stops mapping to reality).
4. Do NOT restate the science — only write the analogy addition.
5. Do not use slang, forced puns, or cringeworthy themed language.

Return ONLY valid JSON, no markdown, no code fences:
{"analogy": "...", "analogyLimits": "...", "analogyUsed": "one sentence describing the core comparison"}`
}

export async function rewriteSection(
  section: KnowledgeSection,
  profile: StudentProfile,
): Promise<RewrittenSection> {
  const interest = profile.interest.trim()

  if (!interest || interest === 'neutral') {
    return { sectionId: section.id, analogy: '', analogyLimits: '', analogyUsed: 'No analogy (neutral)', interest, isMock: false }
  }

  const preset = detectPreset(interest)
  if (preset && section.presetAnalogies) {
    await new Promise((r) => window.setTimeout(r, 250))
    const analogyText = section.presetAnalogies[preset]
    return {
      sectionId: section.id,
      analogy: analogyText,
      analogyLimits: 'Note: this analogy simplifies the underlying mechanism — precise molecular interactions are not captured by the comparison.',
      analogyUsed: analogyText,
      interest,
      isMock: false,
    }
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  if (!apiKey || apiKey === 'PASTE_YOUR_NEW_KEY_HERE') {
    await new Promise((r) => window.setTimeout(r, MOCK_DELAY_MS))
    return {
      sectionId: section.id,
      analogy: `[Mock — no API key set] Think of this like something from ${interest}.`,
      analogyLimits: 'This is a placeholder — add your API key to get a real analogy.',
      analogyUsed: `Mock analogy for ${interest}`,
      interest,
      isMock: true,
    }
  }

  const prompt = buildAnalogyPrompt(section, profile)
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512, responseMimeType: 'application/json' },
      }),
    },
  )

  if (!response.ok) {
    if (response.status === 429) throw new Error('Too many requests — wait a moment and try again.')
    throw new Error('Could not reach the personalisation service.')
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!rawText) throw new Error('Empty response.')

  let parsed: { analogy: string; analogyLimits: string; analogyUsed: string }
  try { parsed = JSON.parse(rawText) } catch {
    throw new Error('Response could not be parsed. Try again.')
  }

  return { sectionId: section.id, analogy: parsed.analogy, analogyLimits: parsed.analogyLimits, analogyUsed: parsed.analogyUsed, interest, isMock: false }
}
```

---

## STEP 4 — UPDATE `src/hooks/useLearnYourWay.ts`

No logic changes. Only update the return type reference: `RewrittenSection` now has `analogy` field instead of `rewrittenBody`. TypeScript will catch any remaining references — fix them.

---

## STEP 5 — KNOWLEDGE BASE — Add `diagram` + `callouts` to all 5 biology files

Do NOT rewrite existing content. Only ADD these fields to the relevant sections.

### `cellular-respiration.ts` — add to `overview` section:

```typescript
diagram: {
  url: '/diagrams/biology/cellular-respiration.png',
  caption: 'Overview of cellular respiration: glycolysis (cytoplasm) → Krebs cycle (matrix) → ETC (inner membrane).',
  alt: 'Diagram showing the three stages of cellular respiration within a mitochondrion',
},
callouts: [
  {
    type: 'key-insight',
    heading: 'Why ATP is the universal currency',
    body: 'Every cell in every organism uses ATP as its energy medium. Evolution selected for a single transferable energy molecule so that energy released in one reaction can power a completely different one — a universal compatibility layer for metabolism.',
  },
  {
    type: 'real-world',
    heading: 'Why you breathe harder during exercise',
    body: 'Muscle cells consuming ATP faster signal the body to increase oxygen delivery. Without more oxygen, the electron transport chain stalls and ATP production collapses to just 2 per glucose (glycolysis only) — which is why you cannot sprint indefinitely.',
  },
],
```

### `cellular-respiration.ts` — add to `etc` section:

```typescript
callouts: [
  {
    type: 'key-insight',
    heading: 'Chemiosmosis is conserved across nearly all life',
    body: 'The proton gradient driving ATP synthase is not unique to animals. Chloroplasts, archaea in extreme environments, and mitochondria all use the same chemiosmotic mechanism — one of the most conserved processes in all of biology.',
  },
],
```

### `cell-membrane.ts` — add to `overview` section:

```typescript
diagram: {
  url: '/diagrams/biology/cell-membrane.png',
  caption: 'Cross-section of the phospholipid bilayer with embedded transport proteins.',
  alt: 'Phospholipid bilayer diagram showing hydrophilic heads facing outward, hydrophobic tails facing inward, with channel and carrier proteins',
},
callouts: [
  {
    type: 'real-world',
    heading: 'Why soap destroys viruses',
    body: 'Soap molecules are amphipathic — hydrophilic on one end, hydrophobic on the other — just like phospholipids. When soap contacts an enveloped virus like influenza or SARS-CoV-2, it disrupts the lipid membrane, destroying the virus. This is why 20 seconds of handwashing is effective.',
  },
],
```

### `dna-expression.ts` — add to `overview` section:

```typescript
diagram: {
  url: '/diagrams/biology/dna-transcription.png',
  caption: 'The central dogma: DNA is transcribed to mRNA, which is translated to protein.',
  alt: 'Flow diagram: DNA double helix → RNA polymerase → mRNA strand → ribosome → protein chain',
},
callouts: [
  {
    type: 'did-you-know',
    heading: 'Each cell holds ~2 metres of DNA',
    body: 'Every human cell nucleus contains approximately 2 metres of DNA packed into a 6-micrometre space using protein scaffolding called chromatin. Gene expression requires this packaging to be locally unwound before RNA polymerase can access the sequence.',
  },
],
```

### `action-potential.ts` — add to `overview` section:

```typescript
diagram: {
  url: '/diagrams/biology/action-potential.png',
  caption: 'A neuron with labelled axon, myelin sheath, and nodes of Ranvier.',
  alt: 'Neuron diagram showing soma, axon, myelin sheath sections, nodes of Ranvier, and axon terminals with arrows showing direction of signal propagation',
},
callouts: [
  {
    type: 'real-world',
    heading: 'How local anaesthetics work',
    body: 'Drugs like lidocaine block voltage-gated sodium channels in sensory neurons, preventing depolarization from reaching the threshold needed to fire an action potential. Pain signals cannot propagate to the brain. The neuron is unharmed — just silenced.',
  },
],
```

### `enzyme-kinetics.ts` — add to `overview` section:

```typescript
diagram: {
  url: '/diagrams/biology/enzyme-kinetics.png',
  caption: 'An enzyme binding its substrate at the active site and releasing products.',
  alt: 'Enzyme-substrate diagram: enzyme with complementary active site, substrate binding, product release, enzyme recycled',
},
callouts: [
  {
    type: 'key-insight',
    heading: 'Enzymes are not consumed by reactions',
    body: 'After catalysing a reaction, the enzyme is released unchanged and free to bind another substrate. A single enzyme molecule can facilitate thousands of reactions per second — which is why the body can sustain high metabolic rates with small quantities of each enzyme.',
  },
],
```

---

## STEP 6 — DIAGRAM PLACEHOLDERS

Create directory `public/diagrams/biology/`. Write 5 minimal PNG placeholder files using this Node.js script (run once):

```javascript
// scripts/create-diagram-placeholders.js
const fs = require('fs')
const path = require('path')

const dir = path.join(__dirname, '../public/diagrams/biology')
fs.mkdirSync(dir, { recursive: true })

// 1x1 transparent PNG (base64)
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
const pngBuffer = Buffer.from(pngBase64, 'base64')

const files = [
  'cellular-respiration.png',
  'cell-membrane.png',
  'dna-transcription.png',
  'action-potential.png',
  'enzyme-kinetics.png',
]

files.forEach((f) => {
  fs.writeFileSync(path.join(dir, f), pngBuffer)
  console.log('Created:', f)
})
```

Run: `node scripts/create-diagram-placeholders.js`

User replaces these with real downloads from bioart.cancer.gov.

---

## STEP 7 — NEW COMPONENTS

### `src/components/RunningHeader.tsx`

Props: `{ subject: Subject, topic: KnowledgeTopic, onBack: () => void }`

Layout (sticky, top-0, z-20, height 48px):
- Background: `bg-white/90 backdrop-blur-md border-b border-stone-100`
- Left: breadcrumb — subject name (clickable, `onBack`) → chevron-right icon → topic title (truncated, max-w-xs)
- Right: small profile interest chip if profile exists
- Font: Plus Jakarta Sans throughout
- Subject name color: matches subject accent color

### `src/components/TableOfContents.tsx`

Props: `{ sections: KnowledgeSection[], activeSectionId: string | null }`

- Only rendered `md:` and above (`hidden md:block`)
- `sticky top-20 self-start`
- Width: `w-52 shrink-0`
- Title: "Contents" — text-xs uppercase tracking-widest text-stone-400 mb-4
- Each item: text-sm text-stone-400 hover:text-stone-700 cursor-pointer py-1.5 leading-5 flex items-center gap-2
- Active item: text-stone-900 font-semibold, left indicator dot in brand color
- Click: `document.getElementById(section.id)?.scrollIntoView({ behavior: 'smooth' })`
- Active tracking: IntersectionObserver (see KitabiPage step)

### `src/components/CalloutBox.tsx`

Props: `{ callout: KnowledgeCallout }`

| type | wrapper bg + border | icon (Lucide) | heading color |
|---|---|---|---|
| key-insight | bg-blue-50, border-l-4 border-blue-400 | Lightbulb (blue-500) | text-blue-700 |
| real-world | bg-emerald-50, border-l-4 border-emerald-500 | Globe (emerald-600) | text-emerald-700 |
| did-you-know | bg-amber-50, border-l-4 border-amber-400 | Sparkles (amber-500) | text-amber-700 |

Layout: `rounded-xl p-5 my-6 flex gap-4`. Icon shrink-0 mt-0.5 size-4. Heading: text-xs font-semibold uppercase tracking-widest mb-1.5. Body: text-sm leading-7 text-stone-600.

### `src/components/DiagramBlock.tsx`

Props: `{ diagram: KnowledgeDiagram }`

```typescript
// Handle broken/placeholder images gracefully
const [failed, setFailed] = useState(false)
if (failed) return null  // hide block entirely if image fails to load
```

Layout:
- Wrapper: `my-8 rounded-2xl overflow-hidden border border-stone-100 bg-stone-50`
- Image: `w-full object-contain max-h-72` with `loading="lazy"` and `onError={() => setFailed(true)}`
- Caption: `text-center text-xs text-stone-400 py-3 px-6 italic leading-5`

### `src/components/AnalogyPanel.tsx`

Props: `{ rewrite: RewrittenSection, onClear: () => void }`

Rendered BELOW the canonical body text — never replacing it.

Layout:
- Wrapper: `border-l-4 border-[#E65C24] bg-orange-50 rounded-r-2xl p-5 my-6`
- Top row (flex, justify-between, items-center, mb-3):
  - Left: orange badge "✦ In your language" (bg-[#E65C24] text-white rounded-full px-2.5 py-1 text-xs font-semibold) + interest chip (text-xs text-orange-700 bg-orange-100 rounded-full px-2 py-0.5 ml-2)
  - Right: "Back to original" button (X icon + text, text-xs text-stone-400 hover:text-stone-600)
- Analogy body: `text-[15px] leading-7 text-stone-700 mb-3`
- Analogy limits (if non-empty): flex items-start gap-1.5, AlertCircle icon size-3 text-stone-400 mt-0.5 shrink-0, text-xs text-stone-400 italic leading-5. Prefix: "Where this breaks down: "
- Mock badge: amber pill "Preview — add API key" shown if `rewrite.isMock`

---

## STEP 8 — UPDATED `src/components/KitabiSection.tsx`

New props:
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

Render order (inside `<section id={section.id} className="kitabi-section">`):
1. `<h3 className="section-heading">` — section heading
2. `<DiagramBlock>` — only if `section.diagram`
3. Equation block (KaTeX) — only if `section.equation`
4. Body `<p className="section-body">` — ALWAYS original text, keyTerms bolded, never replaced
5. `{section.callouts?.map(c => <CalloutBox key={c.heading} callout={c} />)}`
6. Learn it your way row — only if profile && profile.interest !== 'neutral' && !rewrite:
   - Right-aligned `<button className="liyw-button">` with WandSparkles icon
   - While loading: spinner + "Writing your analogy…"
7. `{rewrite && <AnalogyPanel rewrite={rewrite} onClear={onClearRewrite} />}`

---

## STEP 9 — UPDATED `src/components/KitabiPage.tsx`

New props: add `subjectColor: string`

New state: `const [activeSectionId, setActiveSectionId] = useState<string | null>(null)`

IntersectionObserver setup:
```typescript
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActiveSectionId(entry.target.id)
      })
    },
    { rootMargin: '-20% 0px -70% 0px' }
  )
  topic.sections.forEach((s) => {
    const el = document.getElementById(s.id)
    if (el) observer.observe(el)
  })
  return () => observer.disconnect()
}, [topic])
```

Layout structure:
```
<div className="min-h-screen bg-[#FAFAF8]">
  <RunningHeader subject={subject} topic={topic} onBack={onBack} />

  <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-20 flex gap-12">

    {/* Left ToC — desktop only */}
    <aside className="hidden md:block w-52 shrink-0">
      <div className="toc-wrapper">
        <p className="toc-title">Contents</p>
        <TableOfContents sections={topic.sections} activeSectionId={activeSectionId} />
      </div>
    </aside>

    {/* Main content */}
    <main className="flex-1 min-w-0 max-w-2xl">
      {/* Topic header */}
      <header className="mb-12">
        <div className={`subject-pill`} style={{ background: subjectLight, color: subjectColor }}>
          <span className="w-2 h-2 rounded-full" style={{ background: subjectColor }} />
          {subject.title}
        </div>
        <h1 className="topic-title">{topic.title}</h1>
        <p className="topic-subtitle">{topic.subtitle}</p>
        <div className="border-t border-stone-200 mt-8" />
      </header>

      {/* Sections */}
      {topic.sections.map((section) => (
        <KitabiSection
          key={section.id}
          section={section}
          rewrite={getRewrite(section.id)}
          isLoading={loadingSectionId === section.id}
          profile={profile}
          onLearnYourWay={() => profile && learn(section, profile)}
          onClearRewrite={() => clearRewrite(section.id)}
        />
      ))}

      <SourcesFooter source={topic.source} />
    </main>

  </div>
</div>
```

Subject color mapping (derive from `subject.color` string):
```typescript
const colorMap: Record<string, { bg: string; light: string }> = {
  biology:     { bg: '#0D8267', light: '#E6F5F0' },
  physics:     { bg: '#1A6FC4', light: '#EAF2FC' },
  chemistry:   { bg: '#8338EC', light: '#F3EAFC' },
  mathematics: { bg: '#C43D1A', light: '#FCEEEA' },
}
const { bg: subjectColor, light: subjectLight } = colorMap[subject.id] ?? colorMap.biology
```

---

## STEP 10 — FULL `src/index.css` REPLACEMENT

```css
@import 'tailwindcss';
@import 'katex/dist/katex.min.css';

@theme {
  --font-serif: 'Newsreader', Georgia, 'Times New Roman', serif;
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-ui: 'Plus Jakarta Sans', system-ui, sans-serif;
  --color-brand: #E65C24;
  --color-brand-light: #FFF4EF;
  --color-canvas: #FAFAF8;
  --color-text-primary: #1A1E24;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-canvas);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
}

/* Running header */
.running-header {
  @apply sticky top-0 z-20 flex items-center justify-between px-6 py-3
         bg-white/90 backdrop-blur-md border-b border-stone-100;
  font-family: var(--font-ui);
}
.running-header-back { @apply text-sm text-stone-400 hover:text-stone-700 transition-colors cursor-pointer font-medium; }
.running-header-sep  { @apply text-stone-200 text-sm mx-1; }
.running-header-topic { @apply text-sm text-stone-700 font-semibold truncate max-w-xs; }

/* Topic header */
.topic-title {
  font-family: var(--font-serif);
  @apply text-4xl font-bold tracking-tight text-stone-900 mt-3 leading-tight;
}
.topic-subtitle { @apply text-lg text-stone-500 mt-2 leading-relaxed; }
.subject-pill {
  @apply inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold mb-4;
  font-family: var(--font-ui);
}

/* Table of contents */
.toc-wrapper { @apply sticky top-20 self-start; }
.toc-title {
  @apply text-xs font-semibold uppercase tracking-widest text-stone-400 mb-4;
  font-family: var(--font-ui);
}
.toc-item {
  @apply flex items-center gap-2.5 py-1.5 text-sm text-stone-400
         hover:text-stone-700 transition-colors cursor-pointer leading-5 rounded;
  font-family: var(--font-ui);
}
.toc-item-active { @apply text-stone-900 font-semibold; }
.toc-dot { @apply w-1.5 h-1.5 rounded-full bg-stone-200 shrink-0; }
.toc-dot-active { background-color: #E65C24; }

/* Kitabi section */
.kitabi-section { @apply border-b border-stone-100 py-12 last:border-0; }
.section-heading {
  font-family: var(--font-serif);
  @apply text-2xl font-semibold tracking-[-0.02em] text-stone-900 mb-6;
}
.section-body {
  @apply text-[16px] leading-[1.85] text-stone-600;
}
.section-body strong { @apply font-semibold text-stone-800; }

/* Equation */
.equation-block { @apply my-8 overflow-x-auto rounded-2xl bg-stone-50 border border-stone-100 px-8 py-6 text-center; }

/* Diagram */
.diagram-block  { @apply my-8 rounded-2xl overflow-hidden border border-stone-100 bg-stone-50; }
.diagram-img    { @apply w-full object-contain max-h-72; }
.diagram-caption { @apply text-center text-xs text-stone-400 py-3 px-6 italic leading-5; }

/* Callout boxes */
.callout              { @apply rounded-xl p-5 my-6 flex gap-4; }
.callout-key-insight  { @apply bg-blue-50 border-l-4 border-blue-400; }
.callout-real-world   { @apply bg-emerald-50 border-l-4 border-emerald-500; }
.callout-did-you-know { @apply bg-amber-50 border-l-4 border-amber-400; }
.callout-heading      { @apply text-xs font-semibold uppercase tracking-widest mb-1.5; font-family: var(--font-ui); }
.callout-body         { @apply text-sm leading-7 text-stone-600; }

/* Analogy panel */
.analogy-panel  { @apply border-l-4 border-[#E65C24] bg-orange-50 rounded-r-2xl p-5 my-6; }
.analogy-badge  { @apply inline-flex items-center gap-1.5 rounded-full bg-[#E65C24] px-2.5 py-1 text-xs font-semibold text-white; font-family: var(--font-ui); }
.analogy-chip   { @apply text-xs text-orange-700 bg-orange-100 rounded-full px-2 py-0.5 font-medium ml-2; font-family: var(--font-ui); }
.analogy-back   { @apply text-xs text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-1 cursor-pointer; }
.analogy-body   { @apply text-[15px] leading-7 text-stone-700 mb-3; }
.analogy-limits { @apply flex items-start gap-1.5 text-xs text-stone-400 italic leading-5; }
.mock-badge     { @apply inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-100 mt-3; font-family: var(--font-ui); }

/* Learn it your way */
.liyw-row    { @apply flex justify-end mt-6; }
.liyw-button {
  @apply flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2
         text-xs font-semibold text-stone-500 shadow-sm transition-all cursor-pointer
         hover:border-[#E65C24] hover:bg-orange-50 hover:text-[#E65C24] disabled:opacity-50;
  font-family: var(--font-ui);
}

/* Sources footer */
.sources-footer { @apply mt-16 pt-6 border-t border-stone-100; }
.sources-text   { @apply text-xs leading-6 text-stone-400; font-family: var(--font-ui); }
.sources-link   { @apply underline decoration-stone-200 underline-offset-2 hover:text-stone-600 transition-colors; }

/* Onboarding */
.onboarding-shell  { @apply flex min-h-svh flex-col items-center justify-center bg-stone-50 px-4 py-16; }
.onboarding-card   { @apply w-full max-w-md rounded-3xl border border-stone-200 bg-white p-8 shadow-xl shadow-stone-100; }
.onboarding-title  { font-family: var(--font-serif); @apply text-3xl font-bold text-stone-900 mt-4 mb-2; }
.onboarding-sub    { @apply text-stone-500 text-sm leading-relaxed mb-8; }
.onboarding-label  { @apply block text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2; font-family: var(--font-ui); }
.onboarding-input  {
  @apply w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm
         text-stone-900 placeholder-stone-400 focus:outline-none
         focus:border-[#E65C24] focus:ring-2 focus:ring-[#E65C24]/20 transition-all;
}
.onboarding-select { @apply w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 focus:outline-none focus:border-[#E65C24] focus:ring-2 focus:ring-[#E65C24]/20 transition-all mt-1 appearance-none; }
.onboarding-btn    {
  @apply w-full mt-6 rounded-xl bg-[#E65C24] px-6 py-3.5 text-sm font-semibold text-white
         hover:bg-[#D14F1A] disabled:opacity-50 transition-colors cursor-pointer;
  font-family: var(--font-ui);
}
.onboarding-skip   { @apply block text-center text-xs text-stone-400 mt-4 hover:text-stone-600 transition-colors cursor-pointer; }

/* Subject grid */
.subject-grid          { @apply grid grid-cols-1 gap-4 sm:grid-cols-2; }
.subject-card          { @apply flex cursor-pointer flex-col rounded-2xl border border-stone-200 bg-white p-6 transition-all duration-150 hover:border-stone-300 hover:shadow-md; }
.subject-card-disabled { @apply cursor-not-allowed opacity-40 pointer-events-none; }
.subject-card-title    { font-family: var(--font-serif); @apply text-xl font-bold text-stone-900 mt-3; }
.subject-card-desc     { @apply text-sm text-stone-500 leading-relaxed mt-1; }
.coming-soon-pill      { @apply text-xs font-semibold text-stone-400 bg-stone-100 rounded-full px-2.5 py-0.5 w-fit mt-3; font-family: var(--font-ui); }
```

---

## BUILD ORDER

1. Update `index.html` — add Google Fonts `<link>` tags
2. Run `node scripts/create-diagram-placeholders.js` to create `public/diagrams/biology/` with 5 PNG placeholders
3. Replace `src/types/index.ts`
4. Replace `src/services/personaService.ts`
5. Update `src/hooks/useLearnYourWay.ts` — fix any `rewrittenBody` references → `analogy`
6. Update all 5 biology knowledge files — add `diagram` + `callouts` fields
7. Create `src/components/RunningHeader.tsx`
8. Create `src/components/TableOfContents.tsx`
9. Create `src/components/CalloutBox.tsx`
10. Create `src/components/DiagramBlock.tsx`
11. Create `src/components/AnalogyPanel.tsx`
12. Update `src/components/KitabiSection.tsx`
13. Update `src/components/KitabiPage.tsx`
14. Update `src/App.tsx` — use RunningHeader, pass subjectColor
15. Replace `src/index.css`
16. `npm run build` — must exit 0, zero TypeScript errors

---

## DONE WHEN

- [ ] Newsreader font visible in topic title and section headings
- [ ] Inter font in body text
- [ ] Plus Jakarta Sans in badges, labels, buttons
- [ ] Running header sticky at top, breadcrumb correct, back button works
- [ ] Table of contents visible on md+ screens, hidden on mobile
- [ ] Active section highlights in ToC as user scrolls
- [ ] Each section renders: heading → diagram → equation → body → callouts → analogy panel
- [ ] Body text NEVER replaced — always the original canonical text
- [ ] Analogy panel appears BELOW body, not instead of it
- [ ] "Where this breaks down" note renders below analogy text
- [ ] Callout boxes render correct colors per type (blue / emerald / amber)
- [ ] DiagramBlock renders without crashing (placeholder PNG acceptable, hides gracefully on error)
- [ ] Subject accent colors applied to pill, ToC active dot, subject card accent bar
- [ ] `npm run build` exits code 0
