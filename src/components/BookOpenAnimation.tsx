import { Atom, Dna, FlaskConical, Sigma } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'

const SUBJECT_ICONS = {
  biology: Dna,
  physics: Atom,
  chemistry: FlaskConical,
  mathematics: Sigma,
}

interface BookOpenAnimationProps {
  subjectColor: string
  subjectId: string
  subjectTitle: string
}

export function BookOpenAnimation({
  subjectColor,
  subjectId,
  subjectTitle,
}: BookOpenAnimationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const Icon =
    SUBJECT_ICONS[subjectId as keyof typeof SUBJECT_ICONS] ?? FlaskConical

  // 250ms: book appears → auto-open
  useEffect(() => {
    const t = setTimeout(() => setIsOpen(true), 250)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      className="boa-overlay"
      style={{ '--subject-color': subjectColor } as CSSProperties}
      aria-hidden="true"
    >
      <div className={'boa-scene' + (isOpen ? ' is-open' : '')}>
        <div className="boa-book">

          {/* ── Back cover ── */}
          <div className="boa-face boa-cover-back" />

          {/* ── Spine ── */}
          <div className="boa-face boa-spine">
            <span className="boa-spine-text">{subjectTitle}</span>
          </div>

          {/* ── Page edges ── */}
          <div className="boa-face boa-pages-edge-right" />
          <div className="boa-face boa-pages-edge-top" />
          <div className="boa-face boa-pages-edge-bottom" />

          {/* ── Inner right page (revealed when cover opens) ── */}
          <div className="boa-face boa-page-right">
            <div className="boa-page-content">
              <span className="boa-page-icon">
                <Icon size={32} strokeWidth={1.5} />
              </span>
              <p className="boa-page-eyebrow">Global Lab</p>
              <h2 className="boa-page-title">{subjectTitle}</h2>
            </div>
          </div>

          {/* ── Front cover assembly (hinge at left/spine) ── */}
          <div className="boa-front-cover-container">

            {/* Outer face — the visible book cover */}
            <div className="boa-face boa-cover-front">
              <div className="boa-cover-sheen" />
              <div className="boa-cover-inner">
                <span className="boa-cover-icon">
                  <Icon size={52} strokeWidth={1.3} />
                </span>
                <h2 className="boa-cover-title">{subjectTitle}</h2>
                <p className="boa-cover-label">Global Lab</p>
              </div>
            </div>

            {/* Inside front cover — endpaper (back of cover, shows when open) */}
            <div className="boa-face boa-cover-inside">
              <div className="boa-endpaper" />
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
