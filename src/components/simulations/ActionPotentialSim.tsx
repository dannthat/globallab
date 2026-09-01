import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { SimulationComponentProps } from '../../personalization/simulationProtocol'
import {
  publishSimulationState,
  subscribeToTutorSimulationActions,
} from '../../personalization/simulationProtocol'

const PLOT = {
  left: 54,
  right: 612,
  top: 24,
  bottom: 252,
}

const TRACE_DURATION_MS = 1_800
const TRACE_DURATION_S = 5

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}

function smoothStep(progress: number) {
  const value = clamp(progress, 0, 1)
  return value * value * (3 - 2 * value)
}

function interpolate(start: number, end: number, progress: number) {
  return start + (end - start) * smoothStep(progress)
}

function actionPotentialVoltage(time: number) {
  if (time < 0.65) return -70
  if (time < 1.25) return interpolate(-70, 40, (time - 0.65) / 0.6)
  if (time < 2.55) return interpolate(40, -70, (time - 1.25) / 1.3)
  if (time < 3.15) return interpolate(-70, -82, (time - 2.55) / 0.6)
  if (time < 4.25) return interpolate(-82, -70, (time - 3.15) / 1.1)
  return -70
}

function subthresholdVoltage(time: number, stimulus: number) {
  const peak = clamp(stimulus, -80, -55.5)
  if (time < 0.65 || time > 2.5) return -70
  if (time < 1.25) return interpolate(-70, peak, (time - 0.65) / 0.6)
  return interpolate(peak, -70, (time - 1.25) / 1.25)
}

function timeX(time: number) {
  return PLOT.left + (time / TRACE_DURATION_S) * (PLOT.right - PLOT.left)
}

function voltageY(voltage: number) {
  return (
    PLOT.bottom -
    ((voltage + 90) / 140) * (PLOT.bottom - PLOT.top)
  )
}

function phaseAt(time: number, triggered: boolean) {
  if (!triggered) return time > 0.65 && time < 2.5 ? 'Subthreshold response' : 'Resting'
  if (time < 0.65) return 'Resting'
  if (time < 1.25) return 'Na⁺ channels open'
  if (time < 2.55) return 'K⁺ channels repolarize'
  if (time < 4.25) return 'Refractory dip'
  return 'Resting restored'
}

export function ActionPotentialSim({
  simulationId = 'action-potential::standalone',
  topicId = 'action-potential',
  sectionId = 'overview',
}: SimulationComponentProps = {}) {
  const titleId = useId()
  const descriptionId = useId()
  const stimulusId = useId()
  const [stimulus, setStimulus] = useState(-50)
  const [animationRun, setAnimationRun] = useState(0)
  const [progress, setProgress] = useState(1)
  const frameRef = useRef<number | null>(null)
  const triggered = stimulus >= -55

  const samples = useMemo(
    () =>
      Array.from({ length: 151 }, (_, index) => {
        const time = (index / 150) * TRACE_DURATION_S
        return {
          time,
          voltage: triggered
            ? actionPotentialVoltage(time)
            : subthresholdVoltage(time, stimulus),
        }
      }),
    [stimulus, triggered],
  )

  const tracePath = useMemo(
    () =>
      samples
        .map((sample, index) => {
          const command = index === 0 ? 'M' : 'L'
          return `${command}${timeX(sample.time).toFixed(2)},${voltageY(sample.voltage).toFixed(2)}`
        })
        .join(' '),
    [samples],
  )

  useEffect(() => {
    if (animationRun === 0) return
    if (typeof window.requestAnimationFrame !== 'function') return

    const startedAt = performance.now()
    const animate = (time: number) => {
      const nextProgress = clamp((time - startedAt) / TRACE_DURATION_MS, 0, 1)
      setProgress(nextProgress)
      if (nextProgress < 1) {
        frameRef.current = window.requestAnimationFrame(animate)
      } else {
        frameRef.current = null
      }
    }

    frameRef.current = window.requestAnimationFrame(animate)
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [animationRun])

  const currentIndex = Math.min(
    samples.length - 1,
    Math.floor(progress * (samples.length - 1)),
  )
  const currentSample = samples[currentIndex]
  const currentPhase = phaseAt(currentSample.time, triggered)
  const sodiumOpen =
    triggered && currentSample.time >= 0.65 && currentSample.time < 1.45
  const potassiumOpen =
    triggered && currentSample.time >= 1.25 && currentSample.time < 3.25

  useEffect(
    () =>
      subscribeToTutorSimulationActions(simulationId, (action) => {
        if (
          action.type === 'set-simulation-control' &&
          action.controlId === 'stimulus' &&
          typeof action.value === 'number'
        ) {
          setStimulus(clamp(action.value, -80, 40))
        }
      }),
    [simulationId],
  )

  useEffect(() => {
    publishSimulationState({
      simulationId,
      topicId,
      sectionId,
      label: 'Neuron action potential',
      controls: { stimulus },
      outputs: {
        triggered,
        phase: currentPhase,
        voltage: Number(currentSample.voltage.toFixed(1)),
        sodiumOpen,
        potassiumOpen,
      },
      updatedAt: new Date().toISOString(),
    })
  }, [
    currentPhase,
    currentSample.voltage,
    potassiumOpen,
    sectionId,
    simulationId,
    sodiumOpen,
    stimulus,
    topicId,
    triggered,
  ])

  const triggerPulse = () => {
    const reducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion || typeof window.requestAnimationFrame !== 'function') {
      setProgress(1)
      return
    }
    setProgress(0)
    setAnimationRun((run) => run + 1)
  }

  return (
    <section
      className="sim-shell sim-action-potential"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <header className="sim-header">
        <div>
          <p className="sim-eyebrow">Neuron ion-channel simulator</p>
          <h3 className="sim-title" id={titleId}>
            Action potential wave
          </h3>
          <p className="sim-description" id={descriptionId}>
            Cross the −55 mV threshold to observe an all-or-none pulse and the
            timed opening of sodium and potassium channels.
          </p>
        </div>
        <button
          type="button"
          className="sim-primary-action"
          onClick={triggerPulse}
        >
          Trigger Pulse
        </button>
      </header>

      <div className="sim-control sim-control--wide">
        <label className="sim-control-label" htmlFor={stimulusId}>
          <span>Stimulus voltage</span>
          <output htmlFor={stimulusId}>{stimulus} mV</output>
        </label>
        <input
          className="sim-range"
          id={stimulusId}
          type="range"
          min="-80"
          max="40"
          step="1"
          value={stimulus}
          aria-valuetext={`${stimulus} millivolts; ${triggered ? 'threshold reached' : 'below threshold'}`}
          onChange={(event) => setStimulus(Number(event.currentTarget.value))}
        />
        <div className="sim-range-scale" aria-hidden="true">
          <span>−80 mV</span>
          <span className="sim-threshold-label">Threshold −55 mV</span>
          <span>+40 mV</span>
        </div>
      </div>

      <div className="sim-stage sim-action-potential-stage">
        <svg
          className="sim-svg"
          viewBox="0 0 640 300"
          role="img"
          aria-label="Membrane potential in millivolts over five milliseconds"
        >
          <g className="sim-grid" aria-hidden="true">
            {[-80, -70, -55, 0, 40].map((tick) => {
              const y = voltageY(tick)
              return (
                <g key={tick}>
                  <line x1={PLOT.left} x2={PLOT.right} y1={y} y2={y} />
                  <text x={PLOT.left - 10} y={y + 4} textAnchor="end">
                    {tick}
                  </text>
                </g>
              )
            })}
            {[0, 1, 2, 3, 4, 5].map((tick) => {
              const x = timeX(tick)
              return (
                <g key={tick}>
                  <line x1={x} x2={x} y1={PLOT.top} y2={PLOT.bottom} />
                  <text x={x} y={PLOT.bottom + 21} textAnchor="middle">
                    {tick}
                  </text>
                </g>
              )
            })}
          </g>

          <line
            className="sim-threshold-line"
            x1={PLOT.left}
            x2={PLOT.right}
            y1={voltageY(-55)}
            y2={voltageY(-55)}
            aria-hidden="true"
          />
          <text
            className="sim-threshold-text"
            x={PLOT.right - 4}
            y={voltageY(-55) - 7}
            textAnchor="end"
          >
            threshold −55 mV
          </text>

          <g className="sim-axes" aria-hidden="true">
            <line x1={PLOT.left} x2={PLOT.left} y1={PLOT.top} y2={PLOT.bottom} />
            <line x1={PLOT.left} x2={PLOT.right} y1={PLOT.bottom} y2={PLOT.bottom} />
            <text
              className="sim-axis-label"
              x={(PLOT.left + PLOT.right) / 2}
              y="296"
              textAnchor="middle"
            >
              Time (ms)
            </text>
            <text
              className="sim-axis-label"
              x="14"
              y={(PLOT.top + PLOT.bottom) / 2}
              textAnchor="middle"
              transform={`rotate(-90 14 ${(PLOT.top + PLOT.bottom) / 2})`}
            >
              Membrane potential (mV)
            </text>
          </g>

          <path
            className="sim-curve sim-action-potential-trace"
            d={tracePath}
            pathLength="1"
            fill="none"
            vectorEffect="non-scaling-stroke"
            style={{
              strokeDasharray: 1,
              strokeDashoffset: 1 - progress,
            }}
          />
          <g
            className="sim-action-potential-current"
            transform={`translate(${timeX(currentSample.time)} ${voltageY(currentSample.voltage)})`}
            aria-hidden="true"
          >
            <circle className="sim-point-glow" r="14" />
            <circle className="sim-point" r="5" />
          </g>
        </svg>

        <div className="sim-membrane" aria-label="Membrane channel state">
          <div className="sim-membrane-side">
            Extracellular fluid
            <span>Na⁺ high</span>
          </div>
          <div className="sim-membrane-bilayer" aria-hidden="true" />
          <div
            className={`sim-channel${sodiumOpen ? ' sim-channel--open' : ''}`}
          >
            <strong>Na⁺ channel</strong>
            <span>{sodiumOpen ? 'Open · Na⁺ enters' : 'Closed'}</span>
          </div>
          <div
            className={`sim-channel${potassiumOpen ? ' sim-channel--open' : ''}`}
          >
            <strong>K⁺ channel</strong>
            <span>{potassiumOpen ? 'Open · K⁺ exits' : 'Closed'}</span>
          </div>
          <div className="sim-membrane-side">
            Cytoplasm
            <span>K⁺ high</span>
          </div>
        </div>
      </div>

      <div className="sim-metric-grid" aria-live="polite">
        <div className="sim-metric">
          <span className="sim-metric-label">Current phase</span>
          <strong className="sim-metric-value" data-testid="action-phase">
            {currentPhase}
          </strong>
        </div>
        <div className="sim-metric">
          <span className="sim-metric-label">Current voltage</span>
          <strong className="sim-metric-value">
            {currentSample.voltage.toFixed(0)} mV
          </strong>
        </div>
        <div className="sim-metric">
          <span className="sim-metric-label">Response</span>
          <strong className="sim-metric-value">
            {triggered ? 'All-or-none pulse' : 'No action potential'}
          </strong>
        </div>
      </div>
    </section>
  )
}

export default ActionPotentialSim
