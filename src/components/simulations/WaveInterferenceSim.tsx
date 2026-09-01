import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import type { SimulationComponentProps } from '../../personalization/simulationProtocol'
import {
  publishSimulationState,
  subscribeToTutorSimulationActions,
} from '../../personalization/simulationProtocol'

const CANVAS_HEIGHT = 246

function wavelengthColor(wavelength: number) {
  if (wavelength < 440) return '#6d4bdb'
  if (wavelength < 490) return '#2563eb'
  if (wavelength < 510) return '#0d9488'
  if (wavelength < 580) return '#65a30d'
  if (wavelength < 645) return '#ea7a1f'
  return '#dc3f3f'
}

function themeColor(
  styles: CSSStyleDeclaration,
  property: string,
  fallback: string,
) {
  return styles.getPropertyValue(property).trim() || fallback
}

export function WaveInterferenceSim({
  simulationId = 'wave-mechanics::standalone',
  topicId = 'wave-mechanics',
  sectionId = 'overview',
}: SimulationComponentProps = {}) {
  const titleId = useId()
  const descriptionId = useId()
  const wavelengthId = useId()
  const separationId = useId()
  const distanceId = useId()
  const frameRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [wavelength, setWavelength] = useState(540)
  const [slitSeparation, setSlitSeparation] = useState(0.5)
  const [screenDistance, setScreenDistance] = useState(2.5)

  const wavelengthMetres = wavelength * 1e-9
  const separationMetres = slitSeparation * 1e-3
  const fringeSpacingMetres =
    (wavelengthMetres * screenDistance) / separationMetres
  const fringeSpacingMillimetres = fringeSpacingMetres * 1_000

  useEffect(
    () =>
      subscribeToTutorSimulationActions(simulationId, (action) => {
        if (action.type !== 'set-simulation-control' || typeof action.value !== 'number') {
          return
        }
        if (action.controlId === 'wavelength') {
          setWavelength(Math.min(700, Math.max(400, action.value)))
        } else if (action.controlId === 'slitSeparation') {
          setSlitSeparation(Math.min(1, Math.max(0.1, action.value)))
        } else if (action.controlId === 'screenDistance') {
          setScreenDistance(Math.min(5, Math.max(1, action.value)))
        }
      }),
    [simulationId],
  )

  useEffect(() => {
    publishSimulationState({
      simulationId,
      topicId,
      sectionId,
      label: 'Double-slit wave interference',
      controls: { wavelength, slitSeparation, screenDistance },
      outputs: {
        fringeSpacingMillimetres: Number(fringeSpacingMillimetres.toFixed(3)),
        patternColor: wavelengthColor(wavelength),
      },
      updatedAt: new Date().toISOString(),
    })
  }, [
    fringeSpacingMillimetres,
    screenDistance,
    sectionId,
    simulationId,
    slitSeparation,
    topicId,
    wavelength,
  ])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const frame = frameRef.current
    if (!canvas || !frame) return

    const context = canvas.getContext('2d')
    if (!context) return

    const logicalWidth = Math.max(
      320,
      Math.round(frame.getBoundingClientRect().width || 640),
    )
    const dpr = Math.max(1, window.devicePixelRatio || 1)
    canvas.width = Math.round(logicalWidth * dpr)
    canvas.height = Math.round(CANVAS_HEIGHT * dpr)
    canvas.style.width = `${logicalWidth}px`
    canvas.style.height = `${CANVAS_HEIGHT}px`
    context.setTransform(dpr, 0, 0, dpr, 0, 0)

    const dark = document.documentElement.dataset.theme === 'dark'
    const styles = getComputedStyle(canvas)
    const surface = themeColor(
      styles,
      '--sim-surface',
      dark ? '#202521' : '#fbfaf6',
    )
    const ink = themeColor(styles, '--sim-ink', dark ? '#e8e7e4' : '#25231f')
    const muted = themeColor(
      styles,
      '--sim-muted',
      dark ? '#979b95' : '#756f67',
    )
    const grid = themeColor(
      styles,
      '--sim-grid',
      dark ? 'rgba(255,255,255,0.11)' : 'rgba(38,35,31,0.12)',
    )
    const accent = wavelengthColor(wavelength)

    context.clearRect(0, 0, logicalWidth, CANVAS_HEIGHT)
    context.fillStyle = surface
    context.fillRect(0, 0, logicalWidth, CANVAS_HEIGHT)

    const left = 44
    const right = logicalWidth - 18
    const top = 20
    const graphBottom = 151
    const fringeTop = 178
    const fringeBottom = 221
    const plotWidth = right - left
    const plotHeight = graphBottom - top
    // Keep the physical screen width fixed so changing λ, d, or L visibly
    // changes the number and spacing of fringes instead of rescaling the plot.
    const visibleSpan = 0.04

    context.strokeStyle = grid
    context.lineWidth = 1
    context.fillStyle = muted
    context.font = '11px system-ui, sans-serif'
    context.textAlign = 'center'
    for (let index = 0; index <= 4; index += 1) {
      const y = top + (index / 4) * plotHeight
      context.beginPath()
      context.moveTo(left, y)
      context.lineTo(right, y)
      context.stroke()
      context.fillText(String(1 - index / 4), left - 22, y + 4)
    }

    context.strokeStyle = ink
    context.beginPath()
    context.moveTo(left, top)
    context.lineTo(left, graphBottom)
    context.lineTo(right, graphBottom)
    context.stroke()

    context.strokeStyle = accent
    context.lineWidth = 2.4
    context.beginPath()
    for (let pixel = 0; pixel <= plotWidth; pixel += 1) {
      const screenOffset = (pixel / plotWidth - 0.5) * visibleSpan
      const theta = Math.atan2(screenOffset, screenDistance)
      const phase =
        (Math.PI * separationMetres * Math.sin(theta)) / wavelengthMetres
      const intensity = Math.cos(phase) ** 2
      const x = left + pixel
      const y = graphBottom - intensity * plotHeight
      if (pixel === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    }
    context.stroke()

    for (let pixel = 0; pixel < plotWidth; pixel += 2) {
      const screenOffset = (pixel / plotWidth - 0.5) * visibleSpan
      const theta = Math.atan2(screenOffset, screenDistance)
      const phase =
        (Math.PI * separationMetres * Math.sin(theta)) / wavelengthMetres
      const intensity = Math.cos(phase) ** 2
      context.globalAlpha = 0.12 + intensity * 0.88
      context.fillStyle = accent
      context.fillRect(left + pixel, fringeTop, 2.2, fringeBottom - fringeTop)
    }
    context.globalAlpha = 1

    context.fillStyle = ink
    context.font = '600 11px system-ui, sans-serif'
    context.textAlign = 'left'
    context.fillText('Relative intensity', left, 13)
    context.fillText('Projected interference fringes', left, 171)
    context.fillStyle = muted
    context.font = '10px system-ui, sans-serif'
    context.textAlign = 'center'
    context.fillText('Screen position', (left + right) / 2, 241)
  }, [
    screenDistance,
    separationMetres,
    wavelength,
    wavelengthMetres,
  ])

  useEffect(() => {
    draw()

    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => draw())
    if (frameRef.current) observer?.observe(frameRef.current)

    const themeObserver =
      typeof MutationObserver === 'undefined'
        ? null
        : new MutationObserver(() => draw())
    themeObserver?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    window.addEventListener('resize', draw)

    return () => {
      observer?.disconnect()
      themeObserver?.disconnect()
      window.removeEventListener('resize', draw)
    }
  }, [draw])

  return (
    <section
      className="sim-shell sim-wave"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <header className="sim-header">
        <div>
          <p className="sim-eyebrow">Double-slit wave lab</p>
          <h3 className="sim-title" id={titleId}>
            Wave interference
          </h3>
          <p className="sim-description" id={descriptionId}>
            Change wavelength and geometry to see where constructive and
            destructive interference appears on the screen.
          </p>
        </div>
        <div className="sim-equation" aria-label="Fringe spacing equation">
          Δy = λL / d
        </div>
      </header>

      <div className="sim-layout">
        <div className="sim-controls">
          <div className="sim-control">
            <label className="sim-control-label" htmlFor={wavelengthId}>
              <span>Wavelength λ</span>
              <output htmlFor={wavelengthId}>{wavelength} nm</output>
            </label>
            <input
              className="sim-range sim-wave-spectrum"
              id={wavelengthId}
              type="range"
              min="400"
              max="700"
              step="5"
              value={wavelength}
              aria-valuetext={`${wavelength} nanometres`}
              onChange={(event) =>
                setWavelength(Number(event.currentTarget.value))
              }
            />
            <div className="sim-range-scale" aria-hidden="true">
              <span>400 nm</span>
              <span>700 nm</span>
            </div>
          </div>

          <div className="sim-control">
            <label className="sim-control-label" htmlFor={separationId}>
              <span>Slit separation d</span>
              <output htmlFor={separationId}>
                {slitSeparation.toFixed(2)} mm
              </output>
            </label>
            <input
              className="sim-range"
              id={separationId}
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={slitSeparation}
              aria-valuetext={`${slitSeparation.toFixed(2)} millimetres`}
              onChange={(event) =>
                setSlitSeparation(Number(event.currentTarget.value))
              }
            />
            <div className="sim-range-scale" aria-hidden="true">
              <span>0.10 mm</span>
              <span>1.00 mm</span>
            </div>
          </div>

          <div className="sim-control">
            <label className="sim-control-label" htmlFor={distanceId}>
              <span>Screen distance L</span>
              <output htmlFor={distanceId}>
                {screenDistance.toFixed(1)} m
              </output>
            </label>
            <input
              className="sim-range"
              id={distanceId}
              type="range"
              min="1"
              max="5"
              step="0.1"
              value={screenDistance}
              aria-valuetext={`${screenDistance.toFixed(1)} metres`}
              onChange={(event) =>
                setScreenDistance(Number(event.currentTarget.value))
              }
            />
            <div className="sim-range-scale" aria-hidden="true">
              <span>1 m</span>
              <span>5 m</span>
            </div>
          </div>
        </div>

        <div className="sim-stage sim-wave-stage" ref={frameRef}>
          <canvas
            ref={canvasRef}
            className="sim-canvas"
            role="img"
            aria-label={`Double-slit intensity plot with fringe spacing ${fringeSpacingMillimetres.toFixed(2)} millimetres`}
          />
        </div>
      </div>

      <div className="sim-metric-grid" aria-live="polite">
        <div className="sim-metric sim-metric--primary">
          <span className="sim-metric-label">Measured fringe spacing Δy</span>
          <strong className="sim-metric-value" data-testid="fringe-spacing">
            {fringeSpacingMillimetres.toFixed(2)} mm
          </strong>
        </div>
        <div className="sim-metric">
          <span className="sim-metric-label">Pattern colour</span>
          <strong
            className="sim-metric-value sim-wave-color"
            style={
              {
                '--sim-wave-color': wavelengthColor(wavelength),
              } as CSSProperties
            }
          >
            {wavelength} nm
          </strong>
        </div>
      </div>
    </section>
  )
}

export default WaveInterferenceSim
