import type { KnowledgeTopic } from '../../types'

export const chemicalBonding: KnowledgeTopic = {
  id: 'chemical-bonding',
  subjectId: 'chemistry',
  title: 'Chemical Bonding & Molecular Geometry',
  subtitle: 'VSEPR theory, hybridisation, and polarity',
  source: {
    name: 'OpenStax Chemistry 2e',
    url: 'https://openstax.org/details/books/chemistry-2e',
    license: 'CC BY 4.0',
  },
  sections: [
    {
      id: 'overview',
      heading: 'Types of Chemical Bonds',
      body: `Chemical bonds arise from electrostatic interactions that lower the energy of a collection of nuclei and electrons relative to separated atoms. Ionic bonding is the attraction between oppositely charged ions in an extended lattice, commonly formed after substantial electron transfer. Covalent bonding involves shared electron density between nuclei, while metallic bonding involves delocalised valence electrons distributed across many atomic centres.

Bonding is a continuum rather than three perfectly separated categories. Electronegativity difference helps estimate bond polarity, but local structure and the elements involved also matter. A polar covalent bond has unequal electron sharing and partial charges; an ionic solid is not a collection of isolated molecule pairs but a repeating crystal whose stability reflects attractions and repulsions across the entire lattice.

Lewis structures track valence electrons, bonding pairs, lone pairs, and formal charge. They are useful bookkeeping models but do not directly show three-dimensional shape, orbital energies, or electron delocalisation. Resonance structures are alternative drawings of one delocalised electronic state, not molecules rapidly switching between forms. Bond order generally correlates with greater bond strength and shorter bond length.`,
      keyTerms: ['ionic bonding', 'covalent bonding', 'metallic bonding', 'electronegativity', 'bond polarity', 'Lewis structure', 'formal charge', 'resonance'],
      equation: '\\mathrm{FC} = V - N - \\tfrac12B',
      callouts: [
        {
          type: 'key-insight',
          heading: 'Bond types form a continuum',
          body: 'Real bonds can combine ionic and covalent character. Electronegativity difference guides interpretation but does not create a universal hard boundary.',
        },
      ],
      presetAnalogies: {
        neutral: 'Bonding resembles different ways of managing shared resources. Electrons may be localised, strongly shifted, or distributed across a large community.',
        gaming: 'Valence electrons can be transferred, shared between two players, or pooled across a guild. Each arrangement creates a different stability pattern.',
        sports: 'A ball may be controlled by one side, shared in a passing pair, or circulated across the whole team. Electron distribution similarly distinguishes broad bonding models.',
        music: 'An electron can belong mostly to one track, be shared by a duet, or delocalise across an ensemble. The distribution shapes the material’s behaviour.',
      },
    },
    {
      id: 'vsepr',
      heading: 'VSEPR Theory & Molecular Geometry',
      body: `Valence-shell electron-pair repulsion theory predicts molecular shape by arranging electron domains around a central atom to minimise repulsion. Each single, double, or triple bond counts as one bonding domain, and each lone pair counts as one domain. Two, three, four, five, and six domains adopt linear, trigonal-planar, tetrahedral, trigonal-bipyramidal, and octahedral electron-domain geometries.

Molecular geometry names atomic positions and omits lone pairs from the shape name. Four domains give tetrahedral electron geometry, but CH4 is tetrahedral, NH3 is trigonal pyramidal, and H2O is bent because they contain zero, one, and two central lone pairs. Lone pairs occupy more angular space than bonding pairs, so they compress adjacent bond angles below ideal values.

In trigonal-bipyramidal geometry, lone pairs prefer equatorial positions because these have fewer 90-degree interactions. Multiple bonds also repel somewhat more strongly than single bonds because their electron density is larger. VSEPR is highly effective for many main-group molecules but less reliable for transition-metal complexes or cases where ligand interactions and detailed orbital energetics dominate.`,
      keyTerms: ['VSEPR theory', 'electron domain', 'molecular geometry', 'lone pair', 'tetrahedral', 'trigonal bipyramidal', 'octahedral', 'bond angle'],
      diagram: {
        url: '/diagrams/chemistry/vsepr-geometry.png',
        caption: 'VSEPR geometries: linear, trigonal planar, tetrahedral, trigonal bipyramidal, octahedral.',
        alt: 'Reference chart showing ideal three-dimensional arrangements and bond angles for two through six electron domains around a central atom.',
      },
      callouts: [
        {
          type: 'key-insight',
          heading: 'Count domains before naming shape',
          body: 'Electron geometry includes bonds and lone pairs; molecular geometry describes atom positions only. Confusing these two labels is a common source of wrong shapes.',
        },
      ],
      presetAnalogies: {
        neutral: 'Electron domains spread around a central point like balloons tied together. Lone-pair balloons occupy extra space and squeeze the visible bond angles.',
        gaming: 'Units around a capture point maximise separation to avoid overlap. Invisible high-radius units represent lone pairs and still push visible units aside.',
        sports: 'Players marking one central opponent spread into the least crowded arrangement. A larger invisible exclusion zone compresses the angles between the remaining players.',
        music: 'Channels sharing limited headroom distribute themselves to reduce interference. A lone pair consumes more room and shifts the placement of the audible parts.',
      },
    },
    {
      id: 'hybridisation',
      heading: 'Orbital Hybridisation',
      body: `Valence-bond theory describes a covalent bond as overlap between half-filled atomic orbitals containing opposite-spin electrons. Hybridisation is a mathematical recombination of orbitals on one atom to produce directional hybrids suited to observed bonding. Mixing one s and one p orbital produces two sp hybrids; adding two or three p orbitals produces three sp² or four sp³ hybrids.

Hybridisation correlates with electron-domain geometry: sp is linear, sp² is trigonal planar, and sp³ is tetrahedral. In ethene, each carbon uses sp² hybrids for three sigma bonds and retains one unhybridised p orbital; sideways p overlap forms the pi bond. In ethyne, sp hybridisation leaves two unhybridised p orbitals on each carbon, producing two mutually perpendicular pi bonds around the carbon-carbon sigma bond.

Sigma bonds have electron density concentrated along the internuclear axis and generally permit rotation, while pi bonds have density above and below that axis and restrict rotation. Hybridisation is a model, not a directly observed rearrangement performed by an isolated atom before bonding. Molecular-orbital theory often provides a more complete description of delocalisation, magnetism, and excited states, but hybridisation remains a powerful local geometry model.`,
      keyTerms: ['valence-bond theory', 'hybridisation', 'sp hybrid', 'sp² hybrid', 'sp³ hybrid', 'sigma bond', 'pi bond', 'molecular-orbital theory'],
      equation: 's+p \\rightarrow 2sp; \\quad s+2p \\rightarrow 3sp^2; \\quad s+3p \\rightarrow 4sp^3',
      callouts: [
        {
          type: 'real-world',
          heading: 'Pi bonds restrict rotation',
          body: 'Rotating one end of a double bond would destroy side-by-side p-orbital overlap. This rigidity underlies cis–trans isomerism and many molecular shape effects.',
        },
      ],
      presetAnalogies: {
        neutral: 'Hybridisation is like recombining coordinate directions into equivalent, geometry-matched directions. The new basis makes observed bond angles easier to describe.',
        gaming: 'Base ability slots can be remixed into equivalent directional loadouts. The chosen hybrid set matches the geometry required by the encounter.',
        sports: 'A formation reorganises general player roles into equally directed positions. The new arrangement describes the team’s bonding geometry efficiently.',
        music: 'Several source channels can be remixed into new equivalent buses aimed in different directions. The remix is a useful representation of the final arrangement.',
      },
    },
    {
      id: 'polarity',
      heading: 'Molecular Polarity & Dipole Moments',
      body: `A bond dipole results when bonded atoms attract shared electron density unequally. Its magnitude is μ = qr, where q is the separated partial charge and r is the separation vector. Chemistry convention draws a dipole arrow toward the more electronegative atom, often with a crossed tail at the positive end. Bond polarity depends on electronegativity difference and bonding environment.

Molecular polarity is the vector sum of all bond dipoles and lone-pair contributions. A molecule can contain polar bonds yet have zero net dipole if symmetry cancels them, as in linear CO2 or tetrahedral CCl4. Bent H2O and trigonal-pyramidal NH3 retain nonzero dipoles because their bond vectors do not cancel. Geometry must therefore be determined before polarity is predicted.

Polarity influences intermolecular forces, solubility, boiling point, and response to electric fields. Polar molecules can exhibit dipole-dipole attractions; molecules containing suitable O–H, N–H, or F–H groups can form especially strong hydrogen bonds. Nonpolar substances still experience London dispersion forces from instantaneous electron fluctuations, whose strength grows with polarisability and contact surface area.`,
      keyTerms: ['bond dipole', 'partial charge', 'electronegativity', 'molecular polarity', 'vector sum', 'dipole-dipole attraction', 'hydrogen bond', 'London dispersion force'],
      equation: '\\vec\\mu_{\\mathrm{molecule}} = \\sum_i \\vec\\mu_i',
      callouts: [
        {
          type: 'real-world',
          heading: 'Shape controls solubility',
          body: 'Two molecules with similar bonds can have different net polarity because of geometry, changing how strongly they interact with water and biological environments.',
        },
      ],
      presetAnalogies: {
        neutral: 'Bond dipoles are arrows that must be added as vectors. A symmetric set cancels, while an asymmetric arrangement leaves a net molecular direction.',
        gaming: 'Several directional forces act on one character. Balanced forces cancel to zero; an asymmetric loadout produces a net pull.',
        sports: 'Players pull a central ring along different directions. A symmetric formation balances, while an uneven shape moves the ring.',
        music: 'Phase-aligned directional contributions can reinforce or cancel in a mix. Molecular geometry determines the resulting net dipole.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Errors & Exam Traps',
      body: `Do not decide bond type from a rigid electronegativity cutoff or call every metal–nonmetal bond completely ionic. Use formal charge for Lewis-structure bookkeeping, but remember that formal charge is not the same as measured partial charge. Resonance forms are not separate equilibrating molecules; the actual electron density is delocalised across the contributing structures.

For VSEPR, count electron domains around the central atom, treating any multiple bond as one domain. State electron-domain geometry before molecular geometry, then include lone-pair compression of ideal angles. Do not place trigonal-bipyramidal lone pairs axially when an equatorial location is available, and do not force VSEPR predictions onto transition-metal complexes without qualification.

A polar bond does not guarantee a polar molecule. Draw the three-dimensional geometry and add dipoles as vectors. Hybridisation follows local domain geometry and does not count pi bonds as extra hybrid orbitals. In double and triple bonds, one bond is sigma and the remainder are pi. Always distinguish intramolecular bonds from intermolecular forces; boiling usually separates molecules without breaking their internal covalent bonds.`,
      keyTerms: ['formal charge', 'partial charge', 'resonance forms', 'electron-domain geometry', 'molecular geometry', 'bond dipole', 'hybridisation', 'intermolecular forces'],
      callouts: [
        {
          type: 'key-insight',
          heading: 'Structure before properties',
          body: 'A reliable sequence is Lewis structure, formal charges, resonance, electron domains, three-dimensional shape, bond dipoles, then molecular polarity.',
        },
      ],
      presetAnalogies: {
        neutral: 'Bonding questions form a dependency chain. Skipping the three-dimensional structure makes later polarity and force conclusions unreliable.',
        gaming: 'Resolve the build tree in order: electron count, legal structure, geometry, then final stats. A wrong early node corrupts every downstream result.',
        sports: 'Choose the roster and formation before predicting team movement. Individual player directions alone do not determine the net strategy.',
        music: 'Route and place every channel before judging the stereo image. Individual signal directions can cancel once the complete mix is assembled.',
      },
    },
  ],
}
