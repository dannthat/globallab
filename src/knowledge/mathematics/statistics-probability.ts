import type { KnowledgeTopic } from '../../types'

export const statisticsProbability: KnowledgeTopic = {
  id: 'statistics-probability',
  subjectId: 'mathematics',
  title: 'Statistics & Probability',
  subtitle: 'Distributions, hypothesis testing, and the central limit theorem',
  source: {
    name: 'OpenStax Introductory Statistics 2e',
    url: 'https://openstax.org/details/books/introductory-statistics-2e',
    license: 'CC BY 4.0',
  },
  sections: [
    {
      id: 'overview',
      heading: 'Probability Foundations',
      body: `Probability assigns numbers from zero to one to events in a sample space. According to the Kolmogorov axioms, the whole sample space has probability one and probabilities of disjoint events add. Complements satisfy P(Ac) = 1 − P(A), while the general addition rule subtracts the overlap: P(A ∪ B) = P(A) + P(B) − P(A ∩ B).

Conditional probability P(A|B) measures the probability of A after restricting attention to outcomes where B occurred. The multiplication rule is P(A ∩ B) = P(A|B)P(B). Events are independent when P(A ∩ B) = P(A)P(B); independence is not the same as mutual exclusivity, because two nonempty mutually exclusive events cannot occur together and are therefore dependent.

Bayes’ theorem reverses conditioning by combining a prior probability with evidence likelihood. Thomas Bayes developed an early version, and Pierre-Simon Laplace generalised the method. A posterior probability is proportional to likelihood times prior, with the denominator normalising across alternatives. Medical tests, spam filters, reliability analysis, and scientific inference all require attention to base rates as well as test accuracy.`,
      keyTerms: ['sample space', 'event', 'Kolmogorov axioms', 'conditional probability', 'independence', 'mutual exclusivity', 'Bayes’ theorem', 'posterior probability'],
      equation: 'P(A|B)=\\frac{P(B|A)P(A)}{P(B)}',
      callouts: [
        {
          type: 'key-insight',
          heading: 'According to Bayes’ theorem, base rates matter',
          body: 'Even a highly accurate test can produce many false positives when the tested condition is rare. Posterior probability must combine sensitivity with prevalence.',
        },
      ],
      presetAnalogies: {
        neutral: 'Bayesian updating starts with a prior estimate and reweights it using new evidence. Strong evidence matters, but its meaning depends on the original base rate.',
        gaming: 'Estimate an opponent’s strategy from its prior frequency, then update after observing a move. A rare strategy needs stronger evidence before becoming likely.',
        sports: 'A coach combines a player’s long-term record with today’s evidence. One impressive play updates the forecast without erasing the base rate.',
        music: 'A detector combines the prior chance of a note with how likely the observed signal is under each note. Context changes the posterior interpretation.',
      },
    },
    {
      id: 'distributions',
      heading: 'Probability Distributions (Normal, Binomial, Poisson)',
      body: `A random variable maps outcomes to numerical values, and its probability distribution specifies their probabilities. The binomial distribution counts successes in n independent Bernoulli trials with constant success probability p. According to Jacob Bernoulli’s framework, its mean is np and variance np(1 − p); changing p between trials or introducing dependence invalidates the simple binomial model.

The Poisson distribution models counts in a fixed interval when events occur independently at a constant average rate λ and simultaneous events are negligible. Its mean and variance both equal λ. Siméon Denis Poisson introduced the distribution in the nineteenth century. It can approximate a binomial distribution when n is large, p is small, and np is moderate.

The normal distribution is continuous, symmetric, and determined by mean μ and standard deviation σ. Abraham de Moivre derived an early normal approximation to the binomial, while Carl Friedrich Gauss used the curve in error theory. Standardising with z = (x − μ)/σ converts values to the standard normal. The empirical 68–95–99.7 rule is an approximation for data that actually follow a normal distribution, not a universal law for every dataset.`,
      keyTerms: ['random variable', 'probability distribution', 'binomial distribution', 'Bernoulli trial', 'Poisson distribution', 'normal distribution', 'standard deviation', 'z-score'],
      equation: 'f(x)=\\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-(x-\\mu)^2/(2\\sigma^2)}',
      diagram: {
        url: '/diagrams/mathematics/normal-distribution.png',
        caption: 'Standard normal distribution (μ=0, σ=1) with 68-95-99.7 rule marked.',
        alt: 'A symmetric bell-shaped density centred at zero with shaded intervals one, two, and three standard deviations from the mean.',
      },
      callouts: [
        {
          type: 'key-insight',
          heading: 'According to the model assumptions, choose before calculating',
          body: 'Binomial counts need fixed independent trials; Poisson counts need a stable event rate; normal calculations need a defensible continuous bell-shaped model.',
        },
      ],
      presetAnalogies: {
        neutral: 'A distribution is a probability map over possible values. Binomial maps fixed trials, Poisson maps event counts, and normal maps continuous variation.',
        gaming: 'Different random mechanics need different loot tables. Fixed success attempts, arrivals per interval, and continuous stat variation are not interchangeable.',
        sports: 'Free-throw successes, goals per match, and player heights call for different models. The data-generating process selects the distribution.',
        music: 'Note hits, clicks per second, and continuous noise amplitude have different probability structures. Choose the distribution from how the signal is produced.',
      },
    },
    {
      id: 'hypothesis-testing',
      heading: 'Hypothesis Testing & p-values',
      body: `A hypothesis test evaluates sample evidence against a null hypothesis H0 and a defined alternative Ha. A test statistic measures discrepancy between the data and H0 in standard-error units. The p-value is the probability, assuming H0 and all model conditions are true, of obtaining a result at least as incompatible with H0 as the observed result.

According to the Neyman–Pearson framework, a decision rule controls long-run error rates. A Type I error rejects a true H0 and has probability α under the test design; a Type II error fails to reject a false H0 and has probability β at a specified alternative. Power is 1 − β. Smaller α, larger samples, lower variability, and larger true effects shape the trade-off between error control and detection.

Ronald Fisher popularised significance testing, while Jerzy Neyman and Egon Pearson developed formal decision procedures; modern practice often combines ideas from both traditions. A p-value is not the probability that H0 is true, not an effect size, and not proof of practical importance. Responsible reporting includes confidence intervals, effect magnitude, assumptions, study design, and the possibility of selection or multiple-testing bias.`,
      keyTerms: ['null hypothesis', 'alternative hypothesis', 'test statistic', 'p-value', 'Type I error', 'Type II error', 'power', 'effect size'],
      equation: 'p=P(T\\text{ at least as extreme as }T_{\\mathrm{obs}}\\mid H_0)',
      callouts: [
        {
          type: 'key-insight',
          heading: 'According to Fisher, evidence is graded—not certainty',
          body: 'A small p-value quantifies incompatibility between data and a specified null model. It does not supply the probability that the scientific hypothesis is true.',
        },
      ],
      presetAnalogies: {
        neutral: 'A p-value asks how unusual the evidence would be under one stated model. It evaluates that model’s compatibility, not the probability that the model is true.',
        gaming: 'Assume the game is fair, then ask how often a result this extreme would occur. A rare result challenges the assumption but does not prove cheating.',
        sports: 'Assume two teams are equally matched, then measure how unusual the score difference is under that model. The calculation does not assign truth probability to equality.',
        music: 'Assume a signal contains only specified noise, then ask how rarely a peak this large appears. A low rate flags incompatibility without proving the source identity.',
      },
    },
    {
      id: 'clt',
      heading: 'The Central Limit Theorem',
      body: `The central limit theorem states that, under suitable conditions, the standardised sum or mean of many independent identically distributed random variables with finite variance approaches a normal distribution as sample size grows. For sample mean X̄, the sampling distribution has mean μ and standard error σ/√n. The original population itself need not be normal.

Abraham de Moivre proved an early special case for binomial trials, while Pierre-Simon Laplace extended it; later versions by Aleksandr Lyapunov and Jarl Lindeberg clarified broader conditions. The theorem concerns a distribution of statistics across repeated samples, not the shape of one sample. How large n must be depends on skewness, tails, dependence, and the statistic being approximated.

The theorem justifies normal approximations for confidence intervals and hypothesis tests involving sums and means. It does not rescue biased sampling, dependence, infinite-variance models, or a sample statistic dominated by rare extreme observations. Increasing n reduces standard error as 1/√n, so halving uncertainty requires approximately four times the sample size. The law of large numbers instead describes convergence of the sample mean toward μ; it is related but not the same theorem.`,
      keyTerms: ['central limit theorem', 'standardised sum', 'sample mean', 'sampling distribution', 'standard error', 'finite variance', 'law of large numbers', 'normal approximation'],
      equation: '\\frac{\\bar X-\\mu}{\\sigma/\\sqrt n}\\xrightarrow{d}N(0,1)',
      callouts: [
        {
          type: 'key-insight',
          heading: 'According to the CLT, means become normal—not all data',
          body: 'Repeated sample means can be approximately normal even when individual observations are skewed. The theorem does not claim the population becomes normal.',
        },
      ],
      presetAnalogies: {
        neutral: 'Averages combine many independent fluctuations, causing positive and negative deviations to balance into a predictable bell-shaped sampling pattern. The spread of those averages narrows as sample size grows.',
        gaming: 'One loot drop can be highly skewed, but average loot across many independent runs varies much more regularly between players. Larger run groups make that average more stable.',
        sports: 'One shot outcome is discrete, while average performance across many independent shots has a smoother, increasingly normal sampling distribution. More shots reduce the standard error of the average.',
        music: 'One noise spike can follow an irregular distribution, while averages of many independent samples form a more regular bell-shaped pattern. Longer averaging windows reduce its sampling variation.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Errors & Exam Traps',
      body: `Do not confuse mutually exclusive events with independent events. Conditional probabilities change the reference population, so write the conditioning event explicitly. In Bayes problems, include all alternative pathways in the denominator and use prevalence rather than assuming equal prior probabilities. Probabilities must remain between zero and one, which provides a basic arithmetic check.

Match distributions to assumptions. Binomial trials need fixed n, two outcome categories, constant p, and independence. A normal density gives probabilities as areas, so P(X = exact value) = 0 for a continuous variable. A z-score is measured in standard deviations, not original units. According to de Moivre’s approximation, continuity corrections improve normal approximations to discrete counts.

Never interpret p as P(H0|data). Say “fail to reject H0,” not “accept H0,” when evidence is insufficient. Statistical significance does not guarantee practical significance or causal identification. For the central limit theorem, distinguish the population standard deviation σ, sample standard deviation s, and standard error s/√n, and check whether independence, sample size, and tail behaviour support the approximation.`,
      keyTerms: ['mutually exclusive', 'independent events', 'prevalence', 'binomial assumptions', 'continuous variable', 'continuity correction', 'statistical significance', 'standard error'],
      callouts: [
        {
          type: 'key-insight',
          heading: 'According to modern statistical practice, report more than p',
          body: 'Pair significance tests with effect sizes, uncertainty intervals, model checks, and study design. A single threshold cannot carry the scientific conclusion.',
        },
      ],
      presetAnalogies: {
        neutral: 'Statistical conclusions are chains of assumptions and evidence. A correct calculation cannot repair biased sampling or the wrong probability model.',
        gaming: 'A polished probability result is only as reliable as the matchmaking and drop assumptions behind it. Audit the data-generating rules before trusting the number.',
        sports: 'A significant score difference may still come from weak scheduling or sampling. Report effect size, uncertainty, and design before claiming a meaningful advantage.',
        music: 'A detected peak can be statistically unusual yet too small to hear or caused by selection bias. Significance, magnitude, and design answer different questions.',
      },
    },
  ],
}
