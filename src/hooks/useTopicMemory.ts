import { useCallback, useState } from 'react'
import type { StudyMode, TopicPreference, TopicPreferences } from '../types'

const STORAGE_KEY = 'globallab_topic_prefs'

function readPreferences(): TopicPreferences {
  if (typeof window === 'undefined') return {}

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as TopicPreferences) : {}
  } catch {
    return {}
  }
}

export function useTopicMemory(topicId: string) {
  const [preference, setPreference] = useState<TopicPreference | undefined>(
    () => readPreferences()[topicId],
  )

  const savePreferredMode = useCallback(
    (preferredMode: StudyMode) => {
      const nextPreference: TopicPreference = {
        preferredMode,
        savedAt: new Date().toISOString(),
      }

      try {
        const preferences = readPreferences()
        preferences[topicId] = nextPreference
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
      } catch {
        // The UI still responds when storage is unavailable or blocked.
      }

      setPreference(nextPreference)
    },
    [topicId],
  )

  return {
    preferredMode: preference?.preferredMode,
    preference,
    savePreferredMode,
  }
}
