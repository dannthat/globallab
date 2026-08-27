import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const GENERATOR_PATH = fileURLToPath(
  new URL('./generate-quiz-pool.mjs', import.meta.url),
)
const PROJECT_ROOT = fileURLToPath(new URL('../', import.meta.url))

describe('pre-built topic quiz pools', () => {
  it('validates every production pool against canonical topic evidence', () => {
    const output = execFileSync(
      process.execPath,
      [GENERATOR_PATH, '--validate-only'],
      {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
      },
    )

    expect(output.match(/^valid .+: 40 questions$/gm)).toHaveLength(20)
  })
})
