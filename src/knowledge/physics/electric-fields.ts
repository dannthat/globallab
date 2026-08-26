import type { KnowledgeTopic } from '../../types'

export const electricFields: KnowledgeTopic = {
  id: 'electric-fields',
  subjectId: 'physics',
  title: "Electric Fields & Gauss's Law",
  subtitle: "Coulomb's law, field lines, and electric potential",
  source: {
    name: 'OpenStax University Physics Volume 2',
    url: 'https://openstax.org/details/books/university-physics-volume-2',
    license: 'CC BY-NC-SA 4.0',
  },
  sections: [
    {
      id: 'overview',
      heading: "Electric Charge & Coulomb's Law",
      body: `Electric charge is a conserved property of matter that occurs in positive and negative forms. Like charges repel and unlike charges attract. Charge is quantised in integer multiples of the elementary charge e, although quarks carry fractional values while confined inside hadrons. In an isolated system, the algebraic total charge remains constant even when electrons move between objects.

Coulomb’s law gives the force between stationary point charges. Its magnitude is proportional to the product of the charge magnitudes and inversely proportional to the square of their separation. The force lies along the line joining the charges. In a medium, electric polarisation reduces the interaction relative to vacuum, represented by replacing the vacuum permittivity with the medium’s permittivity.

For several charges, the net force is the vector sum of the pairwise Coulomb forces. This superposition principle requires direction as well as magnitude; scalar addition is valid only when all forces share one line and signs are assigned consistently. Charles-Augustin de Coulomb quantified the inverse-square relation in the 1780s using a torsion balance, establishing a precise experimental foundation for electrostatics.`,
      keyTerms: ['electric charge', 'conservation of charge', 'quantised', 'elementary charge', 'Coulomb’s law', 'permittivity', 'superposition principle', 'electrostatics'],
      equation: 'F = \\frac{1}{4\\pi\\varepsilon_0}\\frac{|q_1q_2|}{r^2}',
      diagram: {
        url: '/diagrams/physics/electric-field-lines.png',
        caption: 'Electric field lines radiating from a positive point charge.',
        alt: 'Radial electric field lines point outward from a central positive point charge, with equipotential curves perpendicular to the lines.',
      },
      callouts: [
        {
          type: 'key-insight',
          heading: 'Force is a vector',
          body: 'Coulomb’s formula supplies a magnitude. A correct multi-charge solution also resolves the direction of every pairwise force before adding components.',
        },
      ],
      presetAnalogies: {
        neutral: 'Point charges behave like sources of a distance-sensitive push or pull. Doubling their separation reduces the interaction to one quarter.',
        gaming: 'A charged object acts like an area-effect source whose strength falls with distance squared. Nearby targets feel much more influence than distant ones.',
        sports: 'Imagine two players connected by an invisible elastic interaction. The closer they are, the stronger the push or pull they must counter.',
        music: 'Charge interaction resembles a signal whose intensity fades rapidly with distance. Moving twice as far away leaves one quarter of the original strength.',
      },
    },
    {
      id: 'field-lines',
      heading: 'Electric Fields & Field Lines',
      body: `An electric field assigns a force per unit positive test charge to every point in space. A source charge creates the field whether or not a test charge is present; a test charge merely samples it. The field of a positive point charge points radially outward, while the field of a negative charge points inward. Field strength has units of newtons per coulomb, equivalent to volts per metre.

Electric field lines provide a qualitative map. Their tangent gives the field direction, their density indicates relative magnitude, and they begin on positive charge and end on negative charge or at infinity. Lines never cross because the field at one point has only one direction. They are a visual convention, not physical threads, and their number is chosen for clarity rather than counted as a measurable quantity.

Inside a conductor in electrostatic equilibrium, the electric field is zero. Any internal field would drive free charges until redistribution cancelled it. Excess charge resides on the surface, and the field just outside is normal to that surface; a tangential component would move surface charges. Sharp regions have greater surface charge density, which explains strong fields and corona discharge near pointed conductors.`,
      keyTerms: ['electric field', 'test charge', 'field strength', 'field lines', 'electrostatic equilibrium', 'conductor', 'surface charge density', 'corona discharge'],
      equation: '\\vec E = \\frac{\\vec F}{q_0}',
      callouts: [
        {
          type: 'real-world',
          heading: 'A Faraday cage redirects charge',
          body: 'A conducting enclosure redistributes surface charge so the electrostatic field inside is zero. The same principle helps shield sensitive electronics from external electric fields.',
        },
      ],
      presetAnalogies: {
        neutral: 'An electric field is like a map assigning an arrow to every location. Placing a positive test charge reveals the local arrow without creating the map.',
        gaming: 'Think of a vector field covering the entire game world. A test character at any coordinate experiences the direction and strength stored there.',
        sports: 'A field diagram resembles a tactical map showing the push a ball would receive at every position. Denser arrows mark more intense influence.',
        music: 'A field is like a room-wide map of sound pressure direction and strength. A small microphone samples one point without being the source of the pattern.',
      },
    },
    {
      id: 'gauss-law',
      heading: "Gauss's Law",
      body: `Electric flux measures how much electric field passes through an oriented surface. For a small flat element, the contribution is E cos θ dA, where θ is the angle between the field and the outward area normal. Flux is positive when the field exits a closed surface and negative when it enters. A field tangent to the surface contributes no flux through that element.

Gauss’s law states that the net electric flux through any closed surface equals the enclosed charge divided by the vacuum permittivity. Charges outside the surface can influence the local field, but their field lines enter and leave in equal net amounts, producing zero total contribution to closed-surface flux. The law is exact for any closed shape and is one of Maxwell’s equations.

Gauss’s law becomes a practical field-calculation tool only when symmetry makes the field magnitude constant on suitable parts of a Gaussian surface and fixes its direction relative to the area vector. Spherical symmetry suits point charges and charged spheres, cylindrical symmetry suits long line charges, and planar symmetry suits very large sheets. A Gaussian surface is imaginary; it is chosen to simplify the flux integral and is not a material boundary.`,
      keyTerms: ['electric flux', 'area normal', 'closed surface', 'Gauss’s law', 'enclosed charge', 'Gaussian surface', 'spherical symmetry', 'cylindrical symmetry'],
      equation: '\\oint_S \\vec E \\cdot d\\vec A = \\frac{Q_{\\mathrm{enc}}}{\\varepsilon_0}',
      callouts: [
        {
          type: 'key-insight',
          heading: 'Zero flux does not mean zero field',
          body: 'A uniform field can enter one side of a closed box and leave the other, giving zero net flux even though the field is nonzero everywhere on the box.',
        },
      ],
      presetAnalogies: {
        neutral: 'Imagine counting air that leaves a closed balloon minus air that enters it. The net outward flow reveals sources inside, not currents merely passing through.',
        gaming: 'A closed boundary counts net units crossing outward. Outside spawners may send units through, but only an enclosed spawner changes the net count.',
        sports: 'Count players leaving a fenced training zone minus those entering it. Through-traffic cancels, while players originating inside create a net outward total.',
        music: 'A closed surface acts like a balance of signal flow through all ports. External signals that enter and exit cancel in the net total.',
      },
    },
    {
      id: 'electric-potential',
      heading: 'Electric Potential & Voltage',
      body: `Electric potential energy belongs to a configuration of charges, while electric potential is potential energy per unit charge at a location. Potential is a scalar, so contributions from multiple source charges add algebraically. The potential difference ΔV between two points equals the change in potential energy per unit charge, and one volt is one joule per coulomb.

The electric field points in the direction of steepest decrease of potential. For a displacement, ΔV is the negative line integral of the field along the path. Electrostatic fields are conservative, so the potential difference depends only on endpoints, not on the route. Equipotential surfaces intersect field lines at right angles because motion along an equipotential requires no electric work.

For a point charge with zero potential chosen at infinity, V = kq/r. The sign of q determines the sign of potential, whereas the field magnitude remains nonnegative and its vector direction is treated separately. A charged particle released from rest converts electric potential energy into kinetic energy when the electric force moves it toward lower potential energy; a negative charge can therefore accelerate toward higher electric potential.`,
      keyTerms: ['electric potential energy', 'electric potential', 'potential difference', 'volt', 'line integral', 'conservative field', 'equipotential surface', 'kinetic energy'],
      equation: '\\Delta V = -\\int_A^B \\vec E \\cdot d\\vec l, \\qquad U = qV',
      callouts: [
        {
          type: 'real-world',
          heading: 'Voltage is energy per charge',
          body: 'A 9 V battery can transfer up to 9 joules of electrical energy per coulomb through an external circuit; voltage is not the amount of charge stored.',
        },
      ],
      presetAnalogies: {
        neutral: 'Potential resembles height on a landscape, while the field resembles the downhill slope. A charge’s sign determines whether lower electrical energy corresponds to lower or higher potential.',
        gaming: 'Potential is a scalar height map and the electric field is its downhill direction. Positive and negative characters respond oppositely to the same map.',
        sports: 'A ball gains or loses gravitational energy across different court heights. Electric potential plays the map-like role, while charge determines how strongly it matters.',
        music: 'Voltage resembles a level difference that can drive signal flow. It measures available energy per unit charge, not the amount of charge itself.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Errors & Exam Traps',
      body: `Keep force, field, potential energy, and potential distinct. Force and field are vectors; potential energy and potential are scalars. The source charges create E and V, while a test charge experiences F = qE and U = qV. A negative test charge feels a force opposite to the field direction, but the field itself does not reverse when the test charge changes.

In Gauss’s law, Qenc includes only charge inside the chosen closed surface, while the flux integral uses the total electric field from all charges. Symmetry—not the mere existence of a closed surface—allows E to be removed from the integral. Zero enclosed charge implies zero net flux, not necessarily zero field. Do not use open surfaces in Gauss’s law without completing them into a closed surface.

Signs and geometry cause most potential errors. Electric potential from a negative source charge is negative relative to infinity, and electric potential energy is qV. The relation E = ΔV/d applies in magnitude only for a uniform field along the displacement. Always define the zero of potential, use metres in inverse-distance formulas, and keep the area vector outward for closed-surface flux.`,
      keyTerms: ['force', 'electric field', 'potential energy', 'electric potential', 'test charge', 'enclosed charge', 'net flux', 'uniform field'],
      callouts: [
        {
          type: 'key-insight',
          heading: 'Write the owner of each quantity',
          body: 'Label fields and potentials by their source charges, then introduce the test charge only in F = qE or U = qV. This prevents sign and dependency errors.',
        },
      ],
      presetAnalogies: {
        neutral: 'Field and potential are properties of the map; force and energy depend on the traveller placed on it. Keeping map quantities separate from traveller quantities prevents most mistakes.',
        gaming: 'The level stores a hazard field and potential map. A character’s class or sign determines the force and energy it experiences there.',
        sports: 'The court’s slope exists before a ball is placed on it. The ball’s properties determine its response, just as test charge determines force and energy.',
        music: 'A mixer’s voltage map exists independently of a connected load. The connected component determines the resulting current or energy transfer.',
      },
    },
  ],
}
