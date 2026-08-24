import type { KnowledgeTopic } from '../../types'

export const enzymeKinetics: KnowledgeTopic = {
  id: 'enzyme-kinetics',
  subjectId: 'biology',
  title: 'Enzyme Kinetics & Allosteric Regulation',
  subtitle: 'How biological catalysts are controlled',
  source: {
    name: 'NIH National Institute of General Medical Sciences',
    url: 'https://www.nigms.nih.gov/education',
    license: 'Public Domain',
  },
  sections: [
    {
      id: 'overview',
      heading: 'What Do Enzymes Do?',
      body: 'Enzymes are biological catalysts, usually proteins, that speed biochemical reactions by lowering activation energy without being consumed. They stabilize the transition state and help reactants reach it more readily, but they do not change a reaction’s overall free-energy change (ΔG), equilibrium position, or thermodynamic favourability. Enzyme activity is controlled by substrate concentration, inhibitors, temperature, pH, and allosteric signals.',
      keyTerms: ['enzymes', 'biological catalysts', 'activation energy', 'transition state', 'free-energy change', 'ΔG', 'equilibrium'],
    },
    {
      id: 'enzyme-substrate',
      heading: 'Enzyme–Substrate Binding & Rate',
      body: 'A substrate binds the enzyme’s active site to form an enzyme–substrate complex. In the induced-fit model, binding causes a small shape change that positions catalytic groups and stabilizes the transition state. Product is then released, leaving the enzyme unchanged and ready for another cycle.\n\nAs substrate concentration rises, reaction velocity increases until nearly all active sites are occupied and the enzyme approaches Vmax. The Michaelis constant Km is the substrate concentration at half Vmax; a lower Km generally indicates higher apparent substrate affinity.',
      keyTerms: ['substrate', 'active site', 'enzyme–substrate complex', 'induced-fit model', 'Vmax', 'Km', 'Michaelis constant'],
      equation: 'v = \\frac{V_{\\max}[S]}{K_m + [S]}',
    },
    {
      id: 'inhibition',
      heading: 'Competitive & Non-competitive Inhibition',
      body: 'Competitive inhibitors bind directly to the enzyme\'s active site, competing with the substrate. They are structurally similar to the substrate and block it from binding. Crucially, competitive inhibition is reversible and can be overcome by increasing substrate concentration — more substrate molecules outcompete the inhibitor for active site access. Vmax is unchanged; Km increases.\n\nAllosteric inhibitors bind to a separate regulatory site (the allosteric site), causing a conformational change in the enzyme\'s overall shape. This indirectly changes the active site geometry without physically blocking it. Allosteric inhibition cannot be overcome simply by adding more substrate — Vmax decreases. Clinically, this distinction determines drug design: many pharmaceuticals, including ACE inhibitors for blood pressure and statins for cholesterol, are competitive inhibitors designed to mimic the natural substrate and block a specific enzyme. Allosteric drugs offer additional control because they can activate or inhibit without directly competing with the substrate.',
      keyTerms: ['competitive inhibitors', 'active site', 'apparent Km', 'Vmax', 'non-competitive inhibitors', 'drug design'],
      presetAnalogies: {
        neutral: 'Competitive inhibition is someone blocking a doorway who can be displaced by a larger crowd; allosteric inhibition is locking that door from a separate control room.',
        gaming: 'A competitive inhibitor camps on the objective and can be overwhelmed by more players; an allosteric inhibitor disables the objective from a control panel elsewhere.',
        sports: 'Competitive inhibition is a defender physically blocking the play; allosteric inhibition is the referee stopping the play through a separate decision.',
        music: 'Competitive inhibition is another signal masking the vocal until its level is raised; allosteric inhibition is a mute applied elsewhere in the routing.',
      },
    },
    {
      id: 'allosteric-regulation',
      heading: 'Allosteric Regulation & Feedback',
      body: 'Unregulated enzyme activity would be catastrophically wasteful and potentially lethal. Metabolic pathways produce products that are used elsewhere — building too much of a product depletes precursor molecules, wastes ATP, and can cause toxic accumulation of intermediates. Cells use feedback inhibition as their primary regulatory strategy: when the end product of a pathway accumulates, it inhibits an early enzyme in that pathway, slowing production. This creates an elegant self-regulating system where output is continuously matched to demand without external instruction.\n\nRegulation also allows cells to redirect metabolic flow in response to environmental conditions — rapidly increasing or decreasing the rate of specific pathways based on energy state, nutrient availability, or signalling molecules. Allosteric regulators bind away from the active site and change enzyme conformation. Multisubunit allosteric enzymes often show cooperative binding and a sigmoidal rate curve.',
      keyTerms: ['allosteric regulators', 'conformation', 'cooperative binding', 'sigmoidal', 'feedback inhibition', 'metabolic pathway'],
      presetAnalogies: {
        neutral: 'Feedback inhibition is a thermostat: accumulating product is the signal that turns down the pathway until demand rises again.',
        gaming: 'It is a resource factory that automatically slows when storage is full, preventing wasted production and overflow.',
        sports: 'It is training-load management: accumulated fatigue signals the system to reduce intensity before performance collapses.',
        music: 'It is a compressor that automatically pulls back when the signal rises too far, preventing overload while preserving useful output.',
      },
    },
    {
      id: 'temperature-ph',
      heading: 'Temperature, pH & Denaturation',
      body: 'Enzymes are proteins whose function depends entirely on their three-dimensional shape. That shape is maintained by multiple non-covalent interactions: hydrogen bonds, ionic bonds, hydrophobic interactions, and van der Waals forces. At temperatures above the enzyme\'s optimum, the kinetic energy of the molecules exceeds what these bonds can withstand. The bonds break, the polypeptide chain unfolds, and the precise geometry of the active site is lost. The enzyme can no longer bind substrate effectively or catalyze the reaction.\n\nDenaturation is typically irreversible because the original folded state was not the only thermodynamically accessible conformation — the unfolded chain can misfold into a different stable but non-functional structure, or aggregate with other denatured proteins. Each enzyme also has a characteristic pH range. Changing pH alters the protonation and charge of amino-acid side chains, which can disrupt substrate binding, catalysis, or protein structure.',
      keyTerms: ['optimum temperature', 'hydrogen bonds', 'hydrophobic forces', 'active site', 'denaturation', 'pH', 'protonation'],
      presetAnalogies: {
        neutral: 'Denaturation is crumpling a precisely engineered paper model: the material remains, but the exact functional geometry is lost.',
        gaming: 'It is a corrupted save file: the data still exists, but its structure is scrambled and cannot simply be restored by cooling.',
        sports: 'It is a team losing its entire tactical formation; bringing the players back does not automatically recreate the precise coordination.',
        music: 'It is an analog master left in the sun: the tape remains, but the stored pattern is scrambled and cooling cannot reconstruct it.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Exam Mistakes',
      body: 'Enzymes are not consumed and can catalyse repeated reaction cycles. They lower activation energy but do not alter ΔG, equilibrium, or reaction direction. Competitive inhibition can be overcome with more substrate: apparent Km rises and Vmax stays the same. Pure non-competitive inhibition cannot be overcome this way: Vmax falls and Km is unchanged.\n\nLower Km usually means higher apparent affinity. Allosteric and cooperative enzymes often have sigmoidal rather than hyperbolic kinetics. Feedback inhibition uses a pathway’s end product to inhibit an earlier step. Heating above the optimum can irreversibly denature an enzyme; cooling usually does not restore the original fold.',
      keyTerms: ['activation energy', 'ΔG', 'competitive inhibition', 'non-competitive inhibition', 'Km', 'Vmax', 'sigmoidal kinetics', 'feedback inhibition', 'denature'],
    },
  ],
}
