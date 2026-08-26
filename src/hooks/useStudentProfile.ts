import { useCallback, useState } from 'react'
import type { StudentProfile } from '../types'

const STORAGE_KEY = 'globallab_profile'
const MAX_INTEREST_LENGTH = 60

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

function normalizeSubjectPreferences(value: unknown) {
  if (!isRecord(value)) return undefined

  const entries = Object.entries(value).filter(
    ([subjectId, preference]) =>
      subjectId.trim().length > 0 && typeof preference === 'string',
  ) as Array<[string, string]>

  return Object.fromEntries(entries)
}

function migrateProfile(
  value: unknown,
  fallbackCreatedAt: string,
): StudentProfile | null {
  if (!isRecord(value) || typeof value.interest !== 'string') return null

  const interest = normalizeText(value.interest).slice(0, MAX_INTEREST_LENGTH)
  if (!interest) return null

  const hasValidCreatedAt =
    typeof value.createdAt === 'string' &&
    value.createdAt.trim().length > 0 &&
    Number.isFinite(Date.parse(value.createdAt))
  const next: StudentProfile = {
    interest,
    createdAt: hasValidCreatedAt
      ? (value.createdAt as string)
      : fallbackCreatedAt,
  }

  if (typeof value.gradeLevel === 'string') {
    const gradeLevel = normalizeText(value.gradeLevel)
    if (gradeLevel) next.gradeLevel = gradeLevel
  }

  const subjectPreferences = normalizeSubjectPreferences(value.subjectPreferences)
  if (subjectPreferences) next.subjectPreferences = subjectPreferences

  return next
}

function persistProfile(profile: StudentProfile) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // The profile still works for this session if storage is unavailable.
  }
}

function readProfile(): StudentProfile | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored) as unknown
    const profile = migrateProfile(parsed, new Date().toISOString())
    if (profile && JSON.stringify(profile) !== JSON.stringify(parsed)) {
      persistProfile(profile)
    }
    return profile
  } catch {
    return null
  }
}

export function useStudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(readProfile)

  const saveProfile = useCallback((data: Omit<StudentProfile, 'createdAt'>) => {
    const savedAt = new Date().toISOString()
    setProfile((current) => {
      const next = migrateProfile(
        {
          ...current,
          ...data,
          createdAt: current?.createdAt ?? savedAt,
        },
        savedAt,
      )
      if (!next) return current
      persistProfile(next)
      return next
    })
  }, [])

  const clearProfile = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore blocked storage and still clear the in-memory profile.
    }
    setProfile(null)
  }, [])

  return { profile, hasProfile: profile !== null, saveProfile, clearProfile }
}
