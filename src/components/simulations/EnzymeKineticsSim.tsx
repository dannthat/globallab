import { useId, useMemo, useState } from 'react'

const PLOT = {
  left: 58,
  right: 612,
  top: 24,
  bottom: 266,
}

function velocityAt(substrate: number, vmax: number, km: number) {
  return (vmax * substrate) / (km + substrate)
}

function substrateX(substrate: number) {
  return PLOT.left + (substrate / 50) * (PLOT.right - PLOT.left)
}

function velocityY(velocity: number) {
  return PLOT.bottom - (velocity / 100) * (PLOT.bottom - PLOT.top)
}

export function EnzymeKineticsSim() {
  const titleId = useId()
  const descriptionId = useId()
  const vmaxId = useId()
  const kmId = useId()
  const substrateId = useId()
  const [vmax, setVmax] = useState(70)
  const [km, setKm] = useState(8)
  const [substrate, setSubstrate] = useState(16)
  const [competitive, setCompetitive] = useState(false)
  const [nonCompetitive, setNonCompetitive] = useState(false)

  const effectiveKm = competitive ? km * 2 : km
  const effectiveVmax = nonCompetitive ? vmax * 0.58 : vmax
  const velocity = velocityAt(substrate, effectiveVmax, effectiveKm)

  const curvePath = useMemo(() => {
    return Array.from({ length: 101 }, (_, index) => {
      const sampleSubstrate = index / 2
      const sampleVelocity = velocityAt(
        sampleSubstrate,
        effectiveVmax,
        effectiveKm,
      )
      const command = index === 0 ? 'M' : 'L'
      return `${command}${substrateX(sampleSubstrate).toFixed(2)},${velocityY(sampleVelocity).toFixed(2)}`
    }).join(' ')
  }, [effectiveKm, effectiveVmax])

  const pointX = substrateX(substrate)
  const pointY = velocityY(velocity)

  return (
    <section
      className="sim-shell sim-enzyme"
      aria-labelledby={titleId}
      style={{ color: 'var(--sim-accent, light-dark(#0D8267, #2DD4BF))' }}
    >
      <header className="sim-header">
        <div>
          <p className="sim-eyebrow">Michaelis–Menten lab</p>
          <h3 className="sim-title" id={titleId}>
            Enzyme kinetics
          </h3>
          <p className="sim-description" id={descriptionId}>
            Change enzyme capacity, substrate affinity, and inhibitor type to
            see how reaction velocity responds.
          </p>
        </div>
        <div className="sim-equation" aria-label="Michaelis Menten equation">
          <i>v</i> = <i>V</i><sub>max</sub>[S] / (<i>K</i><sub>m</sub> + [S])
        </div>
      </header>

      <div className="sim-layout">
        <div className="sim-controls" aria-describedby={descriptionId}>
          <div className="sim-control">
            <label className="sim-control-label" htmlFor={vmaxId}>
              <span>
                <i>V</i><sub>max</sub>
              </span>
              <output htmlFor={vmaxId}>{vmax} μmol/s</output>
            </label>
            <input
              className="sim-range"
              id={vmaxId}
              type="range"
              min="10"
              max="100"
              step="1"
              value={vmax}
              aria-valuetext={`${vmax} micromoles per second`}
              onChange={(event) => setVmax(Number(event.currentTarget.value))}
            />
            <div className="sim-range-scale" aria-hidden="true">
              <span>10</span>
              <span>100 μmol/s</span>
            </div>
          </div>

          <div className="sim-control">
            <label className="sim-control-label" htmlFor={kmId}>
              <span>
                <i>K</i><sub>m</sub>
              </span>
              <output htmlFor={kmId}>{km} mM</output>
            </label>
            <input
              className="sim-range"
              id={kmId}
              type="range"
              min="1"
              max="20"
              step="0.5"
              value={km}
              aria-valuetext={`${km} millimolar`}
              onChange={(event) => setKm(Number(event.currentTarget.value))}
            />
            <div className="sim-range-scale" aria-hidden="true">
              <span>1</span>
              <span>20 mM</span>
            </div>
          </div>

          <div className="sim-control">
            <label className="sim-control-label" htmlFor={substrateId}>
              <span>Substrate [S]</span>
              <output htmlFor={substrateId}>{substrate} mM</output>
            </label>
            <input
              className="sim-range"
              id={substrateId}
              type="range"
              min="0"
              max="50"
              step="0.5"
              value={substrate}
              aria-valuetext={`${substrate} millimolar substrate`}
              onChange={(event) =>
                setSubstrate(Number(event.currentTarget.value))
              }
            />
            <div className="sim-range-scale" aria-hidden="true">
              <span>0</span>
              <span>50 mM</span>
            </div>
          </div>

          <div
            className="sim-toggle-row"
            role="group"
            aria-label="Inhibitor conditions"
          >
            <button
              type="button"
              className={`sim-toggle${competitive ? ' sim-toggle--active' : ''}`}
              aria-pressed={competitive}
              onClick={() => setCompetitive((active) => !active)}
            >
              Competitive inhibitor
              <small>Raises apparent K<sub>m</sub></small>
            </button>
            <button
              type="button"
              className={`sim-toggle${nonCompetitive ? ' sim-toggle--active' : ''}`}
              aria-pressed={nonCompetitive}
              onClick={() => setNonCompetitive((active) => !active)}
            >
              Non-competitive inhibitor
              <small>Lowers V<sub>max</sub></small>
            </button>
          </div>
        </div>

        <div className="sim-stage sim-enzyme-stage">
          <svg
            className="sim-svg"
            viewBox="0 0 640 320"
            role="img"
            aria-labelledby={`${titleId} ${descriptionId}`}
          >
            <g className="sim-grid" aria-hidden="true">
              {[0, 25, 50, 75, 100].map((tick) => {
                const y = velocityY(tick)
                return (
                  <g key={`velocity-${tick}`}>
                    <line x1={PLOT.left} y1={y} x2={PLOT.right} y2={y} />
                    <text x={PLOT.left - 12} y={y + 4} textAnchor="end">
                      {tick}
                    </text>
                  </g>
                )
              })}
              {[0, 10, 20, 30, 40, 50].map((tick) => {
                const x = substrateX(tick)
                return (
                  <g key={`substrate-${tick}`}>
                    <line x1={x} y1={PLOT.top} x2={x} y2={PLOT.bottom} />
                    <text x={x} y={PLOT.bottom + 22} textAnchor="middle">
                      {tick}
                    </text>
                  </g>
                )
              })}
            </g>

            <g className="sim-axes" aria-hidden="true">
              <line
                x1={PLOT.left}
                y1={PLOT.top}
                x2={PLOT.left}
                y2={PLOT.bottom}
              />
              <line
                x1={PLOT.left}
                y1={PLOT.bottom}
                x2={PLOT.right}
                y2={PLOT.bottom}
              />
              <text
                className="sim-axis-label"
                x={(PLOT.left + PLOT.right) / 2}
                y="312"
                textAnchor="middle"
              >
                Substrate concentration [S] (mM)
              </text>
              <text
                className="sim-axis-label"
                x="15"
                y={(PLOT.top + PLOT.bottom) / 2}
                textAnchor="middle"
                transform={`rotate(-90 15 ${(PLOT.top + PLOT.bottom) / 2})`}
              >
                Velocity (μmol/s)
              </text>
            </g>

            <path
              className="sim-curve sim-enzyme-curve"
              d={curvePath}
              pathLength="1"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />

            <g
              className="sim-enzyme-operating-point"
              transform={`translate(${pointX} ${pointY})`}
              aria-hidden="true"
            >
              <circle className="sim-point-glow" r="16" />
              <circle className="sim-point-halo" r="9" />
              <circle className="sim-point" r="5" />
            </g>

            <line
              className="sim-guide"
              x1={pointX}
              y1={pointY}
              x2={pointX}
              y2={PLOT.bottom}
              aria-hidden="true"
            />
            <line
              className="sim-guide"
              x1={PLOT.left}
              y1={pointY}
              x2={pointX}
              y2={pointY}
              aria-hidden="true"
            />
          </svg>

          <div className="sim-metric-grid" aria-live="polite">
            <div className="sim-metric">
              <span className="sim-metric-label">Current velocity</span>
              <strong className="sim-metric-value" data-testid="enzyme-velocity">
                {velocity.toFixed(1)} μmol/s
              </strong>
            </div>
            <div className="sim-metric">
              <span className="sim-metric-label">Apparent K<sub>m</sub></span>
              <strong className="sim-metric-value">{effectiveKm.toFixed(1)} mM</strong>
            </div>
            <div className="sim-metric">
              <span className="sim-metric-label">Effective V<sub>max</sub></span>
              <strong className="sim-metric-value">
                {effectiveVmax.toFixed(1)} μmol/s
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default EnzymeKineticsSim
