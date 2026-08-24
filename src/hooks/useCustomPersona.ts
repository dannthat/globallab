import { useCallback, useState } from 'react'
import { generateCustomPersona } from '../services/personaService'
import type { CustomPersonaResult, Topic } from '../types'

export function useCustomPersona(topic: Topic) {
  const [result, setResult] = useState<CustomPersonaResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(
    async (interest: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const generated = await generateCustomPersona(interest, topic)
        setResult(generated)
        return generated
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : 'We could not create that study lens. Try again.'
        setError(message)
        return null
      } finally {
        setIsLoading(false)
      }
    },
    [topic],
  )

  const clearError = useCallback(() => setError(null), [])

  return { result, isLoading, error, generate, clearError }
}
