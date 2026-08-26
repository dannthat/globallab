import type { KnowledgeTopic } from '../../types'

export const chemicalKinetics: KnowledgeTopic = {
  id: 'chemical-kinetics',
  subjectId: 'chemistry',
  title: 'Chemical Kinetics',
  subtitle: 'Rate laws, activation energy, and reaction mechanisms',
  source: {
    name: 'OpenStax Chemistry 2e',
    url: 'https://openstax.org/details/books/chemistry-2e',
    license: 'CC BY 4.0',
  },
  sections: [
    {
      id: 'overview',
      heading: 'Reaction Rates',
      body: `Reaction rate measures composition change per unit time. For aA → bB, the stoichiometrically normalised rate is −(1/a)d[A]/dt = (1/b)d[B]/dt, making one reaction rate independent of which species is monitored. Reactant concentration decreases and product concentration increases, so the negative sign keeps a disappearance-based reaction rate positive.

Collision theory requires reacting particles to collide with sufficient energy and suitable orientation. Raising concentration or gas pressure increases collision frequency, while higher temperature both increases collision frequency and greatly enlarges the fraction of collisions above the activation barrier. Greater surface area exposes more solid reactant, improving contact in heterogeneous reactions.

An average rate uses a finite time interval; an instantaneous rate is the tangent slope of a concentration-time curve. Experimental rates may be followed through absorbance, pressure, conductivity, mass, or sampled concentration. Kinetics concerns pathway and timescale, not thermodynamic favourability: a reaction with negative ΔG may remain imperceptibly slow when its activation energy is large.`,
      keyTerms: ['reaction rate', 'stoichiometric coefficient', 'collision theory', 'activation barrier', 'surface area', 'average rate', 'instantaneous rate', 'kinetics'],
      equation: '\\mathrm{rate} = -\\frac{1}{a}\\frac{d[A]}{dt} = \\frac{1}{b}\\frac{d[B]}{dt}',
      callouts: [
        {
          type: 'real-world',
          heading: 'Powders can react explosively',
          body: 'Finely divided flour or metal exposes enormous surface area to oxygen. A reaction that is slow in bulk can become dangerously rapid as a suspended dust.',
        },
      ],
      presetAnalogies: {
        neutral: 'Reaction rate is traffic through a checkpoint per second. More encounters help, but only correctly aligned travellers with enough energy pass.',
        gaming: 'Particles must meet, aim correctly, and exceed an energy threshold to trigger the reaction. More encounters alone do not guarantee successful hits.',
        sports: 'A scoring chance requires players to meet at the right place, orientation, and energy. Concentration raises encounters while temperature raises their intensity.',
        music: 'A successful trigger needs both timing and sufficient signal level. More events increase opportunities, but only qualifying events produce output.',
      },
    },
    {
      id: 'rate-laws',
      heading: 'Rate Laws & Reaction Order',
      body: `A differential rate law relates rate to reactant concentrations: rate = k[A]^m[B]^n. The exponents are reaction orders determined experimentally and generally cannot be inferred from the overall balanced equation unless the reaction is a single elementary step. Overall order is m + n, and the units of k depend on that total order.

Initial-rate experiments compare trials in which one concentration changes while others remain fixed. If doubling [A] doubles rate, the reaction is first order in A; if rate quadruples, it is second order; if unchanged, zero order. Integrated rate laws connect concentration to time. Zero-, first-, and second-order single-reactant forms are [A]t = [A]0 − kt, ln[A]t = ln[A]0 − kt, and 1/[A]t = 1/[A]0 + kt.

Half-life behaviour provides another diagnostic. A first-order half-life is ln 2/k and does not depend on starting concentration, which explains exponential radioactive decay and many unimolecular processes. Zero-order half-life grows with initial concentration, while second-order half-life is inversely proportional to it. Linearised plots can identify order, although modern analysis often fits concentration data directly to avoid distorting measurement errors.`,
      keyTerms: ['rate law', 'reaction order', 'rate constant', 'initial-rate method', 'integrated rate law', 'half-life', 'first-order reaction', 'linearised plot'],
      equation: '\\mathrm{rate}=k[A]^m[B]^n, \\qquad \\ln[A]_t=\\ln[A]_0-kt \\text{ (first order)}',
      callouts: [
        {
          type: 'key-insight',
          heading: 'Overall coefficients do not usually give order',
          body: 'A balanced equation records net stoichiometry, not the molecular pathway. Rate-law exponents must come from data unless the step is known to be elementary.',
        },
      ],
      presetAnalogies: {
        neutral: 'A rate law is an experimentally measured sensitivity map. Each exponent says how strongly changing one concentration changes the observed rate.',
        gaming: 'Each resource has a scaling exponent in the ability formula. Doubling a first-order resource doubles output, while a second-order resource quadruples it.',
        sports: 'The scoring rate may depend linearly on one player group and quadratically on coordinated pairings. Experiments reveal the actual sensitivity.',
        music: 'A dynamics processor can respond with different powers to input levels. The rate-law exponents describe that measured response curve.',
      },
    },
    {
      id: 'activation-energy',
      heading: 'Activation Energy & the Arrhenius Equation',
      body: `Activation energy Ea is the minimum energy barrier associated with reaching a transition-state region along a reaction pathway. Reactants may be thermodynamically capable of forming products yet require bond distortion and electron rearrangement before productive transformation occurs. A reaction-coordinate diagram separates this kinetic barrier from the overall energy or free-energy difference between reactants and products.

The Arrhenius equation k = Ae^(−Ea/RT) relates the rate constant to temperature. A is the pre-exponential factor containing collision frequency and orientation effects. Plotting ln k against 1/T gives a line with slope −Ea/R when Arrhenius behaviour holds. Because temperature appears in an exponential, modest heating can increase a rate constant substantially.

Svante Arrhenius proposed the temperature relation in 1889. A catalyst increases rate by providing an alternative mechanism with lower activation free energy; it does not alter the energies of reactants and products, ΔG°, or the equilibrium constant. Catalysts accelerate both forward and reverse processes and are regenerated over the catalytic cycle, although they may be deactivated by side reactions or poisoning.`,
      keyTerms: ['activation energy', 'transition state', 'reaction coordinate', 'Arrhenius equation', 'pre-exponential factor', 'rate constant', 'catalyst', 'catalytic cycle'],
      equation: 'k = Ae^{-E_a/(RT)}, \\qquad \\ln k = \\ln A - \\frac{E_a}{R}\\frac{1}{T}',
      diagram: {
        url: '/diagrams/chemistry/activation-energy.png',
        caption: 'Arrhenius activation energy diagram with and without catalyst.',
        alt: 'Reaction-coordinate curves compare a high uncatalysed activation barrier with a lower catalysed pathway while keeping reactant and product energies unchanged.',
      },
      callouts: [
        {
          type: 'real-world',
          heading: 'Refrigeration slows reaction kinetics',
          body: 'Lower temperature reduces the fraction of molecular encounters that cross activation barriers, slowing food spoilage reactions and microbial metabolism.',
        },
      ],
      presetAnalogies: {
        neutral: 'Reactants and products are valleys separated by a pass. A catalyst provides a lower pass without changing either valley’s elevation.',
        gaming: 'The product is behind a high-level gate. A catalyst unlocks a cheaper route but does not change the reward or starting inventory.',
        sports: 'A team can reach the same goal through a lower-resistance play. The new route speeds scoring without changing the scoreboard value of the goal.',
        music: 'A catalyst is a lower-resistance signal route between the same input and output states. It changes transition speed, not the final level difference.',
      },
    },
    {
      id: 'mechanisms',
      heading: 'Reaction Mechanisms & Catalysis',
      body: `A reaction mechanism is a sequence of elementary steps whose sum gives the overall reaction. The molecularity of an elementary step counts the reacting particles in that step, and its rate law follows directly from that step’s reactants. An intermediate is formed in one step and consumed in another, so it cancels from the overall equation; a catalyst is consumed early and regenerated later.

The slowest kinetically influential step is often called rate-determining, but deriving an observed rate law can require pre-equilibrium or steady-state analysis rather than simply selecting the visually slowest step. A proposed mechanism must reproduce the net stoichiometry and experimental rate law. Observing an intermediate or isotope effect can provide additional evidence, but mechanisms remain models constrained by multiple measurements.

Homogeneous catalysts share a phase with reactants, heterogeneous catalysts act across a phase boundary, and enzymes provide highly selective biological catalysis. Catalysts stabilise transition states or reorganise the pathway through acid-base chemistry, redox cycling, surface adsorption, or molecular orientation. Industrial catalysts make processes such as ammonia synthesis and exhaust-gas treatment practical by increasing rate and selectivity under achievable conditions.`,
      keyTerms: ['reaction mechanism', 'elementary step', 'molecularity', 'intermediate', 'catalyst', 'rate-determining step', 'steady-state approximation', 'heterogeneous catalyst'],
      equation: '\\sum \\text{elementary steps} = \\text{overall reaction}',
      callouts: [
        {
          type: 'did-you-know',
          heading: 'Catalysis can improve selectivity',
          body: 'A useful catalyst may suppress unwanted pathways as well as accelerate the desired one, reducing waste and separation costs in industrial chemistry.',
        },
      ],
      presetAnalogies: {
        neutral: 'A mechanism is the actual sequence of moves between start and finish. The overall equation records only the net change and hides intermediates.',
        gaming: 'The quest summary lists inputs and rewards, while the mechanism is the chain of encounters and temporary items. A valid route must match both outcome and timing data.',
        sports: 'The final score hides the sequence of passes that created it. A mechanism explains each elementary play and any temporary formation.',
        music: 'A rendered track hides its signal chain. The mechanism lists every processing stage and temporary bus that produces the final output.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Errors & Exam Traps',
      body: `Normalise rates by stoichiometric coefficients and keep disappearance signs negative before forming a positive reaction rate. Do not infer reaction order from the overall equation. Determine order from initial-rate ratios, integrated plots, or a validated elementary mechanism. The units of k change with overall order, so a value without units is incomplete.

Distinguish activation energy from reaction enthalpy or Gibbs energy. A catalyst lowers the barrier but changes neither ΔG° nor equilibrium composition. On an Arrhenius plot of ln k versus 1/T, the slope is negative and equals −Ea/R. Use kelvin, not Celsius, in exponential and logarithmic temperature relations.

A mechanism is acceptable only if its steps sum to the overall reaction and its derived rate law matches experiment. Cancel intermediates but not a catalyst that fails to be regenerated. Molecularity applies only to an elementary step and is always a positive integer; reaction order can be zero, fractional, or negative in complex systems. Treat “rate-determining step” as a kinetic model supported by derivation, not a shortcut label.`,
      keyTerms: ['normalised rate', 'reaction order', 'rate-constant units', 'activation energy', 'equilibrium composition', 'Arrhenius plot', 'reaction intermediate', 'molecularity'],
      callouts: [
        {
          type: 'key-insight',
          heading: 'Use data to police the mechanism',
          body: 'A chemically plausible sequence is not enough. Its algebraic sum and predicted rate law must both agree with observation.',
        },
      ],
      presetAnalogies: {
        neutral: 'The net equation is a destination, while kinetic data are checkpoints. A proposed route is valid only if it reaches the destination through every observed checkpoint.',
        gaming: 'A speedrun route must produce the right final state and match the observed split times. Plausible lore alone does not validate it.',
        sports: 'A tactical explanation must match both the final score and the recorded play sequence. Either mismatch rejects the proposed mechanism.',
        music: 'A guessed signal chain must reproduce both the final sound and measured response. A plausible diagram without matching data is insufficient.',
      },
    },
  ],
}
