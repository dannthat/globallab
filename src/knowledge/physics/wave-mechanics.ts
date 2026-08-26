import type { KnowledgeTopic } from '../../types'

export const waveMechanics: KnowledgeTopic = {
  id: 'wave-mechanics',
  subjectId: 'physics',
  title: 'Wave Mechanics & Interference',
  subtitle: 'Superposition, diffraction, and the double-slit experiment',
  source: {
    name: 'OpenStax University Physics Volume 1',
    url: 'https://openstax.org/details/books/university-physics-volume-1',
    license: 'CC BY-NC-SA 4.0',
  },
  sections: [
    {
      id: 'overview',
      heading: 'The Nature of Waves',
      body: `A wave is a disturbance that transfers energy and momentum without requiring a net transport of matter. Mechanical waves, such as sound and waves on a string, require a material medium whose particles oscillate around equilibrium. Electromagnetic waves are oscillations of electric and magnetic fields and can cross a vacuum. A pulse is a single disturbance, whereas a periodic wave repeats in time and space.

A sinusoidal travelling wave may be described by amplitude, wavelength, frequency, period, phase, and speed. Amplitude measures the maximum displacement from equilibrium, wavelength is the distance between equal-phase points, and frequency counts cycles per second. The period is the time per cycle, so f = 1/T. Wave speed is set mainly by the medium, not by the source frequency; changing frequency in one medium therefore changes wavelength.

For a transverse wave, oscillations are perpendicular to the direction of propagation; for a longitudinal wave, they are parallel. Energy transport grows strongly with amplitude, while particle displacement remains local. Christiaan Huygens formalised a wavefront construction in 1678, treating every point on a wavefront as a source of secondary wavelets. That model later helped explain reflection, refraction, interference, and diffraction.`,
      keyTerms: ['wave', 'amplitude', 'wavelength', 'frequency', 'period', 'phase', 'transverse wave', 'longitudinal wave'],
      equation: 'v = f\\lambda',
      diagram: {
        url: '/diagrams/physics/wave-interference.png',
        caption: 'Two-point source interference pattern showing constructive and destructive interference fringes.',
        alt: 'Wavefronts from two coherent point sources overlap, forming alternating bands where crests reinforce and where crest and trough cancel.',
      },
      callouts: [
        {
          type: 'key-insight',
          heading: 'The medium sets the speed',
          body: 'When a wave crosses a boundary, its frequency stays fixed by the source. Its speed and wavelength change together, which is why refraction occurs.',
        },
      ],
      presetAnalogies: {
        neutral: 'A travelling wave resembles a stadium ripple passed from person to person. The pattern crosses the crowd even though each person only moves locally.',
        gaming: 'A wave is like a timed animation propagated across a grid. Each tile moves in place while the visible effect travels through the level.',
        sports: 'A crowd wave moves around an arena without spectators running around it. Each spectator supplies a local motion that transfers the pattern onward.',
        music: 'A loudspeaker cone oscillates locally while a pressure pattern travels through air. Frequency sets pitch, while amplitude is closely related to loudness.',
      },
    },
    {
      id: 'superposition',
      heading: 'Superposition & Interference',
      body: `The superposition principle states that when waves overlap in a linear medium, the resultant displacement equals the algebraic sum of the individual displacements. The waves do not permanently alter one another; after overlap, each continues with its original form in an ideal medium. Superposition applies to water waves, sound, light, and quantum probability amplitudes, provided the governing system remains linear.

Constructive interference occurs where waves arrive in phase, so crest meets crest and their amplitudes add. Destructive interference occurs where waves arrive half a cycle out of phase, so crest meets trough and amplitudes subtract. For coherent sources with a constant phase difference, a path difference mλ produces constructive interference, while a path difference (m + 1/2)λ produces destructive interference.

Two equal-frequency waves travelling in opposite directions form a standing wave. Nodes remain at zero displacement and antinodes oscillate with maximum amplitude. A string fixed at both ends supports only wavelengths that fit an integer number of half-wavelengths into its length, producing discrete harmonics. Musical instruments exploit these normal modes, while engineers avoid resonant standing waves that can amplify vibration in structures.`,
      keyTerms: ['superposition principle', 'constructive interference', 'destructive interference', 'coherent sources', 'path difference', 'standing wave', 'nodes', 'antinodes'],
      equation: 'y_{\\text{resultant}}(x,t) = \\sum_i y_i(x,t)',
      callouts: [
        {
          type: 'real-world',
          heading: 'Noise cancellation is destructive interference',
          body: 'Active headphones measure ambient sound and generate a pressure wave with nearly opposite phase. The two waves superpose, reducing the pressure variation at the ear.',
        },
      ],
      presetAnalogies: {
        neutral: 'Superposition is like adding deposits and withdrawals in one account. Contributions with the same sign reinforce, while opposite contributions cancel.',
        gaming: 'Overlapping status effects add according to their signed strengths. Matching buffs reinforce, while an equal buff and debuff can produce no net change.',
        sports: 'Two teammates pushing in the same direction combine their force. If they push equally in opposite directions, the shared object does not move.',
        music: 'Two aligned audio signals sound stronger when their peaks coincide. Reversing one signal makes its peaks meet the other signal’s troughs and reduces the output.',
      },
    },
    {
      id: 'diffraction',
      heading: 'Diffraction & Huygens Principle',
      body: `Diffraction is the spreading and bending of a wave as it passes an edge or aperture. The effect is most pronounced when the opening or obstacle has a size comparable to the wavelength. Huygens’ principle explains the spreading by treating every exposed point on a wavefront as a source of secondary wavelets whose envelope forms the next wavefront.

For a single slit of width a illuminated by monochromatic light, waves from different positions across the slit interfere. Dark minima occur when a sin θ = mλ for nonzero integer m. A narrower slit produces a wider central maximum because a larger angle is needed to establish the required path difference. Increasing wavelength has the same broadening effect.

Diffraction sets a fundamental resolution limit for imaging. Light from two nearby objects forms overlapping diffraction patterns rather than perfect points, so even flawless lenses cannot resolve arbitrarily small details. The Rayleigh criterion gives an angular resolution of approximately 1.22λ/D for a circular aperture of diameter D. Larger telescope mirrors and shorter wavelengths therefore reveal finer structure.`,
      keyTerms: ['diffraction', 'aperture', 'Huygens’ principle', 'wavefront', 'single slit', 'diffraction minimum', 'central maximum', 'Rayleigh criterion'],
      equation: 'a\\sin\\theta = m\\lambda \\quad (m = \\pm1, \\pm2, \\ldots)',
      callouts: [
        {
          type: 'did-you-know',
          heading: 'Why radio bends around buildings',
          body: 'Radio wavelengths can be metres long, comparable with urban structures, so they diffract noticeably. Visible wavelengths are hundreds of nanometres and cast much sharper shadows.',
        },
      ],
      presetAnalogies: {
        neutral: 'People leaving a narrow doorway fan out into the room instead of continuing as a sharp column. Waves spread similarly when an opening is comparable to their wavelength.',
        gaming: 'A wave passing a narrow map gate behaves like an area effect that expands beyond the opening. Making the gate smaller relative to the effect increases the spread.',
        sports: 'Players released through a narrow tunnel spread across the field once they emerge. A narrower exit creates a broader fan of possible directions.',
        music: 'Low-frequency sound wraps around a doorway and remains audible off-axis. Its long wavelength makes the doorway an efficient diffracting aperture.',
      },
    },
    {
      id: 'double-slit',
      heading: 'The Double-Slit Experiment',
      body: `Thomas Young’s double-slit experiment provided decisive evidence for the wave behaviour of light. A monochromatic source illuminates two narrow, closely spaced slits that act as coherent secondary sources. Their waves overlap on a screen, producing alternating bright and dark fringes instead of two simple illuminated bands. Bright fringes occur where the path difference is an integer multiple of wavelength.

For slit separation d and screen distance L much larger than d, the angle to a bright fringe satisfies d sin θ = mλ. At small angles, sin θ is approximately y/L, so adjacent bright fringes are separated by Δy ≈ λL/d. Larger wavelength or screen distance increases fringe spacing, while greater slit separation compresses the pattern.

When electrons, neutrons, atoms, or photons are sent through the apparatus one at a time, individual detections appear as localised impacts but gradually build an interference distribution. Obtaining reliable which-path information removes the interference because the alternatives become distinguishable. The experiment therefore reveals a central quantum principle: probabilities are derived from superposed amplitudes, and measurement context determines which interference terms can survive.`,
      keyTerms: ['double-slit experiment', 'coherent sources', 'bright fringe', 'dark fringe', 'slit separation', 'fringe spacing', 'which-path information', 'quantum amplitude'],
      equation: 'd\\sin\\theta = m\\lambda, \\qquad \\Delta y \\approx \\frac{\\lambda L}{d}',
      callouts: [
        {
          type: 'key-insight',
          heading: 'Single particles still build fringes',
          body: 'The pattern is not produced by particles colliding with one another. It emerges statistically from many independent detection events governed by a wave-like probability amplitude.',
        },
      ],
      presetAnalogies: {
        neutral: 'Two sets of evenly spaced ripples overlap to create stable bands of reinforcement and cancellation. The band positions reveal the difference in travel distance from the two sources.',
        gaming: 'Two synchronized emitters paint an arena with alternating high- and low-intensity zones. The final pattern depends on how far each signal travelled to each location.',
        sports: 'Two synchronized cheering sections send sound toward the court. Some seats receive both pressure peaks together, while others receive a peak and trough.',
        music: 'Two phase-locked speakers playing one tone create loud and quiet positions in a room. Walking across the room lets you sample the interference fringes acoustically.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Errors & Exam Traps',
      body: `Do not confuse particle motion with wave propagation. Particles of a mechanical medium oscillate around equilibrium; they do not normally travel with the wave. Frequency is fixed by the source and remains unchanged at a boundary, while speed and wavelength may change. Amplitude is not wavelength, and increasing amplitude does not automatically increase wave speed in a linear medium.

Interference conditions require careful distinction between phase difference and path difference. Constructive interference occurs at Δr = mλ, while complete destructive interference for equal amplitudes occurs at Δr = (m + 1/2)λ. In single-slit diffraction, a sin θ = mλ identifies dark minima; in a double slit, d sin θ = mλ identifies bright maxima. Using the wrong width or separation reverses the result.

Small-angle formulas are approximations, not identities. The relation y ≈ L sin θ is accurate only when θ is small and the screen is distant relative to the slit separation. Keep units consistent, convert nanometres before substitution, and include the central fringe as m = 0. Finally, an interference pattern requires coherence; unrelated sources with rapidly varying phase differences average to uniform intensity.`,
      keyTerms: ['wave propagation', 'boundary', 'phase difference', 'path difference', 'diffraction minima', 'interference maxima', 'small-angle approximation', 'coherence'],
      callouts: [
        {
          type: 'key-insight',
          heading: 'Read what m labels',
          body: 'The same integer symbol can label bright fringes in one formula and dark minima in another. State the physical feature before substituting values.',
        },
      ],
      presetAnalogies: {
        neutral: 'Treat every formula like a labelled tool rather than a loose equation. First identify whether it locates a maximum, minimum, or boundary change.',
        gaming: 'Similar-looking formulas are different abilities with different targets. Check the tooltip—slit width, slit separation, maximum, or minimum—before activating one.',
        sports: 'A coach’s “number one” can mean a player, formation, or drill. The surrounding label matters just as much as the number m.',
        music: 'A marker can indicate a beat, bar, or frequency band depending on the score. Read the notation’s role before performing the calculation.',
      },
    },
  ],
}
