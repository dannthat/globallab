import { useState } from 'react'
import type { KnowledgeDiagram } from '../types'

interface DiagramBlockProps {
  diagram: KnowledgeDiagram
  figureNumber?: string
}

export function DiagramBlock({ diagram, figureNumber }: DiagramBlockProps) {
  const [failed, setFailed] = useState(false)

  if (failed) return null

  return (
    <figure className="diagram-block">
      <img
        className="diagram-img"
        src={diagram.url}
        alt={diagram.alt}
        loading="lazy"
        onLoad={(event) => {
          const image = event.currentTarget
          if (image.naturalWidth <= 2 && image.naturalHeight <= 2) {
            setFailed(true)
          }
        }}
        onError={() => setFailed(true)}
      />
      <figcaption className="diagram-caption">
        {figureNumber && (
          <strong className="diagram-figure-number">
            Figure {figureNumber}
          </strong>
        )}
        {figureNumber ? ' ' : null}
        {diagram.caption}
      </figcaption>
    </figure>
  )
}
