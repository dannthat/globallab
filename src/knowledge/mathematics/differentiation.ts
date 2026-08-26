import type { KnowledgeTopic } from '../../types'

export const differentiation: KnowledgeTopic = {
  id: 'differentiation',
  subjectId: 'mathematics',
  title: 'Differential Calculus',
  subtitle: 'Limits, derivatives, and applications of differentiation',
  source: {
    name: 'OpenStax Calculus Volume 1',
    url: 'https://openstax.org/details/books/calculus-volume-1',
    license: 'CC BY-NC-SA 4.0',
  },
  sections: [
    {
      id: 'overview',
      heading: 'Limits & Continuity',
      body: `A limit describes the value approached by f(x) as x approaches a point, whether or not f is defined there. The statement limx→a f(x) = L means values of f(x) can be made arbitrarily close to L by choosing x sufficiently close to, but not necessarily equal to, a. One-sided limits separate approach from the left and right; a two-sided limit exists only when both agree.

A function is continuous at a when f(a) is defined, limx→a f(x) exists, and that limit equals f(a). Polynomials are continuous everywhere, while rational functions are continuous wherever their denominators are nonzero. Removable discontinuities can be repaired by redefining one value, jump discontinuities have unequal one-sided limits, and infinite discontinuities occur near vertical asymptotes.

Limits make instantaneous change mathematically precise. Isaac Newton and Gottfried Wilhelm Leibniz developed calculus independently in the seventeenth century, linking tangent problems with accumulated area. Later work by Augustin-Louis Cauchy and Karl Weierstrass gave limits rigorous definitions. The Intermediate Value Theorem guarantees that a continuous function takes every intermediate output between two endpoint values, supporting root-finding and existence arguments.`,
      keyTerms: ['limit', 'one-sided limit', 'continuity', 'removable discontinuity', 'jump discontinuity', 'vertical asymptote', 'Intermediate Value Theorem', 'instantaneous change'],
      equation: '\\lim_{x\\to a}f(x)=L, \\qquad f \\text{ continuous at }a \\iff \\lim_{x\\to a}f(x)=f(a)',
      diagram: {
        url: '/diagrams/mathematics/tangent-derivative.png',
        caption: 'Tangent line to a curve at a point, representing the instantaneous rate of change.',
        alt: 'A smooth curve with a marked point and a tangent line whose slope matches the curve’s instantaneous slope at that point.',
      },
      callouts: [
        {
          type: 'key-insight',
          heading: 'A limit ignores the value at the point',
          body: 'Changing f(a) alone does not change limx→a f(x). Continuity is the extra condition that makes the approached value and actual value agree.',
        },
      ],
      presetAnalogies: {
        neutral: 'A limit studies where a route approaches, not whether the destination marker is installed. Continuity requires the marker to sit exactly at that approached location.',
        gaming: 'The limit is the position a character approaches as the timestep shrinks. The stored value at the exact frame can still be missing or different.',
        sports: 'A runner’s approach to the finish predicts the limiting position independently of one scoreboard entry. Continuity requires the recorded point to match the approach.',
        music: 'A fade can approach a target level even if one exact sample is altered. Continuity requires that sample to agree with its surrounding trend.',
      },
    },
    {
      id: 'first-principles',
      heading: 'Differentiation from First Principles',
      body: `The derivative f′(a) is the limit of average rates of change over shrinking intervals. The difference quotient [f(a + h) − f(a)]/h is the slope of a secant line through two curve points. As h approaches zero, if the quotient approaches a finite value, the secant slopes approach the tangent slope and define the instantaneous rate of change.

For f(x) = x², the quotient is [(a + h)² − a²]/h = 2a + h for h ≠ 0, so the limit is 2a. Cancelling h is legitimate before taking the limit because the quotient concerns nonzero h approaching zero; direct substitution before simplification would create an indeterminate 0/0 expression, not prove that the limit is undefined.

Differentiability implies continuity: if f′(a) exists, then f(x) approaches f(a). The converse is false. The absolute-value function is continuous at zero but has left derivative −1 and right derivative +1, so it has a corner and is not differentiable there. Vertical tangents, cusps, jumps, and unbounded local behaviour can likewise prevent a finite derivative.`,
      keyTerms: ['derivative', 'difference quotient', 'average rate of change', 'secant line', 'tangent slope', 'differentiability', 'corner', 'one-sided derivative'],
      equation: "f'(a)=\\lim_{h\\to0}\\frac{f(a+h)-f(a)}{h}",
      callouts: [
        {
          type: 'key-insight',
          heading: 'Zero is approached, not substituted early',
          body: 'The difference quotient is defined for nonzero h. Algebra first reveals the pattern whose value can then be evaluated as h approaches zero.',
        },
      ],
      presetAnalogies: {
        neutral: 'Average speed over shorter intervals converges toward speed at one instant. The derivative is that limiting value, not a quotient over a zero-length interval.',
        gaming: 'Velocity estimated across successive frames becomes more local as the frame gap shrinks. The derivative is the stable limit of those estimates.',
        sports: 'A sprint’s average pace over one second, then a tenth, then a hundredth approaches instantaneous pace. No division by an actual zero time is required.',
        music: 'The slope of an automation curve is estimated over smaller sample windows. Its derivative is the limiting change rate as the window narrows.',
      },
    },
    {
      id: 'rules',
      heading: 'Differentiation Rules (Chain, Product, Quotient)',
      body: `Derivative rules compress repeated first-principles arguments. Linearity gives (af + bg)′ = af′ + bg′, and the power rule gives d(xn)/dx = nx^(n−1) for broad classes of exponents on appropriate domains. Exponential, logarithmic, and trigonometric derivatives provide a core library from which composite expressions are built.

The product rule is (fg)′ = f′g + fg′ because both factors change. The quotient rule is (f/g)′ = (f′g − fg′)/g² where g is nonzero. These rules are not obtained by differentiating the factors separately and multiplying or dividing; missing cross-effects makes those tempting shortcuts false.

The chain rule differentiates a composition: d[f(g(x))]/dx = f′(g(x))g′(x). It multiplies the outer sensitivity by the inner rate of change and extends through multiple nested layers. Implicit differentiation applies the same rule when y depends on x without being isolated, while logarithmic differentiation simplifies products, quotients, or variable exponents before differentiation.`,
      keyTerms: ['linearity', 'power rule', 'product rule', 'quotient rule', 'chain rule', 'composition', 'implicit differentiation', 'logarithmic differentiation'],
      equation: "\\frac{d}{dx}f(g(x))=f'(g(x))g'(x), \\qquad (fg)'=f'g+fg'",
      callouts: [
        {
          type: 'key-insight',
          heading: 'Name the outer and inner functions',
          body: 'Before using the chain rule, write u = g(x). Differentiating f(u) with respect to u and then multiplying by du/dx exposes missing factors.',
        },
      ],
      presetAnalogies: {
        neutral: 'The chain rule tracks change through connected converters. Overall sensitivity equals the product of each stage’s local sensitivity.',
        gaming: 'A base-stat change passes through several multipliers. The final response depends on every layer in the upgrade chain.',
        sports: 'A tactical adjustment changes possession, which changes shot volume, which changes scoring. The total rate multiplies the linked sensitivities.',
        music: 'A control modulates another control that sets output level. The chain rule multiplies how each stage responds to the previous one.',
      },
    },
    {
      id: 'applications',
      heading: 'Applications: Optimisation & Related Rates',
      body: `Optimisation translates a goal into an objective function and constraints. Interior local extrema of a differentiable function occur at critical points where f′ = 0, but critical points are candidates rather than guaranteed maxima or minima. Endpoints and points where the derivative is undefined must also be checked on a closed interval.

The first-derivative test classifies a critical point by sign changes: positive to negative gives a local maximum, while negative to positive gives a local minimum. The second-derivative test uses concavity when f′ = 0 and f″ is nonzero. If f″ = 0, the test is inconclusive, not evidence that no extremum exists. Units and domain restrictions determine whether a mathematical candidate is physically meaningful.

Related-rates problems connect quantities that change with time. Write an equation relating the variables, differentiate implicitly with respect to time, then substitute the instant-specific values. Substituting fixed values before differentiating can erase the changing relationship. These methods model marginal cost, maximum area, minimum material, fluid filling, shadow motion, and motion tracked by geometry.`,
      keyTerms: ['optimisation', 'objective function', 'constraint', 'critical point', 'first-derivative test', 'second-derivative test', 'related rates', 'implicit differentiation'],
      equation: "f'(x_c)=0 \\text{ or undefined}; \\qquad \\frac{d}{dt}F(x(t),y(t))=0",
      callouts: [
        {
          type: 'real-world',
          heading: 'Optimisation needs a domain',
          body: 'Engineering designs have bounds such as positive lengths, limited material, and safety thresholds. An unconstrained calculus answer can be mathematically valid but unusable.',
        },
      ],
      presetAnalogies: {
        neutral: 'Optimisation maps every allowed choice to a score, then compares critical points and boundaries. A stationary score is only a candidate.',
        gaming: 'A build optimiser checks balance points and hard inventory limits. A zero marginal gain does not automatically prove the best build.',
        sports: 'Peak performance may occur at a balanced training load or at an allowed boundary. Both interior turning points and limits must be compared.',
        music: 'A mix optimum may lie where a small fader change has zero benefit or at a permitted level boundary. Candidate points still require listening and comparison.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Errors & Exam Traps',
      body: `A limit of 0/0 is indeterminate, not automatically zero or nonexistent. Simplify, factor, rationalise, or use an appropriate theorem before evaluating. Continuity does not guarantee differentiability, and a graph can have a derivative of zero without crossing the axis. Distinguish f′(x), the derivative function, from f′(a), its value at one point.

Apply rules to the correct structure. The derivative of a product is not f′g′, the derivative of a quotient is not f′/g′, and a composite requires every chain factor. Preserve parentheses and simplify after differentiation when that reduces algebra risk. In implicit work, every derivative of a y-term requires dy/dx.

For optimisation, include endpoints and domain restrictions, and prove classification rather than assuming every solution of f′ = 0 is an extremum. For related rates, differentiate before substituting the values that apply only at one instant. Carry units through derivatives: if distance is metres and time seconds, dx/dt is metres per second, while dA/dt is square metres per second.`,
      keyTerms: ['indeterminate form', 'continuity', 'derivative function', 'product rule', 'chain factor', 'implicit differentiation', 'endpoint', 'units'],
      callouts: [
        {
          type: 'key-insight',
          heading: 'Read the expression tree',
          body: 'Before differentiating, mark sums, products, quotients, and compositions. The outermost operation determines the first rule to apply.',
        },
      ],
      presetAnalogies: {
        neutral: 'Differentiation rules follow the expression’s construction. Reading its structure first is like disassembling a machine in the reverse order it was built.',
        gaming: 'A formula is a nested skill tree. Start from the outermost node and preserve every modifier as you work inward.',
        sports: 'Analyse the whole formation before assigning individual movements. Ignoring a link in the structure loses a necessary rate factor.',
        music: 'Trace the outer signal bus before opening its nested effects. Each processing layer contributes a derivative factor.',
      },
    },
  ],
}
