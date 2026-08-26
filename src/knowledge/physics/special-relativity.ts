import type { KnowledgeTopic } from '../../types'

export const specialRelativity: KnowledgeTopic = {
  id: 'special-relativity',
  subjectId: 'physics',
  title: 'Special Relativity',
  subtitle: 'Time dilation, length contraction, and mass-energy equivalence',
  source: {
    name: 'OpenStax University Physics Volume 3',
    url: 'https://openstax.org/details/books/university-physics-volume-3',
    license: 'CC BY-NC-SA 4.0',
  },
  sections: [
    {
      id: 'overview',
      heading: 'The Postulates of Special Relativity',
      body: `Special relativity describes measurements made in inertial reference frames, which move at constant velocity relative to one another. Einstein’s first postulate states that the laws of physics have the same form in every inertial frame. No internal experiment performed in a uniformly moving laboratory can identify an absolute state of rest.

The second postulate states that light in vacuum has the same speed c for every inertial observer, independent of the motion of the source or observer. This conflicts with Galilean velocity addition but agrees with Maxwell’s electrodynamics and experiments. Space and time must therefore transform together through Lorentz transformations so that every inertial observer obtains the same light speed.

Events that are simultaneous in one frame need not be simultaneous in another. Relativity of simultaneity is the foundation from which time dilation and length contraction follow; they are not optical illusions or mechanical distortions. Hermann Minkowski later expressed the theory geometrically as spacetime, in which different observers divide the same invariant interval into different spatial and temporal components.`,
      keyTerms: ['special relativity', 'inertial reference frame', 'Einstein’s postulates', 'speed of light', 'Lorentz transformation', 'simultaneity', 'spacetime', 'invariant interval'],
      equation: '\\gamma = \\frac{1}{\\sqrt{1-v^2/c^2}}',
      diagram: {
        url: '/diagrams/physics/spacetime-diagram.png',
        caption: 'Minkowski spacetime diagram showing light cone and relativistic worldlines.',
        alt: 'A spacetime graph with position on the horizontal axis and time on the vertical axis, including diagonal photon worldlines that define a light cone.',
      },
      callouts: [
        {
          type: 'key-insight',
          heading: 'The interval is shared',
          body: 'Observers disagree about spatial distance and elapsed time but calculate the same spacetime interval between two events, preserving causal structure.',
        },
      ],
      presetAnalogies: {
        neutral: 'Different coordinate grids can slice the same spacetime into space and time differently. The invariant interval is the shared geometric quantity beneath those descriptions.',
        gaming: 'Observers use different camera coordinate systems for the same event map. Their space and time readings differ, but invariant game events and causality remain consistent.',
        sports: 'Two moving analysts can disagree about whether separated plays were simultaneous. Their measurements transform consistently because neither viewpoint is an absolute rest frame.',
        music: 'Two time-stretched coordinate tracks can assign different time and distance components to the same events. A preserved interval keeps the underlying structure consistent.',
      },
    },
    {
      id: 'time-dilation',
      heading: 'Time Dilation',
      body: `Proper time Δτ is the interval measured by a single clock present at both events. An observer who sees that clock move measures a longer coordinate-time interval Δt = γΔτ. Because γ is at least one, moving clocks accumulate less proper time between the same pair of reunion events. The effect is reciprocal only while the observers remain in equivalent inertial situations.

A light clock illustrates the geometry. In the clock’s rest frame, a light pulse travels vertically between mirrors. To an observer who sees the clock move sideways, the pulse follows a longer diagonal path. Since both observers measure the same light speed, the moving-clock cycle must take longer. The Lorentz factor becomes appreciable only when v is a significant fraction of c.

Time dilation has direct experimental evidence. Fast atmospheric muons reach Earth’s surface in far greater numbers than a nonrelativistic lifetime estimate predicts, because Earth observers measure their decays as slowed; in the muon frame, the atmosphere is length-contracted. Atomic clocks flown on aircraft and clocks aboard navigation satellites accumulate relativistic offsets that must be included alongside gravitational corrections for accurate positioning.`,
      keyTerms: ['proper time', 'coordinate time', 'time dilation', 'Lorentz factor', 'light clock', 'muon', 'atomic clock', 'navigation satellite'],
      equation: '\\Delta t = \\gamma\\Delta\\tau',
      callouts: [
        {
          type: 'real-world',
          heading: 'Satellite clocks require relativity',
          body: 'Global navigation systems correct both special-relativistic motion and general-relativistic gravity effects. Uncorrected clock drift would quickly produce large position errors.',
        },
      ],
      presetAnalogies: {
        neutral: 'A moving light clock traces a longer path between ticks while light speed stays fixed. The longer path therefore requires a longer coordinate time.',
        gaming: 'A moving in-world timer follows a different spacetime path from a stationary observer’s timer. When they reunite, their accumulated times can differ.',
        sports: 'A runner crossing diagonally on a moving platform covers a longer ground-frame path than in the platform frame. A fixed signal speed turns that geometry into different elapsed times.',
        music: 'Two clocks are not merely playing the same track at different apparent speeds. Their elapsed proper times depend on the spacetime paths they actually follow.',
      },
    },
    {
      id: 'length-contraction',
      heading: 'Length Contraction',
      body: `Proper length L0 is measured in the rest frame of an object by recording its endpoints. An observer who sees the object moving parallel to its length measures L = L0/γ. Contraction occurs only along the direction of relative motion; transverse dimensions are unchanged. It is a difference between valid frame-dependent measurements, not damage to the object.

Measuring a moving length requires recording both endpoint positions simultaneously in the observer’s frame. Because simultaneity is frame-dependent, another frame does not regard those endpoint measurements as simultaneous. Length contraction is therefore inseparable from relativity of simultaneity. Photographs also include light-travel-time effects and do not directly display the simple contracted shape calculated from simultaneous coordinates.

The phenomenon resolves apparent conflicts involving muons and high-energy particle beams. In Earth’s frame, muon lifetimes are dilated; in each muon’s frame, the atmosphere’s thickness is contracted, so the surface is reached within the muon’s ordinary proper lifetime. Both frames predict the same reunion and decay events because Lorentz transformations preserve their causal relationships.`,
      keyTerms: ['proper length', 'length contraction', 'longitudinal direction', 'simultaneity', 'endpoint measurement', 'frame-dependent', 'muon frame', 'Lorentz transformation'],
      equation: 'L = \\frac{L_0}{\\gamma}',
      callouts: [
        {
          type: 'key-insight',
          heading: 'Length needs simultaneous endpoints',
          body: 'The observer must record where both ends are at the same time in that observer’s frame. Changing simultaneity changes the measured moving length.',
        },
      ],
      presetAnalogies: {
        neutral: 'Measuring a moving train means marking both ends at one shared instant. Another frame disagrees about which endpoint events occurred simultaneously.',
        gaming: 'A moving object’s length is sampled from two positions on one frame update. A differently moving client slices the event timeline differently.',
        sports: 'To measure a moving formation, both boundary players must be located at the same observer-time. Another moving observer uses a different simultaneous snapshot.',
        music: 'Sampling both ends of a moving waveform requires one synchronized time slice. Changing the reference timing changes which pair of events forms the measured length.',
      },
    },
    {
      id: 'mass-energy',
      heading: 'Mass-Energy Equivalence',
      body: `A particle of invariant mass m has rest energy E0 = mc². The relation means mass is one form of energy, not that an object’s invariant mass simply increases with speed. Modern treatments keep m invariant and describe a moving particle with total energy E = γmc² and momentum p = γmv. Kinetic energy is the difference K = (γ − 1)mc².

Energy and momentum satisfy E² = (pc)² + (mc²)². For a massless particle, this reduces to E = pc; photons have zero invariant mass but carry energy and momentum. In an isolated system, total relativistic energy and momentum are conserved. The invariant mass of a composite system can include internal kinetic and binding energies, so it need not equal the sum of isolated component masses.

Nuclear reactions reveal mass-energy equivalence because the final rest masses differ from the initial rest masses. A decrease in system mass appears as kinetic energy or radiation; an increase requires supplied energy. Lise Meitner and Otto Frisch used this relation to explain the enormous energy released in nuclear fission. Chemical reactions also change mass, but their energy scales make the mass difference extremely small.`,
      keyTerms: ['invariant mass', 'rest energy', 'total energy', 'relativistic momentum', 'kinetic energy', 'massless particle', 'binding energy', 'nuclear fission'],
      equation: 'E^2 = (pc)^2 + (mc^2)^2, \\qquad E_0 = mc^2',
      callouts: [
        {
          type: 'did-you-know',
          heading: 'A charged battery is slightly heavier',
          body: 'Stored chemical energy contributes to a system’s mass. The difference is real but far too small for an ordinary balance to detect.',
        },
      ],
      presetAnalogies: {
        neutral: 'Mass contributes to a system’s stored energy budget even at rest. Motion and internal binding alter total energy without redefining invariant mass.',
        gaming: 'Invariant mass is part of a character’s base energy ledger. Motion adds kinetic energy, while system interactions can change the combined ledger.',
        sports: 'A stationary team still has stored capacity in its organised system. Motion adds energy, but the team\'s invariant description is not simply heavier because it moves faster.',
        music: 'Rest energy is like a signal system’s baseline stored energy. Additional motion changes total energy without changing the invariant parameter used to identify the particle.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Errors & Exam Traps',
      body: `Always identify the two events and the frame before choosing a formula. Proper time is measured by one clock present at both events; proper length is measured in the object’s rest frame. A moving clock is time-dilated, while a moving length is contracted along motion. Applying γ in the wrong direction is usually a failure to identify the proper quantity.

Relativistic effects are not caused by signal delay, although observations must account for light travel time. Simultaneity itself is frame-dependent after such delays are corrected. No inertial frame is the absolutely stationary one. Apparent reciprocity in time dilation does not create a contradiction when observers reunite, because reunion generally requires acceleration or unequal spacetime paths.

Use invariant mass rather than “relativistic mass.” Massive objects cannot reach c because γ and required energy diverge as v approaches c. Photons always travel at c in vacuum and have zero proper time along a lightlike path, but there is no valid photon rest frame. Retain sufficient precision when v is close to c, and never substitute ordinary velocity-addition rules into a relativistic problem.`,
      keyTerms: ['proper time', 'proper length', 'time dilation', 'length contraction', 'signal delay', 'relativity of simultaneity', 'invariant mass', 'lightlike path'],
      callouts: [
        {
          type: 'key-insight',
          heading: 'Find the proper quantity first',
          body: 'Ask which frame uses one clock for both events or sees the object at rest. Once that frame is identified, the placement of γ follows directly.',
        },
      ],
      presetAnalogies: {
        neutral: 'Relativity problems are coordinate bookkeeping around invariant events. Label the observer, clock, and rest frame before manipulating any equation.',
        gaming: 'Different clients report coordinates in different reference frames. Identify the authoritative local quantity before transforming it to another frame.',
        sports: 'A statistic only makes sense after naming whose clock and which moving object it describes. Proper labels prevent comparing measurements from incompatible viewpoints.',
        music: 'Before converting tempo or timing, identify which track carries the native clock. Transformation is reliable only after that reference is fixed.',
      },
    },
  ],
}
