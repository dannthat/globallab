import { describe, expect, it } from 'vitest'
import type { StudentProfile } from '../types'
import {
  canUseCloudForUserSelection,
  type UserSourceContext,
} from '../services/sourceContext'
import { uploadCompanionKey } from './useCompanionSession'

describe('uploadCompanionKey', () => {
  it('separates exact source text and every explicit V3 profile default', () => {
    const context: UserSourceContext = {
      body: 'Only this uploaded sentence is unclear.',
      anchor: {
        sourceId: 'upload-1',
        sourceKind: 'upload',
        sourceTitle: 'My notes',
        anchorId: 'upload-1::page:2::selection:first',
        anchorLabel: 'My notes - page 2 selection',
        page: 2,
      },
    }
    const profile: StudentProfile = {
      interest: 'gaming',
      gradeLevel: 'Grade 11',
      preferredLanguage: 'English',
      learningGoals: ['Understand difficult material'],
      startingSupport: 'balanced',
      stuckSupport: 'different-explanation',
      createdAt: '2026-08-29T00:00:00.000Z',
    }
    const keyFor = (
      source: UserSourceContext,
      student: StudentProfile,
    ) => uploadCompanionKey(source, student, 'analogy', {})
    const keys = [
      keyFor(context, profile),
      keyFor({ ...context, body: 'A different selected sentence.' }, profile),
      keyFor(context, { ...profile, interest: 'basketball' }),
      keyFor(context, { ...profile, preferredLanguage: 'Arabic' }),
      keyFor(context, { ...profile, learningGoals: ['Prepare for an exam'] }),
      keyFor(context, { ...profile, startingSupport: 'guided' }),
      keyFor(context, { ...profile, stuckSupport: 'hint' }),
    ]

    expect(new Set(keys).size).toBe(keys.length)
  })

  it('separates local and explicitly approved cloud artifacts', () => {
    const context: UserSourceContext = {
      body: 'Only this selected sentence may leave the browser.',
      selectionOnly: true,
      anchor: {
        sourceId: 'upload-privacy',
        sourceKind: 'upload',
        sourceTitle: 'Private notes',
        anchorId: 'upload-privacy::selection',
        anchorLabel: 'Selected text',
      },
    }
    const profile: StudentProfile = {
      interest: 'gaming',
      gradeLevel: 'Grade 11',
      createdAt: '2026-09-01T00:00:00.000Z',
    }

    const localKey = uploadCompanionKey(context, profile, 'analogy', {}, false)
    const cloudKey = uploadCompanionKey(context, profile, 'analogy', {}, true)

    expect(localKey).not.toBe(cloudKey)
    expect(localKey).toContain('local')
    expect(cloudKey).toContain('cloud')
  })

  it('allows cloud only for a bounded explicit upload selection', () => {
    const selection: UserSourceContext = {
      body: 'This sentence was explicitly selected.',
      selectionOnly: true,
      anchor: {
        sourceId: 'private-upload',
        sourceKind: 'upload',
        sourceTitle: 'Private source',
        anchorId: 'private-upload::selection',
        anchorLabel: 'Selected sentence',
      },
    }

    expect(canUseCloudForUserSelection(selection, true)).toBe(true)
    expect(canUseCloudForUserSelection(selection, false)).toBe(false)
    expect(canUseCloudForUserSelection({ ...selection, selectionOnly: false }, true)).toBe(false)
    expect(canUseCloudForUserSelection({
      ...selection,
      inlineData: { mimeType: 'image/jpeg', data: 'page-image' },
    }, true)).toBe(false)
    expect(canUseCloudForUserSelection({
      ...selection,
      body: 'x'.repeat(4_001),
    }, true)).toBe(false)
  })
})
