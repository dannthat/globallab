import { access, mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..')
const KNOWLEDGE_ROOT = path.join(PROJECT_ROOT, 'src', 'knowledge')
const QUIZ_ROOT = path.join(KNOWLEDGE_ROOT, 'quizzes')
const SUBJECT_IDS = ['biology', 'physics', 'chemistry', 'mathematics']
const EXPECTED_TOPIC_COUNT = 20
const QUESTIONS_PER_TOPIC = 40
// The brief named gemini-2.0-flash, but that endpoint was shut down on
// 2026-06-01. Google lists gemini-3.6-flash as its supported replacement.
const MODEL = process.env.GEMINI_QUIZ_MODEL?.trim() || 'gemini-3.6-flash'
const MAX_GENERATION_ATTEMPTS = 4
const GENERATOR_META_QUESTION_PATTERN =
  /source[- ]backed|directly supported by this section|which claim belongs with this section|section-specific review|complete this source|topic:\s*[“"]|\[(?:missing|blank)[^\]]*\]|fill\s+in\s+the\s+blank|which term (?:correctly )?completes|what belongs in the blank|identify the missing mathematical term|statement accurately summarises an important idea|would be useful when solving a problem/i
const GENERATOR_META_MISCONCEPTION_PATTERN =
  /attributing evidence from another part|replacing .+ with a related but contextually incorrect term|generic misconception|common mistake from this section/i

function fail(message) {
  throw new Error(message)
}

function propertyName(node, sourceFile) {
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
    return node.text
  }
  fail(`Unsupported computed property at ${sourceFile.fileName}:${sourceFile.getLineAndCharacterOfPosition(node.pos).line + 1}`)
}

function unwrapExpression(node) {
  let current = node
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isNonNullExpression(current)
  ) {
    current = current.expression
  }
  return current
}

function literalValue(input, sourceFile) {
  const node = unwrapExpression(input)

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text
  }
  if (ts.isNumericLiteral(node)) return Number(node.text)
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false
  if (node.kind === ts.SyntaxKind.NullKeyword) return null

  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    const value = Number(node.operand.text)
    if (node.operator === ts.SyntaxKind.MinusToken) return -value
    if (node.operator === ts.SyntaxKind.PlusToken) return value
  }

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => {
      if (ts.isSpreadElement(element)) {
        fail(`Spread elements are not allowed in knowledge data (${sourceFile.fileName})`)
      }
      return literalValue(element, sourceFile)
    })
  }

  if (ts.isObjectLiteralExpression(node)) {
    const result = {}
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property)) {
        fail(`Only literal property assignments are allowed in knowledge data (${sourceFile.fileName})`)
      }
      result[propertyName(property.name, sourceFile)] = literalValue(property.initializer, sourceFile)
    }
    return result
  }

  const location = sourceFile.getLineAndCharacterOfPosition(node.pos)
  fail(
    `Non-literal knowledge expression (${ts.SyntaxKind[node.kind]}) at ${sourceFile.fileName}:${location.line + 1}`,
  )
}

export function parseTopicSource(sourceText, fileName = 'topic.ts') {
  const sourceFile = ts.createSourceFile(
    fileName,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue
    const isExported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    )
    if (!isExported) continue

    for (const declaration of statement.declarationList.declarations) {
      if (!declaration.initializer) continue
      const candidate = literalValue(declaration.initializer, sourceFile)
      if (
        candidate &&
        typeof candidate === 'object' &&
        typeof candidate.id === 'string' &&
        typeof candidate.subjectId === 'string' &&
        Array.isArray(candidate.sections)
      ) {
        return candidate
      }
    }
  }

  fail(`No exported literal KnowledgeTopic found in ${fileName}`)
}

function validateCanonicalTopic(topic, expectedSubjectId, filePath) {
  if (!topic.id.trim()) fail(`Topic ID is empty in ${filePath}`)
  if (topic.subjectId !== expectedSubjectId) {
    fail(
      `Subject mismatch in ${filePath}: directory=${expectedSubjectId}, topic=${topic.subjectId}`,
    )
  }
  if (!Array.isArray(topic.sections) || ![5, 6].includes(topic.sections.length)) {
    fail(`${topic.id} must contain 5 or 6 sections; found ${topic.sections?.length ?? 0}`)
  }
  if (
    topic.sections.length === 6 &&
    topic.sections[topic.sections.length - 1]?.id !== 'exam-traps'
  ) {
    fail(`${topic.id} may contain a sixth section only when it is the exam-traps recap`)
  }

  const sectionIds = new Set()
  for (const section of topic.sections) {
    if (!section || typeof section !== 'object') fail(`${topic.id} contains an invalid section`)
    if (typeof section.id !== 'string' || !section.id.trim()) {
      fail(`${topic.id} contains a section without an ID`)
    }
    if (sectionIds.has(section.id)) fail(`${topic.id} repeats section ID ${section.id}`)
    sectionIds.add(section.id)
    if (typeof section.heading !== 'string' || !section.heading.trim()) {
      fail(`${topic.id}/${section.id} has no heading`)
    }
    if (typeof section.body !== 'string' || !section.body.trim()) {
      fail(`${topic.id}/${section.id} has no canonical body text`)
    }
  }
}

export async function discoverTopics(knowledgeRoot = KNOWLEDGE_ROOT) {
  const topics = []

  for (const subjectId of SUBJECT_IDS) {
    const subjectDirectory = path.join(knowledgeRoot, subjectId)
    const entries = await readdir(subjectDirectory, { withFileTypes: true })
    const topicFiles = entries
      .filter(
        (entry) =>
          entry.isFile() && entry.name.endsWith('.ts') && entry.name !== 'index.ts',
      )
      .map((entry) => path.join(subjectDirectory, entry.name))
      .sort((left, right) => left.localeCompare(right))

    for (const filePath of topicFiles) {
      const sourceText = await readFile(filePath, 'utf8')
      const topic = parseTopicSource(sourceText, filePath)
      validateCanonicalTopic(topic, subjectId, filePath)
      topics.push(topic)
    }
  }

  if (topics.length !== EXPECTED_TOPIC_COUNT) {
    fail(`Expected ${EXPECTED_TOPIC_COUNT} knowledge topics; discovered ${topics.length}`)
  }

  const ids = new Set()
  for (const topic of topics) {
    if (ids.has(topic.id)) fail(`Duplicate topic ID discovered: ${topic.id}`)
    ids.add(topic.id)
  }

  return topics
}

export function selectQuizSections(topic) {
  if (topic.sections.length === 5) return topic.sections
  if (
    topic.sections.length === 6 &&
    topic.sections[topic.sections.length - 1]?.id === 'exam-traps'
  ) {
    return topic.sections
  }
  fail(`${topic.id} must expose five sections or six sections ending in exam-traps`)
}

export function questionQuotas(sectionCount) {
  if (sectionCount === 5) return [8, 8, 8, 8, 8]
  if (sectionCount === 6) return [7, 7, 7, 7, 6, 6]
  fail(`Quiz generation requires five or six instructional sections; received ${sectionCount}`)
}

function responseSchema(questionCount) {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      questions: {
        type: 'array',
        minItems: questionCount,
        maxItems: questionCount,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            question: { type: 'string', minLength: 12 },
            options: {
              type: 'array',
              minItems: 4,
              maxItems: 4,
              uniqueItems: true,
              items: { type: 'string', minLength: 1 },
            },
            correctIndex: { type: 'integer', minimum: 0, maximum: 3 },
            explanation: { type: 'string', minLength: 20 },
            sourceEvidence: { type: 'string', minLength: 12 },
            misconceptionTargeted: { type: 'string', minLength: 8 },
          },
          required: [
            'question',
            'options',
            'correctIndex',
            'explanation',
            'sourceEvidence',
            'misconceptionTargeted',
          ],
        },
      },
    },
    required: ['questions'],
  }
}

function stableSeed(value) {
  let hash = 2166136261
  for (const character of value) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function generationPrompt(topic, section, questionCount, retryReason = '') {
  return `You are creating a source-grounded mastery pool for a digital textbook.

Canonical subject: ${topic.subjectId}
Canonical topic: ${topic.title} (${topic.id})
Canonical section: ${section.heading} (${section.id})

CANONICAL SECTION BODY — this is the only factual source you may use:
<source>
${section.body}
</source>

Return exactly ${questionCount} distinct multiple-choice questions.
- Test conceptual understanding or a calculation explicitly supported by the source.
- Each question must have exactly four concise, mutually exclusive options.
- Make one and only one option correct.
- Distribute correctIndex across 0, 1, 2, and 3 as evenly as mathematically possible within this batch.
- explanation must contain exactly two clear sentences: why the answer is correct, then why the targeted misconception fails.
- sourceEvidence must be one contiguous, verbatim excerpt copied character-for-character from the canonical body. Never paraphrase it and never add ellipses.
- misconceptionTargeted must name the specific exam trap, not a generic phrase.
- Write natural student-facing questions. Never mention the source, section, topic label, item number, generation process, or answer-selection task.
- Do not use fill-in-the-blank prompts. Prefer explanation, prediction, comparison, application, or calculation.
- Make distractors plausible consequences of specific misconceptions rather than unrelated facts.
- Do not introduce facts, values, names, or claims absent from the canonical body.
${retryReason ? `\nThe previous response failed validation. Correct every issue below:\n${retryReason}\n` : ''}`
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function sentenceCount(value) {
  const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' })
  return [...segmenter.segment(value)].filter(({ segment }) => segment.trim()).length
}

function questionId(topicId, sectionId, index) {
  return `${topicId}--${sectionId}--q${index + 1}`
}

export function validateSectionQuestions(rawQuestions, topic, section, expectedCount) {
  const errors = []
  if (!Array.isArray(rawQuestions)) {
    return { errors: ['questions must be an array'], questions: [] }
  }
  if (rawQuestions.length !== expectedCount) {
    errors.push(`expected ${expectedCount} questions, received ${rawQuestions.length}`)
  }

  const seenQuestions = new Set()
  const seenMisconceptions = new Set()
  const questions = rawQuestions.map((raw, index) => {
    const prefix = `question ${index + 1}`
    const question = normalizeText(raw?.question)
    const explanation = normalizeText(raw?.explanation)
    const sourceEvidence = normalizeText(raw?.sourceEvidence)
    const misconceptionTargeted = normalizeText(raw?.misconceptionTargeted)
    const options = Array.isArray(raw?.options)
      ? raw.options.map((option) => normalizeText(option))
      : []
    const correctIndex = raw?.correctIndex

    if (!question) errors.push(`${prefix}: question is empty`)
    if (GENERATOR_META_QUESTION_PATTERN.test(question) || /_{2,}/.test(question)) {
      errors.push(`${prefix}: question contains generator-facing or fill-in-the-blank wording`)
    }
    const normalizedQuestion = question.toLocaleLowerCase('en-US')
    if (seenQuestions.has(normalizedQuestion)) errors.push(`${prefix}: duplicate question`)
    seenQuestions.add(normalizedQuestion)

    if (options.length !== 4) errors.push(`${prefix}: options must contain exactly four items`)
    if (options.some((option) => !option)) errors.push(`${prefix}: options cannot be empty`)
    if (new Set(options.map((option) => option.toLocaleLowerCase('en-US'))).size !== 4) {
      errors.push(`${prefix}: options must be mutually distinct`)
    }
    if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      errors.push(`${prefix}: correctIndex must be an integer from 0 to 3`)
    }
    if (sentenceCount(explanation) !== 2) {
      errors.push(`${prefix}: explanation must contain exactly two complete sentences`)
    }
    if (!sourceEvidence || !section.body.includes(sourceEvidence)) {
      errors.push(`${prefix}: sourceEvidence is not an exact substring of the canonical body`)
    }
    if (!misconceptionTargeted) {
      errors.push(`${prefix}: misconceptionTargeted is empty`)
    } else {
      const normalizedMisconception = misconceptionTargeted.toLocaleLowerCase('en-US')
      if (GENERATOR_META_MISCONCEPTION_PATTERN.test(misconceptionTargeted)) {
        errors.push(`${prefix}: misconceptionTargeted is generic or generator-facing`)
      }
      if (seenMisconceptions.has(normalizedMisconception)) {
        errors.push(`${prefix}: misconceptionTargeted is duplicated in this section`)
      }
      seenMisconceptions.add(normalizedMisconception)
    }

    return {
      id: questionId(topic.id, section.id, index),
      sectionId: section.id,
      question,
      options,
      correctIndex,
      explanation,
      sourceEvidence,
      misconceptionTargeted,
    }
  })

  if (expectedCount > 1) {
    const correctIndexCounts = [0, 0, 0, 0]
    for (const question of questions) {
      if (
        Number.isInteger(question.correctIndex) &&
        question.correctIndex >= 0 &&
        question.correctIndex <= 3
      ) {
        correctIndexCounts[question.correctIndex] += 1
      }
    }
    if (Math.max(...correctIndexCounts) - Math.min(...correctIndexCounts) > 1) {
      errors.push(
        `correctIndex must be evenly distributed; received ${correctIndexCounts.join('/')}`,
      )
    }
  }

  return { errors, questions }
}

export function validateTopicQuizPool(pool, topic) {
  const errors = []
  if (!pool || typeof pool !== 'object') return ['pool must be an object']
  const poolKeys = Object.keys(pool).sort().join(',')
  if (poolKeys !== ['questions', 'subjectId', 'topicId'].join(',')) {
    errors.push('pool must contain exactly topicId, subjectId, and questions')
  }
  if (pool.topicId !== topic.id) errors.push(`topicId must be ${topic.id}`)
  if (pool.subjectId !== topic.subjectId) errors.push(`subjectId must be ${topic.subjectId}`)
  if (!Array.isArray(pool.questions)) return [...errors, 'questions must be an array']
  if (pool.questions.length !== QUESTIONS_PER_TOPIC) {
    errors.push(`expected ${QUESTIONS_PER_TOPIC} questions, received ${pool.questions.length}`)
  }

  const quizSections = selectQuizSections(topic)
  const quotas = questionQuotas(quizSections.length)
  const sectionMap = new Map(quizSections.map((section) => [section.id, section]))
  const counts = new Map(quizSections.map((section) => [section.id, 0]))
  const seenIds = new Set()
  const seenQuestions = new Set()
  const seenMisconceptions = new Set()
  const correctIndexCounts = new Map(
    quizSections.map((section) => [section.id, [0, 0, 0, 0]]),
  )

  pool.questions.forEach((raw, index) => {
    const prefix = `questions[${index}]`
    const sectionEntry = sectionMap.get(raw?.sectionId)
    if (!sectionEntry) {
      errors.push(`${prefix}.sectionId does not belong to ${topic.id}`)
      return
    }
    counts.set(raw.sectionId, (counts.get(raw.sectionId) ?? 0) + 1)

    if (typeof raw.id !== 'string' || !raw.id.trim()) {
      errors.push(`${prefix}.id must be a non-empty string`)
    } else {
      const sequence = counts.get(raw.sectionId)
      const acceptedIds = [
        `${topic.id}--${raw.sectionId}--q${sequence}`,
        `${topic.id}::${raw.sectionId}::${String(sequence).padStart(2, '0')}`,
      ]
      if (!acceptedIds.includes(raw.id)) {
        errors.push(`${prefix}.id must match its deterministic topic/section sequence`)
      }
    }
    if (seenIds.has(raw.id)) errors.push(`${prefix}.id is duplicated`)
    seenIds.add(raw.id)

    const result = validateSectionQuestions([raw], topic, sectionEntry, 1)
    for (const error of result.errors) errors.push(`${prefix}: ${error.replace('question 1: ', '')}`)

    const normalizedQuestion = normalizeText(raw.question).toLocaleLowerCase('en-US')
    if (seenQuestions.has(normalizedQuestion)) errors.push(`${prefix}.question is duplicated in topic`)
    seenQuestions.add(normalizedQuestion)

    const normalizedMisconception = normalizeText(raw.misconceptionTargeted).toLocaleLowerCase('en-US')
    if (seenMisconceptions.has(normalizedMisconception)) {
      errors.push(`${prefix}.misconceptionTargeted is duplicated in topic`)
    }
    seenMisconceptions.add(normalizedMisconception)

    if (
      Number.isInteger(raw.correctIndex) &&
      raw.correctIndex >= 0 &&
      raw.correctIndex <= 3
    ) {
      correctIndexCounts.get(raw.sectionId)[raw.correctIndex] += 1
    }
  })

  quizSections.forEach((section, index) => {
    const actual = counts.get(section.id) ?? 0
    if (actual === 0) {
      errors.push(`${section.id} must be represented by at least one question`)
    }
    if (actual !== quotas[index]) {
      errors.push(`${section.id} must contain ${quotas[index]} questions; found ${actual}`)
    }
    const answerCounts = correctIndexCounts.get(section.id)
    if (Math.max(...answerCounts) - Math.min(...answerCounts) > 1) {
      errors.push(
        `${section.id} correctIndex must be evenly distributed; received ${answerCounts.join('/')}`,
      )
    }
  })

  return errors
}

function retryableError(error) {
  const status = Number(error?.status ?? error?.code)
  return status === 429 || (status >= 500 && status <= 599)
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function generateSectionQuestions(client, topic, section, questionCount) {
  let retryReason = ''
  let lastError = null

  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
    try {
      const response = await client.models.generateContent({
        model: MODEL,
        contents: generationPrompt(topic, section, questionCount, retryReason),
        config: {
          seed: stableSeed(`${topic.id}:${section.id}`),
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
          responseJsonSchema: responseSchema(questionCount),
        },
      })

      const responseText = normalizeText(response.text)
      if (!responseText) fail('provider returned an empty response')
      const parsed = JSON.parse(responseText)
      const validation = validateSectionQuestions(
        parsed.questions,
        topic,
        section,
        questionCount,
      )
      if (validation.errors.length === 0) return validation.questions

      retryReason = validation.errors.map((error) => `- ${error}`).join('\n')
      lastError = new Error(retryReason)
    } catch (error) {
      lastError = error
      retryReason = `- ${error instanceof Error ? error.message : String(error)}`
      if (!retryableError(error) && attempt === MAX_GENERATION_ATTEMPTS) break
    }

    if (attempt < MAX_GENERATION_ATTEMPTS) {
      await wait(700 * 2 ** (attempt - 1))
    }
  }

  fail(
    `Failed to generate valid questions for ${topic.id}/${section.id} after ${MAX_GENERATION_ATTEMPTS} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  )
}

async function readPool(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'))
}

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function writePoolAtomically(pool, outputPath) {
  await mkdir(path.dirname(outputPath), { recursive: true })
  const temporaryPath = `${outputPath}.${process.pid}.tmp`
  await writeFile(temporaryPath, `${JSON.stringify(pool, null, 2)}\n`, 'utf8')
  await rename(temporaryPath, outputPath)
}

async function generateTopic(client, topic, force) {
  const outputPath = path.join(QUIZ_ROOT, `${topic.id}.json`)
  if (!force && (await fileExists(outputPath))) {
    const existing = await readPool(outputPath)
    const errors = validateTopicQuizPool(existing, topic)
    if (errors.length === 0) {
      console.log(`skip ${topic.id}: existing verified pool`)
      return
    }
    console.warn(`regenerate ${topic.id}: existing pool failed validation`)
  }

  const questions = []
  const quizSections = selectQuizSections(topic)
  const quotas = questionQuotas(quizSections.length)
  for (let index = 0; index < quizSections.length; index += 1) {
    const section = quizSections[index]
    const questionCount = quotas[index]
    console.log(`generate ${topic.id}/${section.id}: ${questionCount} questions`)
    questions.push(
      ...(await generateSectionQuestions(client, topic, section, questionCount)),
    )
  }

  const pool = { topicId: topic.id, subjectId: topic.subjectId, questions }
  const errors = validateTopicQuizPool(pool, topic)
  if (errors.length > 0) fail(`${topic.id} failed final validation:\n${errors.join('\n')}`)
  await writePoolAtomically(pool, outputPath)
  console.log(`wrote ${path.relative(PROJECT_ROOT, outputPath)} (${questions.length} questions)`)
}

function usage() {
  console.log(`Usage:
  node scripts/generate-quiz-pool.mjs [--topic <topic-id>] [--force]
  node scripts/generate-quiz-pool.mjs --validate [--topic <topic-id>]

Environment:
  GEMINI_API_KEY or GOOGLE_API_KEY is required for generation.
  GEMINI_QUIZ_MODEL optionally overrides the default ${MODEL} model.`)
}

function parseArguments(argv) {
  const options = { force: false, help: false, topicId: null, validateOnly: false }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--force') options.force = true
    else if (argument === '--validate' || argument === '--validate-only') {
      options.validateOnly = true
    }
    else if (argument === '--help' || argument === '-h') options.help = true
    else if (argument === '--topic') {
      options.topicId = argv[index + 1] ?? null
      index += 1
      if (!options.topicId) fail('--topic requires a topic ID')
    } else {
      fail(`Unknown argument: ${argument}`)
    }
  }
  return options
}

async function validateFiles(topics) {
  let invalid = 0
  for (const topic of topics) {
    const outputPath = path.join(QUIZ_ROOT, `${topic.id}.json`)
    if (!(await fileExists(outputPath))) {
      console.error(`missing ${path.relative(PROJECT_ROOT, outputPath)}`)
      invalid += 1
      continue
    }
    try {
      const pool = await readPool(outputPath)
      const errors = validateTopicQuizPool(pool, topic)
      if (errors.length > 0) {
        console.error(`${topic.id}:\n${errors.map((error) => `  - ${error}`).join('\n')}`)
        invalid += 1
      } else {
        console.log(`valid ${topic.id}: ${pool.questions.length} questions`)
      }
    } catch (error) {
      console.error(`${topic.id}: ${error instanceof Error ? error.message : String(error)}`)
      invalid += 1
    }
  }
  if (invalid > 0) fail(`${invalid} quiz pool(s) missing or invalid`)
}

async function createGeminiClient(apiKey) {
  let GoogleGenAI
  try {
    ;({ GoogleGenAI } = await import('@google/genai'))
  } catch (error) {
    fail(
      `Generation requires @google/genai. Validation does not load it. ${error instanceof Error ? error.message : String(error)}`,
    )
  }
  return new GoogleGenAI({ apiKey })
}

async function main() {
  const options = parseArguments(process.argv.slice(2))
  if (options.help) {
    usage()
    return
  }

  const discovered = await discoverTopics()
  const topics = options.topicId
    ? discovered.filter((topic) => topic.id === options.topicId)
    : discovered
  if (topics.length === 0) fail(`Unknown topic: ${options.topicId}`)

  if (options.validateOnly) {
    await validateFiles(topics)
    return
  }

  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()
  if (!apiKey) {
    fail('Set GEMINI_API_KEY or GOOGLE_API_KEY before generating quiz pools.')
  }

  const client = await createGeminiClient(apiKey)
  await mkdir(QUIZ_ROOT, { recursive: true })
  for (const topic of topics) await generateTopic(client, topic, options.force)
}

const isMainModule = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false

if (isMainModule) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
