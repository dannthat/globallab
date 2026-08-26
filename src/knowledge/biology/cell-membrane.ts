import type { KnowledgeTopic } from '../../types'

export const cellMembrane: KnowledgeTopic = {
  id: 'cell-membrane',
  subjectId: 'biology',
  title: 'Cell Membrane & Active Transport',
  subtitle: 'How cells control what enters and exits',
  source: {
    name: 'NIH National Institute of General Medical Sciences',
    url: 'https://www.nigms.nih.gov/education',
    license: 'Public Domain',
  },
  sections: [
    {
      id: 'overview',
      heading: 'What is the Cell Membrane?',
      body: 'The cell membrane is a selectively permeable phospholipid bilayer that regulates the passage of substances into and out of the cell, maintaining internal homeostasis. By separating the cytoplasm from the external environment, it lets the cell control ion concentrations, nutrient uptake, waste removal, electrical signalling, and communication with other cells.',
      keyTerms: ['cell membrane', 'selectively permeable', 'phospholipid bilayer', 'homeostasis', 'cytoplasm'],
      diagram: {
        url: '/diagrams/biology/cell-membrane.png',
        caption:
          'Cross-section of the phospholipid bilayer with embedded transport proteins.',
        alt: 'Phospholipid bilayer diagram showing hydrophilic heads facing outward, hydrophobic tails facing inward, with channel and carrier proteins',
      },
      callouts: [
        {
          type: 'real-world',
          heading: 'Why soap destroys viruses',
          body: 'Soap molecules are amphipathic — hydrophilic on one end, hydrophobic on the other — just like phospholipids. When soap contacts an enveloped virus like influenza or SARS-CoV-2, it disrupts the lipid membrane, destroying the virus. This is why 20 seconds of handwashing is effective.',
        },
      ],
    },
    {
      id: 'phospholipid-bilayer',
      heading: 'The Phospholipid Bilayer',
      body: 'Phospholipids are amphipathic molecules: each has a hydrophilic phosphate head that interacts with water and hydrophobic fatty-acid tails that avoid water. In a watery environment they self-assemble into two layers, with heads facing the cytoplasm and extracellular fluid while tails point inward. Cholesterol sits between phospholipids and buffers fluidity, while membrane proteins provide channels, carriers, receptors, enzymes, and attachment points.\n\nWithout a membrane, a cell could not maintain the specific internal chemical environment required for its enzymes and metabolic reactions to function. Concentration gradients of ions like Na⁺, K⁺, and Ca²⁺ are essential for electrical signaling, protein function, and energy production. A freely permeable cell would rapidly equilibrate with its external environment, losing the controlled concentrations that make life possible. The membrane acts as a selective barrier — permeable to some substances and impermeable to others — allowing the cell to maintain homeostasis independently of the surrounding environment.',
      keyTerms: ['phospholipids', 'amphipathic', 'hydrophilic', 'hydrophobic', 'cholesterol', 'ion gradients'],
      presetAnalogies: {
        neutral: 'A cell without a membrane would be like a building with no walls — temperature, sound, and people would move freely in and out, making it impossible to maintain any controlled environment inside.',
        gaming: 'A cell without a membrane is like a game with no defined map boundaries — resources, players, and objectives all bleed together, making any strategy impossible.',
        sports: 'Without a membrane, a cell would be like a sports pitch with no boundary lines. Players, ball, and play would spill everywhere, so no organised play could exist.',
        music: 'A cell without a membrane is like an open-air session with no acoustic boundaries — every sound bleeds in and out, making it impossible to shape or control the mix.',
      },
    },
    {
      id: 'passive-transport',
      heading: 'Passive Transport & Osmosis',
      body: 'Passive transport moves substances down their concentration or electrochemical gradient and requires no ATP. Small non-polar molecules cross by simple diffusion; polar molecules and ions use channel or carrier proteins in facilitated diffusion. Osmosis is the passive movement of water across a selectively permeable membrane, often through aquaporins, from lower solute concentration toward higher solute concentration.\n\nA hypotonic solution has a lower solute concentration than the cell\'s interior. Because water moves by osmosis from a region of lower solute concentration (higher water concentration) to a region of higher solute concentration (lower water concentration), water would flow into the cell. The cell would swell as water enters faster than it can be expelled. In animal cells without rigid walls, this can continue until the membrane ruptures — a process called cytolysis or osmotic lysis. Plant cells resist this because their cell wall provides a rigid structure that creates turgor pressure, opposing further water entry. Red blood cells placed in distilled water (maximally hypotonic) will burst within seconds.',
      keyTerms: ['passive transport', 'concentration gradient', 'diffusion', 'facilitated diffusion', 'osmosis', 'aquaporins', 'hypotonic', 'hypertonic', 'isotonic'],
      diagram: {
        url: '/diagrams/biology/osmosis.png',
        caption: 'Osmosis across a semipermeable membrane from low to high solute concentration.',
        alt: 'Diagram showing water molecules moving through a semipermeable membrane from a hypotonic solution to a hypertonic solution.',
      },
      presetAnalogies: {
        neutral: 'Osmosis is like people moving through available doors toward the less crowded distribution of water until the imbalance on the two sides is reduced.',
        gaming: 'In a hypotonic environment, water rushes into the cell like players flooding the zone with the strongest resource pull. Without a rigid outer wall, the base can be overwhelmed.',
        sports: 'A concentration gradient is like players spreading from an overcrowded side of the pitch into open space — movement continues without extra coaching until the imbalance falls.',
        music: 'Passive diffusion resembles signal bleeding from a louder channel into a quieter one through an open route, continuing until the level difference is reduced.',
      },
    },
    {
      id: 'active-transport',
      heading: 'Active Transport',
      body: 'Active transport moves substances against their concentration gradient and therefore requires energy. The Na⁺/K⁺ ATPase is a transmembrane protein that undergoes a conformational change (shape change) powered by ATP hydrolysis. In its first state, it binds 3 Na⁺ ions from the cytoplasm and one ATP molecule. Hydrolysis of ATP phosphorylates the protein, triggering a shape change that exposes the Na⁺ binding sites to the extracellular space — where Na⁺ affinity drops, releasing the Na⁺ ions outside. The changed shape now binds 2 K⁺ from outside. Dephosphorylation returns the protein to its original shape, releasing K⁺ inside the cell. The net result: 3 Na⁺ pumped out, 2 K⁺ pumped in, 1 ATP consumed. This cycle is essential for maintaining the electrochemical gradient used by neurons and muscle cells.\n\nCells also use ATP-dependent vesicle transport. Endocytosis brings large material into the cell, while exocytosis fuses vesicles with the membrane to release material outside.',
      keyTerms: ['active transport', 'Na⁺/K⁺ ATPase', 'antiporter', 'ATP hydrolysis', 'electrochemical gradient', 'endocytosis', 'exocytosis'],
      equation: '3\\text{ Na}^+_{\\text{in}} + 2\\text{ K}^+_{\\text{out}} + \\text{ATP} \\rightarrow 3\\text{ Na}^+_{\\text{out}} + 2\\text{ K}^+_{\\text{in}}',
      diagram: {
        url: '/diagrams/biology/sodium-potassium-pump.png',
        caption: 'The Na?/K?-ATPase pump moving 3 Na? out and 2 K? in per ATP hydrolysed.',
        alt: 'Sodium-potassium pump embedded in membrane showing 3 sodium ions exiting and 2 potassium ions entering, with ATP being hydrolysed.',
      },
      presetAnalogies: {
        neutral: 'The pump works like a revolving door with a built-in bouncer: energy turns the door, three selected passengers leave, and two different passengers enter on the return rotation.',
        gaming: 'The Na⁺/K⁺ pump is a fixed resource exchange station: spend one energy unit, send 3 sodium units out, and bring 2 potassium units in.',
        sports: 'It is a strict substitution cycle: ATP powers three players leaving the field and two replacements entering, maintaining the lineup the team needs.',
        music: 'The pump is an automated mixing cycle that lowers three channels on one bus and raises two on another, spending a fixed amount of power each time.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Exam Mistakes',
      body: 'Remember that osmosis describes water movement only, not solute movement. Water moves from low solute concentration to high solute concentration through a selectively permeable membrane. Facilitated diffusion is still passive because substances move down their gradient, even though a protein helps them cross. Active transport moves substances against the gradient and requires energy.\n\nThe Na⁺/K⁺ pump moves 3 sodium ions out and 2 potassium ions in, not the reverse. It is an antiporter because the ions move in opposite directions. Hypertonic solutions shrink animal cells, hypotonic solutions can cause lysis, and isotonic solutions cause no net volume change. Cholesterol increases membrane fluidity at low temperature and restrains it at high temperature.',
      keyTerms: ['osmosis', 'facilitated diffusion', 'active transport', 'Na⁺/K⁺ pump', 'antiporter', 'tonicity', 'lysis'],
    },
  ],
}
