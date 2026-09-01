import { useEffect, useId, useMemo, useState } from 'react'
import type { SimulationComponentProps } from '../../personalization/simulationProtocol'
import {
  publishSimulationState,
  subscribeToTutorSimulationActions,
} from '../../personalization/simulationProtocol'

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

export function ChemicalEquilibriumSim({
  simulationId = 'thermodynamics::gibbs',
  topicId = 'thermodynamics',
  sectionId = 'gibbs',
}: SimulationComponentProps = {}) {
  const titleId = useId()
  const descriptionId = useId()
  const [increasedPressure, setIncreasedPressure] = useState(false)
  const [increasedTemperature, setIncreasedTemperature] = useState(false)
  const [addedReactant, setAddedReactant] = useState(false)

  const model = useMemo(() => {
    const hasRightShiftDisturbance = increasedPressure || addedReactant
    if (increasedTemperature && hasRightShiftDisturbance) {
      return {
        shift: 'Competing disturbances — magnitude needed',
        relation: 'Compare Q with the new Kₑq',
        explanation:
          'Compression or added reactant drives Q below K, while heating lowers K for this exothermic reaction. Without disturbance magnitudes, the net direction cannot be predicted.',
        productPercent: 45,
        reactantPercent: 55,
        qRatio: 1,
      }
    }

    const shiftScore =
      (increasedPressure ? 16 : 0) +
      (addedReactant ? 18 : 0) -
      (increasedTemperature ? 20 : 0)
    const productPercent = clamp(45 + shiftScore, 18, 82)
    const reactantPercent = 100 - productPercent
    const qRatio = clamp(1 - shiftScore / 70, 0.45, 1.55)

    if (shiftScore > 1) {
      return {
        shift: 'Shifts right toward NH₃',
        relation: 'Q < Kₑq',
        explanation:
          'The immediate disturbance favours the forward reaction until Q returns to Kₑq.',
        productPercent,
        reactantPercent,
        qRatio,
      }
    }
    if (shiftScore < -1) {
      return {
        shift: 'Shifts left toward N₂ and H₂',
        relation: 'Q > Kₑq',
        explanation:
          'The immediate disturbance favours the reverse reaction until Q returns to Kₑq.',
        productPercent,
        reactantPercent,
        qRatio,
      }
    }
    return {
      shift: 'No net predicted shift',
      relation: 'Q ≈ Kₑq',
      explanation:
        'The selected effects balance in this qualitative model, so neither direction is favoured.',
      productPercent,
      reactantPercent,
      qRatio,
    }
  }, [addedReactant, increasedPressure, increasedTemperature])

  useEffect(
    () =>
      subscribeToTutorSimulationActions(simulationId, (action) => {
        if (action.type !== 'set-simulation-control' || typeof action.value !== 'boolean') {
          return
        }
        if (action.controlId === 'increasedPressure') {
          setIncreasedPressure(action.value)
        } else if (action.controlId === 'increasedTemperature') {
          setIncreasedTemperature(action.value)
        } else if (action.controlId === 'addedReactant') {
          setAddedReactant(action.value)
        }
      }),
    [simulationId],
  )

  useEffect(() => {
    publishSimulationState({
      simulationId,
      topicId,
      sectionId,
      label: 'Le Chatelier equilibrium reactor',
      controls: { increasedPressure, increasedTemperature, addedReactant },
      outputs: {
        shift: model.shift,
        relation: model.relation,
        productPercent: model.productPercent,
        reactantPercent: model.reactantPercent,
      },
      updatedAt: new Date().toISOString(),
    })
  }, [
    addedReactant,
    increasedPressure,
    increasedTemperature,
    model.productPercent,
    model.reactantPercent,
    model.relation,
    model.shift,
    sectionId,
    simulationId,
    topicId,
  ])

  return (
    <section
      className="sim-shell sim-equilibrium"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <header className="sim-header">
        <div>
          <p className="sim-eyebrow">Le Chatelier dynamic reactor</p>
          <h3 className="sim-title" id={titleId}>
            Chemical equilibrium
          </h3>
          <p className="sim-description" id={descriptionId}>
            Disturb an exothermic ammonia equilibrium and compare the
            instantaneous reaction quotient with the new equilibrium tendency.
          </p>
        </div>
      </header>

      <div
        className="sim-equilibrium-reaction"
        aria-label="Nitrogen gas plus three hydrogen gas reversibly forms two ammonia gas plus heat"
      >
        N<sub>2</sub>(g) + 3H<sub>2</sub>(g)
        <span aria-hidden="true"> ⇌ </span>
        2NH<sub>3</sub>(g) + Heat
      </div>

      <div
        className="sim-toggle-row sim-toggle-row--three"
        role="group"
        aria-label="Equilibrium disturbances"
      >
        <button
          type="button"
          className={`sim-toggle${increasedPressure ? ' sim-toggle--active' : ''}`}
          aria-pressed={increasedPressure}
          onClick={() => setIncreasedPressure((active) => !active)}
        >
          Increase pressure
          <small>Fewer gas particles favoured</small>
        </button>
        <button
          type="button"
          className={`sim-toggle${increasedTemperature ? ' sim-toggle--active' : ''}`}
          aria-pressed={increasedTemperature}
          onClick={() => setIncreasedTemperature((active) => !active)}
        >
          Increase temperature
          <small>Consumes added heat</small>
        </button>
        <button
          type="button"
          className={`sim-toggle${addedReactant ? ' sim-toggle--active' : ''}`}
          aria-pressed={addedReactant}
          onClick={() => setAddedReactant((active) => !active)}
        >
          Add reactant
          <small>N₂ / H₂ disturbance</small>
        </button>
      </div>

      <div className="sim-layout sim-equilibrium-layout">
        <div
          className="sim-stage sim-equilibrium-stage"
          role="img"
          aria-label={`Qualitative equilibrium bars: reactants ${model.reactantPercent} percent and ammonia ${model.productPercent} percent`}
        >
          <div className="sim-equilibrium-chart">
            <div className="sim-equilibrium-column">
              <div className="sim-equilibrium-bar-track">
                <div
                  className="sim-equilibrium-bar sim-equilibrium-bar--reactants"
                  style={{ height: `${model.reactantPercent}%` }}
                />
              </div>
              <strong>
                N<sub>2</sub> + H<sub>2</sub>
              </strong>
              <span>{model.reactantPercent}% relative amount</span>
            </div>

            <div className="sim-equilibrium-arrow" aria-hidden="true">
              <span>⇌</span>
              <small>{model.shift.includes('right') ? '→' : model.shift.includes('left') ? '←' : '↔'}</small>
            </div>

            <div className="sim-equilibrium-column">
              <div className="sim-equilibrium-bar-track">
                <div
                  className="sim-equilibrium-bar sim-equilibrium-bar--products"
                  style={{ height: `${model.productPercent}%` }}
                />
              </div>
              <strong>
                NH<sub>3</sub>
              </strong>
              <span>{model.productPercent}% relative amount</span>
            </div>
          </div>
        </div>

        <div className="sim-equilibrium-readout" aria-live="polite">
          <p className="sim-equilibrium-readout-label">
            Immediately after disturbance
          </p>
          <strong className="sim-equilibrium-relation" data-testid="q-k-relation">
            {model.relation}
          </strong>
          <div className="sim-equilibrium-meter" aria-hidden="true">
            <span
              className="sim-equilibrium-meter-point"
              style={{ left: `${clamp(model.qRatio / 2, 0.08, 0.92) * 100}%` }}
            />
          </div>
          <div className="sim-equilibrium-meter-labels" aria-hidden="true">
            <span>Q &lt; Kₑq</span>
            <span>Q = Kₑq</span>
            <span>Q &gt; Kₑq</span>
          </div>
          <p className="sim-equilibrium-shift">{model.shift}</p>
          <p className="sim-equilibrium-explanation">{model.explanation}</p>
          <small className="sim-equilibrium-caveat">
            Bars show a normalized qualitative prediction, not measured
            concentrations.
          </small>
        </div>
      </div>
    </section>
  )
}

export default ChemicalEquilibriumSim
