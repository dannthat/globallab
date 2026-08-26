import type { KnowledgeTopic } from '../../types'

export const electromagneticInduction: KnowledgeTopic = {
  id: 'electromagnetic-induction',
  subjectId: 'physics',
  title: 'Electromagnetic Induction',
  subtitle: "Faraday's law, Lenz's law, and transformers",
  source: {
    name: 'OpenStax University Physics Volume 2',
    url: 'https://openstax.org/details/books/university-physics-volume-2',
    license: 'CC BY-NC-SA 4.0',
  },
  sections: [
    {
      id: 'overview',
      heading: 'Magnetic Flux',
      body: `Magnetic flux quantifies the magnetic field passing through an oriented surface. For a uniform field crossing a flat area, ΦB = BA cos θ, where θ is the angle between the magnetic field and the surface normal. Flux is greatest when the field is perpendicular to the surface, zero when it lies in the plane, and signed according to the chosen normal direction.

For a nonuniform field or curved surface, the area is divided into infinitesimal vector elements and the dot product is integrated. Magnetic flux has the SI unit weber, equal to tesla metre squared. Unlike electric field lines, magnetic field lines form closed loops; Gauss’s law for magnetism states that the net magnetic flux through any closed surface is zero because isolated magnetic monopoles have not been observed.

Flux can change because field magnitude changes, the loop area changes, or the orientation changes. A rotating coil in a steady magnetic field therefore experiences a periodic flux even though B is constant. This geometric idea is central to generators, transformers, induction cooktops, wireless chargers, and many sensors: the induced electrical response depends on the rate of flux change, not simply the amount of flux present.`,
      keyTerms: ['magnetic flux', 'surface normal', 'weber', 'tesla', 'closed loops', 'magnetic monopoles', 'rotating coil', 'flux change'],
      equation: '\\Phi_B = \\int_S \\vec B \\cdot d\\vec A',
      callouts: [
        {
          type: 'key-insight',
          heading: 'Constant flux produces no induced emf',
          body: 'A strong steady field through a stationary loop does not induce a sustained emf. Induction requires the magnetic flux linkage to change with time.',
        },
      ],
      presetAnalogies: {
        neutral: 'Flux is like counting rain passing through a tilted hoop. The count changes with rain intensity, hoop area, and its angle.',
        gaming: 'Imagine a detector counting field lines crossing a portal. Rotating or resizing the portal changes its linked total even in a steady field.',
        sports: 'A goal intercepts the most straight-ahead ball trajectories when it faces the play. Turning it edge-on sharply reduces the number crossing its opening.',
        music: 'Flux resembles signal captured by a directional microphone. Strength depends on source level, collection area, and orientation to the incoming pattern.',
      },
    },
    {
      id: 'faraday',
      heading: "Faraday's Law of Induction",
      body: `Faraday’s law states that the induced electromotive force around a closed conducting path equals the negative time rate of change of magnetic flux through it. For a coil with N identical turns, the flux linkage is NΦB and the induced emf scales with N. Michael Faraday discovered electromagnetic induction experimentally in 1831, connecting changing magnetism to an electric effect without requiring direct contact.

An emf can arise from a changing magnetic field or from motion of a conductor through a field. In motional emf, magnetic forces separate charge along a moving rod; for a rod of length ℓ moving perpendicular to a uniform B, the magnitude is Bℓv. In the general case, Faraday’s law describes both transformer emf and motional contributions through the changing flux linkage.

Induced emf drives current only when the path is closed, and the current magnitude also depends on circuit resistance and inductive effects. Increasing the rate of change, field strength, loop area, or number of turns can increase the induced emf. Electric generators exploit continuous rotation to convert mechanical work into alternating electrical energy, while microphones and guitar pickups use small motions to induce signals that encode sound.`,
      keyTerms: ['Faraday’s law', 'electromotive force', 'flux linkage', 'coil', 'motional emf', 'induced current', 'electric generator', 'alternating current'],
      equation: '\\mathcal{E} = -N\\frac{d\\Phi_B}{dt}',
      diagram: {
        url: '/diagrams/physics/faraday-induction.png',
        caption: "Faraday's experiment: moving a magnet through a coil induces a current.",
        alt: 'A bar magnet moves relative to a conducting coil connected to a galvanometer, causing the meter to deflect as magnetic flux changes.',
      },
      callouts: [
        {
          type: 'real-world',
          heading: 'Generators convert rather than create energy',
          body: 'The mechanical work needed to rotate a generator coil becomes electrical energy. A larger load produces greater opposing torque, preserving energy conservation.',
        },
      ],
      presetAnalogies: {
        neutral: 'Induction reacts to how quickly a linked magnetic pattern changes. A rapid change produces a larger electrical response than the same change spread over more time.',
        gaming: 'A motion sensor rewards change per second, not a permanently occupied zone. Faster crossings trigger a stronger response.',
        sports: 'A goalkeeper reacts to the rate at which the shooting angle changes. A rapidly developing play demands a stronger response than a static formation.',
        music: 'A pickup responds to changing magnetic flux from a vibrating string. A motionless string leaves the linked field steady and produces no sustained note.',
      },
    },
    {
      id: 'lenz',
      heading: "Lenz's Law & Back-EMF",
      body: `Lenz’s law determines the direction of induced emf: the induced current creates a magnetic field that opposes the change in flux that produced it. The word change is essential. If inward flux is increasing, the induced field points outward; if inward flux is decreasing, the induced field points inward to resist the decrease. Heinrich Lenz stated this rule in 1834.

The negative sign in Faraday’s law encodes Lenz’s law and enforces conservation of energy. If an induced current reinforced the initiating change, a tiny motion could generate ever-growing current and mechanical acceleration without energy input. Instead, pushing a magnet into a conducting coil requires work against the coil’s induced magnetic response, and that work becomes electrical energy and eventually thermal energy.

Back-emf appears whenever a changing current produces an induced emf opposing that current’s change. In a motor, rotation of the armature generates a back-emf that reduces the net current during normal operation. At startup, back-emf is initially small, so the current can be large. Inductors similarly oppose rapid current changes, storing energy in their magnetic field rather than blocking steady direct current indefinitely.`,
      keyTerms: ['Lenz’s law', 'induced field', 'conservation of energy', 'back-emf', 'motor', 'armature', 'inductor', 'magnetic energy'],
      equation: '\\mathcal{E}_L = -L\\frac{dI}{dt}',
      callouts: [
        {
          type: 'did-you-know',
          heading: 'Eddy-current braking needs no contact',
          body: 'A moving conductor in a magnetic field develops circulating currents whose fields oppose the motion. Trains and exercise machines use this effect for smooth, wear-resistant braking.',
        },
      ],
      presetAnalogies: {
        neutral: 'Lenz’s law resembles inertia in a control system. The induced response always resists the particular change that triggered it.',
        gaming: 'It behaves like automatic counterplay against a changing objective state. The faster the state shifts, the stronger the opposing response becomes.',
        sports: 'A defender moves to cancel the attacker’s developing advantage. The response opposes the change in play, not necessarily the attacker’s current position.',
        music: 'Back-emf resembles feedback that pushes against a rapid level change. It moderates the transition rather than simply erasing the existing signal.',
      },
    },
    {
      id: 'transformers',
      heading: 'Transformers & Energy Transfer',
      body: `A transformer transfers alternating electrical energy between circuits through mutual induction. Alternating current in the primary coil produces changing magnetic flux in a shared ferromagnetic core. That flux links the secondary coil and induces an emf. Direct current creates only a brief transient during switching and cannot sustain transformer action because steady current produces steady flux.

For an ideal transformer, the voltage ratio equals the turns ratio: Vs/Vp = Ns/Np. Conservation of power gives VpIp = VsIs, so a step-up transformer increases voltage while decreasing current, and a step-down transformer does the reverse. Real transformers lose energy through winding resistance, eddy currents, hysteresis, and incomplete flux linkage, although laminated cores and suitable magnetic materials reduce these losses.

High-voltage transmission reduces resistive energy loss in power lines. For a fixed delivered power P = VI, raising V lowers I; because line heating is I²R, the loss falls with the square of current. Transformers step generator voltage up for transmission and down again near users. Nikola Tesla, George Westinghouse, and others developed practical alternating-current systems that made efficient long-distance distribution possible.`,
      keyTerms: ['transformer', 'mutual induction', 'primary coil', 'secondary coil', 'turns ratio', 'step-up transformer', 'eddy currents', 'transmission loss'],
      equation: '\\frac{V_s}{V_p} = \\frac{N_s}{N_p}, \\qquad V_pI_p \\approx V_sI_s',
      callouts: [
        {
          type: 'key-insight',
          heading: 'Higher grid voltage means lower heating',
          body: 'For the same transmitted power, multiplying voltage by ten divides current by ten and reduces I²R line loss to one hundredth.',
        },
      ],
      presetAnalogies: {
        neutral: 'A transformer exchanges voltage for current while approximately preserving power. It resembles changing gear ratio without creating extra mechanical power.',
        gaming: 'It reallocates a fixed power budget between high impact and high throughput. Raising one side of the trade reduces the other.',
        sports: 'A bicycle gear changes force and speed while the rider supplies the power. Transformer turns similarly trade current for voltage.',
        music: 'An audio transformer matches signal levels between circuits. Its winding ratio changes voltage and current while transferring the underlying power.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Errors & Exam Traps',
      body: `Use the angle between B and the area normal in ΦB = BA cos θ, not the angle between B and the plane. A field perpendicular to the plane gives maximum flux; a field parallel to the plane gives zero. Flux can change through B, A, or θ. A large constant flux does not induce emf, while a small but rapidly changing flux can.

Lenz’s law opposes the change in flux, not always the original field. Determine whether the signed flux is increasing or decreasing before selecting the induced field direction, then use the right-hand grip rule to infer current. The negative sign in Faraday’s law gives direction; do not attach an extra negative after already applying Lenz’s law verbally.

Transformer equations assume alternating operation and, for power equality, ideal efficiency. A step-up transformer raises voltage but lowers current; it does not amplify power. Use rms voltages consistently for sinusoidal AC and keep primary and secondary labels attached to the correct turn counts. In induction problems, distinguish emf from current: current additionally requires a closed circuit and depends on impedance.`,
      keyTerms: ['area normal', 'constant flux', 'Lenz’s law', 'right-hand grip rule', 'alternating operation', 'ideal efficiency', 'rms voltage', 'impedance'],
      callouts: [
        {
          type: 'key-insight',
          heading: 'Separate magnitude from direction',
          body: 'Calculate |dΦB/dt| for emf magnitude first. Then apply Lenz’s law and the right-hand rule as a separate direction step.',
        },
      ],
      presetAnalogies: {
        neutral: 'Treat induction as a two-question process: how fast is linkage changing, and which response resists that change? Keeping them separate prevents sign errors.',
        gaming: 'First calculate the strength of the triggered effect, then determine its counter-direction. Mixing damage magnitude with targeting logic causes mistakes.',
        sports: 'Measure how quickly the play develops before assigning the defender’s direction. Speed of change and direction of response are related but distinct.',
        music: 'Set the gain from the rate of signal change, then choose polarity to oppose it. Magnitude and phase are separate controls.',
      },
    },
  ],
}
