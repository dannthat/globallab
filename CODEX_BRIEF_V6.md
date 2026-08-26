# CODEX_BRIEF_V6 — STEM Content Expansion + Diagram Pipeline
**READ THIS ENTIRE DOCUMENT BEFORE TOUCHING ANY FILE.**

---

## Goal
Expand Global Lab from Biology-only to all four STEM subjects.
Add Physics, Chemistry, and Mathematics — each with 5 topics at **Grade 12 / first-year university** level.
Wire diagrams into all topics (Biology backfill + all new subjects).
Mark all subjects active (no `comingSoon`).

---

## Tech Stack (reference only — do not change)
- React 19 + Vite + TypeScript
- Tailwind CSS v4 — do NOT add inline styles unless inside existing patterns
- KaTeX already wired — use LaTeX strings for equations
- Gemini API key: `import.meta.env.VITE_GEMINI_API_KEY` (in `.env`)

---

## Step 1 — Write and run the content generation script

Create `scripts/generate-topics.mjs` and run it with `node scripts/generate-topics.mjs`.
The script calls Gemini 2.0 Flash (`gemini-2.0-flash`) with a structured output schema
to generate each topic, then writes the TypeScript files.

### Script pattern (follow exactly)

```js
import { GoogleGenAI } from '@google/genai'
import { writeFileSync, mkdirSync } from 'fs'
import 'dotenv/config'

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY })

const SECTION_SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    heading: { type: 'string' },
    body: { type: 'string', description: '3 rigorous paragraphs, Grade 12/uni level, no markdown' },
    keyTerms: { type: 'array', items: { type: 'string' }, description: '5-8 precise terms' },
    equation: { type: 'string', description: 'LaTeX string for KaTeX (omit if no core equation)' },
    callouts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['real-world', 'key-insight', 'did-you-know'] },
          heading: { type: 'string' },
          body: { type: 'string' }
        },
        required: ['type', 'heading', 'body']
      }
    }
  },
  required: ['id', 'heading', 'body', 'keyTerms']
}

async function generateTopic(subjectId, topicSpec) {
  const prompt = `
You are a rigorous university-level STEM author.
Write content for the topic "${topicSpec.title}" in ${subjectId}.
Level: Grade 12 / first-year university. No evolutionary biology.
For each section listed below, return structured JSON matching the schema.
Sections: ${JSON.stringify(topicSpec.sections)}

Rules:
- body: 3 dense, accurate paragraphs. Scientific facts only. No hallucination.
- keyTerms: the 5-8 most critical technical terms in this section.
- equation: the canonical equation for this section in LaTeX (e.g. "E = mc^2"). Omit if not applicable.
- callouts: 1-2 real-world or key-insight callouts per section. Be specific and surprising.
- presetAnalogies: for each section, write 4 short (2-3 sentence) analogies for interest types: neutral, gaming, sports, music.
`
  const resp = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          sections: { type: 'array', items: SECTION_SCHEMA }
        },
        required: ['sections']
      }
    }
  })
  return JSON.parse(resp.text())
}
```

### Topics to generate (in order)

Run each topic through `generateTopic`, save to the path shown.
**Add a 4-second delay between API calls** to avoid rate limits.

---

#### PHYSICS — `src/knowledge/physics/`

Source attribution for all physics topics:
```ts
source: {
  name: 'OpenStax University Physics',
  url: 'https://openstax.org/details/books/university-physics-volume-2',
  license: 'CC BY 4.0',
}
```

**Topic 1** — `src/knowledge/physics/wave-mechanics.ts`
```js
{
  id: 'wave-mechanics',
  subjectId: 'physics',
  title: 'Wave Mechanics & Interference',
  subtitle: 'Superposition, diffraction, and the double-slit experiment',
  sections: [
    { id: 'overview', heading: 'The Nature of Waves' },
    { id: 'superposition', heading: 'Superposition & Interference' },
    { id: 'diffraction', heading: 'Diffraction & Huygens Principle' },
    { id: 'double-slit', heading: 'The Double-Slit Experiment' },
    { id: 'exam-traps', heading: 'Common Errors & Exam Traps' },
  ]
}
```

**Topic 2** — `src/knowledge/physics/electric-fields.ts`
```js
{
  id: 'electric-fields',
  subjectId: 'physics',
  title: 'Electric Fields & Gauss\'s Law',
  subtitle: 'Coulomb\'s law, field lines, and electric potential',
  sections: [
    { id: 'overview', heading: 'Electric Charge & Coulomb\'s Law' },
    { id: 'field-lines', heading: 'Electric Fields & Field Lines' },
    { id: 'gauss-law', heading: 'Gauss\'s Law' },
    { id: 'electric-potential', heading: 'Electric Potential & Voltage' },
    { id: 'exam-traps', heading: 'Common Errors & Exam Traps' },
  ]
}
```

**Topic 3** — `src/knowledge/physics/electromagnetic-induction.ts`
```js
{
  id: 'electromagnetic-induction',
  subjectId: 'physics',
  title: 'Electromagnetic Induction',
  subtitle: 'Faraday\'s law, Lenz\'s law, and transformers',
  sections: [
    { id: 'overview', heading: 'Magnetic Flux' },
    { id: 'faraday', heading: 'Faraday\'s Law of Induction' },
    { id: 'lenz', heading: 'Lenz\'s Law & Back-EMF' },
    { id: 'transformers', heading: 'Transformers & Energy Transfer' },
    { id: 'exam-traps', heading: 'Common Errors & Exam Traps' },
  ]
}
```

**Topic 4** — `src/knowledge/physics/quantum-mechanics.ts`
```js
{
  id: 'quantum-mechanics',
  subjectId: 'physics',
  title: 'Quantum Mechanics',
  subtitle: 'Wave-particle duality, the photoelectric effect, and uncertainty',
  sections: [
    { id: 'overview', heading: 'Wave-Particle Duality' },
    { id: 'photoelectric', heading: 'The Photoelectric Effect' },
    { id: 'de-broglie', heading: 'de Broglie Wavelength' },
    { id: 'uncertainty', heading: 'Heisenberg Uncertainty Principle' },
    { id: 'exam-traps', heading: 'Common Errors & Exam Traps' },
  ]
}
```

**Topic 5** — `src/knowledge/physics/special-relativity.ts`
```js
{
  id: 'special-relativity',
  subjectId: 'physics',
  title: 'Special Relativity',
  subtitle: 'Time dilation, length contraction, and mass-energy equivalence',
  sections: [
    { id: 'overview', heading: 'The Postulates of Special Relativity' },
    { id: 'time-dilation', heading: 'Time Dilation' },
    { id: 'length-contraction', heading: 'Length Contraction' },
    { id: 'mass-energy', heading: 'Mass-Energy Equivalence' },
    { id: 'exam-traps', heading: 'Common Errors & Exam Traps' },
  ]
}
```

---

#### CHEMISTRY — `src/knowledge/chemistry/`

Source attribution for all chemistry topics:
```ts
source: {
  name: 'OpenStax Chemistry 2e',
  url: 'https://openstax.org/details/books/chemistry-2e',
  license: 'CC BY 4.0',
}
```

**Topic 1** — `src/knowledge/chemistry/atomic-structure.ts`
```js
{
  id: 'atomic-structure',
  subjectId: 'chemistry',
  title: 'Atomic Structure & Electron Configuration',
  subtitle: 'Quantum numbers, orbitals, and periodic trends',
  sections: [
    { id: 'overview', heading: 'The Quantum Atom' },
    { id: 'quantum-numbers', heading: 'Quantum Numbers & Orbital Shapes' },
    { id: 'electron-config', heading: 'Electron Configuration & the Aufbau Principle' },
    { id: 'periodic-trends', heading: 'Periodic Trends' },
    { id: 'exam-traps', heading: 'Common Errors & Exam Traps' },
  ]
}
```

**Topic 2** — `src/knowledge/chemistry/chemical-bonding.ts`
```js
{
  id: 'chemical-bonding',
  subjectId: 'chemistry',
  title: 'Chemical Bonding & Molecular Geometry',
  subtitle: 'VSEPR theory, hybridisation, and polarity',
  sections: [
    { id: 'overview', heading: 'Types of Chemical Bonds' },
    { id: 'vsepr', heading: 'VSEPR Theory & Molecular Geometry' },
    { id: 'hybridisation', heading: 'Orbital Hybridisation' },
    { id: 'polarity', heading: 'Molecular Polarity & Dipole Moments' },
    { id: 'exam-traps', heading: 'Common Errors & Exam Traps' },
  ]
}
```

**Topic 3** — `src/knowledge/chemistry/thermodynamics.ts`
```js
{
  id: 'thermodynamics',
  subjectId: 'chemistry',
  title: 'Chemical Thermodynamics',
  subtitle: 'Enthalpy, entropy, Gibbs free energy, and spontaneity',
  sections: [
    { id: 'overview', heading: 'Energy in Chemical Reactions' },
    { id: 'enthalpy', heading: 'Enthalpy & Hess\'s Law' },
    { id: 'entropy', heading: 'Entropy & the Second Law' },
    { id: 'gibbs', heading: 'Gibbs Free Energy & Spontaneity' },
    { id: 'exam-traps', heading: 'Common Errors & Exam Traps' },
  ]
}
```

**Topic 4** — `src/knowledge/chemistry/electrochemistry.ts`
```js
{
  id: 'electrochemistry',
  subjectId: 'chemistry',
  title: 'Electrochemistry & Redox Reactions',
  subtitle: 'Galvanic cells, electrode potentials, and electrolysis',
  sections: [
    { id: 'overview', heading: 'Oxidation & Reduction' },
    { id: 'galvanic-cells', heading: 'Galvanic Cells & Cell Notation' },
    { id: 'electrode-potentials', heading: 'Standard Electrode Potentials' },
    { id: 'electrolysis', heading: 'Electrolysis & Faraday\'s Laws' },
    { id: 'exam-traps', heading: 'Common Errors & Exam Traps' },
  ]
}
```

**Topic 5** — `src/knowledge/chemistry/chemical-kinetics.ts`
```js
{
  id: 'chemical-kinetics',
  subjectId: 'chemistry',
  title: 'Chemical Kinetics',
  subtitle: 'Rate laws, activation energy, and reaction mechanisms',
  sections: [
    { id: 'overview', heading: 'Reaction Rates' },
    { id: 'rate-laws', heading: 'Rate Laws & Reaction Order' },
    { id: 'activation-energy', heading: 'Activation Energy & the Arrhenius Equation' },
    { id: 'mechanisms', heading: 'Reaction Mechanisms & Catalysis' },
    { id: 'exam-traps', heading: 'Common Errors & Exam Traps' },
  ]
}
```

---

#### MATHEMATICS — `src/knowledge/mathematics/`

Source attribution for all mathematics topics:
```ts
source: {
  name: 'OpenStax Calculus Volume 1 & 2',
  url: 'https://openstax.org/details/books/calculus-volume-1',
  license: 'CC BY 4.0',
}
```

**Topic 1** — `src/knowledge/mathematics/differentiation.ts`
```js
{
  id: 'differentiation',
  subjectId: 'mathematics',
  title: 'Differential Calculus',
  subtitle: 'Limits, derivatives, and applications of differentiation',
  sections: [
    { id: 'overview', heading: 'Limits & Continuity' },
    { id: 'first-principles', heading: 'Differentiation from First Principles' },
    { id: 'rules', heading: 'Differentiation Rules (Chain, Product, Quotient)' },
    { id: 'applications', heading: 'Applications: Optimisation & Related Rates' },
    { id: 'exam-traps', heading: 'Common Errors & Exam Traps' },
  ]
}
```

**Topic 2** — `src/knowledge/mathematics/integration.ts`
```js
{
  id: 'integration',
  subjectId: 'mathematics',
  title: 'Integral Calculus',
  subtitle: 'Antiderivatives, definite integrals, and area',
  sections: [
    { id: 'overview', heading: 'Antiderivatives & Indefinite Integrals' },
    { id: 'definite-integrals', heading: 'Definite Integrals & the Fundamental Theorem' },
    { id: 'techniques', heading: 'Integration by Substitution & Parts' },
    { id: 'applications', heading: 'Area Between Curves & Volumes' },
    { id: 'exam-traps', heading: 'Common Errors & Exam Traps' },
  ]
}
```

**Topic 3** — `src/knowledge/mathematics/differential-equations.ts`
```js
{
  id: 'differential-equations',
  subjectId: 'mathematics',
  title: 'Differential Equations',
  subtitle: 'First-order ODEs, separable equations, and modelling',
  sections: [
    { id: 'overview', heading: 'What is a Differential Equation?' },
    { id: 'separable', heading: 'Separable Equations' },
    { id: 'linear-first-order', heading: 'Linear First-Order ODEs' },
    { id: 'modelling', heading: 'Modelling: Growth, Decay & Oscillation' },
    { id: 'exam-traps', heading: 'Common Errors & Exam Traps' },
  ]
}
```

**Topic 4** — `src/knowledge/mathematics/linear-algebra.ts`
```js
{
  id: 'linear-algebra',
  subjectId: 'mathematics',
  title: 'Linear Algebra',
  subtitle: 'Vectors, matrices, determinants, and eigenvalues',
  sections: [
    { id: 'overview', heading: 'Vectors & Vector Spaces' },
    { id: 'matrices', heading: 'Matrix Operations & Systems of Equations' },
    { id: 'determinants', heading: 'Determinants & Invertibility' },
    { id: 'eigenvalues', heading: 'Eigenvalues & Eigenvectors' },
    { id: 'exam-traps', heading: 'Common Errors & Exam Traps' },
  ]
}
```

**Topic 5** — `src/knowledge/mathematics/statistics-probability.ts`
```js
{
  id: 'statistics-probability',
  subjectId: 'mathematics',
  title: 'Statistics & Probability',
  subtitle: 'Distributions, hypothesis testing, and the central limit theorem',
  sections: [
    { id: 'overview', heading: 'Probability Foundations' },
    { id: 'distributions', heading: 'Probability Distributions (Normal, Binomial, Poisson)' },
    { id: 'hypothesis-testing', heading: 'Hypothesis Testing & p-values' },
    { id: 'clt', heading: 'The Central Limit Theorem' },
    { id: 'exam-traps', heading: 'Common Errors & Exam Traps' },
  ]
}
```

---

## Step 2 — Download diagrams

Create `public/diagrams/physics/`, `public/diagrams/chemistry/`, `public/diagrams/mathematics/`.
Download the following files using `Invoke-WebRequest -UseBasicParsing -OutFile`.
**Sleep 2 seconds between downloads.**

### Biology backfill (files already exist in `public/diagrams/biology/` — skip download, only wire)
- `synapse-transmission.png` — already downloaded
- `osmosis.png` — already downloaded
- `sodium-potassium-pump.png` — already downloaded
- `translation-ribosome.png` — already downloaded
- `michaelis-menten.png` — already downloaded
- `enzyme-inhibition.png` — already downloaded
- resting-membrane-potential: download from Wikimedia:
  ```
  https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Action_potential.svg/800px-Action_potential.svg.png
  → public/diagrams/biology/resting-membrane-potential.png
  ```
  Attribution: Wikimedia Commons, CC BY-SA 3.0

### Physics diagrams
```
https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Two_point_sources_interference.svg/800px-Two_point_sources_interference.svg.png
→ public/diagrams/physics/wave-interference.png
(CC BY-SA 3.0, Wikimedia Commons)

https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Camponotus_flavomarginatus_ant.jpg/800px-Electric_field_point_lines_equipotential.svg.png
→ SKIP — use this instead:
https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Electric_field_point_lines_equipotential.svg/800px-Electric_field_point_lines_equipotential.svg.png
→ public/diagrams/physics/electric-field-lines.png
(Public domain, Wikimedia Commons)

https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Faraday_emf_experiment.svg/800px-Faraday_emf_experiment.svg.png
→ public/diagrams/physics/faraday-induction.png
(CC BY-SA 3.0)

https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Photoelectric_effect.svg/800px-Photoelectric_effect.svg.png
→ public/diagrams/physics/photoelectric-effect.png
(CC BY-SA 3.0)

https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Minkowski_diagram_-_photon.svg/800px-Minkowski_diagram_-_photon.svg.png
→ public/diagrams/physics/spacetime-diagram.png
(CC BY-SA 3.0)
```

### Chemistry diagrams
```
https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Electron_orbitals.svg/800px-Electron_orbitals.svg.png
→ public/diagrams/chemistry/electron-orbitals.png
(Public domain)

https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/VSEPR_geometries.svg/800px-VSEPR_geometries.svg.png
→ public/diagrams/chemistry/vsepr-geometry.png
(CC BY-SA 3.0)

https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Potential_energy_profile.svg/800px-Potential_energy_profile.svg.png
→ public/diagrams/chemistry/gibbs-reaction-profile.png
(CC BY-SA 3.0)

https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Galvanic_cell_with_no_cation_flow.svg/800px-Galvanic_cell_with_no_cation_flow.svg.png
→ public/diagrams/chemistry/galvanic-cell.png
(CC BY-SA 3.0)

https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Activation_energy.svg/800px-Activation_energy.svg.png
→ public/diagrams/chemistry/activation-energy.png
(CC BY-SA 3.0)
```

### Mathematics diagrams
```
https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Tangent_to_a_curve.svg/800px-Tangent_to_a_curve.svg.png
→ public/diagrams/mathematics/tangent-derivative.png
(CC BY-SA 3.0)

https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/Integral_example.svg/800px-Integral_example.svg.png
→ public/diagrams/mathematics/riemann-integral.png
(CC BY-SA 3.0)

https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Exponential_decay.svg/800px-Exponential_decay.svg.png
→ public/diagrams/mathematics/exponential-decay.png
(CC BY-SA 3.0)

https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Linear_subspaces_with_shading.svg/800px-Linear_subspaces_with_shading.svg.png
→ public/diagrams/mathematics/linear-subspace.png
(CC BY-SA 3.0)

https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Normal_Distribution_PDF.svg/800px-Normal_Distribution_PDF.svg.png
→ public/diagrams/mathematics/normal-distribution.png
(CC BY-SA 3.0)
```

---

## Step 3 — Wire diagrams into section files

After generating and downloading, add `diagram:` fields to the following sections.
**Only add to the `overview` section of each topic, and to the one additional section listed.**

### Biology backfill (modify existing files)

**`src/knowledge/biology/action-potential.ts`**
- section `resting-potential`: `{ url: '/diagrams/biology/resting-membrane-potential.png', caption: 'Voltage trace of an action potential showing resting, depolarisation, and repolarisation phases.', alt: 'Graph of membrane potential vs time showing resting potential at -70mV, threshold at -55mV, depolarisation peak at +40mV, and repolarisation back to resting.' }`
- section `synaptic-transmission`: `{ url: '/diagrams/biology/synapse-transmission.png', caption: 'Synaptic vesicles releasing neurotransmitter into the synaptic cleft.', alt: 'Diagram of a synapse showing pre-synaptic terminal, synaptic vesicles, neurotransmitter molecules in the cleft, and post-synaptic receptor proteins.' }`

**`src/knowledge/biology/cell-membrane.ts`**
- section `passive-transport`: `{ url: '/diagrams/biology/osmosis.png', caption: 'Osmosis across a semipermeable membrane from low to high solute concentration.', alt: 'Diagram showing water molecules moving through a semipermeable membrane from a hypotonic solution to a hypertonic solution.' }`
- section `active-transport`: `{ url: '/diagrams/biology/sodium-potassium-pump.png', caption: 'The Na⁺/K⁺-ATPase pump moving 3 Na⁺ out and 2 K⁺ in per ATP hydrolysed.', alt: 'Sodium-potassium pump embedded in membrane showing 3 sodium ions exiting and 2 potassium ions entering, with ATP being hydrolysed.' }`

**`src/knowledge/biology/dna-expression.ts`**
- section `translation`: `{ url: '/diagrams/biology/translation-ribosome.png', caption: 'A ribosome reading mRNA codons and assembling a polypeptide chain.', alt: 'Diagram of translation showing ribosome with A, P, and E sites, mRNA strand with codons, tRNA molecules with anticodons and amino acids, and growing polypeptide chain.' }`

**`src/knowledge/biology/enzyme-kinetics.ts`**
- section `enzyme-substrate`: `{ url: '/diagrams/biology/michaelis-menten.png', caption: 'Michaelis-Menten curve showing reaction velocity vs substrate concentration.', alt: 'Graph of reaction velocity (V) on y-axis vs substrate concentration [S] on x-axis, showing hyperbolic curve approaching Vmax, with Km marked at half-Vmax.' }`
- section `inhibition`: `{ url: '/diagrams/biology/enzyme-inhibition.png', caption: 'Competitive vs non-competitive enzyme inhibition.', alt: 'Two diagrams side by side: competitive inhibitor blocking active site vs non-competitive inhibitor binding allosteric site and changing enzyme shape.' }`

### Physics (add to generated files — overview section of each)
- wave-mechanics overview: `wave-interference.png` — caption: 'Two-point source interference pattern showing constructive and destructive interference fringes.'
- electric-fields overview: `electric-field-lines.png` — caption: 'Electric field lines radiating from a positive point charge.'
- electromagnetic-induction faraday section: `faraday-induction.png` — caption: 'Faraday\'s experiment: moving a magnet through a coil induces a current.'
- quantum-mechanics photoelectric section: `photoelectric-effect.png` — caption: 'Photoelectric effect showing photons ejecting electrons from a metal surface above the threshold frequency.'
- special-relativity overview: `spacetime-diagram.png` — caption: 'Minkowski spacetime diagram showing light cone and relativistic worldlines.'

### Chemistry (add to overview sections)
- atomic-structure overview: `electron-orbitals.png` — caption: 'Shapes of s, p, d, and f atomic orbitals.'
- chemical-bonding vsepr section: `vsepr-geometry.png` — caption: 'VSEPR geometries: linear, trigonal planar, tetrahedral, trigonal bipyramidal, octahedral.'
- thermodynamics gibbs section: `gibbs-reaction-profile.png` — caption: 'Reaction energy profile for exothermic reaction showing reactant energy, activation energy barrier, and product energy.'
- electrochemistry galvanic-cells section: `galvanic-cell.png` — caption: 'Galvanic cell with zinc anode, copper cathode, salt bridge, and external circuit.'
- chemical-kinetics activation-energy section: `activation-energy.png` — caption: 'Arrhenius activation energy diagram with and without catalyst.'

### Mathematics (add to overview sections)
- differentiation overview: `tangent-derivative.png` — caption: 'Tangent line to a curve at a point, representing the instantaneous rate of change.'
- integration definite-integrals section: `riemann-integral.png` — caption: 'Riemann sum approximating area under a curve using rectangular strips.'
- differential-equations modelling section: `exponential-decay.png` — caption: 'Exponential decay curve N(t) = N₀e^(-λt) showing radioactive decay or cooling.'
- linear-algebra overview: `linear-subspace.png` — caption: 'Two-dimensional linear subspace (plane through origin) in three-dimensional space.'
- statistics-probability distributions section: `normal-distribution.png` — caption: 'Standard normal distribution (μ=0, σ=1) with 68-95-99.7 rule marked.'

---

## Step 4 — Update `src/knowledge/index.ts`

Import and register all new topics. Remove `comingSoon: true` from Physics, Chemistry, Mathematics.

```ts
import { wavesMechanics } from './physics/wave-mechanics'
import { electricFields } from './physics/electric-fields'
import { electromagneticInduction } from './physics/electromagnetic-induction'
import { quantumMechanics } from './physics/quantum-mechanics'
import { specialRelativity } from './physics/special-relativity'

import { atomicStructure } from './chemistry/atomic-structure'
import { chemicalBonding } from './chemistry/chemical-bonding'
import { thermodynamics } from './chemistry/thermodynamics'
import { electrochemistry } from './chemistry/electrochemistry'
import { chemicalKinetics } from './chemistry/chemical-kinetics'

import { differentiation } from './mathematics/differentiation'
import { integration } from './mathematics/integration'
import { differentialEquations } from './mathematics/differential-equations'
import { linearAlgebra } from './mathematics/linear-algebra'
import { statisticsProbability } from './mathematics/statistics-probability'
```

Physics subject color: `#1a6fc4` (deep blue)
Chemistry subject color: `#8338ec` (purple)
Mathematics subject color: `#c87b1a` (amber)

Remove `comingSoon: true` from all three subjects.

---

## Step 5 — TypeScript file output format

Each generated topic file must match this exact pattern:

```ts
import type { KnowledgeTopic } from '../../types'

export const waveMechanics: KnowledgeTopic = {
  id: 'wave-mechanics',
  subjectId: 'physics',
  title: 'Wave Mechanics & Interference',
  subtitle: 'Superposition, diffraction, and the double-slit experiment',
  source: {
    name: 'OpenStax University Physics',
    url: 'https://openstax.org/details/books/university-physics-volume-2',
    license: 'CC BY 4.0',
  },
  sections: [
    {
      id: 'overview',
      heading: 'The Nature of Waves',
      body: '...',  // Gemini-generated
      keyTerms: [...],
      equation: '...',  // if applicable
      diagram: { url: '/diagrams/physics/wave-interference.png', caption: '...', alt: '...' },
      callouts: [...],
      presetAnalogies: { neutral: '...', gaming: '...', sports: '...', music: '...' },
    },
    // ... remaining sections
  ],
}
```

---

## Step 6 — Verification

Run these in order. All must pass:

```bash
npx tsc -b --noEmit
npx oxlint src/
npm run build
```

Build must exit 0 with no TypeScript errors.
Check: `public/diagrams/physics/`, `public/diagrams/chemistry/`, `public/diagrams/mathematics/` each contain 5 PNG files.
Check: `src/knowledge/physics/`, `src/knowledge/chemistry/`, `src/knowledge/mathematics/` each contain 5 `.ts` files + `index.ts`.

---

## DONE WHEN
- [ ] `npm run build` exits 0
- [ ] All 15 new topic files created with Gemini-generated content (no placeholder text)
- [ ] All 16 diagrams downloaded (5 per new subject + 1 biology backfill)
- [ ] All biology diagram backfill sections wired
- [ ] All new topic overview sections have `diagram:` field
- [ ] No `comingSoon: true` on Physics, Chemistry, Mathematics subjects
- [ ] `tsc -b --noEmit` passes with zero errors
