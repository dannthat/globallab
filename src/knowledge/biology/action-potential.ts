import type { KnowledgeTopic } from '../../types'

export const actionPotential: KnowledgeTopic = {
  id: 'action-potential',
  subjectId: 'biology',
  title: 'Action Potential & Synaptic Transmission',
  subtitle: 'How neurons generate and transmit electrical signals',
  source: {
    name: 'NIH National Institute of General Medical Sciences',
    url: 'https://www.nigms.nih.gov/education',
    license: 'Public Domain',
  },
  sections: [
    {
      id: 'overview',
      heading: 'Electrical Signalling in Neurons',
      body: 'An action potential is a rapid, all-or-nothing change in a neuron’s membrane voltage. Voltage-gated ion channels first reverse and then restore the membrane potential, creating a signal that travels along the axon without losing amplitude. At the axon terminal, synaptic transmission converts the electrical signal into a chemical message that can influence another cell.',
      keyTerms: ['action potential', 'all-or-nothing', 'membrane voltage', 'voltage-gated ion channels', 'axon', 'synaptic transmission'],
      diagram: {
        url: '/diagrams/biology/action-potential.png',
        caption:
          'A neuron with labelled axon, myelin sheath, and nodes of Ranvier.',
        alt: 'Neuron diagram showing soma, axon, myelin sheath sections, nodes of Ranvier, and axon terminals with arrows showing direction of signal propagation',
      },
      callouts: [
        {
          type: 'real-world',
          heading: 'How local anaesthetics work',
          body: 'Drugs like lidocaine block voltage-gated sodium channels in sensory neurons, preventing depolarization from reaching the threshold needed to fire an action potential. Pain signals cannot propagate to the brain. The neuron is unharmed — just silenced.',
        },
      ],
    },
    {
      id: 'resting-potential',
      heading: 'Resting Membrane Potential',
      body: 'The resting membrane potential of approximately −70 mV (inside negative relative to outside) exists because of two factors: the selective permeability of the membrane and the activity of the Na⁺/K⁺ ATPase pump. At rest, the membrane is more permeable to K⁺ than Na⁺. K⁺ ions leak out down their concentration gradient through open K⁺ leak channels, carrying positive charges out and leaving behind negatively charged proteins inside. The Na⁺/K⁺ pump continuously restores the gradients — moving 3 Na⁺ out for every 2 K⁺ in — and contributes to the net negative interior.\n\nThis stored electrical potential is critical because it represents potential energy. When a neuron is stimulated, rapid changes to ion permeability can use this potential energy to generate a fast electrical signal that travels the length of the axon.',
      keyTerms: ['resting membrane potential', '−70 mV', 'K⁺ leak channels', 'Na⁺/K⁺ ATPase', 'selective permeability', 'potential energy'],
      diagram: {
        url: '/diagrams/biology/resting-membrane-potential.png',
        caption: 'Voltage trace of an action potential showing resting, depolarisation, and repolarisation phases.',
        alt: 'Graph of membrane potential vs time showing resting potential at -70mV, threshold at -55mV, depolarisation peak at +40mV, and repolarisation back to resting.',
      },
      presetAnalogies: {
        neutral: 'The resting potential is a compressed spring: stored energy is ready to release, while the pump continually restores the tension after each signal.',
        gaming: 'The resting potential is a charged ability bar maintained by passive regeneration; reaching the trigger releases the stored energy in one complete action.',
        sports: 'It is a sprinter coiled in the blocks: the negative potential is stored tension ready to become rapid forward movement.',
        music: 'The resting potential is a wound music-box spring, holding energy until a trigger releases the full sequence.',
      },
    },
    {
      id: 'depolarization',
      heading: 'Depolarization & the Threshold',
      body: 'An action potential is all-or-nothing because of the voltage-gated Na⁺ channels involved. Below the threshold potential (approximately −55 mV), Na⁺ channels do not open sufficiently and the membrane returns to rest. Once threshold is reached, positive feedback takes over: Na⁺ entry depolarizes the membrane further, which opens more Na⁺ channels, which allows more Na⁺ in — creating a self-amplifying cascade that always produces the same magnitude signal regardless of how much above threshold the original stimulus was.\n\nSignal strength is therefore not encoded in the size of individual action potentials but in their frequency. A weak stimulus might cause 5 action potentials per second; a stronger stimulus causes 50. The nervous system interprets frequency as intensity — a code called rate coding.',
      keyTerms: ['threshold', '−55 mV', 'voltage-gated Na⁺ channels', 'depolarization', 'positive feedback', 'rate coding'],
      equation: 'V_m \\geq -55\\text{ mV} \\Rightarrow \\text{full action potential}',
      presetAnalogies: {
        neutral: 'An action potential is like a trigger: below the required pressure nothing happens, but crossing the threshold releases the full mechanism.',
        gaming: 'It is a fixed-power ability that either fires completely or not at all; signal strength comes from firing it more often, not making each hit larger.',
        sports: 'A starting pistol either fires or does not. Urgency is communicated by how frequently signals arrive, not by a larger individual shot.',
        music: 'Each spike is a fixed event; intensity is carried by tempo, like a faster drum pattern rather than a taller note.',
      },
    },
    {
      id: 'repolarization',
      heading: 'Repolarization & Refractory Periods',
      body: 'Near the action-potential peak, Na⁺ channels inactivate and voltage-gated K⁺ channels open. K⁺ flows out, returning the membrane toward a negative voltage. Because K⁺ channels close slowly, the potential briefly falls below rest to about −80 mV, a phase called hyperpolarization, before leak channels and the Na⁺/K⁺ pump restore resting conditions.\n\nDuring the absolute refractory period, inactivated Na⁺ channels cannot reopen, so another action potential cannot begin. The relative refractory period during hyperpolarization requires a stronger stimulus. These periods limit firing frequency and ensure that propagation moves forward rather than backward.',
      keyTerms: ['repolarization', 'Na⁺ channel inactivation', 'voltage-gated K⁺ channels', 'hyperpolarization', 'absolute refractory period', 'relative refractory period'],
    },
    {
      id: 'synaptic-transmission',
      heading: 'Synaptic Transmission',
      body: 'When an action potential reaches the axon terminal, it triggers voltage-gated Ca²⁺ channels to open. Calcium ions flood into the terminal, causing synaptic vesicles (membrane-bound packages of neurotransmitter) to fuse with the presynaptic membrane and release their neurotransmitter molecules into the synaptic cleft by exocytosis. The neurotransmitters diffuse across the narrow cleft (20–40 nm) and bind to receptors on the postsynaptic membrane.\n\nWhether the postsynaptic neuron fires depends on summation: excitatory inputs (EPSPs) bring the membrane toward threshold; inhibitory inputs (IPSPs) move it away. The postsynaptic neuron integrates all incoming signals simultaneously — spatial summation (multiple synapses firing at once) and temporal summation (repeated signals from one synapse in quick succession) — and fires only if the net effect reaches threshold.',
      keyTerms: ['Ca²⁺', 'neurotransmitter vesicles', 'presynaptic membrane', 'synaptic cleft', 'postsynaptic cell', 'EPSPs', 'IPSPs', 'summation'],
      diagram: {
        url: '/diagrams/biology/synapse-transmission.png',
        caption: 'Synaptic vesicles releasing neurotransmitter into the synaptic cleft.',
        alt: 'Diagram of a synapse showing pre-synaptic terminal, synaptic vesicles, neurotransmitter molecules in the cleft, and post-synaptic receptor proteins.',
      },
      presetAnalogies: {
        neutral: 'A synapse is a vote count: excitatory inputs vote yes, inhibitory inputs vote no, and the next neuron fires only when the net vote crosses threshold.',
        gaming: 'Incoming excitatory hits stack toward a trigger while inhibitory shields subtract from them; the target acts only when the net total crosses the threshold.',
        sports: 'The next neuron is a referee combining simultaneous “go” and “hold” calls and acting only when the go signal clearly wins.',
        music: 'The neuron is a master channel summing inputs that add or reduce gain; output opens only when the combined level crosses threshold.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Exam Mistakes',
      body: 'The resting potential is about −70 mV inside, not positive. K⁺ concentration is high inside and Na⁺ concentration is high outside. Depolarization means the interior becomes less negative. Once threshold is crossed, action potentials are all-or-nothing; stronger stimuli increase frequency, not amplitude.\n\nThe absolute refractory period helps make propagation one-directional. Myelin speeds conduction through saltatory conduction between nodes of Ranvier. Neurotransmitters leave the presynaptic cell and bind receptors on the postsynaptic cell. EPSPs move the cell toward threshold, while IPSPs move it away.',
      keyTerms: ['resting potential', 'depolarization', 'frequency', 'refractory period', 'myelin', 'saltatory conduction', 'nodes of Ranvier', 'presynaptic', 'postsynaptic'],
    },
  ],
}
