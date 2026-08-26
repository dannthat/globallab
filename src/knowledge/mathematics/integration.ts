import type { KnowledgeTopic } from '../../types'

export const integration: KnowledgeTopic = {
  id: 'integration',
  subjectId: 'mathematics',
  title: 'Integral Calculus',
  subtitle: 'Antiderivatives, definite integrals, and area',
  source: {
    name: 'OpenStax Calculus Volume 1',
    url: 'https://openstax.org/details/books/calculus-volume-1',
    license: 'CC BY-NC-SA 4.0',
  },
  sections: [
    {
      id: 'overview',
      heading: 'Antiderivatives & Indefinite Integrals',
      body: `An antiderivative of f on an interval is a function F satisfying F′ = f there. If F is one antiderivative, then F + C is another for every constant C, and all antiderivatives on a connected interval differ by a constant. The indefinite integral ∫f(x)dx denotes this family, so omitting +C loses valid solutions.

Integration reverses familiar derivative rules. The power rule gives ∫x^n dx = x^(n+1)/(n+1) + C for n ≠ −1, while ∫1/x dx = ln|x| + C. Linearity allows constants and sums to be handled term by term. An antiderivative formula is always checked by differentiation, which also exposes missing constants, chain factors, or domain restrictions.

Initial conditions select one member of an antiderivative family. If velocity is integrated to position, the integration constant is the initial position; integrating acceleration introduces initial velocity and position through successive constants. Leibniz’s integral notation preserves the differential dx, which identifies the integration variable and becomes essential in substitution and multivariable settings.`,
      keyTerms: ['antiderivative', 'indefinite integral', 'constant of integration', 'power rule', 'linearity', 'initial condition', 'integration variable', 'Leibniz notation'],
      equation: "\\int f(x)\\,dx = F(x)+C \\quad \\text{where }F'(x)=f(x)",
      callouts: [
        {
          type: 'key-insight',
          heading: 'Differentiate to verify',
          body: 'A proposed indefinite integral is correct exactly when differentiating it returns the integrand on the stated domain.',
        },
      ],
      presetAnalogies: {
        neutral: 'A derivative removes an unknown vertical offset, so integration restores a whole family. An initial condition identifies the correct member.',
        gaming: 'Reconstructing a path from velocity determines every movement but not the spawn point. The integration constant stores that missing initial position.',
        sports: 'Pace data reconstruct a runner’s displacement but not the starting mark. One initial measurement fixes the entire trajectory.',
        music: 'Integrating a rate automation curve recovers level changes but not the initial fader position. The constant records that baseline.',
      },
    },
    {
      id: 'definite-integrals',
      heading: 'Definite Integrals & the Fundamental Theorem',
      body: `A definite integral is the limit of Riemann sums. Partition [a,b] into subintervals, multiply each width by a sampled function value, and sum. If these sums approach one value as the maximum subinterval width tends to zero, f is integrable and the limit is ∫a^b f(x)dx. The result is signed accumulation: regions below the axis contribute negatively.

The Fundamental Theorem of Calculus links accumulation and local change. If f is continuous and A(x) = ∫a^x f(t)dt, then A′(x) = f(x). Conversely, if F′ = f, then ∫a^b f(x)dx = F(b) − F(a). This relationship, recognised by Newton and Leibniz, unifies the tangent and area problems that motivated calculus.

Definite integrals represent far more than geometric area: integrating velocity gives displacement, density gives mass, force over distance gives work, and a probability density gives probability. Units multiply accordingly. Numerical methods such as midpoint, trapezoidal, and Simpson rules approximate integrals when an elementary antiderivative is unavailable or data are discrete.`,
      keyTerms: ['definite integral', 'Riemann sum', 'partition', 'integrable', 'signed accumulation', 'Fundamental Theorem of Calculus', 'displacement', 'numerical integration'],
      equation: '\\int_a^b f(x)\\,dx = \\lim_{n\\to\\infty}\\sum_{i=1}^n f(x_i^*)\\Delta x_i = F(b)-F(a)',
      diagram: {
        url: '/diagrams/mathematics/riemann-integral.png',
        caption: 'Riemann sum approximating area under a curve using rectangular strips.',
        alt: 'Rectangles over a partition approximate the signed area between a smooth function and the horizontal axis, becoming finer across the interval.',
      },
      callouts: [
        {
          type: 'key-insight',
          heading: 'Integral is signed; area is not',
          body: 'To find total geometric area, split at zeros and integrate |f| or change the sign of below-axis contributions.',
        },
      ],
      presetAnalogies: {
        neutral: 'A Riemann sum totals many thin contributions, then makes them arbitrarily fine. The integral is the stable accumulation those approximations approach.',
        gaming: 'Estimate total damage by summing rate times tiny time slices. Refining the timestep converges to the exact accumulated effect.',
        sports: 'Total distance comes from adding speed times many short time intervals. Smaller intervals capture changing pace more accurately.',
        music: 'Total signal energy can be approximated from many narrow time slices. The integral is the limit as those slices become finer.',
      },
    },
    {
      id: 'techniques',
      heading: 'Integration by Substitution & Parts',
      body: `Substitution reverses the chain rule. When an integrand contains f(g(x))g′(x), set u = g(x) so du = g′(x)dx and integrate in u. For definite integrals, either transform both limits into u-values or return to x before applying the original bounds. Mixing transformed integrands with untransformed limits is invalid.

Integration by parts reverses the product rule: ∫u dv = uv − ∫v du. It is useful when differentiating one factor simplifies it while integrating the other is manageable, as with polynomial-exponential, logarithmic, or inverse-trigonometric products. Choosing u with the LIATE heuristic can help, but the decisive criterion is whether the remaining integral becomes simpler.

Some integrals require algebra before a named technique: completing the square, polynomial division, trigonometric identities, or partial fractions. No elementary antiderivative exists for every elementary function; e^(−x²) is a standard example. In such cases, definite values can still be defined and accurately approximated numerically or represented using special functions.`,
      keyTerms: ['substitution', 'chain rule', 'integration by parts', 'product rule', 'LIATE', 'partial fractions', 'elementary antiderivative', 'special function'],
      equation: '\\int u\\,dv = uv - \\int v\\,du',
      callouts: [
        {
          type: 'key-insight',
          heading: 'Techniques reverse derivative structures',
          body: 'Substitution reverses a chain rule and integration by parts reverses a product rule. Identify the likely derivative structure before choosing a method.',
        },
      ],
      presetAnalogies: {
        neutral: 'Integration techniques undo the assembly steps used by differentiation. Recognising the construction suggests the correct reverse operation.',
        gaming: 'A crafted item is dismantled by reversing its recipe. Composite effects suggest substitution, while coupled factors suggest integration by parts.',
        sports: 'To reverse a set play, identify whether it was built as a sequence or a coordinated pair. Different constructions require different undoing strategies.',
        music: 'Unmixing a processed signal starts by identifying its chain: nested modulation suggests substitution, while multiplied envelopes suggest parts. The detected chain guides the reverse operation.',
      },
    },
    {
      id: 'applications',
      heading: 'Area Between Curves & Volumes',
      body: `The area between y = f(x) and y = g(x) over [a,b] is ∫a^b |f(x) − g(x)|dx. If one function stays above the other, the absolute value becomes top minus bottom. When curves cross, solve for intersection points and split the integral so the ordering is correct. Horizontal slicing instead uses right minus left and integrates with respect to y.

Volumes can be assembled from cross-sectional area: V = ∫A(x)dx. Rotating a region around an axis produces disks or washers when slices are perpendicular to the axis, with area π(R² − r²). Cylindrical shells use slices parallel to the axis, giving 2π(radius)(height) times thickness. The geometry determines the method; formulas should be reconstructed from a representative slice rather than memorised without context.

Integration also finds arc length, surface area, centres of mass, hydrostatic force, and average value. Each application begins with a small contribution expressed in terms of one variable, then accumulates it across the domain. Dimensional analysis checks the setup: area integrals must yield squared units and volume integrals cubed units. A correct-looking antiderivative cannot repair an incorrectly modelled slice.`,
      keyTerms: ['area between curves', 'intersection point', 'cross-sectional area', 'washer method', 'cylindrical shell', 'arc length', 'centre of mass', 'dimensional analysis'],
      equation: 'A=\\int_a^b|f(x)-g(x)|\\,dx, \\qquad V=\\int_a^b A(x)\\,dx',
      callouts: [
        {
          type: 'real-world',
          heading: 'A slice is the model',
          body: 'Engineers derive volume, mass, and force integrals by modelling one thin physical slice. The integral simply accumulates those correctly defined pieces.',
        },
      ],
      presetAnalogies: {
        neutral: 'Build the total from one correctly measured thin slice. Integration then stacks every slice across the object.',
        gaming: 'Compute the resource in one narrow map strip, then sum all strips. Choosing the wrong strip geometry corrupts the total.',
        sports: 'Measure attendance row by row and add the rows. The counting method works only when each row’s width and density are modelled correctly.',
        music: 'Measure one narrow frequency band and accumulate across the spectrum. The total depends on defining each band’s contribution correctly.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Errors & Exam Traps',
      body: `Include +C for indefinite integrals but not for a definite integral evaluated by endpoint subtraction. The power rule excludes n = −1, whose antiderivative is ln|x|. After substitution, transform the differential and either transform bounds or return fully to the original variable. Partial substitutions leave an inconsistent integral.

Definite integral and geometric area are not synonyms. Below-axis contributions are negative, so split at zeros or integrate an absolute value for total area. For area between curves, verify top minus bottom or right minus left on every subinterval. Sketching the region and marking a representative slice prevents reversed radii and missing intersections.

The Fundamental Theorem requires attention to variable upper limits and chain factors: d/dx ∫a^{g(x)} f(t)dt = f(g(x))g′(x). Keep dummy variables distinct from the outer variable. Check units, bounds, and sign before performing long algebra, then differentiate indefinite results or estimate definite results numerically to test plausibility.`,
      keyTerms: ['constant of integration', 'logarithmic antiderivative', 'substitution bounds', 'signed area', 'absolute value', 'representative slice', 'variable upper limit', 'dummy variable'],
      callouts: [
        {
          type: 'key-insight',
          heading: 'Draw before integrating geometry',
          body: 'A labelled sketch reveals intersections, slice direction, outer and inner radii, and whether the integrand must change across the domain.',
        },
      ],
      presetAnalogies: {
        neutral: 'Integration is accurate accumulation only after each contribution is signed and bounded correctly. A perfect sum of the wrong pieces remains wrong.',
        gaming: 'The total score depends on selecting the right zones and whether each adds or subtracts. Clean arithmetic cannot fix an incorrect map partition.',
        sports: 'Statistics require the correct intervals and scoring direction. Counting every event precisely is useless if own-goals are added with the wrong sign.',
        music: 'Summing a mix requires correct phase, range, and routing. Accurate processing of the wrong channels does not yield the intended output.',
      },
    },
  ],
}
