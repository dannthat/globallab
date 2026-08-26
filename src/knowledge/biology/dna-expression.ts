import type { KnowledgeTopic } from '../../types'

export const dnaExpression: KnowledgeTopic = {
  id: 'dna-expression',
  subjectId: 'biology',
  title: 'DNA Transcription & Translation',
  subtitle: 'How genetic information becomes a protein',
  source: {
    name: 'NIH National Institute of General Medical Sciences',
    url: 'https://www.nigms.nih.gov/education',
    license: 'Public Domain',
  },
  sections: [
    {
      id: 'overview',
      heading: 'From DNA to Protein',
      body: 'Gene expression turns stored genetic information into functional products. Transcription converts a DNA gene into a complementary RNA copy in the nucleus. After RNA processing, translation uses the mature mRNA sequence at a ribosome to build a specific polypeptide from amino acids. This directional flow of information is summarized by the central dogma: DNA → RNA → protein.',
      keyTerms: ['gene expression', 'transcription', 'DNA', 'RNA', 'translation', 'mRNA', 'ribosome', 'polypeptide', 'central dogma'],
      equation: '\\text{DNA} \\rightarrow \\text{RNA} \\rightarrow \\text{Protein}',
      diagram: {
        url: '/diagrams/biology/dna-transcription.png',
        caption:
          'The central dogma: DNA is transcribed to mRNA, which is translated to protein.',
        alt: 'Flow diagram: DNA double helix → RNA polymerase → mRNA strand → ribosome → protein chain',
      },
      callouts: [
        {
          type: 'did-you-know',
          heading: 'Each cell holds ~2 metres of DNA',
          body: 'Every human cell nucleus contains approximately 2 metres of DNA packed into a 6-micrometre space using protein scaffolding called chromatin. Gene expression requires this packaging to be locally unwound before RNA polymerase can access the sequence.',
        },
      ],
    },
    {
      id: 'transcription',
      heading: 'Transcription',
      body: 'RNA polymerase binds a promoter, locally unwinds the DNA, and reads the template strand 3′→5′ while synthesizing complementary pre-mRNA 5′→3′. RNA uses uracil in place of thymine, so adenine in the DNA template pairs with uracil in RNA. Synthesis continues until a termination signal is reached.\n\nDNA is the master copy of all genetic information and must be protected from damage. If ribosomes used DNA directly, the constant mechanical stress of translation would risk breaks, mutations, or permanent loss of the genetic code. By transcribing a disposable mRNA copy, the cell preserves the original blueprint intact in the nucleus while sending working copies into the cytoplasm where protein synthesis happens. mRNA molecules are temporary — they are degraded after use — so errors or damage affect only one batch of proteins, not the genome itself. This separation also allows one gene to be transcribed into thousands of mRNA copies simultaneously, amplifying protein output without duplicating DNA.',
      keyTerms: ['RNA polymerase', 'promoter', 'template strand', 'pre-mRNA', 'uracil', 'termination signal', 'genome'],
      presetAnalogies: {
        neutral: 'DNA is an original blueprint kept in a protected archive; mRNA is a working copy sent to the construction site and discarded after use.',
        gaming: 'DNA is the protected source-code repository; mRNA is a compiled build sent to the game server while the source remains untouched.',
        sports: 'DNA is the coach’s master playbook; mRNA is the single play copied out and carried to the team on the field.',
        music: 'DNA is the original session master; mRNA is an export sent into production while the master files remain pristine.',
      },
    },
    {
      id: 'rna-processing',
      heading: 'RNA Processing',
      body: 'In eukaryotic cells, the first transcript is pre-mRNA and must be processed before leaving the nucleus. A modified 5′ cap protects the RNA and helps the ribosome recognize it. A poly-A tail added to the 3′ end improves stability and assists export. The spliceosome removes non-coding introns and joins coding exons to create mature mRNA.\n\nAlternative splicing can combine exons in different patterns, allowing one gene to produce several related proteins. Once processing is complete, the mature mRNA exits the nucleus through a nuclear pore and enters the cytoplasm.',
      keyTerms: ['pre-mRNA', '5′ cap', 'poly-A tail', 'spliceosome', 'introns', 'exons', 'alternative splicing', 'mature mRNA'],
    },
    {
      id: 'translation',
      heading: 'Translation',
      body: 'The ribosome reads the mRNA sequence in triplets called codons (e.g., AUG, GGC, UAC). Each codon is matched by a tRNA molecule carrying a complementary anticodon sequence. For example, the codon GGC is matched by a tRNA with anticodon CCG, which carries the amino acid glycine. When the correct tRNA enters the ribosome\'s A site, its anticodon forms hydrogen bonds with the mRNA codon, confirming the match. The ribosome then catalyzes the formation of a peptide bond between the incoming amino acid and the growing polypeptide chain at the P site. The ribosome shifts along the mRNA by one codon (translocation), and the cycle repeats. The process is read continuously, codon by codon, until a stop codon (UAA, UAG, or UGA) is encountered — which has no matching tRNA, causing the chain to be released.\n\nTranslation usually begins at AUG, which codes for methionine. The ribosome contains A, P, and E sites for the incoming tRNA, growing chain, and exiting tRNA.',
      keyTerms: ['codons', 'tRNA', 'anticodon', 'amino acid', 'A site', 'P site', 'E site', 'peptide bond', 'AUG', 'stop codons'],
      diagram: {
        url: '/diagrams/biology/translation-ribosome.png',
        caption: 'A ribosome reading mRNA codons and assembling a polypeptide chain.',
        alt: 'Diagram of translation showing ribosome with A, P, and E sites, mRNA strand with codons, tRNA molecules with anticodons and amino acids, and growing polypeptide chain.',
      },
      presetAnalogies: {
        neutral: 'The ribosome is an assembly-line scanner: each codon is a barcode, and the matching tRNA delivers the specified amino-acid cargo.',
        gaming: 'The ribosome is a crafting machine reading recipe steps one at a time while keyed delivery units bring the exact ingredient each step requires.',
        sports: 'Translation is a relay in which each codon calls the numbered runner whose tRNA delivers the next amino acid in strict order.',
        music: 'The ribosome reads mRNA like a step sequencer: every codon triggers the matching tRNA module to add one precise note to the composition.',
      },
    },
    {
      id: 'mutations',
      heading: 'How Mutations Change Expression',
      body: 'Not every mutation breaks a protein — the outcome depends entirely on the type of mutation and its position. A point mutation (single nucleotide change) can result in: (1) a synonymous (silent) mutation, where a different codon still encodes the same amino acid due to codon degeneracy — protein is unchanged; (2) a missense mutation, where the new codon encodes a different amino acid — the protein may function normally, partially, or not at all depending on whether the amino acid change affects the protein\'s shape or active site; (3) a nonsense mutation, where the new codon is a stop codon — translation terminates early, usually producing a non-functional truncated protein.\n\nA frameshift mutation (insertion or deletion of a nucleotide) is typically the most damaging because it shifts the entire reading frame downstream, scrambling every subsequent codon.',
      keyTerms: ['mutation', 'synonymous', 'missense', 'nonsense', 'degenerate', 'frameshift', 'truncated protein', 'reading frame'],
      presetAnalogies: {
        neutral: 'A one-letter recipe typo may change nothing, swap one ingredient, or insert an early stop; deleting a letter shifts how every later word is grouped.',
        gaming: 'Changing one character in a command may do nothing, trigger a different action, or stop execution; deleting one shifts every command segment after it.',
        sports: 'One altered word in a play call may be harmless or change one assignment, while a missing word can shift how every later instruction is understood.',
        music: 'One changed note may be silent, subtle, or disruptive; removing a beat shifts the timing of every note that follows.',
      },
    },
    {
      id: 'exam-traps',
      heading: 'Common Exam Mistakes',
      body: 'Keep direction clear: RNA polymerase reads the DNA template 3′→5′ but synthesizes RNA 5′→3′. DNA uses thymine; RNA uses uracil. Ribosomes never read DNA directly and DNA does not leave the nucleus. Introns are removed, while exons remain in mature mRNA.\n\nOne codon is three mRNA nucleotides and usually specifies one amino acid. The tRNA anticodon is complementary to the codon; it is not the codon itself. AUG is the start codon and codes for methionine. UAA, UAG, and UGA are stop codons and add no amino acid. The genetic code is degenerate but unambiguous: several codons can specify one amino acid, but each codon specifies only one.',
      keyTerms: ['template strand', '5′→3′', 'thymine', 'uracil', 'introns', 'exons', 'codon', 'anticodon', 'AUG'],
    },
  ],
}
