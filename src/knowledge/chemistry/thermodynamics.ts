import type { KnowledgeTopic } from '../../types'

export const thermodynamics: KnowledgeTopic = {
  id: 'thermodynamics',
  subjectId: 'chemistry',
  title: 'Chemical Thermodynamics',
  subtitle: 'Enthalpy, entropy, Gibbs free energy, and spontaneity',
  source: {
    name: 'OpenStax Chemistry 2e',
    url: 'https://openstax.org/details/books/chemistry-2e',
    license: 'CC BY 4.0',
  },
  sections: [
    {
      id: 'overview',
      heading: 'Energy in Chemical Reactions',
      body: `Thermodynamics studies energy transfer and the direction of macroscopic change. The system is the portion under study, while the surroundings are everything else. Systems may be open to matter and energy, closed to energy but not matter, or isolated from both. State functions such as internal energy depend only on the current state, whereas heat and work describe transfer pathways.

The first law expresses energy conservation: ΔU = q + w under the chemistry sign convention, where heat entering the system and work done on the system are positive. Expansion work at constant external pressure is w = −PextΔV, so expansion does work on the surroundings and lowers the system’s energy unless heat compensates. Temperature measures thermal state, while heat is energy transferred because of a temperature difference.

Bond breaking requires energy and bond formation releases energy. An exothermic reaction transfers net heat to the surroundings, while an endothermic reaction absorbs net heat under the specified conditions. Thermodynamic favourability does not determine reaction speed: a process can be spontaneous but extremely slow if it faces a large activation barrier. Kinetics and thermodynamics answer different questions.`,
      keyTerms: ['thermodynamics', 'system', 'surroundings', 'state function', 'internal energy', 'first law', 'expansion work', 'activation barrier'],
      equation: '\\Delta U = q + w',
      callouts: [
        {
          type: 'key-insight',
          heading: 'Heat is transfer, not stored substance',
          body: 'A system contains internal energy. Heat and work name ways energy crosses the system boundary; they are not state properties stored inside it.',
        },
      ],
      presetAnalogies: {
        neutral: 'Internal energy is an account balance; heat and work are transaction types. The final balance depends on net transfer, not the path label alone.',
        gaming: 'A character’s energy bar is a state quantity. Healing and work are different transfer mechanics that change the bar.',
        sports: 'The scoreboard is a state, while passes and shots are pathways that change it. Different sequences can reach the same final score.',
        music: 'Stored system energy resembles a channel level at one instant. Heat and work are distinct routes by which that level changes.',
      },
    },
    {
      id: 'enthalpy',
      heading: "Enthalpy & Hess's Law",
      body: `Enthalpy is the state function H = U + PV. At constant pressure with only pressure-volume work, the enthalpy change equals the heat absorbed by the system, ΔH = qp. Negative ΔH denotes an exothermic process and positive ΔH an endothermic process. A thermochemical equation must include physical states and stoichiometric coefficients because both affect the enthalpy change.

Hess’s law states that the enthalpy change for an overall reaction equals the sum of enthalpy changes for any sequence of steps that produces the same net reaction. This follows because enthalpy is a state function. When a reaction equation is reversed, the sign of ΔH reverses; when coefficients are multiplied, ΔH is multiplied by the same factor.

Standard reaction enthalpy can be calculated from standard enthalpies of formation: products minus reactants, each weighted by stoichiometric coefficient. Germain Hess established the additivity principle before energy conservation was fully formalised. Calorimetry measures heat transfer experimentally using q = mcΔT or a calibrated heat capacity, with heat gained by one part balancing heat lost by another in an insulated setup.`,
      keyTerms: ['enthalpy', 'constant pressure', 'exothermic', 'endothermic', 'thermochemical equation', 'Hess’s law', 'enthalpy of formation', 'calorimetry'],
      equation: '\\Delta H^\\circ_{\\mathrm{rxn}} = \\sum \\nu\\Delta H_f^\\circ(\\mathrm{products}) - \\sum \\nu\\Delta H_f^\\circ(\\mathrm{reactants})',
      callouts: [
        {
          type: 'real-world',
          heading: 'Calorimeters infer reaction heat',
          body: 'The measured temperature change belongs to the surroundings or calorimeter. Energy conservation then gives the reaction heat with the opposite sign.',
        },
      ],
      presetAnalogies: {
        neutral: 'Hess’s law resembles calculating elevation change through any route. The net change depends only on starting and ending elevations.',
        gaming: 'Different quest chains can connect the same initial and final states. Adding each energy reward or cost gives the same net result.',
        sports: 'A team can reach the same score through different sequences of plays. The net scoreboard change is fixed by the endpoints.',
        music: 'Several gain stages can be combined into one net level change. Reordering an equivalent signal path does not alter the endpoint difference.',
      },
    },
    {
      id: 'entropy',
      heading: 'Entropy & the Second Law',
      body: `Entropy S is a state function related to the number and distribution of microscopic arrangements compatible with a macroscopic state. Boltzmann’s relation S = kB ln W connects entropy to multiplicity W. Entropy usually rises when matter or energy becomes dispersed among more accessible states, as in expansion, mixing, heating, or many solid-to-liquid and liquid-to-gas transitions.

For a reversible transfer of heat at temperature T, dS = δqrev/T. A real spontaneous process may be irreversible, but its entropy change is calculated using any imagined reversible path between the same states because S is a state function. Tabulated standard molar entropies can be combined as products minus reactants, like other reaction state functions.

The second law states that the entropy of the universe increases for a spontaneous process: ΔSuniv = ΔSsys + ΔSsurr > 0. The system’s entropy may decrease if the surroundings increase by a larger amount. Rudolf Clausius introduced entropy in thermodynamics, while Ludwig Boltzmann developed its statistical interpretation. The second law is statistical: overwhelmingly probable macrostates dominate because they correspond to vastly more microstates.`,
      keyTerms: ['entropy', 'microstate', 'multiplicity', 'Boltzmann relation', 'reversible path', 'standard molar entropy', 'second law', 'entropy of the universe'],
      equation: '\\Delta S_{\\mathrm{univ}} = \\Delta S_{\\mathrm{sys}} + \\Delta S_{\\mathrm{surr}} \\geq 0',
      callouts: [
        {
          type: 'key-insight',
          heading: 'The system can become more ordered',
          body: 'Freezing water lowers the water’s entropy, but released heat raises surrounding entropy. Below the freezing point, the total entropy change can still be positive.',
        },
      ],
      presetAnalogies: {
        neutral: 'Entropy counts how many microscopic arrangements fit the visible state. States compatible with overwhelmingly more arrangements are statistically favoured.',
        gaming: 'A macrostate is one scoreboard result with many possible action histories. Outcomes supported by vastly more histories are more probable.',
        sports: 'One formation is highly specific, while a dispersed crowd can occupy countless arrangements. The larger multiplicity gives the dispersed macrostate greater entropy.',
        music: 'A precise phase-aligned signal has few compatible arrangements. Randomised phases realise far more microstates while producing a less structured macroscopic pattern.',
      },
    },
    {
      id: 'gibbs',
      heading: 'Gibbs Free Energy & Spontaneity',
      body: `At constant temperature and pressure, Gibbs free energy combines enthalpy and entropy as G = H − TS. A process is thermodynamically spontaneous in the forward direction when ΔG < 0, at equilibrium when ΔG = 0, and nonspontaneous forward when ΔG > 0. Spontaneous means permitted without continuous external driving; it does not mean rapid or explosive.

The signs of ΔH and ΔS determine temperature dependence. A reaction with ΔH < 0 and ΔS > 0 is favourable at all temperatures, while ΔH > 0 and ΔS < 0 is unfavourable at all temperatures. When the terms have the same sign, a crossover can occur near T = ΔH/ΔS, provided the quantities are treated as approximately temperature-independent over the range.

Under nonstandard conditions, ΔG = ΔG° + RT ln Q. At equilibrium, Q = K and ΔG = 0, giving ΔG° = −RT ln K. A negative standard free-energy change therefore corresponds to K > 1, not to complete conversion. Josiah Willard Gibbs developed the thermodynamic potential that now predicts chemical equilibrium, phase stability, electrochemical work, and coupled biochemical reactions.`,
      keyTerms: ['Gibbs free energy', 'spontaneous', 'equilibrium', 'temperature dependence', 'reaction quotient', 'equilibrium constant', 'standard free-energy change', 'coupled reaction'],
      equation: '\\Delta G = \\Delta H - T\\Delta S = \\Delta G^\\circ + RT\\ln Q',
      diagram: {
        url: '/diagrams/chemistry/gibbs-reaction-profile.png',
        caption: 'Reaction energy profile for exothermic reaction showing reactant energy, activation energy barrier, and product energy.',
        alt: 'Energy-versus-reaction-coordinate graph with reactants above products and a transition-state peak that marks the activation-energy barrier.',
      },
      callouts: [
        {
          type: 'key-insight',
          heading: 'A catalyst cannot change ΔG or K',
          body: 'A catalyst lowers kinetic barriers for both directions. It speeds the approach to equilibrium but does not move the equilibrium position.',
        },
      ],
      presetAnalogies: {
        neutral: 'Free energy is a direction indicator that combines energy release with dispersal. The activation barrier is a separate hill controlling how quickly the route is taken.',
        gaming: 'ΔG says whether the destination is energetically favourable, while activation energy is the locked gate on the route. A key opens the gate without changing the destination.',
        sports: 'A downhill finish can still require clearing a high hurdle. Thermodynamics sets the favourable endpoint; kinetics sets the difficulty of reaching it.',
        music: 'A mix may have a stable final balance but transition slowly because controls resist change. A catalyst speeds the transition without changing the final balance.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Errors & Exam Traps',
      body: `Follow one sign convention consistently. In chemistry, q > 0 and w > 0 mean energy enters the system; expansion work is negative. Exothermic means ΔH < 0 for the system, not that the system’s temperature must always fall. When reversing or scaling a thermochemical equation, reverse or scale ΔH as well, and include stoichiometric coefficients in formation-enthalpy sums.

Do not define entropy simply as “disorder.” Use energy dispersal, accessible microstates, and multiplicity. A negative system entropy change does not violate the second law if the surroundings gain more entropy. In ΔS = qrev/T, the reversible heat path is used to calculate a state change even when the actual process is irreversible.

Spontaneity and rate are independent. ΔG < 0 does not guarantee a fast reaction, and a catalyst changes neither ΔG° nor K. Use kelvin in TΔS and make enthalpy and entropy units compatible, usually converting J to kJ where needed. Q describes the current composition, K the equilibrium composition, and their comparison determines the direction in which ΔG drives change.`,
      keyTerms: ['sign convention', 'expansion work', 'thermochemical equation', 'microstates', 'second law', 'spontaneity', 'catalyst', 'reaction quotient'],
      callouts: [
        {
          type: 'key-insight',
          heading: 'Separate direction from speed',
          body: 'Thermodynamics compares initial and final states; kinetics studies the pathway and barrier. Write those as separate conclusions in exam answers.',
        },
      ],
      presetAnalogies: {
        neutral: 'A destination may be downhill yet separated by a high pass. Downhill tendency describes spontaneity; the pass controls rate.',
        gaming: 'A quest reward can make completion favourable even when a difficult boss slows progress. Better access changes speed, not the reward balance.',
        sports: 'The scoreboard may favour one final outcome while strong defence delays it. Directional advantage and pace are different questions.',
        music: 'A system can favour a lower-energy mix but transition slowly through resistant controls. Automation speed does not determine the final equilibrium level.',
      },
    },
  ],
}
