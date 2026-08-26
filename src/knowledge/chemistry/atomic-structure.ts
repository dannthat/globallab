import type { KnowledgeTopic } from '../../types'

export const atomicStructure: KnowledgeTopic = {
  id: 'atomic-structure',
  subjectId: 'chemistry',
  title: 'Atomic Structure & Electron Configuration',
  subtitle: 'Quantum numbers, orbitals, and periodic trends',
  source: {
    name: 'OpenStax Chemistry 2e',
    url: 'https://openstax.org/details/books/chemistry-2e',
    license: 'CC BY 4.0',
  },
  sections: [
    {
      id: 'overview',
      heading: 'The Quantum Atom',
      body: `An atom consists of a compact nucleus containing protons and neutrons surrounded by electrons. Ernest Rutherford’s scattering experiments established the small, positively charged nucleus, while Niels Bohr introduced quantised electron energies for hydrogen. The Bohr model predicts hydrogen’s spectral lines but cannot accurately describe multi-electron atoms, bonding, or fine spectral structure.

Modern atomic theory represents each electron with a wavefunction obtained from the Schrödinger equation. An atomic orbital is a one-electron wavefunction, and its squared magnitude gives a probability density—not a fixed path. Orbitals have discrete energies and characteristic spatial distributions determined by the nuclear attraction, electron kinetic energy, and, in multi-electron atoms, electron-electron repulsion.

Hydrogen-like atoms have energies determined primarily by the principal quantum number n. In multi-electron atoms, shielding and penetration split subshell energies: an electron that penetrates closer to the nucleus experiences a larger effective nuclear charge. Spectroscopy tests these energy differences because an atom absorbs or emits a photon when it transitions between allowed states, with photon energy equal to the state-energy difference.`,
      keyTerms: ['nucleus', 'Bohr model', 'wavefunction', 'atomic orbital', 'probability density', 'shielding', 'penetration', 'spectroscopy'],
      equation: '\\hat H\\psi = E\\psi, \\qquad \\Delta E = h\\nu',
      diagram: {
        url: '/diagrams/chemistry/electron-orbitals.png',
        caption: 'Shapes of s, p, d, and f atomic orbitals.',
        alt: 'Probability-surface representations of spherical s orbitals and directional p, d, and f atomic orbitals with differently phased lobes.',
      },
      callouts: [
        {
          type: 'key-insight',
          heading: 'Orbitals are not little orbits',
          body: 'An orbital is a quantum state and probability distribution. It does not describe an electron travelling along a planetary path around the nucleus.',
        },
      ],
      presetAnalogies: {
        neutral: 'An orbital resembles a probability cloud showing where detection is more or less likely. It is a map of a state, not a drawn flight path.',
        gaming: 'An orbital is a spawn-probability map around the nucleus. It predicts repeated detection locations without assigning one hidden route.',
        sports: 'A player’s heat map shows occupancy probability across many plays. It does not claim the player follows the boundary of the coloured region.',
        music: 'An orbital resembles a standing resonance mode with specific shape and energy. It is not a particle circling like a needle around a record.',
      },
    },
    {
      id: 'quantum-numbers',
      heading: 'Quantum Numbers & Orbital Shapes',
      body: `Four quantum numbers label an electron state in an atom. The principal number n = 1, 2, 3, … controls the shell and typical radial extent. The angular-momentum number ℓ ranges from 0 to n − 1 and labels subshells s, p, d, and f for ℓ = 0, 1, 2, and 3. The magnetic number mℓ ranges from −ℓ to +ℓ and distinguishes orbital orientations.

The spin quantum number ms is +1/2 or −1/2. The Pauli exclusion principle states that no two electrons in one atom can share all four quantum numbers, so each spatial orbital holds at most two electrons with opposite spins. A subshell contains 2ℓ + 1 orbitals and can hold 2(2ℓ + 1) electrons, giving capacities of 2, 6, 10, and 14 for s, p, d, and f.

Orbital shapes are probability-density patterns separated by nodes where ψ is zero. s orbitals are spherically symmetric; p orbitals have two lobes separated by an angular nodal plane; d orbitals usually have four-lobed distributions. The coloured signs often drawn on lobes represent wavefunction phase, not positive and negative electrical charge. Phase matters when orbitals overlap to form bonding and antibonding combinations.`,
      keyTerms: ['principal quantum number', 'angular-momentum quantum number', 'magnetic quantum number', 'spin quantum number', 'Pauli exclusion principle', 'subshell', 'node', 'wavefunction phase'],
      equation: 'n=1,2,\\ldots; \\quad \\ell=0,\\ldots,n-1; \\quad m_\\ell=-\\ell,\\ldots,+\\ell; \\quad m_s=\\pm\\tfrac12',
      callouts: [
        {
          type: 'key-insight',
          heading: 'Subshell capacity comes from counting states',
          body: 'There are 2ℓ + 1 spatial orbitals in a subshell and two allowed spin states per orbital, giving 2(2ℓ + 1) electrons.',
        },
      ],
      presetAnalogies: {
        neutral: 'Quantum numbers act like a complete address: shell, subshell, orientation, and spin. Pauli’s rule prevents two electrons from sharing the entire address.',
        gaming: 'They form a four-part character slot identifier. Two electrons may share the same spatial slot only when their spin flags differ.',
        sports: 'Think of section, row, seat, and one of two seat orientations. No two spectators receive the identical full ticket.',
        music: 'The labels resemble register, mode family, mode orientation, and one of two spin settings. Together they identify a unique electron state.',
      },
    },
    {
      id: 'electron-config',
      heading: 'Electron Configuration & the Aufbau Principle',
      body: `An electron configuration lists occupied subshells and their electron counts. The Aufbau procedure fills available orbitals from lower to higher energy, subject to Pauli exclusion. Hund’s rule states that degenerate orbitals in one subshell are occupied singly with parallel spins before pairing, which lowers electron-electron repulsion and reflects exchange stabilisation.

The common filling order follows increasing n + ℓ, with lower n filled first when n + ℓ is equal. This gives 1s, 2s, 2p, 3s, 3p, 4s, then 3d for neutral atoms. The rule is a useful pattern rather than a fundamental law, and measured configurations include exceptions such as chromium [Ar]3d⁵4s¹ and copper [Ar]3d¹⁰4s¹ because subshell energies are close.

When transition metals form cations, electrons are removed from the highest principal shell first, so 4s electrons are removed before 3d electrons even though 4s filled first in the neutral atom. Noble-gas notation abbreviates inner electrons and makes valence structure visible. Configuration determines unpaired-electron count, magnetic behaviour, common oxidation states, and much of an element’s chemical reactivity.`,
      keyTerms: ['electron configuration', 'Aufbau principle', 'Pauli exclusion', 'Hund’s rule', 'degenerate orbitals', 'exchange stabilisation', 'noble-gas notation', 'valence structure'],
      equation: '\\text{orbital order: increasing }(n+\\ell), \\text{ then increasing }n',
      callouts: [
        {
          type: 'did-you-know',
          heading: 'Filling order is not removal order',
          body: 'Neutral transition atoms generally fill 4s before 3d, but their cations lose 4s electrons first because orbital energies reorganise after d occupation.',
        },
      ],
      presetAnalogies: {
        neutral: 'Electrons occupy the lowest available seating while obeying capacity and pairing rules. Near-equal sections can reorder once the venue fills.',
        gaming: 'Build slots unlock roughly by energy cost, but occupancy changes later priorities. Transition-metal ionisation removes from the currently highest-cost slot, not simply the last label written.',
        sports: 'Players fill the most favourable positions first and spread across equivalent positions before doubling up. A roster change can alter which occupied position is least stable.',
        music: 'Voices fill available modes from lower energy upward and occupy degenerate parts separately before pairing. Closely spaced modes can switch order as the full arrangement develops.',
      },
    },
    {
      id: 'periodic-trends',
      heading: 'Periodic Trends',
      body: `Periodic trends arise from nuclear charge, shielding, and electron-shell structure. Across a period, proton number increases while valence electrons enter the same principal shell, so effective nuclear charge generally rises. Atomic radius therefore tends to decrease from left to right. Down a group, added shells and shielding dominate, so atomic radius increases despite greater nuclear charge.

First ionisation energy is the energy required to remove an electron from a gaseous neutral atom. It generally increases across a period and decreases down a group, but subshell and pairing effects create informative exceptions. For example, boron’s first 2p electron is easier to remove than beryllium’s filled 2s electron, and paired p electrons help make oxygen’s first ionisation energy lower than nitrogen’s.

Electron affinity describes the energy change when a gaseous atom gains an electron, while electronegativity describes attraction for shared electrons in a bond. These are related but not identical quantities. Cations are smaller than their parent atoms because electron removal reduces repulsion and may remove a shell; anions are larger because added electrons increase repulsion. In an isoelectronic series, radius decreases as proton number increases.`,
      keyTerms: ['effective nuclear charge', 'shielding', 'atomic radius', 'ionisation energy', 'electron affinity', 'electronegativity', 'cation', 'isoelectronic series'],
      equation: 'Z_{\\mathrm{eff}} \\approx Z - S',
      callouts: [
        {
          type: 'key-insight',
          heading: 'Trends are competing effects',
          body: 'Across a period, rising effective nuclear charge usually dominates. Down a group, extra shells and shielding usually dominate. Exceptions reveal subshell structure.',
        },
      ],
      presetAnalogies: {
        neutral: 'The nucleus pulls while inner electrons screen that pull. Periodic trends reflect which influence changes more strongly across the table.',
        gaming: 'Nuclear charge is base attraction and shielding is armour between the core and outer electrons. Effective attraction is what the valence electron actually experiences.',
        sports: 'The nucleus is a coach calling players inward while inner rows obstruct the signal. More central pull matters only after accounting for that screening.',
        music: 'The nuclear signal grows with proton number, while inner shells attenuate it. Valence behaviour follows the effective signal that reaches the outer layer.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Errors & Exam Traps',
      body: `Do not draw electrons as classical planets or interpret orbital lobes as solid containers. An orbital is a wavefunction, |ψ|² is probability density, and differently coloured lobes usually mark phase. Quantum-number ranges must follow n, and mℓ values include every integer from −ℓ through +ℓ. No orbital holds more than two opposite-spin electrons.

Apply Aufbau, Pauli, and Hund separately. Pairing electrons in p or d orbitals before each degenerate orbital has one electron violates Hund’s rule. When forming transition-metal ions, remove electrons from the highest n shell first. Do not infer a configuration solely from a memorised diagonal chart when known exceptions or ionisation are involved.

State trends as general patterns with physical reasons, not absolute slogans. Radius does not simply follow atomic mass, and electronegativity is not electron affinity. Compare isoelectronic ions by nuclear charge, distinguish cation size from neutral-atom size, and explain ionisation-energy anomalies using subshell energy or electron pairing. A complete answer connects the observation to effective nuclear charge, shielding, penetration, and repulsion.`,
      keyTerms: ['probability density', 'orbital phase', 'quantum-number range', 'Hund’s rule', 'transition-metal ions', 'atomic radius', 'electronegativity', 'electron affinity'],
      callouts: [
        {
          type: 'key-insight',
          heading: 'Explain, do not only recite',
          body: 'High-quality trend answers name the competing causes—nuclear charge, shielding, shell number, penetration, and electron pairing—then identify the dominant one.',
        },
      ],
      presetAnalogies: {
        neutral: 'Periodic rules are a model with competing causes, not a list of arrows. Use the underlying forces to explain both the pattern and its exceptions.',
        gaming: 'A stat trend comes from several modifiers rather than one level number. Inspect base charge, shielding, shell distance, and pairing before predicting the outcome.',
        sports: 'Team performance does not follow roster size alone. Position, spacing, screening, and matchups explain why a broad trend can have exceptions.',
        music: 'A spectrum’s behaviour depends on several interacting controls. A trend arrow is useful, but the signal chain explains why individual cases depart from it.',
      },
    },
  ],
}
