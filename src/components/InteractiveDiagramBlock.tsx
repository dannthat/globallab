import { useEffect, useId, useState, type CSSProperties } from 'react'
import type { KnowledgeDiagram } from '../types'
import { DiagramBlock } from './DiagramBlock'
import { getSimulationRegistration } from './simulations'
import { subscribeToTutorSimulationActions } from '../personalization/simulationProtocol'

interface InteractiveDiagramBlockProps {
  topicId: string
  sectionId: string
  diagram?: KnowledgeDiagram
  figureNumber?: string
}

type DiagramView = 'static' | 'interactive'

export function InteractiveDiagramBlock({
  topicId,
  sectionId,
  diagram,
  figureNumber,
}: InteractiveDiagramBlockProps) {
  const staticPanelId = useId()
  const interactivePanelId = useId()
  const [view, setView] = useState<DiagramView>('static')
  const registration = getSimulationRegistration(topicId, sectionId)

  useEffect(() => {
    if (!registration) return
    return subscribeToTutorSimulationActions(registration.simulationId, (action) => {
      if (action.type === 'open-simulation') setView('interactive')
    })
  }, [registration])

  if (!registration) {
    return diagram ? (
      <DiagramBlock diagram={diagram} figureNumber={figureNumber} />
    ) : null
  }

  const staticDiagram = diagram ?? registration.fallbackDiagram
  const Simulation = registration.Component

  return (
    <section
      className="interactive-diagram"
      data-diagram-view={view}
      aria-label={registration.label}
    >
      <div
        className="interactive-diagram-segmented"
        role="group"
        aria-label="Diagram view"
      >
        <button
          type="button"
          className={
            'interactive-diagram-tab' +
            (view === 'static' ? ' interactive-diagram-tab--active' : '')
          }
          aria-pressed={view === 'static'}
          aria-controls={staticPanelId}
          onClick={() => setView('static')}
        >
          Static Diagram
        </button>
        <button
          type="button"
          className={
            'interactive-diagram-tab' +
            (view === 'interactive'
              ? ' interactive-diagram-tab--active'
              : '')
          }
          aria-pressed={view === 'interactive'}
          aria-controls={interactivePanelId}
          onClick={() => setView('interactive')}
        >
          Interactive Lab
        </button>
      </div>

      <div
        className="interactive-diagram-stage"
        style={
          {
            '--interactive-diagram-reserved-height':
              'clamp(300px, 42dvh, 430px)',
          } as CSSProperties
        }
      >
        <div
          className="interactive-diagram-panel interactive-diagram-panel--static"
          id={staticPanelId}
          hidden={view !== 'static'}
        >
          {staticDiagram ? (
            <DiagramBlock
              diagram={staticDiagram}
              figureNumber={figureNumber}
            />
          ) : (
            <p className="interactive-diagram-unavailable">
              No static diagram is available for this lab.
            </p>
          )}
        </div>

        <div
          className="interactive-diagram-panel interactive-diagram-panel--lab"
          id={interactivePanelId}
          hidden={view !== 'interactive'}
        >
          {view === 'interactive' && (
            <Simulation
              simulationId={registration.simulationId}
              topicId={topicId}
              sectionId={sectionId}
            />
          )}
        </div>
      </div>
    </section>
  )
}

export default InteractiveDiagramBlock
