import type { KnowledgeTopic } from '../../types'

export const electrochemistry: KnowledgeTopic = {
  id: 'electrochemistry',
  subjectId: 'chemistry',
  title: 'Electrochemistry & Redox Reactions',
  subtitle: 'Galvanic cells, electrode potentials, and electrolysis',
  source: {
    name: 'OpenStax Chemistry 2e',
    url: 'https://openstax.org/details/books/chemistry-2e',
    license: 'CC BY 4.0',
  },
  sections: [
    {
      id: 'overview',
      heading: 'Oxidation & Reduction',
      body: `Oxidation-reduction reactions transfer electrons or redistribute electron density. Oxidation is loss of electrons and an increase in oxidation number; reduction is gain of electrons and a decrease in oxidation number. The reducing agent donates electrons and is oxidised, while the oxidising agent accepts electrons and is reduced. Both half-processes must occur together because electrons are conserved.

Oxidation numbers are formal bookkeeping values assigned by rules. Elements in their standard form have oxidation number zero, monatomic ions equal their charge, oxygen is usually −2, and hydrogen is usually +1 with nonmetals. The sum equals the species charge. Changes in these values identify which atoms undergo redox even in equations without explicit ionic charge transfer.

Half-reaction balancing separates oxidation and reduction. In acidic solution, balance atoms other than O and H, balance O with H2O, H with H+, charge with electrons, then scale the half-reactions so electrons cancel. In basic solution, first balance as acidic, add OH− to neutralise H+, form water, and cancel excess water. Antoine Lavoisier developed early oxidation ideas involving oxygen; the electron-transfer definition became possible after atomic charge was understood.`,
      keyTerms: ['oxidation', 'reduction', 'oxidation number', 'reducing agent', 'oxidising agent', 'half-reaction', 'acidic solution', 'basic solution'],
      equation: '\\mathrm{Oxidation:}\\; M \\rightarrow M^{n+}+ne^-; \\qquad \\mathrm{Reduction:}\\; X+ne^-\\rightarrow X^{n-}',
      callouts: [
        {
          type: 'key-insight',
          heading: 'Name agents by what they do to the other species',
          body: 'An oxidising agent causes oxidation by accepting electrons and is itself reduced. A reducing agent causes reduction and is itself oxidised.',
        },
      ],
      presetAnalogies: {
        neutral: 'Electron transfer is a balanced exchange: one participant gives exactly what another receives. The donor is oxidised and the receiver is reduced.',
        gaming: 'One player transfers charge tokens to another. The giver loses electrons and is the reducing agent; the receiver gains them and is the oxidising agent.',
        sports: 'A completed pass requires one player to release the ball and another to receive it. Electron loss and gain are inseparable halves of one play.',
        music: 'One channel sends signal while another receives the same transferred amount. The roles are named by how each changes its partner.',
      },
    },
    {
      id: 'galvanic-cells',
      heading: 'Galvanic Cells & Cell Notation',
      body: `A galvanic cell converts the free-energy decrease of a spontaneous redox reaction into electrical work. Oxidation occurs at the anode and reduction at the cathode. Electrons travel through the external circuit from anode to cathode, while ions move through an electrolyte and salt bridge to preserve bulk electrical neutrality in each half-cell.

In the Daniell cell, zinc metal is oxidised to Zn²+ at the anode and Cu²+ is reduced to copper metal at the cathode. Anions from the salt bridge migrate toward the anode compartment, where positive ions accumulate; cations migrate toward the cathode compartment, where positive ions are consumed. The salt bridge carries ions, not electrons, and completes the internal circuit without rapidly mixing the half-cell solutions.

Cell notation writes the anode on the left and cathode on the right. A single vertical line marks a phase boundary, a double line marks the salt bridge, and commas separate species in one phase. The standard cell potential is E°cell = E°cathode − E°anode when both tabulated values are reduction potentials. Alessandro Volta built an early continuous-current battery in 1800; later cell designs made the redox chemistry and ion transport clearer.`,
      keyTerms: ['galvanic cell', 'anode', 'cathode', 'external circuit', 'salt bridge', 'Daniell cell', 'cell notation', 'standard cell potential'],
      equation: 'E^\\circ_{\\mathrm{cell}} = E^\\circ_{\\mathrm{cathode}} - E^\\circ_{\\mathrm{anode}}',
      diagram: {
        url: '/diagrams/chemistry/galvanic-cell.png',
        caption: 'Galvanic cell with zinc anode, copper cathode, salt bridge, and external circuit.',
        alt: 'Two half-cells connected by a salt bridge and wire, with zinc oxidising at the anode, copper ions reducing at the cathode, and electrons flowing through the wire.',
      },
      callouts: [
        {
          type: 'key-insight',
          heading: 'The salt bridge prevents charge shutdown',
          body: 'Without ion migration, charge would rapidly accumulate in both half-cells and oppose further electron flow, stopping the cell reaction.',
        },
      ],
      presetAnalogies: {
        neutral: 'The wire carries electrons while the salt bridge balances ionic charge. Both routes must remain open for continuous circulation.',
        gaming: 'One lane transports the main resource and a second support lane restores team balance. Blocking either lane shuts down the objective.',
        sports: 'The ball moves through the attacking lane while players reposition through another channel to maintain formation. Both flows sustain the play.',
        music: 'The external cable carries the main signal while a return path preserves circuit balance. Breaking either connection silences the system.',
      },
    },
    {
      id: 'electrode-potentials',
      heading: 'Standard Electrode Potentials',
      body: `An electrode potential measures the tendency of a half-reaction to occur as reduction relative to a reference. Absolute single-electrode potentials cannot be measured; only potential differences are observable. The standard hydrogen electrode is assigned E° = 0 V under standard conditions and provides the reference for tabulated standard reduction potentials.

A more positive reduction potential indicates a stronger tendency to be reduced and therefore a stronger oxidising agent on the reactant side. Combining two half-cells gives E°cell from cathode minus anode reduction potentials. Potentials are intensive and are not multiplied when half-reactions are scaled, even though Gibbs energies and electron amounts are extensive. The connection is ΔG° = −nFE°cell.

Nonstandard concentrations and gas pressures change the potential according to the Nernst equation, E = E° − (RT/nF) ln Q. At equilibrium E = 0 and Q = K, recovering the link between E° and K. Walther Nernst formulated the concentration dependence in the late nineteenth century, enabling quantitative prediction of batteries, concentration cells, ion-selective electrodes, and biological membrane potentials.`,
      keyTerms: ['electrode potential', 'standard hydrogen electrode', 'reduction potential', 'oxidising agent', 'intensive property', 'Gibbs energy', 'Nernst equation', 'reaction quotient'],
      equation: 'E = E^\\circ - \\frac{RT}{nF}\\ln Q, \\qquad \\Delta G^\\circ=-nFE^\\circ',
      callouts: [
        {
          type: 'real-world',
          heading: 'Ion concentration changes voltage',
          body: 'pH electrodes and many biosensors measure a voltage whose Nernst dependence reveals ion activity relative to a calibrated reference.',
        },
      ],
      presetAnalogies: {
        neutral: 'Reduction potentials are relative rankings measured against one agreed reference. Pairing two rankings predicts the direction and voltage difference.',
        gaming: 'Each half-reaction has a relative capture preference on one common ladder. The matchup difference, not either rating alone, drives the cell.',
        sports: 'Team ratings become meaningful only on one shared scale. The gap between two opponents predicts the directional advantage.',
        music: 'Voltage is a level difference, so one isolated channel has no absolute level without a reference. The measured contrast between electrodes drives the signal.',
      },
    },
    {
      id: 'electrolysis',
      heading: "Electrolysis & Faraday's Laws",
      body: `An electrolytic cell uses an external power supply to drive a nonspontaneous redox reaction. Oxidation still occurs at the anode and reduction at the cathode, but the electrode signs differ from a galvanic cell: the electrolytic anode is connected to the positive supply terminal and the cathode to the negative terminal. Electrons are pulled from the anode and delivered to the cathode.

The products depend on available species, electrode material, and overpotential. In molten NaCl, Na+ reduces to sodium metal and Cl− oxidises to chlorine. In aqueous solution, water may be reduced or oxidised instead of a dissolved ion, so standard potentials and kinetic barriers must be considered. Inert electrodes mainly provide a surface, whereas active electrodes can participate chemically.

Faraday’s laws connect charge to chemical amount. Charge Q = It corresponds to Q/F moles of electrons, where F is the Faraday constant. If n electrons produce one formula unit, the product amount is Q/(nF), and deposited mass is ItM/(nF). Electrorefining, metal plating, aluminium production, chlorine manufacture, and rechargeable-battery charging all use controlled electrolysis.`,
      keyTerms: ['electrolytic cell', 'external power supply', 'overpotential', 'molten electrolyte', 'aqueous electrolysis', 'Faraday constant', 'electroplating', 'electrorefining'],
      equation: 'm = \\frac{ItM}{nF}',
      callouts: [
        {
          type: 'real-world',
          heading: 'Current measures reaction rate',
          body: 'One ampere is one coulomb per second. Measuring current over time therefore counts electron transfer and predicts the amount of electrolysis product.',
        },
      ],
      presetAnalogies: {
        neutral: 'Electrolysis uses an external pump to force charge uphill. Counting transferred electrons determines exactly how much product can form.',
        gaming: 'A powered device forces a normally unfavourable conversion. Every required set of charge tokens crafts one unit of product.',
        sports: 'External effort drives the ball against its natural direction of play. The total work rate and time determine how many complete plays occur.',
        music: 'An amplifier drives a signal against passive losses. Integrated current is the total transferred charge, analogous to total delivered signal over time.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Errors & Exam Traps',
      body: `Remember “anode oxidation, cathode reduction” for both galvanic and electrolytic cells. Electrode sign changes between cell types, but the reaction labels do not. Electrons move through the wire from anode to cathode; ions move through electrolyte. The salt bridge does not supply electrons, and its ion directions are chosen to oppose charge accumulation.

Use tables as reduction potentials. Do not multiply E° when scaling a half-reaction; instead calculate cathode minus anode after identifying the actual reduction and oxidation. A positive E°cell means spontaneous only under standard conditions. Under other conditions, use the Nernst equation or ΔG = ΔG° + RT ln Q, and define Q without pure solids or liquids.

Electrolysis calculations require electron stoichiometry. Convert current and time to coulombs, coulombs to moles of electrons, then electrons to moles of product. Use seconds, amperes, and the correct n value. In aqueous electrolysis, do not assume the dissolved ion is always discharged; compare water reactions, concentration, electrode material, and overpotential before assigning products.`,
      keyTerms: ['anode', 'cathode', 'electron flow', 'reduction potential', 'standard conditions', 'Nernst equation', 'electron stoichiometry', 'aqueous electrolysis'],
      callouts: [
        {
          type: 'key-insight',
          heading: 'Anchor labels to reactions, not signs',
          body: 'Anode always means oxidation and cathode always means reduction. Determine signs only after deciding whether the cell is galvanic or electrolytic.',
        },
      ],
      presetAnalogies: {
        neutral: 'Name each station by the process it performs, then determine its sign from the cell type. This prevents memorised plus and minus signs from being swapped.',
        gaming: 'Roles stay fixed even when team colours switch. Identify the oxidation and reduction roles before assigning positive or negative terminals.',
        sports: 'Positions are defined by duties, not jersey colour. Establish who gives and receives electrons before labelling the scoreboard side.',
        music: 'Signal-source and signal-receiver roles remain meaningful when polarity conventions change. Trace the flow first, then attach the terminal signs.',
      },
    },
  ],
}
