import { LoaderCircle, Sparkles, WandSparkles, X } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

interface CustomPersonaModalProps {
  isOpen: boolean
  isLoading: boolean
  error: string | null
  onClose: () => void
  onSubmit: (interest: string) => Promise<boolean>
  onClearError: () => void
}

export function CustomPersonaModal({
  isOpen,
  isLoading,
  error,
  onClose,
  onSubmit,
  onClearError,
}: CustomPersonaModalProps) {
  const [interest, setInterest] = useState('')
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isLoading, isOpen, onClose])

  if (!isOpen) return null

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const succeeded = await onSubmit(interest)
    if (succeeded) {
      setInterest('')
      onClose()
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isLoading) onClose()
      }}
    >
      <section
        className="modal-card animate-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <button
          type="button"
          className="modal-close"
          aria-label="Close custom interest dialog"
          onClick={onClose}
          disabled={isLoading}
        >
          <X size={19} />
        </button>

        <div className="modal-illustration" aria-hidden="true">
          <WandSparkles size={25} />
        </div>
        <p className="eyebrow">Custom learning lens</p>
        <h2 id={titleId} className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-stone-950">
          Make the analogy feel familiar
        </h2>
        <p id={descriptionId} className="mt-3 max-w-md text-sm leading-6 text-stone-500">
          Enter one interest. We’ll keep every biology fact intact and change only the analogy cards.
        </p>

        <form className="mt-6" onSubmit={handleSubmit}>
          <label htmlFor="custom-interest" className="text-sm font-semibold text-stone-800">
            What are you into?
          </label>
          <div className="interest-input-wrap">
            <Sparkles className="text-orange-400" size={18} aria-hidden="true" />
            <input
              id="custom-interest"
              type="text"
              value={interest}
              maxLength={60}
              autoFocus
              autoComplete="off"
              placeholder="Formula 1, baking, K-pop…"
              onChange={(event) => {
                setInterest(event.target.value)
                if (error) onClearError()
              }}
            />
          </div>

          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <div className="mock-note">
            <span className="mock-dot" aria-hidden="true" />
            Generated live with your local Gemini key, with a no-key mock fallback for development.
          </div>

          <button type="submit" className="modal-submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
                Shaping your analogy…
              </>
            ) : (
              <>
                <WandSparkles size={18} aria-hidden="true" />
                Create my lens
              </>
            )}
          </button>
        </form>
      </section>
    </div>
  )
}
