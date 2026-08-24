import type { Topic } from '../types'

export const cellularRespiration: Topic = {
  id: 'cellular-respiration',
  title: 'Cellular Respiration & ATP Synthesis',
  subtitle: 'How cells extract and store energy from glucose',
  cram: {
    definition:
      'Cellular respiration is the process by which cells break down glucose (C₆H₁₂O₆) in the presence of oxygen to produce ATP, CO₂, and water — releasing the chemical energy stored in glucose.',
    stages: [
      'Glycolysis — cytoplasm. Glucose (6C) split into 2 pyruvate (3C). Net yield: 2 ATP + 2 NADH.',
      'Krebs Cycle (Citric Acid Cycle) — mitochondrial matrix. Pyruvate converted to Acetyl-CoA, enters cycle. Yield per glucose: 2 ATP + 6 NADH + 2 FADH₂ + 4 CO₂.',
      'Electron Transport Chain (ETC) & Oxidative Phosphorylation — inner mitochondrial membrane. NADH/FADH₂ donate electrons, proton gradient drives ATP synthase. Yield: ~26–28 ATP.',
    ],
    examFacts: [
      'Overall equation: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ~30–32 ATP',
      'Glycolysis is anaerobic (no oxygen needed). The later stages depend on oxygen being available as the final electron acceptor.',
      'ATP synthase uses chemiosmosis — the proton (H⁺) gradient across the inner mitochondrial membrane drives ADP → ATP conversion.',
      'NADH carries high-energy electrons from earlier stages to the ETC. Each NADH ≈ 2.5 ATP. Each FADH₂ ≈ 1.5 ATP.',
      'Most ATP production occurs in mitochondria, across the inner mitochondrial membrane.',
      'Oxygen is the final electron acceptor in the ETC — it combines with electrons and H⁺ to form water.',
    ],
    commonMistakes: [
      'Glycolysis does NOT occur in mitochondria — it takes place in the cytoplasm.',
      'The overall ATP yield is approximately 30–32, not exactly 36 or 38 as shown in some older textbooks.',
      'Fermentation does not use the ETC; it regenerates NAD⁺ so glycolysis can continue without oxygen.',
      'CO₂ is released during pyruvate oxidation and the Krebs Cycle, not during glycolysis.',
    ],
  },
  explorer: [
    {
      question: 'Why does the cell need to break down glucose at all — why not just use it directly?',
      groundedAnswer:
        'Glucose stores a large amount of chemical energy in its bonds, but cells cannot directly use this energy for most cellular work. They need a universal energy currency — ATP (adenosine triphosphate). ATP is a small, stable molecule whose terminal phosphate bond can be broken to release a controlled, usable amount of energy exactly where and when a cell needs it. Breaking glucose down in controlled steps allows the cell to capture that energy gradually in ATP, rather than releasing it all at once as heat.',
      analogies: {
        neutral:
          'Think of glucose as a large battery pack. Most devices cannot plug directly into it; they need an adapter that delivers energy in the right form. ATP is that standardized, cell-sized energy packet.',
        gaming:
          'Glucose is like a large resource drop you cannot spend directly. The cell converts it into ATP — the in-game currency that can actually power movement, repairs, and abilities.',
        sports:
          'Glucose is like fuel in a race car: it holds potential energy, but the engine must convert it into controlled motion. Cellular respiration is that conversion process; ATP is the usable power reaching the wheels.',
        music:
          'Glucose is like a powerful raw audio signal. The cell processes it in stages so the energy arrives as clean, controlled units instead of one damaging burst. Each ATP molecule is a usable signal level.',
      },
    },
    {
      question: 'How does ATP synthase actually make ATP — what is the proton gradient doing?',
      groundedAnswer:
        'ATP synthase is a molecular motor embedded in the inner mitochondrial membrane. As electrons move through the Electron Transport Chain, released energy pumps protons (H⁺ ions) from the mitochondrial matrix into the intermembrane space. This creates a proton gradient, also called the proton-motive force. Protons then flow back into the matrix through ATP synthase, rotating part of the enzyme. That mechanical rotation changes the shape of catalytic sites that join ADP and inorganic phosphate to produce ATP. Using a proton gradient to power ATP synthesis is called chemiosmosis.',
      analogies: {
        neutral:
          'ATP synthase works like a water turbine in a dam. Stored water flows through the turbine and makes it rotate; here, stored protons flow through the enzyme and the rotation powers ATP production.',
        gaming:
          'The ETC loads protons into a charged zone, building potential energy. ATP synthase is the only controlled exit: as the protons rush through its rotating gate, the mechanism produces new ATP energy units.',
        sports:
          'Imagine pressure building in a stadium’s hydraulic system. When the pressurized fluid is released through a turbine, the flow spins machinery. The proton gradient supplies that pressure, and ATP synthase is the turbine.',
        music:
          'The ETC builds tension like energy accumulating before a musical drop. ATP synthase is the controlled release point: proton flow turns its rotor and converts that stored potential into a steady output of ATP.',
      },
    },
    {
      question: 'What would actually happen inside a cell if the Electron Transport Chain stopped working?',
      groundedAnswer:
        'If the ETC stopped, NADH and FADH₂ could no longer pass on their electrons efficiently. These carriers would remain reduced and could not be recycled to NAD⁺ and FAD at the required rate. The Krebs Cycle would slow or halt, and the proton gradient would collapse, stopping oxidative phosphorylation. Glycolysis could continue only if the cell regenerated NAD⁺ through fermentation, yielding just 2 ATP per glucose. That low output is insufficient for many high-demand cells, so tissues such as the brain and heart are affected especially quickly when oxygen delivery or the ETC fails.',
      analogies: {
        neutral:
          'It is like a factory recycling loop breaking. Used carriers cannot be emptied and returned to the production line, so the whole system slows even while raw fuel is still present.',
        gaming:
          'Imagine the system that recharges spent energy tokens goes offline. Basic low-power actions may continue briefly, but the high-output abilities stay locked because the tokens cannot be reset and reused.',
        sports:
          'Picture a team whose substitution system fails. Tired players cannot rotate out and recover, so performance drops even though the team still has a game plan. The carriers are present, but they cannot be refreshed.',
        music:
          'It is like a broken send-and-return loop on a live sound board. Signals enter, but the processed channels cannot cycle back cleanly; the system saturates and the whole mix begins to collapse.',
      },
    },
  ],
}

export const topics: Topic[] = [cellularRespiration]
