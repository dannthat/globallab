import { describe, expect, it } from 'vitest'
import { classifyUserSource } from './useUserLibrary'

function source(name: string, type = '') {
  return classifyUserSource({ name, type })
}

describe('classifyUserSource', () => {
  it('keeps PDF page counting lazy until the reader opens it', () => {
    const result = source('cell-biology-slides.pdf', 'application/pdf')

    expect(result).toMatchObject({
      fileType: 'pdf',
      previewKind: 'pdf',
      pageCount: 0,
      pageCountKnown: false,
    })
    expect(result.previewMessage).toContain('counted when the source is first opened')
  })

  it('classifies JavaScript as inert source code', () => {
    const result = source('simulation.js', 'text/javascript')

    expect(result).toMatchObject({
      fileType: 'code',
      previewKind: 'code',
      pageCountKnown: false,
    })
    expect(result.previewMessage).toContain('never executed')
  })

  it('keeps Markdown distinct from generic text', () => {
    expect(source('lesson-notes.md', 'text/markdown')).toMatchObject({
      fileType: 'markdown',
      previewKind: 'markdown',
    })
  })

  it('recognizes browser-native images as one-page sources', () => {
    expect(source('labelled-cell.png', 'image/png')).toMatchObject({
      fileType: 'image',
      previewKind: 'image',
      pageCount: 1,
      pageCountKnown: true,
    })
  })

  it.each([
    ['chapter.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'document'],
    ['lecture.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'presentation'],
    ['results.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'spreadsheet'],
  ] as const)('marks %s as conversion-required', (name, type, fileType) => {
    const result = source(name, type)

    expect(result).toMatchObject({
      fileType,
      previewKind: 'conversion-required',
      pageCount: 0,
      pageCountKnown: false,
    })
    expect(result.previewMessage).toContain('conversion service is required')
  })

  it('stores an unknown format while reporting preview support honestly', () => {
    const result = source('research.sample', 'application/x-research-sample')

    expect(result).toMatchObject({
      fileType: 'unknown',
      previewKind: 'unsupported',
      pageCount: 0,
      pageCountKnown: false,
    })
    expect(result.previewMessage).toContain('does not have a GlobalLab preview yet')
  })
})
