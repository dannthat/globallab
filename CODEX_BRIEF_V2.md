# CODEX BRIEF — Global Lab v2
> Read the entire brief before writing a single line. v2 builds directly on top of v1 — do not rewrite what already works.

---

## CONTEXT — WHAT V1 BUILT (DO NOT TOUCH UNLESS SPECIFIED)

v1 is complete and builds clean. It contains:
- One topic: Cellular Respiration & ATP Synthesis
- Two modes: Cram (static, no API) and Explorer (3-step Socratic, progressive reveal)
- Four persona presets: Neutral, Gaming, Sports, Music (all pre-written, no API)
- Custom persona: UX flow exists and works, but `personaService.ts` always returns a mock — **never calls any API**
- Per-topic mode memory via localStorage
- `VITE_GEMINI_API_KEY` is now in `.env` — the key exists, nothing uses it yet

**DO NOT refactor v1 components. DO NOT change the data model. DO NOT change how Cram mode works.**

---

## WHAT V2 ADDS — EXACTLY THIS, NOTHING MORE

1. **Wire the real Gemini API call** in `personaService.ts` — custom persona generates live, not mocked
2. **4 new biology topics** with full Cram + Explorer + persona content
3. **Topic selector UI** — a way to switch between the 5 topics, showing the remembered mode badge per topic

---

## CHANGE 1 — Wire the Gemini API call

### File to modify: `src/services/personaService.ts`

Replace the entire file with this implementation:

```typescript
import type { CustomPersonaResult, Topic } from '../types'

const MOCK_DELAY_MS = 850
const GEMINI_MODEL = 'gemini-2.0-flash'

export function buildPersonaPrompt(interest: string, topicTitle: string): string {
  return `You are a biology tutor explaining ${topicTitle} to a student whose favorite interest is: ${interest}.

Generate a 3-turn Socratic Explorer exchange. Return ONLY valid JSON — no markdown, no code fences, no extra text.

Each turn must follow this structure:
- question: a "Why/How" question about ${topicTitle}
- groundedAnswer: the core scientific explanation — accurate, complete, no slang, no forced theming
- analogy: ONE short analogy using ${interest} as the reference domain. Max 2 sentences. Must illuminate the mechanism, not just name-drop the interest. If you cannot find a genuine analogy, say so honestly rather than forcing a bad one.

Rules:
1. The groundedAnswer must never change from the scientific truth regardless of the interest.
2. The analogy must be genuinely illuminating, not decorative.
3. Do not flood the explanation with ${interest} references. One analogy per turn only.
4. Do not use slang, forced puns, or cringe-worthy themed language.
5. Return ONLY this JSON structure with no surrounding text:

{
  "steps": [
    { "question": "...", "groundedAnswer": "...", "analogy": "..." },
    { "question": "...", "groundedAnswer": "...", "analogy": "..." },
    { "question": "...", "groundedAnswer": "...", "analogy": "..." }
  ]
}`
}

function getMockResult(interest: string, topic: Topic): CustomPersonaResult {
  return {
    interest,
    isMock: true,
    steps: topic.explorer.map((step) => ({
      question: step.question,
      groundedAnswer: step.groundedAnswer,
      analogy: `[Mock — no API key set] Based on your interest in ${interest}: ${step.analogies.neutral}`,
    })),
  }
}

export async function generateCustomPersona(
  interest: string,
  topic: Topic,
): Promise<CustomPersonaResult> {
  const normalizedInterest = interest.trim().replace(/\s+/g, ' ')

  if (!normalizedInterest) {
    throw new Error('Tell us one interest to personalize the analogies.')
  }

  if (normalizedInterest.length > 60) {
    throw new Error('Keep your interest to 60 characters or fewer.')
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined

  // Fall back to mock when no key is present
  if (!apiKey || apiKey === 'PASTE_YOUR_NEW_KEY_HERE') {
    await new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS))
    return getMockResult(normalizedInterest, topic)
  }

  const prompt = buildPersonaPrompt(normalizedInterest, topic.title)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    },
  )

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('Gemini API error:', response.status, errorBody)

    if (response.status === 429) {
      throw new Error('Too many requests — wait a moment and try again.')
    }
    if (response.status === 400) {
      throw new Error('The interest you entered could not be processed. Try a different one.')
    }
    throw new Error('Could not generate a custom analogy right now. Try again in a moment.')
  }

  const data = await response.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!rawText) {
    throw new Error('The model returned an empty response. Try again.')
  }

  let parsed: { steps: Array<{ question: string; groundedAnswer: string; analogy: string }> }

  try {
    parsed = JSON.parse(rawText)
  } catch {
    throw new Error('The generated response could not be read. Try again.')
  }

  if (!Array.isArray(parsed.steps) || parsed.steps.length !== 3) {
    throw new Error('The response was incomplete. Try again.')
  }

  return {
    interest: normalizedInterest,
    isMock: false,
    steps: parsed.steps,
  }
}
```

**Verify after this change:**
- With a valid key in `.env`, custom persona should call Gemini and return real analogies
- With no key or placeholder, it still returns the mock (no broken state)
- All error cases (429, 400, empty response, bad JSON) show friendly messages to the student

---

## CHANGE 2 — Add 4 New Topics

### File to modify: `src/data/topics.ts`

Keep `cellularRespiration` exactly as-is. Add these 4 topics below it, then update the `topics` export array.

---

### Topic 2: Cell Membrane & Active Transport

```typescript
export const cellMembrane: Topic = {
  id: 'cell-membrane',
  title: 'Cell Membrane & Active Transport',
  subtitle: 'How cells control what enters and exits',
  cram: {
    definition:
      'The cell membrane is a selectively permeable phospholipid bilayer that regulates the passage of substances into and out of the cell, maintaining internal homeostasis.',
    stages: [
      'Phospholipid Bilayer — two layers of phospholipids (hydrophilic heads face outward, hydrophobic tails face inward). Forms the basic structural barrier.',
      'Passive Transport — movement down a concentration gradient, no ATP required. Includes simple diffusion, facilitated diffusion (via channel/carrier proteins), and osmosis (water via aquaporins).',
      'Active Transport — movement against a concentration gradient, requires ATP. Key example: Na⁺/K⁺ ATPase pump moves 3 Na⁺ out and 2 K⁺ in per ATP molecule used.',
    ],
    examFacts: [
      'Phospholipids are amphipathic — hydrophilic (water-loving) phosphate heads and hydrophobic (water-fearing) fatty acid tails.',
      'Osmosis: water moves from low solute concentration (hypotonic) to high solute concentration (hypertonic) through a semipermeable membrane.',
      'Na⁺/K⁺ ATPase is an antiporter — it moves two ions in opposite directions simultaneously.',
      'Tonicity determines cell behavior: hypertonic solution → cell shrinks (crenation in RBCs); hypotonic → cell swells (lysis); isotonic → no net change.',
      'Endocytosis (into cell) and exocytosis (out of cell) move large molecules via vesicles — both require ATP.',
      'Cholesterol embedded in the membrane increases fluidity at low temperatures and decreases it at high temperatures.',
    ],
    commonMistakes: [
      'Osmosis refers to water movement only — not solute movement. Do not say "solutes osmose."',
      'Active transport moves solutes AGAINST the gradient (from low to high concentration), not with it.',
      'The Na⁺/K⁺ pump moves 3 sodium OUT and 2 potassium IN — not the reverse.',
      'Facilitated diffusion still moves substances DOWN the gradient — it is passive, not active.',
    ],
  },
  explorer: [
    {
      question: 'Why does the cell need a membrane at all — why not just let everything flow freely?',
      groundedAnswer:
        'Without a membrane, a cell could not maintain the specific internal chemical environment required for its enzymes and metabolic reactions to function. Concentration gradients of ions like Na⁺, K⁺, and Ca²⁺ are essential for electrical signaling, protein function, and energy production. A freely permeable cell would rapidly equilibrate with its external environment, losing the controlled concentrations that make life possible. The membrane acts as a selective barrier — permeable to some substances and impermeable to others — allowing the cell to maintain homeostasis independently of the surrounding environment.',
      analogies: {
        neutral:
          'A cell without a membrane would be like a building with no walls — temperature, sound, and people would move freely in and out, making it impossible to maintain any controlled environment inside. The membrane is the architecture that makes "inside" and "outside" meaningful.',
        gaming:
          'A cell without a membrane is like a game with no defined map boundaries — resources, players, and objectives all bleed together, making any strategy impossible. The membrane defines the arena where the cell\'s game can actually be played.',
        sports:
          'Without a membrane, a cell would be like a sports pitch with no boundary lines. Players, ball, and play would spill everywhere — you could not keep score, defend a zone, or run a play. The membrane is the boundary that makes the game coherent.',
        music:
          'A cell without a membrane is like an open-air session with no acoustic boundaries — every sound bleeds in and out, making it impossible to shape or control the mix. The membrane is the recording booth walls that let the internal environment be controlled.',
      },
    },
    {
      question: 'How does the Na⁺/K⁺ pump actually move ions against their concentration gradient?',
      groundedAnswer:
        'The Na⁺/K⁺ ATPase is a transmembrane protein that undergoes a conformational change (shape change) powered by ATP hydrolysis. In its first state, it binds 3 Na⁺ ions from the cytoplasm and one ATP molecule. Hydrolysis of ATP phosphorylates the protein, triggering a shape change that exposes the Na⁺ binding sites to the extracellular space — where Na⁺ affinity drops, releasing the Na⁺ ions outside. The changed shape now binds 2 K⁺ from outside. Dephosphorylation returns the protein to its original shape, releasing K⁺ inside the cell. The net result: 3 Na⁺ pumped out, 2 K⁺ pumped in, 1 ATP consumed. This cycle is essential for maintaining the electrochemical gradient used by neurons and muscle cells.',
      analogies: {
        neutral:
          'The pump works like a revolving door with a built-in bouncer. It selectively admits certain molecules from one side, rotates using energy (ATP), and deposits them on the other side — while simultaneously collecting a different set on the return rotation.',
        gaming:
          'The Na⁺/K⁺ pump is like a resource exchange station in a strategy game. You spend one unit of energy (ATP), send 3 units of one resource out, and receive 2 units of a different resource in return. The exchange rate is fixed, and the station only works in one direction per transaction.',
        sports:
          'It is like a controlled substitution system with a strict rule: for every cycle, 3 players (Na⁺) leave the field and 2 new ones (K⁺) come on. The coaching staff (ATP) makes this happen against the natural flow of player fatigue — keeping the team composition exactly where the coach needs it.',
        music:
          'The pump works like an automated mixing desk that runs a fixed fade cycle: it turns down 3 channels on one bus and brings up 2 on another, using a set amount of power per cycle. The ratios are fixed, and the cycle repeats continuously to keep the signal balanced.',
      },
    },
    {
      question: 'What would happen to a cell placed in a hypotonic solution, and why?',
      groundedAnswer:
        'A hypotonic solution has a lower solute concentration than the cell\'s interior. Because water moves by osmosis from a region of lower solute concentration (higher water concentration) to a region of higher solute concentration (lower water concentration), water would flow into the cell. The cell would swell as water enters faster than it can be expelled. In animal cells without rigid walls, this can continue until the membrane ruptures — a process called cytolysis or osmotic lysis. Plant cells resist this because their cell wall provides a rigid structure that creates turgor pressure, opposing further water entry. Red blood cells placed in distilled water (maximally hypotonic) will burst within seconds.',
      analogies: {
        neutral:
          'It is like an inflatable balloon submerged in water that can seep through its walls. If the pressure inside the balloon is greater than outside, water still flows in to equalize concentrations — not pressure. The balloon swells until it either stabilizes or bursts.',
        gaming:
          'A cell in a hypotonic solution is like a base that enemies flood toward from all directions because the inside holds the most valuable resource. Water (the flood) rushes in to "balance" the resource count. If the base has no walls (no cell wall), it gets overwhelmed and destroyed.',
        sports:
          'It is like a team forced to play on a pitch that keeps shrinking around them. More players (water molecules) keep entering the defined zone than are leaving, until the space is overcrowded and the structure breaks down.',
        music:
          'A cell in a hypotonic solution is like a speaker cone that keeps receiving more signal than it can handle. Volume (water) keeps pouring in to equalize the difference — but without a limit, the cone distorts and eventually blows.',
      },
    },
  ],
}
```

---

### Topic 3: DNA Transcription & Translation

```typescript
export const dnaExpression: Topic = {
  id: 'dna-expression',
  title: 'DNA Transcription & Translation',
  subtitle: 'How genetic information becomes a protein',
  cram: {
    definition:
      'Transcription converts a DNA gene into a complementary mRNA strand in the nucleus. Translation uses the mRNA sequence at a ribosome to build a specific protein from amino acids.',
    stages: [
      'Transcription — nucleus. RNA polymerase unwinds DNA at the promoter, synthesizes a complementary mRNA strand (5\'→3\'), and terminates at the terminator sequence. DNA stays in the nucleus.',
      'RNA Processing — nucleus. Pre-mRNA is modified: 5\' cap and poly-A tail added, introns spliced out, exons joined. Mature mRNA exits to cytoplasm.',
      'Translation — ribosome (cytoplasm or RER). Ribosome reads mRNA codons (3-base sequences) 5\'→3\'. tRNA anticodons deliver matching amino acids. Peptide bonds form the polypeptide chain.',
    ],
    examFacts: [
      'Central Dogma: DNA → RNA → Protein. DNA is never translated directly.',
      'mRNA codons are read 5\'→3\'. The genetic code is degenerate (multiple codons can encode one amino acid) but unambiguous (one codon only encodes one amino acid).',
      'Start codon: AUG (methionine). Stop codons: UAA, UAG, UGA — no amino acid is added at stop codons.',
      'DNA uses thymine (T); RNA uses uracil (U). A pairs with U in transcription.',
      'tRNA has an anticodon loop complementary to the mRNA codon and carries the corresponding amino acid at its 3\' CCA end.',
      'Ribosomes have 3 sites: A site (aminoacyl — incoming tRNA), P site (peptidyl — growing chain), E site (exit — spent tRNA leaves).',
    ],
    commonMistakes: [
      'RNA polymerase reads the template strand 3\'→5\' but synthesizes mRNA 5\'→3\' — direction is often confused.',
      'Introns are removed (spliced out); exons are expressed (kept). Memory: introns are "interrupted," exons are "expressed."',
      'Ribosomes do not read DNA — they read mRNA. DNA never leaves the nucleus.',
      'One codon = three mRNA nucleotides = one amino acid (usually). Do not confuse codons with anticodons.',
    ],
  },
  explorer: [
    {
      question: 'Why does the cell make an mRNA copy of DNA instead of using DNA directly to build proteins?',
      groundedAnswer:
        'DNA is the master copy of all genetic information and must be protected from damage. If ribosomes used DNA directly, the constant mechanical stress of translation would risk breaks, mutations, or permanent loss of the genetic code. By transcribing a disposable mRNA copy, the cell preserves the original blueprint intact in the nucleus while sending working copies into the cytoplasm where protein synthesis happens. mRNA molecules are temporary — they are degraded after use — so errors or damage affect only one batch of proteins, not the genome itself. This separation also allows one gene to be transcribed into thousands of mRNA copies simultaneously, amplifying protein output without duplicating DNA.',
      analogies: {
        neutral:
          'DNA is the original architectural blueprint stored in a locked archive. mRNA is a working photocopy sent to the construction site. The archive never leaves the vault — workers use the copies, which get worn out and discarded after each build. The master is always safe.',
        gaming:
          'DNA is the source code repository — protected, version-controlled, and never deployed directly. mRNA is a compiled build sent to the game servers. The servers run the build until it is replaced; the source stays untouched. You can push a thousand builds without ever modifying the original.',
        sports:
          'DNA is the playbook held by the head coach. The coach never runs onto the field — instead, they hand the play (mRNA) to a runner who delivers it to the team. The play gets used and discarded; the playbook stays with the coach, intact for every future game.',
        music:
          'DNA is the master recording — the original session files that never get touched. mRNA is the export file sent to the mastering studio. Engineers work on the export, which gets used up in production. The master files stay pristine, ready to generate a new export anytime.',
      },
    },
    {
      question: 'How does the ribosome know which amino acid to add next during translation?',
      groundedAnswer:
        'The ribosome reads the mRNA sequence in triplets called codons (e.g., AUG, GGC, UAC). Each codon is matched by a tRNA molecule carrying a complementary anticodon sequence. For example, the codon GGC is matched by a tRNA with anticodon CCG, which carries the amino acid glycine. When the correct tRNA enters the ribosome\'s A site, its anticodon forms hydrogen bonds with the mRNA codon, confirming the match. The ribosome then catalyzes the formation of a peptide bond between the incoming amino acid and the growing polypeptide chain at the P site. The ribosome shifts along the mRNA by one codon (translocation), and the cycle repeats. The process is read continuously, codon by codon, until a stop codon (UAA, UAG, or UGA) is encountered — which has no matching tRNA, causing the chain to be released.',
      analogies: {
        neutral:
          'The ribosome reads the mRNA like a barcode scanner on an assembly line. Each three-letter codon is a barcode. The scanner checks which tRNA (delivery vehicle) carries the matching barcode, accepts the cargo (amino acid), attaches it to the growing package, and advances to the next barcode.',
        gaming:
          'The ribosome is a crafting machine that reads recipe steps (codons) one at a time. Each step specifies exactly one ingredient (amino acid). A delivery unit (tRNA) with the matching slot key arrives, drops off the ingredient, and the machine adds it to the structure being built — then it reads the next step.',
        sports:
          'Translation is like a relay race where each leg is called out by a scoreboard (mRNA codon). The runner (tRNA) with the right number bib enters, passes the baton (amino acid) forward, and exits. The scoreboard advances to the next leg. Each leg must be run in exact order — and when "FINISH" appears (stop codon), the race ends and the medal (protein) is awarded.',
        music:
          'The ribosome reads mRNA like a step sequencer reading a pattern. Each step (codon) triggers a specific sound module (tRNA with its amino acid) to fire. The modules play in strict order, note by note, building the full composition (protein). When the sequencer hits a blank step (stop codon), the track ends.',
      },
    },
    {
      question: 'What happens when a single nucleotide in a gene is mutated — does it always break the protein?',
      groundedAnswer:
        'Not necessarily — the outcome depends entirely on the type of mutation and its position. A point mutation (single nucleotide change) can result in: (1) a synonymous (silent) mutation, where a different codon still encodes the same amino acid due to codon degeneracy — protein is unchanged; (2) a missense mutation, where the new codon encodes a different amino acid — the protein may function normally, partially, or not at all depending on whether the amino acid change affects the protein\'s shape or active site; (3) a nonsense mutation, where the new codon is a stop codon — translation terminates early, usually producing a non-functional truncated protein. A frameshift mutation (insertion or deletion of a nucleotide) is typically the most damaging because it shifts the entire reading frame downstream, scrambling every subsequent codon.',
      analogies: {
        neutral:
          'A single-letter typo in a recipe might change nothing ("stir" vs. "star" in a note), change the flavour slightly (a different spice substituted), or ruin the dish entirely (a stop instruction placed mid-recipe). A deleted word, however, corrupts every sentence that follows — like a frameshift corrupts every codon downstream.',
        gaming:
          'Changing one character in a cheat code might produce a different (still valid) effect, activate the wrong ability, or crash the command entirely. Deleting a character shifts the entire input string — every subsequent command the game reads is now off by one character and breaks.',
        sports:
          'One wrong word in a play call might be inconsequential ("run left" vs. "run right"), send the wrong player, or stop the play entirely if the word is "stop." But delete a word from the call entirely and every player who hears the rest of the sentence misinterprets their assignment — the whole play collapses.',
        music:
          'Changing one note in a chord might be inaudible, slightly alter the harmonic colour, or clash badly depending on context. Removing a beat entirely shifts the timing of every note that follows — the rhythm falls apart from that point on, no matter how correctly the remaining notes were placed.',
      },
    },
  ],
}
```

---

### Topic 4: Action Potential & Synaptic Transmission

```typescript
export const actionPotential: Topic = {
  id: 'action-potential',
  title: 'Action Potential & Synaptic Transmission',
  subtitle: 'How neurons generate and transmit electrical signals',
  cram: {
    definition:
      'An action potential is a rapid, all-or-nothing electrical signal generated by a neuron when voltage-gated ion channels open, reversing and then restoring the membrane potential. Synaptic transmission converts this electrical signal into a chemical one at the synapse.',
    stages: [
      'Resting Potential — ~−70 mV inside relative to outside. Na⁺/K⁺ pump maintains high K⁺ inside, high Na⁺ outside. Leak channels keep K⁺ slowly flowing out.',
      'Depolarization — stimulus reaches threshold (~−55 mV). Voltage-gated Na⁺ channels open → Na⁺ floods in → membrane potential rises to ~+30 to +40 mV.',
      'Repolarization & Hyperpolarization — Na⁺ channels inactivate; voltage-gated K⁺ channels open → K⁺ flows out → potential falls, briefly overshoots (hyperpolarization ~−80 mV), then returns to resting.',
      'Synaptic Transmission — action potential reaches axon terminal → Ca²⁺ enters → neurotransmitter vesicles fuse with membrane → neurotransmitters released into synapse → bind receptors on postsynaptic cell.',
    ],
    examFacts: [
      'Action potentials are all-or-nothing: once threshold is reached, the full signal fires regardless of stimulus strength. Intensity is coded by frequency, not amplitude.',
      'The absolute refractory period (Na⁺ channels inactivated) ensures one-directional propagation — the signal cannot travel backward.',
      'Myelinated axons conduct faster via saltatory conduction — action potentials "jump" between nodes of Ranvier.',
      'Key neurotransmitters: acetylcholine (ACh) at neuromuscular junctions, glutamate (excitatory), GABA (inhibitory), dopamine, serotonin.',
      'EPSP (excitatory postsynaptic potential) brings membrane closer to threshold; IPSP (inhibitory) moves it further away.',
    ],
    commonMistakes: [
      'The resting potential is −70 mV inside — negative, not positive. K⁺ is high inside; Na⁺ is high outside.',
      'Depolarization is when the membrane becomes LESS negative (inside going toward 0 and beyond), not more.',
      'The action potential signal is coded in FREQUENCY, not amplitude. Stronger stimuli cause more frequent spikes, not larger ones.',
      'Neurotransmitters are released from the presynaptic cell and bind receptors on the postsynaptic cell — not the other way around.',
    ],
  },
  explorer: [
    {
      question: 'Why is the neuron\'s resting membrane potential negative, and why does that matter?',
      groundedAnswer:
        'The resting membrane potential of approximately −70 mV (inside negative relative to outside) exists because of two factors: the selective permeability of the membrane and the activity of the Na⁺/K⁺ ATPase pump. At rest, the membrane is more permeable to K⁺ than Na⁺. K⁺ ions leak out down their concentration gradient through open K⁺ leak channels, carrying positive charges out and leaving behind negatively charged proteins inside. The Na⁺/K⁺ pump continuously restores the gradients — moving 3 Na⁺ out for every 2 K⁺ in — and contributes to the net negative interior. This stored electrical potential is critical because it represents potential energy. When a neuron is stimulated, rapid changes to ion permeability can use this potential energy to generate a fast electrical signal that travels the length of the axon.',
      analogies: {
        neutral:
          'The resting potential is like a compressed spring — energy stored and ready to release. The Na⁺/K⁺ pump constantly re-compresses the spring. When the neuron fires, the spring releases all at once, driving the signal down the axon.',
        gaming:
          'The resting potential is a fully charged ability bar, held at a set level by a passive regeneration system (the pump). When a trigger event (stimulus) hits threshold, the ability fires — discharging the stored energy in a single burst that travels to the next target.',
        sports:
          'It is like a sprinter in the blocks — fully loaded with potential energy, coiled and held in place by the starter\'s stance (the pump). The negative potential is the stored tension. The starting gun (stimulus) releases it all at once as explosive forward movement.',
        music:
          'The resting potential is a fully wound key on a music box — potential energy stored in the tension. The pump keeps winding it. A sufficient stimulus releases the mechanism, playing the sequence (action potential) from start to finish before the key needs rewinding.',
      },
    },
    {
      question: 'What makes an action potential "all-or-nothing," and how does a neuron encode signal strength?',
      groundedAnswer:
        'An action potential is all-or-nothing because of the voltage-gated Na⁺ channels involved. Below the threshold potential (approximately −55 mV), Na⁺ channels do not open sufficiently and the membrane returns to rest. Once threshold is reached, positive feedback takes over: Na⁺ entry depolarizes the membrane further, which opens more Na⁺ channels, which allows more Na⁺ in — creating a self-amplifying cascade that always produces the same magnitude signal regardless of how much above threshold the original stimulus was. Signal strength is therefore not encoded in the size of individual action potentials but in their frequency. A weak stimulus might cause 5 action potentials per second; a stronger stimulus causes 50. The nervous system interprets frequency as intensity — a code called rate coding.',
      analogies: {
        neutral:
          'It is like a gun trigger — squeezing lightly does nothing, but once enough pressure crosses the threshold, the gun fires fully regardless of how hard you squeeze beyond that point. Whether you fire once per second or ten times per second determines how urgent the signal is, not how hard each pull is.',
        gaming:
          'The action potential is a charged attack with a fixed damage output — it either fires at full power or not at all. You cannot fire it at half power. But you can hold down the button to fire it repeatedly. Enemies interpret the incoming damage rate — not the damage per hit — to know how serious the threat is.',
        sports:
          'Think of a starting pistol: either it fires or it doesn\'t — there\'s no "half-fire." But a coach can fire the gun many times in rapid succession to indicate urgency. Players read the tempo (frequency) of the signals, not the volume of any individual shot.',
        music:
          'One note on a drum is either struck or not — there\'s no half-hit at the same velocity. But the drummer communicates intensity through hit rate: a slow beat signals calm; a rapid roll signals urgency. The note is the same each time; the tempo is the message.',
      },
    },
    {
      question: 'How does a signal cross the synaptic gap — and what determines whether the next neuron fires?',
      groundedAnswer:
        'When an action potential reaches the axon terminal, it triggers voltage-gated Ca²⁺ channels to open. Calcium ions flood into the terminal, causing synaptic vesicles (membrane-bound packages of neurotransmitter) to fuse with the presynaptic membrane and release their neurotransmitter molecules into the synaptic cleft by exocytosis. The neurotransmitters diffuse across the narrow cleft (20–40 nm) and bind to receptors on the postsynaptic membrane. Whether the postsynaptic neuron fires depends on summation: excitatory inputs (EPSPs) bring the membrane toward threshold; inhibitory inputs (IPSPs) move it away. The postsynaptic neuron integrates all incoming signals simultaneously — spatial summation (multiple synapses firing at once) and temporal summation (repeated signals from one synapse in quick succession) — and fires only if the net effect reaches threshold.',
      analogies: {
        neutral:
          'The synapse is a vote-counting system. Excitatory neurons cast "yes" votes (EPSPs); inhibitory neurons cast "no" votes (IPSPs). The postsynaptic neuron tallies all incoming votes continuously. If the "yes" total exceeds the threshold majority, it fires. If "no" votes dominate, it stays silent.',
        gaming:
          'The synapse is the game\'s damage-calculation layer. Multiple incoming hits (EPSPs) stack damage toward a health threshold. Shields and healing (IPSPs) push it back. The target fires (acts) only when net damage crosses the threshold — any combination of stacked hits and blocks determines the outcome.',
        sports:
          'The postsynaptic neuron is a referee who listens to multiple coaching calls at once. Coaches on one side (excitatory) push toward a decision; coaches on the other side (inhibitory) argue against it. If the "go" calls collectively outweigh the "hold" calls above a clear threshold, the referee calls the play.',
        music:
          'The postsynaptic neuron is a master fader. Multiple input channels (synapses) feed into it — some add gain (excitatory), some pull it down (inhibitory). The fader sums everything in real time. When the combined level crosses the threshold, the output channel opens and fires its signal downstream.',
      },
    },
  ],
}
```

---

### Topic 5: Enzyme Kinetics & Allosteric Regulation

```typescript
export const enzymeKinetics: Topic = {
  id: 'enzyme-kinetics',
  title: 'Enzyme Kinetics & Allosteric Regulation',
  subtitle: 'How biological catalysts are controlled',
  cram: {
    definition:
      'Enzymes are biological catalysts (usually proteins) that speed up biochemical reactions by lowering activation energy, without being consumed. Their activity is regulated by substrate concentration, inhibitors, and allosteric modulators.',
    stages: [
      'Enzyme-Substrate Binding — substrate binds to the active site (lock-and-key or induced-fit model). Induced-fit: active site changes shape slightly to optimize binding. Enzyme-substrate complex forms.',
      'Catalysis — enzyme stabilizes transition state, lowers activation energy. Product forms and is released. Enzyme is unchanged and ready to catalyze again.',
      'Regulation — activity controlled by: competitive inhibition (inhibitor blocks active site, reversible by more substrate), non-competitive inhibition (inhibitor binds elsewhere, reduces efficiency regardless of substrate), and allosteric regulation (modulator binds allosteric site, causes conformational change that activates or inhibits).',
    ],
    examFacts: [
      'Enzymes lower activation energy — they do NOT change the overall ΔG (free energy change) of the reaction or make unfavourable reactions favourable.',
      'Km (Michaelis constant) = substrate concentration at half-maximum velocity (Vmax/2). Lower Km = higher affinity for substrate.',
      'Competitive inhibitors increase apparent Km (lower affinity) without changing Vmax. Non-competitive inhibitors decrease Vmax without changing Km.',
      'Allosteric enzymes often show sigmoidal kinetics (S-shaped curve) rather than hyperbolic, due to cooperative binding between multiple subunits.',
      'Feedback inhibition: end product of a metabolic pathway inhibits an earlier enzyme in the same pathway, preventing overproduction.',
      'Enzyme activity is affected by temperature (peak at optimum; denaturing above) and pH (specific optimum per enzyme).',
    ],
    commonMistakes: [
      'Enzymes are NOT consumed in reactions — they are catalysts and can be reused thousands of times.',
      'Competitive inhibition can be overcome by adding more substrate; non-competitive inhibition cannot — Vmax is always reduced.',
      'Enzymes DO NOT change the direction or thermodynamic favourability of a reaction — only the speed at which equilibrium is reached.',
      'Denaturation above optimum temperature is irreversible in most cases — the enzyme does not "recover" on cooling.',
    ],
  },
  explorer: [
    {
      question: 'Why do cells need to regulate enzyme activity rather than just running reactions at full speed all the time?',
      groundedAnswer:
        'Unregulated enzyme activity would be catastrophically wasteful and potentially lethal. Metabolic pathways produce products that are used elsewhere — building too much of a product depletes precursor molecules, wastes ATP, and can cause toxic accumulation of intermediates. Cells use feedback inhibition as their primary regulatory strategy: when the end product of a pathway accumulates, it inhibits an early enzyme in that pathway, slowing production. This creates an elegant self-regulating system where output is continuously matched to demand without external instruction. Regulation also allows cells to redirect metabolic flow in response to environmental conditions — rapidly increasing or decreasing the rate of specific pathways based on energy state, nutrient availability, or signalling molecules.',
      analogies: {
        neutral:
          'It is like a thermostat controlling a heating system. The house does not run the heater at full blast permanently — the thermostat detects when the desired temperature is reached and turns it off. Feedback inhibition is the cell\'s thermostat: product accumulation is the signal that turns off the pathway\'s "heater."',
        gaming:
          'Unregulated enzyme activity would be like a resource factory running at max output forever, even when your storage is full and your inventory is capped. You would waste all your production budget and overflow your resource slots. Regulation is the production cap: factories slow when storage nears full, matching supply to demand.',
        sports:
          'It is like a team\'s training load management. You do not run full-intensity sessions every day — fatigue (the end product) signals the coaching staff to reduce intensity. If the team ignores this signal and trains at maximum every day, performance collapses. Feedback inhibition is the cell\'s built-in load management system.',
        music:
          'Running enzymes at full speed with no regulation is like a live board with every fader at maximum all the time — total saturation, zero dynamic range, and a blown mix. Regulation is the compressor and limiter: when signal levels spike, the circuit automatically pulls back, preventing overload and keeping the output clean.',
      },
    },
    {
      question: 'How is competitive inhibition different from allosteric inhibition — and why does the difference matter clinically?',
      groundedAnswer:
        'Competitive inhibitors bind directly to the enzyme\'s active site, competing with the substrate. They are structurally similar to the substrate and block it from binding. Crucially, competitive inhibition is reversible and can be overcome by increasing substrate concentration — more substrate molecules outcompete the inhibitor for active site access. Vmax is unchanged; Km increases. Allosteric inhibitors bind to a separate regulatory site (the allosteric site), causing a conformational change in the enzyme\'s overall shape. This indirectly changes the active site geometry without physically blocking it. Allosteric inhibition cannot be overcome simply by adding more substrate — Vmax decreases. Clinically, this distinction determines drug design: many pharmaceuticals (e.g., ACE inhibitors for blood pressure, statins for cholesterol) are competitive inhibitors designed to mimic the natural substrate and block a specific enzyme. Allosteric drugs offer additional control because they can activate or inhibit without directly competing with the substrate.',
      analogies: {
        neutral:
          'Competitive inhibition is like someone standing in a doorway — they block entry, but if enough other people push simultaneously, they can be displaced. Allosteric inhibition is like remotely locking the door from a different room — no amount of pushing on the door overcomes it because the lock mechanism is elsewhere.',
        gaming:
          'Competitive inhibition is a player standing on the objective, blocking capture — you can overpower them with more teammates (more substrate). Allosteric inhibition is a game mechanic that disables the objective entirely from a control panel across the map — sending more players to the objective does nothing.',
        sports:
          'Competitive inhibition is a defender physically blocking a play — bring enough offensive pressure and you break through. Allosteric inhibition is the referee calling the play dead before it starts — no amount of offensive pressure changes that call because the decision came from outside the play itself.',
        music:
          'Competitive inhibition is a vocalist trying to sing over backing tracks that are too loud — turn up the vocal fader enough and they cut through. Allosteric inhibition is a mute button applied at the mixing desk — no amount of vocal power overcomes a hard mute because the signal is cut at the routing level, not at the source.',
      },
    },
    {
      question: 'Why do enzymes denature at high temperatures — and why is that usually irreversible?',
      groundedAnswer:
        'Enzymes are proteins whose function depends entirely on their three-dimensional shape. That shape is maintained by multiple non-covalent interactions: hydrogen bonds, ionic bonds, hydrophobic interactions, and van der Waals forces. At temperatures above the enzyme\'s optimum, the kinetic energy of the molecules exceeds what these bonds can withstand. The bonds break, the polypeptide chain unfolds, and the precise geometry of the active site is lost. The enzyme can no longer bind substrate effectively or catalyze the reaction. Denaturation is typically irreversible because the original folded state was not the only thermodynamically accessible conformation — the unfolded chain can misfold into a different stable (but non-functional) structure, or aggregate with other denatured proteins. Unlike simple bond breaking (which can reform on cooling), large-scale misfolding and aggregation cannot spontaneously reverse.',
      analogies: {
        neutral:
          'Denaturation is like crumpling a precisely engineered paper model — the material is intact but the specific structure is destroyed. Uncrumpling returns a roughly similar shape but not the precise original geometry needed for function. The model\'s functional shape is gone even though the paper remains.',
        gaming:
          'It is like corrupting a game\'s save file past the point of recovery. The file still exists, but the data structure is scrambled. You cannot restore the exact prior state by reloading — the information about the original configuration is permanently lost, even if the raw bytes are technically present.',
        sports:
          'Denaturation is like a team losing its tactical structure in chaos — players scatter, roles collapse, coordination breaks down. You can call the players back, but without the clear formation and trust that built over time, re-forming the same precise structure from scratch is nearly impossible mid-match.',
        music:
          'Denaturation is like an analog tape master recording left in the sun. The tape still exists — but the magnetic particles have scrambled. Cooling the tape does not rearrange the particles back to the original signal. The information is gone even though the medium remains.',
      },
    },
  ],
}
```

---

### Update the topics export

At the bottom of `topics.ts`, update the export:

```typescript
export const topics: Topic[] = [
  cellularRespiration,
  cellMembrane,
  dnaExpression,
  actionPotential,
  enzymeKinetics,
]
```

---

## CHANGE 3 — Topic Selector UI

### New file: `src/components/TopicSelector.tsx`

Create a topic selector that shows all 5 topics as selectable cards, with a badge showing the remembered mode for each:

```typescript
import { BookOpenText, Compass } from 'lucide-react'
import type { StudyMode, Topic, TopicPreferences } from '../types'

interface TopicSelectorProps {
  topics: Topic[]
  activeTopic: Topic
  preferences: TopicPreferences
  onSelect: (topic: Topic) => void
}

export function TopicSelector({ topics, activeTopic, preferences, onSelect }: TopicSelectorProps) {
  return (
    <nav className="topic-selector" aria-label="Biology topics">
      <p className="eyebrow mb-3">Topics</p>
      <ul className="space-y-2">
        {topics.map((topic) => {
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
```

---

## CHANGE 4 — Update App.tsx

`App.tsx` needs to:
1. Import all 5 topics
2. Manage `activeTopic` state (defaults to cellular respiration)
3. Import and render `TopicSelector`
4. Read all topic preferences at once to pass to `TopicSelector`
5. Reset `customResult` and explorer `visibleCount` when topic changes (the ExplorerView `key` prop already handles this via `topic.id`)
6. Reset persona to 'neutral' when topic changes

The key structural change is the layout: add a left sidebar (on large screens) or a top scrollable strip (on mobile) that contains `TopicSelector`.

Key state additions:
```typescript
const [activeTopic, setActiveTopic] = useState<Topic>(topics[0])

const handleTopicSelect = (topic: Topic) => {
  setActiveTopic(topic)
  setPersona('neutral')
  // mode should auto-load from the new topic's preference
}
```

For preferences across all topics, read from localStorage once at mount:
```typescript
const [allPreferences, setAllPreferences] = useState<TopicPreferences>(() => {
  try {
    const stored = window.localStorage.getItem('globallab_topic_prefs')
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
})
```

Update `allPreferences` whenever `savePreferredMode` is called.

The `useTopicMemory` hook is already per-topic — keep using it for the active topic's save/load. `allPreferences` is only used to display the memory badges in `TopicSelector`.

---

## CSS — Add these class names to `index.css`

These new components need styles. Add them after the existing component styles:

```css
/* Topic Selector */
.topic-selector {
  /* On large screens: fixed left sidebar. On mobile: horizontal scroll strip */
}

.topic-card {
  @apply flex w-full items-start gap-3 rounded-xl border border-transparent px-3 py-3 text-left transition-all duration-150 hover:border-stone-200 hover:bg-stone-50;
}

.topic-card-active {
  @apply border-orange-200 bg-orange-50;
}

.topic-memory-badge {
  @apply flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-stone-600 shadow-sm ring-1 ring-stone-200;
}
```

Adjust layout in `App.tsx` to be a two-column grid on large screens (sidebar left, content right) or stacked on mobile.

---

## BUILD ORDER FOR V2

1. Update `src/services/personaService.ts` with the real Gemini API call
2. Add the 4 new topics to `src/data/topics.ts` and update the export
3. Create `src/components/TopicSelector.tsx`
4. Update `src/App.tsx` to manage `activeTopic` state and render the selector
5. Add the new CSS classes to `src/index.css`
6. Run `npm run build` — must pass with 0 errors
7. Run `npm run dev` and verify:
   - Custom persona calls Gemini and returns real analogies (not mock)
   - All 5 topics load correctly in Cram and Explorer modes
   - Switching topics resets persona to neutral and loads the correct remembered mode
   - Topic selector shows memory badges for topics the student has marked

---

## DONE WHEN

- [ ] `npm run build` passes with 0 TypeScript errors
- [ ] Custom persona with the Gemini key returns live analogies, not mock text
- [ ] Custom persona with no key (or placeholder) still returns mock gracefully
- [ ] All 5 topics visible and selectable in the topic selector
- [ ] Switching topics resets explorer progress and persona
- [ ] Memory badges appear in the topic selector for topics the student has marked as helpful
- [ ] Cram mode on all 5 new topics renders correct content with no API calls
- [ ] Explorer mode on all 5 new topics shows correct 3 steps with correct persona analogies
