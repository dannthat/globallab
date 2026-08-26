// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { StudentProfile } from '../types'
import { useStudentProfile } from './useStudentProfile'

const STORAGE_KEY = 'globallab_profile'
const CREATED_AT = '2026-08-20T10:15:00.000Z'

beforeEach(() => {
  window.localStorage.clear()
})

describe('useStudentProfile', () => {
  it('migrates legacy profile data while preserving valid durable fields', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        interest: '  basketball   tactics ',
        gradeLevel: ' Grade 10 ',
        createdAt: CREATED_AT,
        subjectPreferences: { biology: 'visual-first' },
        ignoredLegacyField: true,
      }),
    )

    const { result } = renderHook(() => useStudentProfile())

    expect(result.current.profile).toEqual({
      interest: 'basketball tactics',
      gradeLevel: 'Grade 10',
      createdAt: CREATED_AT,
      subjectPreferences: { biology: 'visual-first' },
    })
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual(
      result.current.profile,
    )
  })

  it('keeps createdAt and subject preferences when the lens is updated', () => {
    const original: StudentProfile = {
      interest: 'basketball',
      gradeLevel: 'Grade 10',
      createdAt: CREATED_AT,
      subjectPreferences: {
        biology: 'diagram-led',
        chemistry: 'step-by-step',
      },
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(original))
    const { result } = renderHook(() => useStudentProfile())

    act(() => {
      result.current.saveProfile({
        interest: 'music production',
        gradeLevel: 'Grade 11',
      })
    })

    expect(result.current.profile).toEqual({
      ...original,
      interest: 'music production',
      gradeLevel: 'Grade 11',
    })
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}')).toEqual(
      result.current.profile,
    )
  })

  it('adds a createdAt timestamp to a valid legacy profile that lacks one', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        interest: 'gaming',
        subjectPreferences: { mathematics: 'examples' },
      }),
    )

    const { result } = renderHook(() => useStudentProfile())

    expect(result.current.profile?.interest).toBe('gaming')
    expect(result.current.profile?.subjectPreferences).toEqual({
      mathematics: 'examples',
    })
    expect(Number.isFinite(Date.parse(result.current.profile?.createdAt ?? ''))).toBe(
      true,
    )
  })

  it('rejects malformed stored profiles without crashing onboarding', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not-json')

    const { result } = renderHook(() => useStudentProfile())

    expect(result.current.profile).toBeNull()
    expect(result.current.hasProfile).toBe(false)
  })
})
