# TASK: Implement Phase 2 Assessment Engine & Interactive STEM Simulations
## Target Files: `src/types/index.ts`, `src/components/simulations/*`, `src/components/InteractiveDiagramBlock.tsx`, `src/components/TopicQuizModal.tsx`, `src/components/KitabiPage.tsx`, `scripts/generate-quiz-pool.mjs`, `src/index.css`
## Priority / Mode: HIGH | CORE PEDAGOGY & INTERACTIVE TOOLING

---

## 1. OBJECTIVE
Implement Phase 2 of Global Lab's roadmap to close the gap with industry leaders (Brilliant.org / Duolingo Mastery):
1. **Interactive STEM Simulation Lab Widgets**: Build four lightweight, hardware-accelerated interactive Canvas/SVG simulation widgets (Michaelis-Menten Enzyme Kinetics, Neuron Action Potential Wave, Double-Slit Wave Interference, and Le Chatelier Chemical Equilibrium) with a seamless toggle between static diagrams and live manipulable parameter sliders.
2. **Comprehensive 40-Question Mastery Engine (V5b)**: Build a zero-runtime-latency question pipeline with a generation script producing 40 verified questions per topic (8 per section), randomized 5-question test sessions, instant scientific rationale feedback, and local mastery score persistence.

All changes must compile cleanly with `tsc -b && vite build` and pass all unit tests.

---

## 2. CONTEXT & INVARIANTS
- **Workspace:** `c:/Users/mhamm/Downloads/globallab`
- **Framework:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4 + KaTeX + Lucide React.
- **Invariants:**
  - Zero external heavy physics or 3D engine libraries (no Three.js / Matter.js dependencies for these widgets). Use pure 2D Canvas or SVG math.
  - Zero live API calls during student quizzes: all 40 questions per topic must be pre-generated to JSON files in `src/knowledge/quizzes/` for instant zero-latency loading.
  - Canonical textbook facts remain immutable.
  - All widgets and quizzes must support both Light and Dark mode seamlessly.
- **Non-Goals:**
  - Do NOT modify the user upload pipeline (`UserBookReaderCore.tsx`, `sourceContext.ts`).
  - Do NOT touch existing text extraction services (`extractText.ts`, `localOcr.ts`).

---

## 3. ROOT CAUSE & ARCHITECTURAL GAPS
1. **Static Visuals:** Current diagrams in `DiagramBlock.tsx` are static PNGs. Students cannot manipulate variables (e.g. adjust substrate concentration, voltage threshold, or slit width) to build dynamic mental models.
2. **Assessment Scarcity:** Knowledge topics lack structured, repeatable self-testing. Comprehension checks are limited to single-question analogy popovers rather than full topic mastery evaluation.

---

## 4. STEP-BY-STEP IMPLEMENTATION INSTRUCTIONS

### Step 4.1: Domain Type Extensions
In `src/types/index.ts`, add the assessment and simulation data models:

```ts
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
  questions: TopicQuizQuestion[] // 40 questions per topic (8 per section)
}

export interface TopicMasteryRecord {
  topicId: string
  bestScore: number
  totalQuestions: number
  attemptsCount: number
  lastAttemptAt: string
  completedQuestionIds: string[]
}
```

### Step 4.2: Interactive Simulation Lab Widgets
Create `src/components/simulations/` with 4 self-contained interactive components:

1. **`EnzymeKineticsSim.tsx` (Michaelis-Menten Lab):**
   - Sliders for $V_{\max}$ (10 to 100 $\mu\text{mol/s}$), $K_m$ (1 to 20 mM), and Substrate $[S]$ (0 to 50 mM).
   - Toggle pills for "Competitive Inhibitor" (increases apparent $K_m$) and "Non-Competitive Inhibitor" (decreases $V_{\max}$).
   - SVG coordinate plane rendering the hyperbolic velocity curve: $v = \frac{V_{\max} [S]}{K_m + [S]}$, with a glowing point tracking the current $[S]$ operating point.

2. **`ActionPotentialSim.tsx` (Neuron Ion Channel Simulator):**
   - Slider for Stimulus Voltage ($-80\text{ mV}$ to $+40\text{ mV}$).
   - "Trigger Pulse" button that animates a live voltage trace over time ($0$ to $5\text{ ms}$).
   - Visual membrane schematic below the graph showing Na⁺ channels opening at threshold ($-55\text{ mV}$), followed by K⁺ channel repolarization and the refractory dip.

3. **`WaveInterferenceSim.tsx` (Double-Slit Wave Lab):**
   - Sliders for Wavelength $\lambda$ (400nm to 700nm with color spectrum sync), Slit Separation $d$ ($0.1\text{ mm}$ to $1.0\text{ mm}$), and Screen Distance $L$ ($1\text{ m}$ to $5\text{ m}$).
   - 2D Canvas rendering the sinusoidal fringe intensity pattern: $I(\theta) = I_0 \cos^2\left(\frac{\pi d \sin\theta}{\lambda}\right)$, displaying measured fringe spacing $\Delta y = \frac{\lambda L}{d}$.

4. **`ChemicalEquilibriumSim.tsx` (Le Chatelier Dynamic Reactor):**
   - Reaction: $\text{N}_2\text{(g)} + 3\text{H}_2\text{(g)} \rightleftharpoons 2\text{NH}_3\text{(g)} + \text{Heat}$.
   - Toggles: "Increase Pressure", "Increase Temperature", "Add Reactant".
   - Animated dynamic bar chart illustrating reactant vs. product shift with instantaneous $Q$ vs $K_{eq}$ comparison.

### Step 4.3: `InteractiveDiagramBlock.tsx` Wrapper
In `src/components/InteractiveDiagramBlock.tsx`:
- Render the standard `DiagramBlock.tsx` static PNG by default.
- If a simulation exists for this topic/section (e.g. `enzyme-kinetics`, `action-potential`, `wave-mechanics`), render a top-right segmented pill: **[Static Diagram | Interactive Lab]**.
- Seamlessly transition between the high-res diagram image and the live Canvas/SVG simulation widget with zero layout jump.

### Step 4.4: 40-Question Generation Script (`scripts/generate-quiz-pool.mjs`)
Create `scripts/generate-quiz-pool.mjs` using `@google/genai`:
- Reads all 20 topic files across Biology, Physics, Chemistry, and Math.
- For each topic and its 5 sections, calls `gemini-2.0-flash` with a strict JSON schema to generate 8 questions per section (40 total per topic).
- Prompt constraints:
  - `question`: Clear, single-concept question targeting conceptual understanding or calculation.
  - `options`: 4 mutually exclusive choices.
  - `correctIndex`: 0, 1, 2, or 3.
  - `explanation`: 2-sentence breakdown of why the correct option is true and why common misconceptions fail.
  - `sourceEvidence`: Verbatim snippet from `section.body`.
  - `misconceptionTargeted`: Specific exam trap being tested.
- Output: Writes JSON files to `src/knowledge/quizzes/[topicId].json`.
- Provide default pre-built JSON fixtures for core topics so the application functions out of the box.

### Step 4.5: `TopicQuizModal.tsx` & Mastery Tracker
In `src/components/TopicQuizModal.tsx`:
1. Modal triggered by a prominent *"Test Your Mastery"* button at the bottom of each `KitabiPage.tsx`.
2. Selects 5 random questions from the topic's 40-question pool, prioritizing questions the student has not yet completed.
3. Clean examination layout:
   - Question counter (e.g. "Question 3 of 5").
   - 4 selectable option cards with keyboard shortcut indicators (`1`, `2`, `3`, `4` or `A`, `B`, `C`, `D`).
   - "Submit Answer" button triggering immediate green/red feedback + explanation.
4. Summary Screen upon finishing all 5 questions:
   - Score readout (e.g. "4 / 5 — 80% Conceptual Mastery").
   - Per-question review accordion.
   - Saves result to `localStorage` under `gl_mastery_${topicId}`.
   - "Practice Another 5 Questions" (draws next 5 unvisited questions from the 40-question pool).

---

## 5. EDGE CASES & DEFENSIVE CHECKS
- **Zero Question Repeats:** Ensure the quiz sampler tracks visited question IDs in `localStorage` so students experience 8 unique quiz sessions before seeing repeat questions.
- **Canvas HiDPI Scaling:** All 2D simulation canvases must multiply dimensions by `window.devicePixelRatio` to prevent blurry lines on Retina displays.
- **Dark Mode CSS Variables:** All interactive SVG/Canvas curves must reference CSS variables or theme-aware hex colors (`#0D8267` in light mode, `#2DD4BF` in dark mode) for crisp visibility.

---

## 6. VERIFICATION GATES
- [ ] **Gate 1:** Navigating to `enzyme-kinetics`, `action-potential`, or `wave-mechanics` displays the "Interactive Lab" pill and loads the simulation with working parameter sliders.
- [ ] **Gate 2:** Clicking "Test Your Mastery" at the end of a topic launches `TopicQuizModal` with 5 randomized questions.
- [ ] **Gate 3:** Submitting quiz answers provides instant visual feedback, explanation, and saves the score to `localStorage`.
- [ ] **Gate 4:** `npm run build` and `npm test` pass with 0 errors.
