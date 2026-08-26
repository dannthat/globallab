import type { KnowledgeTopic } from '../../types'

export const linearAlgebra: KnowledgeTopic = {
  id: 'linear-algebra',
  subjectId: 'mathematics',
  title: 'Linear Algebra',
  subtitle: 'Vectors, matrices, determinants, and eigenvalues',
  source: {
    name: 'MIT OpenCourseWare 18.06 Linear Algebra',
    url: 'https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/',
    license: 'CC BY-NC-SA 4.0',
  },
  sections: [
    {
      id: 'overview',
      heading: 'Vectors & Vector Spaces',
      body: `A vector is an element of a vector space and may represent displacement, force, data, a polynomial, a function, or another object that supports vector addition and scalar multiplication. In Rn, vectors are ordered coordinate lists. Their geometric length comes from a norm, and the dot product measures alignment through u·v = ||u||||v||cos θ.

A vector space is closed under addition and scalar multiplication and satisfies axioms including associativity, distributivity, and the existence of zero and additive inverses. A subspace must contain zero and remain closed under linear combinations. The span of vectors is the set of all their linear combinations; it is always a subspace and captures every direction reachable from the generating set.

A basis is a linearly independent set that spans the space. Independence means no basis vector is a combination of the others, ensuring unique coordinates. The number of vectors in any basis is the dimension. Giuseppe Peano and others formalised abstract vector-space axioms, while modern linear algebra extends these ideas across geometry, differential equations, quantum states, statistics, graphics, and machine learning.`,
      keyTerms: ['vector', 'vector space', 'dot product', 'subspace', 'linear combination', 'span', 'basis', 'dimension'],
      equation: '\\operatorname{span}\\{v_1,\\ldots,v_k\\}=\\left\\{\\sum_{i=1}^k c_iv_i:c_i\\in\\mathbb F\\right\\}',
      diagram: {
        url: '/diagrams/mathematics/linear-subspace.png',
        caption: 'Two-dimensional linear subspace (plane through origin) in three-dimensional space.',
        alt: 'A shaded plane passing through the origin in three-dimensional coordinates, illustrating closure under vector addition and scalar multiplication.',
      },
      callouts: [
        {
          type: 'key-insight',
          heading: 'Every subspace contains zero',
          body: 'Closure under scalar multiplication forces 0v = 0 into any nonempty subspace. A plane not passing through the origin is an affine set, not a linear subspace.',
        },
      ],
      presetAnalogies: {
        neutral: 'A basis is a minimal set of independent directions from which every vector in the space can be built. Coordinates record the required amounts.',
        gaming: 'Basis vectors are independent movement controls that reach every allowed position. Removing one loses access; adding a dependent one adds no new capability.',
        sports: 'A basis is the smallest set of independent play directions that can generate every formation movement. Coordinates specify how much of each direction to combine.',
        music: 'Basis signals are independent tracks whose weighted mix reconstructs every signal in the space. A redundant track adds no new dimension.',
      },
    },
    {
      id: 'matrices',
      heading: 'Matrix Operations & Systems of Equations',
      body: `A matrix represents a linear transformation after bases are chosen. Multiplying Ax forms linear combinations of A’s columns with coefficients from x. Matrix multiplication composes transformations, so order matters: AB generally differs from BA. The identity matrix leaves vectors unchanged, and an inverse A⁻¹ reverses the transformation when it exists.

The system Ax = b is solved by row operations on the augmented matrix [A|b]. Gaussian elimination uses row swaps, nonzero scaling, and row replacement to reach echelon form without changing the solution set. Pivot positions reveal rank. A system is consistent exactly when b lies in the column space of A; free variables correspond to directions in the nullspace.

For a square matrix, invertibility has many equivalent forms: a pivot in every row and column, trivial nullspace, independent columns, full rank, nonzero determinant, and a unique solution for every b. Factorisation A = LU records elimination as lower- and upper-triangular matrices, allowing many systems with the same A to be solved efficiently. Numerical computation normally favours factorisation over explicitly forming A⁻¹.`,
      keyTerms: ['matrix', 'linear transformation', 'matrix multiplication', 'Gaussian elimination', 'pivot', 'rank', 'column space', 'nullspace'],
      equation: 'A\\vec x=\\vec b, \\qquad A=LU',
      callouts: [
        {
          type: 'real-world',
          heading: 'Matrices compose transformations',
          body: 'Computer graphics combine rotation, scaling, projection, and translation through matrix products. Reversing the product order usually produces a different image.',
        },
      ],
      presetAnalogies: {
        neutral: 'A matrix is a machine that maps input vectors to output vectors. Matrix multiplication connects machines in sequence, so order changes the result.',
        gaming: 'Rotation, scaling, and camera projection are transformation stages. Their matrix order determines the final object position on screen.',
        sports: 'A sequence of tactical transformations moves a formation from one state to another. Applying press then rotate is not generally the same as rotate then press.',
        music: 'A chain of linear processors maps input channels to outputs. Swapping two noncommuting processors changes the final mix.',
      },
    },
    {
      id: 'determinants',
      heading: 'Determinants & Invertibility',
      body: `The determinant assigns a scalar to a square matrix. Geometrically, |det A| is the factor by which the associated linear transformation scales oriented area in two dimensions or volume in higher dimensions. A negative determinant reverses orientation, and determinant zero collapses dimension, making the transformation noninvertible.

Determinants satisfy det(AB) = det A det B and det(Aᵀ) = det A. Swapping two rows reverses the sign, scaling one row scales the determinant, and adding a multiple of one row to another leaves it unchanged. For triangular matrices, the determinant is the product of diagonal entries. These rules make elimination an efficient calculation method.

A square matrix is invertible exactly when det A ≠ 0. Cofactor expansion gives a theoretical formula, and Cramer’s rule expresses components of Ax = b as determinant ratios, but both are inefficient for large numerical systems. Determinants also appear in Jacobian change-of-variables factors, eigenvalue equations, orientation tests, and volume calculations.`,
      keyTerms: ['determinant', 'oriented volume', 'orientation', 'noninvertible', 'triangular matrix', 'cofactor expansion', 'Cramer’s rule', 'Jacobian'],
      equation: '\\det(AB)=\\det(A)\\det(B), \\qquad A^{-1}\\text{ exists}\\iff\\det(A)\\ne0',
      callouts: [
        {
          type: 'key-insight',
          heading: 'Zero determinant means lost dimension',
          body: 'If a transformation flattens a plane into a line or space into a plane, distinct inputs can share one output, so no inverse can recover them.',
        },
      ],
      presetAnalogies: {
        neutral: 'The determinant measures signed volume scaling. Zero means the transformation flattened the space and permanently lost a direction.',
        gaming: 'A transformation can stretch the map, flip it, or collapse it. Determinant size measures scale, sign marks orientation, and zero signals lost information.',
        sports: 'A formation change may expand spacing, reverse orientation, or compress everyone onto one line. The determinant summarises that geometric effect.',
        music: 'A channel transformation may preserve, scale, invert, or collapse independent signal directions. A zero determinant means some source distinction cannot be recovered.',
      },
    },
    {
      id: 'eigenvalues',
      heading: 'Eigenvalues & Eigenvectors',
      body: `A nonzero vector v is an eigenvector of A if Av = λv for some scalar eigenvalue λ. The transformation changes only the vector’s scale and possibly direction sign, not its line. Eigenvalues satisfy det(A − λI) = 0, and each eigenspace is the nullspace of A − λI.

If an n by n matrix has n linearly independent eigenvectors, form P from those eigenvectors and D from the corresponding eigenvalues. Then A = PDP⁻¹ and powers become Ak = PDkP⁻¹. Diagonalisation reveals independent modes of the transformation, but repeated eigenvalues do not guarantee enough eigenvectors; defective matrices require other canonical tools.

Eigenvectors identify natural patterns in dynamical systems. In x′ = Ax, an eigenvector mode evolves as e^{λt}; the sign of the real part of λ determines growth or decay, while complex pairs describe oscillation. Eigenvectors underpin vibration modes, stability, Markov chains, principal component analysis, quantum observables, and Google’s original PageRank method. Gilbert Strang’s linear-algebra teaching emphasises using these structures to understand computations, not just perform them.`,
      keyTerms: ['eigenvector', 'eigenvalue', 'eigenspace', 'characteristic equation', 'diagonalisation', 'defective matrix', 'dynamical system', 'principal component analysis'],
      equation: 'A\\vec v=\\lambda\\vec v, \\qquad \\det(A-\\lambda I)=0',
      callouts: [
        {
          type: 'real-world',
          heading: 'Eigenvectors reveal natural modes',
          body: 'A vibrating structure decomposes into mode shapes that retain their form while their amplitudes oscillate. Engineers use these modes to avoid dangerous resonance.',
        },
      ],
      presetAnalogies: {
        neutral: 'An eigenvector is a special direction a transformation does not turn away from itself. The eigenvalue says how strongly that direction is stretched or reversed.',
        gaming: 'Most movement directions rotate under a map transform, but an eigen-direction stays aligned. Its eigenvalue is the scale modifier applied there.',
        sports: 'A tactical transformation changes most formations, yet certain movement patterns keep their shape and only grow or shrink. Those are system modes.',
        music: 'A normal mode passes through the system without changing its shape, only amplitude and phase. The eigenvalue describes that mode’s response.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Errors & Exam Traps',
      body: `A set is a subspace only if it contains zero and is closed under all linear combinations. A basis must both span and be linearly independent; neither condition alone is enough. Coordinates depend on the chosen basis even though the underlying vector does not. Do not confuse a set of vectors with the matrix that stores them as columns.

Matrix multiplication is not elementwise and generally not commutative. Row operations preserve a system’s solution set but usually change the matrix’s determinant according to specific rules. Rank counts pivots, not rows or columns automatically. A square matrix with no inverse may still map some b values to solutions, but never uniquely for every b.

The determinant is a scalar, not a matrix, and det(A + B) is generally not det A + det B. Eigenvectors must be nonzero, while zero may be an eigenvalue. Solve the characteristic equation for λ and then solve (A − λI)v = 0 for vectors; substituting λ alone does not produce an eigenvector. A repeated eigenvalue may have too few independent eigenvectors for diagonalisation.`,
      keyTerms: ['subspace test', 'basis', 'coordinates', 'matrix multiplication', 'row operation', 'rank', 'determinant', 'diagonalisation'],
      callouts: [
        {
          type: 'key-insight',
          heading: 'Interpret every computation geometrically',
          body: 'Pivots reveal independent directions, determinant reveals volume scaling, and eigenvectors reveal invariant directions. Meaning catches algebra mistakes.',
        },
      ],
      presetAnalogies: {
        neutral: 'Linear-algebra calculations describe geometry beneath the symbols. Translate each result into directions, dimensions, scaling, or solvability to test it.',
        gaming: 'Matrix numbers are engine behaviour in disguise. Interpret rank as available directions, determinant as map scaling, and eigenvectors as invariant movement modes.',
        sports: 'The algebra encodes formation freedom, compression, and stable patterns. A geometric reading exposes results that make no tactical sense.',
        music: 'The matrix encodes channel independence, gain-volume scaling, and natural modes. Listening to that structural meaning helps detect arithmetic errors.',
      },
    },
  ],
}
