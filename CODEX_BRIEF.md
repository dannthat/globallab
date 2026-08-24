# CODEX BRIEF — Global Lab (Biology Study Companion)
> Paste this entire file as your first message. Read every section before writing a single line of code.

---

## STEP 0 — BEFORE YOU START: REQUIRED RESEARCH

You must search for and deeply read about both of these products before touching the codebase. They are the direct design reference for everything you build here. Do not skip this.

### Search 1: EduLab Lebanon
Search: `EduLab Lebanon edulab.com.lb biology STEM digital learning platform`
What to understand:
- Founded Beirut 2005. Serves 100,000+ students across Lebanon's top 200 schools.
- Provides biology, physics, chemistry interactive e-learning for K-12.
- Content is pre-built and curriculum-ready — students open it and go, no uploads needed.
- Its strength: zero friction, ready-to-use library of real subject content.
- Its weakness: locked to the Lebanese national curriculum. No personalization engine. Dated execution. One-size-fits-all delivery. Every student sees the same thing regardless of how they learn.

### Search 2: Google Learn Your Way (LearnLM / Google Labs)
Search: `Google "Learn Your Way" Google Labs LearnLM personalization pipeline arXiv 2509.13348`
What to understand:
- A Google Labs research experiment built on LearnLM (pedagogy-tuned Gemini 2.5 Pro).
- Takes a student's uploaded PDF textbook and re-levels it by grade + personalizes it by interest.
- Uses a TWO-STAGE pipeline:
  - Stage 1: Dual generation — (a) re-level content to the student's grade, (b) replace generic analogies with interest-specific ones (e.g. explaining osmosis through basketball court zone defense).
  - Stage 2: Multimodal outputs — text, mind maps, audio lessons, quizzes.
- KEY DESIGN PRINCIPLE (critical — read this carefully):
  - It does NOT rewrite every sentence to sound like a sports broadcast.
  - It performs SELECTIVE ANALOGY SUBSTITUTION: the scientific facts, terminology, and mechanistic steps stay 100% intact. Only the explanatory analogy/example is swapped for an interest-relevant one.
  - Flooding the whole explanation with themed language is explicitly called "cringe" and is avoided.
- Its strength: real personalization grounded in vetted source text. 11% higher retention scores in RCTs.
- Its weakness: requires the student to upload their own PDF. No built-in content library.

### The insight this project is built on:
EduLab has the "nothing to upload, just open it" library model.
Google Learn Your Way has the real personalization engine.
This project combines BOTH: a pre-built biology content library (EduLab's model) + selective analogy personalization (Learn Your Way's model). Applied to one subject only — Biology — to avoid becoming a platform instead of a product.

---

## WHAT YOU ARE BUILDING

**Project name:** Global Lab
**One-line description:** A biology study tool for one subject that lets students explore a topic as a concise exam-focused "Cram" mode or a curious back-and-forth "Explorer" mode, remembers per-topic which mode helped that student, and flavors Explorer analogies with the student's stated interests.

---

## V1 SCOPE — BUILD EXACTLY THIS, NOTHING MORE

### Topic: ONE topic only for v1
**Cellular Respiration & ATP Synthesis**
This is the proof of concept. If it feels right end-to-end, it becomes the template for all other topics.

### Two Study Modes

**Cram Mode:**
- Short, neutral, exam-shaped bullet facts.
- Zero persona flavoring. Ever. Same for every student.
- Structure: Key Definition → Core Stages (numbered) → Must-Know Exam Facts → Common Exam Mistakes.
- For Cellular Respiration this means: reactants/products, 3 stages (Glycolysis/Krebs/ETC), ATP yield (~30-32), chemiosmotic mechanism in 1 line.

**Explorer Mode:**
- 3-turn interactive Socratic dialogue. "Why does this happen?" → Answer → "How exactly?" → Answer → "What would break it?" → Answer.
- Each answer has two parts: (1) the grounded scientific explanation — never changes regardless of persona, (2) an analogy callout block — this is the ONLY thing the persona changes.
- The analogy block is visually distinct (colored card/box) so it's clear it's the analogy, not the core fact.

### Persona Presets (Explorer Mode Only)
Four pre-written, hand-vetted personas. No API call needed for these:
- **Neutral** — clean direct scientific analogy (e.g., "like water pressure behind a dam")
- **Gaming** — mana/stamina meter recharging, wind-up turbines, power cells
- **Sports / Basketball** — fast-break energy burns vs. endurance pacing, battery reserves, fuel for full-court press
- **Music / Audio** — rhythm sync, synthesizer voltage modulation, bass drop compression

**Custom Persona (Explorer Mode Only):**
- A text input where the student types any interest (e.g. "Formula 1", "Baking", "K-pop").
- On submit, makes a live API call to generate a persona-flavored Explorer exchange on the spot.
- This is lower quality than presets — that is ACCEPTED AND EXPECTED. Do not try to make it match preset quality.
- API key: configurable via a settings modal. Stub/mock the call with fallback text for development — do NOT block the rest of the build on this.
- Loading state and error state required.

### Per-Topic Mode Memory
- After using a mode, a "This mode helped me for this topic" button appears.
- Clicking it saves that topic's preferred mode to localStorage.
- Next time the student opens that topic, it defaults to their remembered mode.
- This is PER-TOPIC, not global. A student can be Cram for one topic and Explorer for another.
- localStorage key structure: `globallab_topic_prefs` → `{ "cellular-respiration": { "preferredMode": "explorer", "savedAt": "ISO date" } }`

---

## EXPLICITLY OUT OF SCOPE — DO NOT BUILD THESE

- Multiple subjects (no Physics, Chemistry, Math)
- User-uploaded PDFs or any file import
- Backend, database, auth, or user accounts
- 3D visualizations of any kind
- National curriculum alignment (Lebanese or otherwise) — content must work for any student globally
- Full adaptive tutoring or curriculum sequencing
- Any LMS integration

---

## TECH STACK

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Persistence:** localStorage only
- **API (custom persona):** Configurable — stub with mock for now, wire real key later
- **No backend. No database. No auth.**

---

## FILE STRUCTURE

```
globallab/
├── public/
│   └── favicon.svg
├── src/
│   ├── data/
│   │   └── topics.ts           # All topic content: cram facts + explorer steps + persona analogies
│   ├── types/
│   │   └── index.ts            # StudyMode, PersonaPreset, Topic, ExplorerStep, TopicPreference types
│   ├── hooks/
│   │   ├── useTopicMemory.ts   # localStorage read/write for per-topic mode preference
│   │   └── useCustomPersona.ts # API call logic for custom persona generation
│   ├── services/
│   │   └── personaService.ts   # Prompt builder + API fetch + mock fallback
│   ├── components/
│   │   ├── ModeToggle.tsx      # Cram / Explorer toggle with "remembered" badge
│   │   ├── PersonaBar.tsx      # Neutral/Gaming/Sports/Music chips + Custom input
│   │   ├── CramView.tsx        # The Cram mode full layout
│   │   ├── ExplorerView.tsx    # The Explorer mode full layout
│   │   ├── ExplorerStep.tsx    # Single turn: question + grounded answer + analogy card
│   │   ├── AnalogyCard.tsx     # The styled callout for the analogy (persona-colored)
│   │   ├── HelpfulButton.tsx   # "This helped me" feedback + memory trigger
│   │   └── CustomPersonaModal.tsx  # Input + submit + loading + error for custom interest
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

---

## DATA MODEL — topics.ts

This is the most important file. Get this right before building any UI.

```typescript
export type StudyMode = 'cram' | 'explorer';

export type PersonaPreset = 'neutral' | 'gaming' | 'sports' | 'music';

export interface AnalogySet {
  neutral: string;
  gaming: string;
  sports: string;
  music: string;
}

export interface ExplorerStep {
  question: string;          // The "Why/How" question shown to student
  groundedAnswer: string;    // The core scientific explanation — NEVER changes with persona
  analogies: AnalogySet;     // Only the analogy text changes per persona
}

export interface CramContent {
  definition: string;        // One tight sentence definition
  stages: string[];          // Ordered list of mechanism steps
  examFacts: string[];       // High-yield exam bullets
  commonMistakes: string[];  // Traps students fall into
}

export interface Topic {
  id: string;
  title: string;
  subtitle: string;
  cram: CramContent;
  explorer: ExplorerStep[];  // Exactly 3 steps
}
```

### Cellular Respiration Content to Use

```typescript
const cellularRespiration: Topic = {
  id: 'cellular-respiration',
  title: 'Cellular Respiration & ATP Synthesis',
  subtitle: 'How cells extract and store energy from glucose',

  cram: {
    definition:
      'Cellular respiration is the process by which cells break down glucose (C₆H₁₂O₆) in the presence of oxygen to produce ATP, CO₂, and water — releasing the chemical energy stored in glucose.',
    stages: [
      'Glycolysis — cytoplasm. Glucose (6C) split into 2 pyruvate (3C). Net yield: 2 ATP + 2 NADH.',
      'Krebs Cycle (Citric Acid Cycle) — mitochondrial matrix. Pyruvate converted to Acetyl-CoA, enters cycle. Yield per glucose: 2 ATP + 6 NADH + 2 FADH₂ + 4 CO₂.',
      'Electron Transport Chain (ETC) & Oxidative Phosphorylation — inner mitochondrial membrane. NADH/FADH₂ donate electrons, proton gradient drives ATP synthase. Yield: ~26-28 ATP.',
    ],
    examFacts: [
      'Overall equation: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ~30-32 ATP',
      'Glycolysis is anaerobic (no oxygen needed). All other stages require oxygen.',
      'ATP synthase uses chemiosmosis — the proton (H⁺) gradient across the inner mitochondrial membrane drives ADP → ATP conversion.',
      'NADH carries high-energy electrons from earlier stages to the ETC. Each NADH ≈ 2.5 ATP. Each FADH₂ ≈ 1.5 ATP.',
      'The mitochondria is called the "powerhouse of the cell" because Stage 2 and 3 occur there.',
      'Oxygen is the final electron acceptor in the ETC — it combines with H⁺ to form water.',
    ],
    commonMistakes: [
      'Glycolysis does NOT occur in mitochondria — it is in the cytoplasm.',
      'The overall ATP yield is approximately 30-32, not exactly 36 or 38 (older textbooks are wrong).',
      'Fermentation is NOT cellular respiration — it produces ethanol or lactate without using the ETC.',
      'CO₂ is released in the Krebs Cycle, not in glycolysis.',
    ],
  },

  explorer: [
    {
      question: 'Why does the cell need to break down glucose at all — why not just use it directly?',
      groundedAnswer:
        'Glucose stores a large amount of chemical energy in its bonds, but cells cannot directly use this energy for most cellular work. They need a universal energy currency — ATP (adenosine triphosphate). ATP is a small, stable molecule whose third phosphate bond can be quickly broken to release a controlled, usable burst of energy exactly where and when a cell needs it. Breaking glucose down in controlled steps allows the cell to capture that energy gradually into many ATP molecules, rather than releasing it all at once as heat (which would destroy the cell).',
      analogies: {
        neutral:
          'Think of glucose as a large battery pack. You cannot plug most devices directly into a battery pack — you need to convert it to the right voltage through an adapter. ATP is that adapter: a standardized, cell-sized energy packet every cellular process can plug into.',
        gaming:
          'Glucose is like a massive XP loot drop you cannot directly spend. The cell has to "convert" it into the in-game currency (ATP) that actually unlocks abilities, heals, and powers actions. Respiration is the conversion process — slow and staged so you do not waste a single drop of XP.',
        sports:
          'Glucose is like a full tank of fuel in a race car — raw potential. The engine (mitochondria) converts it into actual wheel-turning power in controlled bursts. You cannot pour gasoline directly onto the track — you need the combustion process to release it as usable force.',
        music:
          'Glucose is like a raw audio file with all frequencies mixed together at full volume. You cannot play it directly without distortion. The cell runs it through stages of processing (like EQ and compression) to output clean, controlled energy signals — each ATP molecule is one perfectly leveled beat.',
      },
    },
    {
      question: 'How does ATP synthase actually make ATP — what is the proton gradient doing?',
      groundedAnswer:
        'ATP synthase is a molecular motor embedded in the inner mitochondrial membrane. As electrons flow down the Electron Transport Chain (ETC), they pump protons (H⁺ ions) from the mitochondrial matrix into the intermembrane space. This creates a high concentration of protons on one side — a proton gradient, also called the proton-motive force. Because protons naturally flow from high concentration to low concentration, they rush back through the only available channel: the core of ATP synthase. This flow of protons physically rotates the ATP synthase rotor. The mechanical rotation drives the chemical reaction that attaches a phosphate group to ADP, producing ATP. This process — using a proton gradient to power ATP synthesis — is called chemiosmosis.',
      analogies: {
        neutral:
          'ATP synthase is like a water turbine in a dam. The proton gradient is the water stored behind the dam — high potential energy. When protons flow through ATP synthase, they spin its rotor like water spins a turbine, and that mechanical spin converts the flow into electrical energy — except here, the "electricity" is chemical energy stored in ATP.',
        gaming:
          'Think of the ETC as a charging station that pumps energy tokens (protons) into a locked compartment. Pressure builds up. ATP synthase is the only door — when tokens rush through it, the rotation of the door mechanism "mints" new ATP coins. More charge = faster spinning door = more ATP output per second.',
        sports:
          'The proton gradient is like building pressure in a hydraulic system — like a compressed air tank at a stadium. ATP synthase is the valve. When you open the valve (protons flow through), the rush of air spins a turbine that charges equipment. More compressed air (steeper gradient) = more power generated per second.',
        music:
          'The ETC pumps protons like a DJ building tension before a drop — energy accumulates, pressure rises. ATP synthase is the release point: the drop. When protons finally rush through, the rotor spins in rhythm, converting that built-up potential into a steady beat of ATP molecules — one per revolution.',
      },
    },
    {
      question: 'What would actually happen inside a cell if the Electron Transport Chain stopped working?',
      groundedAnswer:
        'If the ETC stopped, the cell would immediately hit a bottleneck: NADH and FADH₂ cannot offload their electrons anywhere. These electron carriers would remain "full" and could not be recycled back to NAD⁺ and FAD. Without NAD⁺, the Krebs cycle halts. Without usable carriers, glycolysis also eventually stops (it needs NAD⁺ too). ATP production from oxidative phosphorylation drops to zero — the cell can only make 2 ATP per glucose via glycolysis alone. For most cells, this is fatally insufficient. The cell would switch to anaerobic pathways (fermentation) as an emergency measure — producing lactic acid — but this is unsustainable long-term. Cells with the highest energy demands (neurons, cardiac muscle) would begin to fail within seconds to minutes.',
      analogies: {
        neutral:
          'It is like a recycling system breaking down in a factory. The raw material (NAD⁺) cannot be returned to the production line, so production grinds to a halt even though glucose is still available. The factory does not lack raw material — it lacks the ability to recycle what it has already used.',
        gaming:
          'Imagine your game has an energy regen system that converts spent stamina tokens back into usable mana. If that regen system breaks, you burn through your mana fast and cannot recover it. You can still use your base attack (glycolysis) but all your high-power abilities (ETC-driven ATP) are locked. You are essentially stuck in low-power mode until the regen comes back online — or you die.',
        sports:
          'Picture a team whose substitution system breaks mid-game. Tired players cannot be swapped out, so they accumulate fatigue and their performance collapses. The whole team (cell) slows down — not because there is no game plan, but because exhausted players (NADH, FADH₂) cannot be refreshed and rotated back in.',
        music:
          'It is like a live sound board where the send/return loop breaks. The signal processes fine going in, but the processed output cannot loop back into the mix. Effects pile up, the board saturates, and the whole audio chain seizes. The music does not stop instantly — but it degrades fast, and eventually the set (cell function) collapses.',
      },
    },
  ],
};
```

---

## KEY DESIGN RULES — READ BEFORE BUILDING UI

### 1. Analogy cards are visually SEPARATE from the scientific explanation
The analogy must be in a distinct styled block (different background color, border-left accent, or labeled "Analogy" badge). The student must instantly see: "this is the metaphor, not the fact." Do not blend analogy text into the main explanation paragraph.

### 2. Persona switcher is only visible in Explorer mode
The PersonaBar component does not render at all in Cram mode. Zero mention of personas in Cram mode.

### 3. Cram mode has zero AI calls, zero loading states
Cram mode is 100% static. All cram content is pre-written in topics.ts. No spinner, no fetch. Instant.

### 4. Per-topic memory badge on mode toggle
The ModeToggle component should show a subtle "★ Preferred for this topic" badge next to whichever mode the student has marked as helpful. This persists via localStorage.

### 5. Custom persona generates a structured mock when no API key is set
When the API key is not configured, the custom persona input should still work — it returns a clearly-labeled mock response: `[Mock — no API key set] Based on your interest in [X]: [generic analogy placeholder text]`. This lets the whole UX flow be tested without credentials.

### 6. Explorer steps are revealed progressively
Do not show all 3 Explorer steps at once. Show step 1 first. After reading, a "Continue" or "Next question →" button reveals step 2, then step 3. This enforces active engagement — the student reads before advancing.

---

## PERSONA API PROMPT TEMPLATE (for custom persona generation)

When a student enters a custom interest and an API key is set, send this exact prompt structure:

```
You are a biology tutor explaining cellular respiration to a student whose favorite interest is: [CUSTOM_INTEREST].

Generate a 3-turn Socratic Explorer exchange following this STRICT structure for each turn:
- Question: [a "Why/How" question about cellular respiration]
- Grounded Answer: [the core scientific explanation — accurate, complete, no slang, no forced theming]
- Analogy: [ONE SHORT analogy using [CUSTOM_INTEREST] as the reference domain. Max 2 sentences. Must illuminate the mechanism, not just name-drop the interest. If you cannot find a genuine analogy, say so honestly rather than forcing a bad one.]

Rules you must follow:
1. The Grounded Answer must never change from the scientific truth regardless of the interest.
2. The Analogy must be genuinely illuminating, not decorative.
3. Do not flood the explanation with [CUSTOM_INTEREST] references. One analogy per turn, in the Analogy field only.
4. Do not use slang, forced puns, or cringy themed language.
5. Return your response as valid JSON matching this schema:
{
  "steps": [
    { "question": "...", "groundedAnswer": "...", "analogy": "..." },
    { "question": "...", "groundedAnswer": "...", "analogy": "..." },
    { "question": "...", "groundedAnswer": "...", "analogy": "..." }
  ]
}
```

---

## START HERE — BUILD ORDER

1. `npm create vite@latest . -- --template react-ts` in the globallab/ directory
2. Install deps: `npm install tailwindcss lucide-react && npx tailwindcss init`
3. Create `src/types/index.ts` with all types
4. Create `src/data/topics.ts` with the full cellular respiration topic content from above
5. Create `src/hooks/useTopicMemory.ts`
6. Create `src/components/` — ModeToggle, PersonaBar, CramView, ExplorerView, ExplorerStep, AnalogyCard, HelpfulButton, CustomPersonaModal
7. Wire App.tsx
8. Create `src/services/personaService.ts` with mock fallback
9. Create `src/hooks/useCustomPersona.ts`
10. Run `npm run dev` and verify the full flow works

**Do not add any feature not described in this brief. Do not add routing, do not add a backend, do not add multiple subjects. One topic, two modes, four presets, one custom input, one memory system.**

---

## DONE WHEN:

- [ ] Cram mode shows all content for Cellular Respiration with zero loading/API calls
- [ ] Explorer mode shows 3 steps progressively (one at a time, revealed by button)
- [ ] Each Explorer step shows grounded answer + a distinct analogy card
- [ ] Switching between Neutral / Gaming / Sports / Music swaps only the analogy card text
- [ ] "This mode helped me" marks the mode in localStorage and shows the ★ badge on the toggle
- [ ] Reloading the page restores the remembered mode
- [ ] Custom persona input shows loading state, then renders a generated or mocked Explorer exchange
- [ ] `npm run build` passes with 0 TypeScript errors
