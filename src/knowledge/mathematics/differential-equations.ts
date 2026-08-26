import type { KnowledgeTopic } from '../../types'

export const differentialEquations: KnowledgeTopic = {
  id: 'differential-equations',
  subjectId: 'mathematics',
  title: 'Differential Equations',
  subtitle: 'First-order ODEs, separable equations, and modelling',
  source: {
    name: 'OpenStax Calculus Volume 2',
    url: 'https://openstax.org/details/books/calculus-volume-2',
    license: 'CC BY-NC-SA 4.0',
  },
  sections: [
    {
      id: 'overview',
      heading: 'What is a Differential Equation?',
      body: `A differential equation relates an unknown function to one or more of its derivatives. An ordinary differential equation uses derivatives with respect to one independent variable, while a partial differential equation uses several. The order is the highest derivative present. A solution is a function that satisfies the equation on an interval, not merely a numerical value.

A general solution usually contains arbitrary constants representing a family of functions. Initial or boundary conditions select particular members and form an initial-value or boundary-value problem. Existence and uniqueness are separate questions: an equation may have no solution, one local solution, or multiple solutions through the same point if its conditions are not sufficiently regular.

Differential equations express local laws of change and predict global behaviour. Newton’s motion laws, radioactive decay, population growth, circuit dynamics, heat flow, and epidemics all take differential form. Leonhard Euler developed systematic methods for many differential equations, while later mathematicians established rigorous existence theory and numerical methods for equations without closed-form solutions.`,
      keyTerms: ['differential equation', 'ordinary differential equation', 'partial differential equation', 'order', 'general solution', 'initial condition', 'existence', 'uniqueness'],
      equation: "F(x,y,y',y'',\\ldots,y^{(n)})=0",
      callouts: [
        {
          type: 'key-insight',
          heading: 'A solution is a function',
          body: 'Always substitute the proposed function and its derivatives back into the equation. Matching one point does not establish a solution on an interval.',
        },
      ],
      presetAnalogies: {
        neutral: 'A differential equation gives a local direction rule at every state. A solution is an entire path that follows that rule everywhere.',
        gaming: 'The equation is the movement engine, not one coordinate. A valid trajectory obeys the engine’s velocity rule on every frame.',
        sports: 'A tactical rule specifies how position should change in each situation. A solution is the full play that follows the rule throughout.',
        music: 'The equation is a rule linking signal level to its rate of change. A solution is the complete waveform satisfying that rule at every instant.',
      },
    },
    {
      id: 'separable',
      heading: 'Separable Equations',
      body: `A first-order equation is separable when it can be written dy/dx = g(x)h(y). Where division by h(y) is valid, rearrange to dy/h(y) = g(x)dx and integrate both sides. The result may define y implicitly; solving explicitly is optional unless required. One integration constant is sufficient because constants from both sides can be combined.

Dividing by h(y) can discard equilibrium solutions satisfying h(y) = 0. These constant solutions must be identified before division and included separately. Initial conditions determine the integration constant and can also restrict the interval of validity, especially when logarithms, square roots, or finite-time blow-up appear.

Autonomous separable equations y′ = h(y) can be analysed without explicit solution. Equilibria occur where h(y) = 0, and a phase line shows whether nearby solutions increase or decrease. Arrows toward an equilibrium indicate stability; arrows away indicate instability. This qualitative analysis often reveals long-term behaviour more clearly than a complicated formula.`,
      keyTerms: ['separable equation', 'implicit solution', 'integration constant', 'equilibrium solution', 'interval of validity', 'autonomous equation', 'phase line', 'stability'],
      equation: '\\frac{dy}{dx}=g(x)h(y) \\Longrightarrow \\int\\frac{dy}{h(y)}=\\int g(x)\\,dx+C',
      callouts: [
        {
          type: 'key-insight',
          heading: 'Check what division removes',
          body: 'Before dividing by a function of y, solve where that function is zero. Those values may define constant solutions absent from the divided equation.',
        },
      ],
      presetAnalogies: {
        neutral: 'Separation sorts all y-dependent pieces to one side and x-dependent pieces to the other. It is controlled bookkeeping before integration.',
        gaming: 'Group state modifiers in one inventory and time modifiers in another, then process each list. Do not discard a zero-state that was valid before division.',
        sports: 'Separate player-condition effects from clock effects before analysing the play. A stationary formation may be lost if you divide by its zero movement.',
        music: 'Route level-dependent processing and time-dependent control into separate paths. A silent equilibrium still needs checking before dividing by signal level.',
      },
    },
    {
      id: 'linear-first-order',
      heading: 'Linear First-Order ODEs',
      body: `A first-order linear equation has standard form y′ + P(x)y = Q(x). Multiplying by the integrating factor μ(x) = e^{∫P(x)dx} turns the left side into the product derivative (μy)′. Integrating gives μy = ∫μQ dx + C and therefore y = μ⁻¹[∫μQ dx + C].

The method works because μ′ = Pμ, which creates the missing product-rule term. The equation must first be divided by the coefficient of y′, and the resulting P and Q must be continuous on the interval considered. An initial value then produces one local solution on any interval meeting the regularity conditions.

The solution separates naturally into a homogeneous transient Ch(x) and one particular forced response. In constant-coefficient equations y′ + ay = b, the transient Ce^(−ax) decays for a > 0 and the solution approaches equilibrium b/a. This structure models cooling, mixing tanks, resistor-capacitor circuits, drug infusion, and any linear system with proportional loss plus external input.`,
      keyTerms: ['linear equation', 'standard form', 'integrating factor', 'product derivative', 'homogeneous solution', 'particular solution', 'transient', 'forced response'],
      equation: '\\mu(x)=e^{\\int P(x)dx}, \\qquad y=\\frac{1}{\\mu(x)}\\left(\\int\\mu(x)Q(x)\\,dx+C\\right)',
      callouts: [
        {
          type: 'key-insight',
          heading: 'The integrating factor engineers a product rule',
          body: 'After multiplying, verify that μy′ + μPy equals μy′ + μ′y. That identity is the entire reason the method works.',
        },
      ],
      presetAnalogies: {
        neutral: 'The integrating factor repackages two awkward terms as one product derivative. It changes the bookkeeping without changing the solutions.',
        gaming: 'A temporary multiplier combines separate state-update terms into one trackable resource. After solving, divide the multiplier back out.',
        sports: 'A tactical reweighting makes two coordinated movements appear as one combined play. The original positions are recovered after analysis.',
        music: 'A gain envelope turns two derivative terms into the derivative of one weighted signal. Removing the envelope returns the original response.',
      },
    },
    {
      id: 'modelling',
      heading: 'Modelling: Growth, Decay & Oscillation',
      body: `Exponential growth and decay follow y′ = ky, whose solution is y = y0e^{kt}. Positive k gives growth and negative k decay. The model assumes a constant per-capita rate and no resource limit, making it appropriate for short growth phases, radioactive decay, and first-order elimination but not indefinite biological population growth.

Newton’s law of cooling states T′ = −k(T − Tenv) for constant ambient temperature, so the temperature difference decays exponentially. Logistic growth adds a carrying capacity K through P′ = rP(1 − P/K), producing near-exponential growth when P is small and slower growth near K. Parameters must be estimated from data and interpreted with units.

Simple harmonic motion satisfies x″ + ω²x = 0 and has sinusoidal solutions. Position and acceleration are opposite in sign, while total energy alternates between kinetic and potential forms. With damping and driving, the model becomes x″ + 2βx′ + ω0²x = F(t)/m, explaining transients, resonance, and steady forced response in mechanical, electrical, and acoustical systems.`,
      keyTerms: ['exponential growth', 'exponential decay', 'per-capita rate', 'Newton’s law of cooling', 'logistic growth', 'carrying capacity', 'simple harmonic motion', 'resonance'],
      equation: "N(t)=N_0e^{-\\lambda t}, \\qquad x''+\\omega^2x=0",
      diagram: {
        url: '/diagrams/mathematics/exponential-decay.png',
        caption: 'Exponential decay curve N(t) = N₀e^(-λt) showing radioactive decay or cooling.',
        alt: 'A quantity decreases rapidly at first and then approaches zero asymptotically, with equal time intervals producing equal fractional reductions.',
      },
      callouts: [
        {
          type: 'real-world',
          heading: 'Half-life is constant for exponential decay',
          body: 'Every half-life removes half of what remains, not half of the original amount. Equal time intervals therefore produce equal fractional changes.',
        },
      ],
      presetAnalogies: {
        neutral: 'Exponential decay removes a fixed fraction per interval. The absolute amount removed shrinks because the remaining quantity shrinks.',
        gaming: 'A damage-over-time effect removes a fixed percentage of current health each round. Each tick is smaller than the previous one.',
        sports: 'A team reduces a remaining deficit by the same fraction each period. Progress is fast initially and slows as the gap narrows.',
        music: 'A reverberation tail loses a fixed fraction of amplitude over equal times. It fades exponentially rather than dropping by equal amounts.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Errors & Exam Traps',
      body: `Verify solutions by substitution into the original differential equation, not only an algebraically transformed version. State the interval on which divisions and logarithms are valid. When separating variables, record equilibrium solutions before dividing by a factor that may be zero, and use the initial condition only after obtaining the general relationship unless an equivalent definite-integral method is used.

Put a linear equation in y′ + Py = Q form before constructing μ. The integrating factor has a positive exponent ∫Pdx, and the integration constant appears after integrating the product derivative. Do not add a second independent constant to a first-order general solution. Distinguish homogeneous from particular solutions and apply the initial condition to their sum.

Models inherit assumptions. Exponential growth does not include crowding, logistic carrying capacity need not remain constant, and Newton cooling assumes a suitable heat-transfer regime and known ambient conditions. Parameters carry units: an exponential rate constant has inverse-time units, while angular frequency is radians per unit time. A good answer reports both the mathematical solution and what its domain and long-term behaviour mean.`,
      keyTerms: ['solution verification', 'interval of validity', 'equilibrium solution', 'integrating factor', 'general solution', 'initial condition', 'model assumption', 'rate constant'],
      callouts: [
        {
          type: 'key-insight',
          heading: 'Solve, verify, interpret',
          body: 'A complete differential-equation answer checks the formula in the equation, applies the data, states its valid interval, and interprets its behaviour.',
        },
      ],
      presetAnalogies: {
        neutral: 'A model is a rule plus assumptions, not just a formula. Verification checks the rule; interpretation checks whether the assumptions fit reality.',
        gaming: 'A simulation equation is valid only under its engine rules and parameter range. Passing one test case does not justify it outside that domain.',
        sports: 'A tactical model works under stated conditions such as fatigue and field size. Report both its prediction and the conditions that support it.',
        music: 'An audio model fits only within its operating range and signal assumptions. Validate the equation, then state where the approximation remains credible.',
      },
    },
  ],
}
