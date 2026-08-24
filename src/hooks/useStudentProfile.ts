import { useCallback, useState } from 'react'
import type { StudentProfile } from '../types'

const STORAGE_KEY = 'globallab_profile'

function readProfile(): StudentProfile | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as StudentProfile) : null
  } catch {
    return null
  }
}

export function useStudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(readProfile)

  const saveProfile = useCallback((data: Omit<StudentProfile, 'createdAt'>) => {
    const next: StudentProfile = { ...data, createdAt: new Date().toISOString() }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // The profile still works for this session if storage is unavailable.
    }
    setProfile(next)
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
