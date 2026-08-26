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
      diagram: {
        url: '/diagrams/biology/cellular-respiration.png',
        caption:
          'Overview of cellular respiration: glycolysis (cytoplasm) → Krebs cycle (matrix) → ETC (inner membrane).',
        alt: 'Diagram showing the three stages of cellular respiration within a mitochondrion',
      },
      callouts: [
        {
          type: 'key-insight',
          heading: 'Why ATP is the universal currency',
          body: 'Cells across diverse organisms use ATP as a transferable energy molecule. Energy released by one reaction can therefore power a different cellular process through a shared chemical energy carrier.',
        },
        {
          type: 'real-world',
          heading: 'Why you breathe harder during exercise',
          body: 'Muscle cells consuming ATP faster signal the body to increase oxygen delivery. Without more oxygen, the electron transport chain stalls and ATP production collapses to just 2 per glucose (glycolysis only) — which is why you cannot sprint indefinitely.',
        },
      ],
      presetAnalogies: {
        neutral: 'ATP is the cell\'s universal energy currency — like a standardised rechargeable battery that every cellular machine is built to use, regardless of where the original energy came from.',
        gaming: 'Glucose is a large resource cache the cell cannot spend directly. Cellular respiration converts it into ATP — the in-game currency every ability, movement, and repair action actually runs on.',
        sports: 'Glucose is a full fuel tank — potential energy stored but not yet usable. Cellular respiration is the engine that converts it into actual drive reaching the wheels. ATP is that usable output.',
        basketball: 'Glucose is like the energy a basketball team has stored before tip-off; it cannot power a sprint or jump until the body converts it. Cellular respiration is the team’s conversion system, producing ATP — the immediately spendable energy for every cut, pass, and shot.',
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
        basketball: 'Glycolysis is like the opening fast break: one glucose possession splits into two pyruvate lanes and produces a quick two-ATP payoff. It can start without oxygen, but most of the energy opportunity moves on to later stages.',
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
        basketball: 'The Krebs cycle is like a point guard repeatedly running a set play. It scores little directly, but loads the assist leaders NADH and FADH₂ with high-energy electrons to deliver to the final scoring stage.',
        music: 'The Krebs cycle is the mid-chain signal processor — extracting harmonic content into separate buses and routing them to the master section where real output power is generated.',
      },
    },
    {
      id: 'etc',
      heading: 'Stage 3 — Electron Transport Chain & ATP Synthase',
      body: 'The electron transport chain (ETC) is embedded in the inner mitochondrial membrane and produces approximately 26–28 of the 30–32 ATP generated per glucose. NADH and FADH₂ deliver electrons to protein complexes in the chain. As electrons move through these complexes, the released energy pumps protons (H⁺) from the mitochondrial matrix into the intermembrane space, creating a steep proton gradient — the proton-motive force. Protons flow back into the matrix through ATP synthase, a molecular rotor whose rotation drives ATP synthesis from ADP and inorganic phosphate. This mechanism — using a proton gradient to power ATP synthesis — is called chemiosmosis. Oxygen is the final electron acceptor, combining with electrons and protons to form water. Without oxygen, the ETC stalls and ATP production collapses to the 2 ATP of glycolysis alone.',
      keyTerms: ['electron transport chain', 'ATP synthase', 'chemiosmosis', 'proton gradient', 'proton-motive force', 'inner mitochondrial membrane', 'ADP'],
      callouts: [
        {
          type: 'key-insight',
          heading: 'Chemiosmosis is conserved across nearly all life',
          body: 'The proton gradient driving ATP synthase is not unique to animals. Chloroplasts, archaea in extreme environments, and mitochondria all use the same chemiosmotic mechanism — one of the most conserved processes in all of biology.',
        },
      ],
      presetAnalogies: {
        neutral: 'ATP synthase works like a water turbine in a dam. The proton gradient is the water held behind the dam wall. Protons rushing through the synthase spin its rotor the way water spins a turbine — converting controlled flow into usable mechanical energy output.',
        gaming: 'The ETC pressurises protons into a high-density zone. ATP synthase is the only controlled release gate — as protons rush through, the rotating mechanism mints ATP. More pressure built = faster ATP output rate.',
        sports: 'The proton gradient is a hydraulic system under pressure. ATP synthase is the valve — the rush of pressure through the turbine generates power on demand. No oxygen means no release pathway, and the whole system stalls at 2 ATP.',
        basketball: 'Picture protons as basketballs being pumped into a packed rack on one side of the membrane, storing pressure. As they roll back through ATP synthase, they spin it like a ball-return wheel to make ATP; oxygen is the final receiver that keeps the system from jamming.',
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
        basketball: 'Treat the pathway like a basketball score sheet: glycolysis belongs in the cytoplasm column, the final ATP total is about 30–32, and fermentation is an emergency bench unit rather than one of the three main stages. Putting a fact in the wrong column loses the point even if the term itself sounds familiar.',
        music: 'Fermentation is the acoustic backup set when the main PA fails — stripped down, lower output, keeps the show running but nowhere near full production quality.',
      },
    },
  ],
}
