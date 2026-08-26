import type { KnowledgeTopic } from '../../types'

export const quantumMechanics: KnowledgeTopic = {
  id: 'quantum-mechanics',
  subjectId: 'physics',
  title: 'Quantum Mechanics',
  subtitle: 'Wave-particle duality, the photoelectric effect, and uncertainty',
  source: {
    name: 'OpenStax University Physics Volume 3',
    url: 'https://openstax.org/details/books/university-physics-volume-3',
    license: 'CC BY-NC-SA 4.0',
  },
  sections: [
    {
      id: 'overview',
      heading: 'Wave-Particle Duality',
      body: `Quantum mechanics describes matter and radiation at atomic and subatomic scales. Classical waves spread and interfere, while classical particles follow definite trajectories. Quantum objects display both kinds of behaviour: light arrives in discrete energy transfers called photons yet produces interference, and electrons form localised detections yet diffract through crystals and slits. “Wave-particle duality” names this failure of either classical category to describe every experiment.

Max Planck introduced energy quanta in 1900 to model blackbody radiation, proposing that oscillators exchange energy in units proportional to frequency. Albert Einstein applied the quantum relation E = hf to light in 1905, explaining the photoelectric effect. The constant h sets the scale at which quantum discreteness becomes important; for everyday objects, the associated wavelengths are so small that classical mechanics is an excellent approximation.

A quantum state is represented by a wavefunction whose complex amplitude evolves according to the Schrödinger equation. The Born rule interprets |ψ|² as a probability density for measurement outcomes. Superposition applies to amplitudes, so alternatives can interfere before measurement. Quantum theory does not say a particle is literally a classical wave and a classical particle simultaneously; it supplies one mathematical framework whose measurable predictions include both localisation and interference.`,
      keyTerms: ['quantum mechanics', 'wave-particle duality', 'photon', 'energy quanta', 'Planck constant', 'wavefunction', 'Born rule', 'superposition'],
      equation: 'E = hf, \\qquad |\\psi(x,t)|^2 = \\text{probability density}',
      callouts: [
        {
          type: 'key-insight',
          heading: 'Amplitudes interfere; probabilities are observed',
          body: 'Quantum alternatives combine as complex amplitudes. Squaring the magnitude produces observable probabilities, including cross terms responsible for interference.',
        },
      ],
      presetAnalogies: {
        neutral: 'A quantum state is like a map of possible outcomes with phase information attached. The map evolves smoothly, but a measurement records one definite result.',
        gaming: 'Think of a state as a probability-and-phase map over possible outcomes. Gameplay resolves one event, while repeated runs reveal the predicted distribution.',
        sports: 'A play can retain several live possibilities before the decisive pass. The final recorded outcome is definite, but statistics across repetitions reveal the underlying state.',
        music: 'Quantum amplitudes resemble audio signals that combine with both strength and phase. The measured intensity appears only after those amplitudes have interfered.',
      },
    },
    {
      id: 'photoelectric',
      heading: 'The Photoelectric Effect',
      body: `The photoelectric effect occurs when light incident on a material ejects electrons. Experiments showed a threshold frequency below which no electrons are emitted, regardless of intensity. Above threshold, emission begins without a measurable delay and the maximum electron kinetic energy increases with frequency. Greater intensity increases the number of emitted electrons, not their maximum energy, when frequency is fixed.

Einstein explained these results by treating light as photons with energy hf. One photon transfers its energy to one electron. An amount φ, the material’s work function, is required to escape the surface; the remainder becomes the electron’s maximum kinetic energy. The stopping potential Vs required to halt the most energetic electrons satisfies eVs = Kmax, providing a direct experimental measure.

The effect contradicts a purely classical wave prediction in which energy is spread continuously across the wavefront and intensity alone should eventually eject electrons. Robert Millikan’s careful measurements later confirmed Einstein’s linear frequency relation despite Millikan’s initial scepticism. Modern photodiodes, camera sensors, solar cells, and photoelectron spectroscopy all depend on quantised light-matter interactions related to this principle.`,
      keyTerms: ['photoelectric effect', 'threshold frequency', 'intensity', 'photon', 'work function', 'maximum kinetic energy', 'stopping potential', 'photoelectron spectroscopy'],
      equation: 'K_{\\max} = hf - \\phi = eV_s',
      diagram: {
        url: '/diagrams/physics/photoelectric-effect.png',
        caption: 'Photoelectric effect showing photons ejecting electrons from a metal surface above the threshold frequency.',
        alt: 'Incoming photons strike a metal surface and eject electrons only when individual photon energy exceeds the material work function.',
      },
      callouts: [
        {
          type: 'real-world',
          heading: 'Frequency controls electron energy',
          body: 'Brighter light supplies more photons and can eject more electrons, but only higher-frequency photons raise the maximum kinetic energy of each emitted electron.',
        },
      ],
      presetAnalogies: {
        neutral: 'A turnstile opens only when one token has enough value. More low-value tokens arriving separately cannot replace one token above the threshold.',
        gaming: 'Each photon is one attack with fixed damage hf. More weak attacks increase hit count but cannot penetrate armour whose threshold exceeds each hit.',
        sports: 'Each ball must individually clear a wall to leave the field. Throwing more low-energy balls does not make any one ball clear it.',
        music: 'Each photon behaves like one quantised note packet whose frequency sets its energy. Turning up volume sends more packets but does not raise each packet’s frequency.',
      },
    },
    {
      id: 'de-broglie',
      heading: 'de Broglie Wavelength',
      body: `Louis de Broglie proposed in 1924 that a particle with momentum p has wavelength λ = h/p. This extended wave-particle duality from radiation to matter. Because momentum appears in the denominator, slow electrons can have wavelengths comparable to atomic spacings, while macroscopic objects have wavelengths far too small to observe under ordinary conditions.

Davisson and Germer confirmed electron matter waves in 1927 by observing diffraction from a nickel crystal. Crystal planes act like a three-dimensional diffraction grating, producing strong scattering at angles satisfying Bragg’s law. Electron microscopes exploit the much shorter wavelength of accelerated electrons compared with visible light, enabling substantially finer resolution, although lens aberrations and sample interactions impose practical limits.

For nonrelativistic motion, p = mv and the de Broglie wavelength is h/mv. At high speeds, relativistic momentum p = γmv must be used. A confined matter wave supports only boundary-compatible wavelengths, leading naturally to discrete energy states. This is why quantisation in atoms is not an arbitrary rule: it follows from wave boundary conditions applied to the electron’s quantum state.`,
      keyTerms: ['de Broglie wavelength', 'momentum', 'matter wave', 'electron diffraction', 'Bragg’s law', 'electron microscope', 'relativistic momentum', 'boundary conditions'],
      equation: '\\lambda = \\frac{h}{p}',
      callouts: [
        {
          type: 'did-you-know',
          heading: 'Electron waves image atoms',
          body: 'Accelerated electrons can have picometre-scale wavelengths, well below visible-light wavelengths. Electron microscopes use this scale to resolve nanometre and even atomic structure.',
        },
      ],
      presetAnalogies: {
        neutral: 'A confined particle resembles a vibrating string that accepts only patterns fitting its boundaries. Allowed standing patterns correspond to discrete quantum states.',
        gaming: 'A matter wave in a bounded level can occupy only modes that fit the map exactly. Invalid wavelengths cannot satisfy the boundary rules.',
        sports: 'A stadium can sustain only crowd patterns that close consistently around its shape. The boundary selects allowed modes from all imaginable motions.',
        music: 'A string supports only standing-wave wavelengths compatible with its fixed ends. Quantum confinement similarly selects discrete matter-wave states.',
      },
    },
    {
      id: 'uncertainty',
      heading: 'Heisenberg Uncertainty Principle',
      body: `The uncertainty principle states that a quantum state cannot possess arbitrarily narrow distributions of both position and momentum along the same axis. Their standard deviations satisfy ΔxΔpx ≥ ħ/2. This is not merely poor instrument design or disturbance by an observer; it is a property of quantum states arising because position and momentum are represented by noncommuting operators.

A tightly localised wave packet requires the superposition of many wavelengths and therefore many momenta. A nearly single-wavelength state has well-defined momentum but is spread broadly through space. This Fourier relationship supplies an intuitive basis for the inequality. Similar relations hold for other pairs of incompatible observables, such as different angular-momentum components.

Uncertainty does not forbid precise measurements of either quantity individually. A state can be prepared with very small position uncertainty, but its momentum distribution must then be broad. The principle helps explain atomic stability: confining an electron extremely close to a nucleus would generate a large momentum spread and kinetic-energy cost. Werner Heisenberg formulated matrix mechanics and the uncertainty relation during the foundational development of quantum theory in the 1920s.`,
      keyTerms: ['uncertainty principle', 'position', 'momentum', 'standard deviation', 'noncommuting operators', 'wave packet', 'Fourier relationship', 'atomic stability'],
      equation: '\\Delta x\\,\\Delta p_x \\geq \\frac{\\hbar}{2}',
      callouts: [
        {
          type: 'key-insight',
          heading: 'Uncertainty is not measurement clumsiness',
          body: 'Even an ideal experiment cannot prepare a state with both spreads below the quantum bound. The limitation belongs to the state, not just the apparatus.',
        },
      ],
      presetAnalogies: {
        neutral: 'A short wave pulse needs many component wavelengths. Localising the pulse sharply therefore makes its wavelength—and momentum—content broad.',
        gaming: 'Pinning a quantum state to a tiny map region requires combining many movement modes. Its momentum possibilities consequently spread out.',
        sports: 'A very short whistle burst contains a broad range of frequencies. Narrowing its time or position profile widens the range of wave components.',
        music: 'A pure sustained note has precise frequency but extends in time. A sharp click is precisely localised yet contains a wide frequency spectrum.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Errors & Exam Traps',
      body: `Do not assign classical trajectories to quantum objects unless an approximation justifies them. A wavefunction is not a material wave carrying smeared charge in the classical sense, and |ψ|²—not ψ itself—is the probability density. Superposition concerns amplitudes, so probabilities must be calculated only after amplitudes for indistinguishable alternatives are combined.

In the photoelectric effect, intensity changes photocurrent while frequency changes photon energy. Below threshold, arbitrarily intense monochromatic light does not eject electrons in the one-photon regime. Use Kmax, not every electron’s kinetic energy, in Einstein’s equation because electrons lose different amounts of energy before escape. Keep h and ħ distinct: ħ = h/2π.

The de Broglie relation uses momentum, not kinetic energy directly; choose p = mv only when nonrelativistic. Uncertainty Δx and Δp are distribution standard deviations, not simple instrument tolerances. The inequality sets a lower bound on their product and does not mean both uncertainties are always equal. Finally, observation of a particle-like detection does not erase the wave-like evolution that predicts the distribution of many detections.`,
      keyTerms: ['classical trajectory', 'probability density', 'amplitude', 'photocurrent', 'work function', 'Planck constant', 'reduced Planck constant', 'standard deviation'],
      callouts: [
        {
          type: 'key-insight',
          heading: 'Match the evidence to the model',
          body: 'Localised detections demonstrate particle-like transfer; interference demonstrates amplitude superposition. Quantum mechanics predicts both without switching between two classical objects.',
        },
      ],
      presetAnalogies: {
        neutral: 'Quantum formulas describe distributions and individual recorded events at different levels. Mixing those levels produces apparent contradictions.',
        gaming: 'A probability map predicts many runs, while one playthrough records one outcome. One result does not display the full distribution.',
        sports: 'A shot chart predicts long-run patterns, while one shot lands at one point. Do not mistake the single event for the statistical model.',
        music: 'A spectrum describes the components of a signal, while one detector click is a local event. Each representation answers a different measurement question.',
      },
    },
  ],
}
