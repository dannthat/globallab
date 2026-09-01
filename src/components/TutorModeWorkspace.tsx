import { useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  GitCompareArrows,
  GraduationCap,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react'
import type { TutorSessionController } from '../hooks/useTutorSession'
import type { SourceExcerpt } from '../personalization/types'

interface TutorModeWorkspaceProps {
  session: TutorSessionController
  crossSourceCandidates: SourceExcerpt[]
  activeCrossSource: SourceExcerpt | null
  crossSourceAllowed: boolean
  onCrossSourceChange?: (excerpt: SourceExcerpt | null) => void
  onCrossSourceAllowedChange?: (allowed: boolean) => void
}

function DraftBox({
  label,
  placeholder,
  action,
  disabled = false,
  onSubmit,
}: {
  label: string
  placeholder: string
  action: string
  disabled?: boolean
  onSubmit: (value: string) => boolean | void
}) {
  const [value, setValue] = useState('')
  return (
    <form
      className="koji-mode-draft"
      onSubmit={(event) => {
        event.preventDefault()
        const next = value.trim()
        if (!next) return
        const accepted = onSubmit(next)
        if (accepted !== false) setValue('')
      }}
    >
      <label>
        <span>{label}</span>
        <textarea
          rows={4}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
        />
      </label>
      <button
        type="submit"
        className="koji-primary-button"
        disabled={!value.trim() || disabled}
      >
        {action}
        <ArrowRight size={14} aria-hidden="true" />
      </button>
    </form>
  )
}

export function TutorModeWorkspace({
  session,
  crossSourceCandidates,
  activeCrossSource,
  crossSourceAllowed,
  onCrossSourceChange,
  onCrossSourceAllowedChange,
}: TutorModeWorkspaceProps) {
  const mode = session.machine.learningMode
  const [predictionDecision, setPredictionDecision] = useState<{
    key: string
    accurate: boolean
  } | null>(null)
  const predictionDecisionKey = [
    session.machine.predictionCycle.prediction ?? 'none',
    session.machine.predictionCycle.observation?.updatedAt ?? 'none',
  ].join('::')
  const predictionAccurate =
    predictionDecision?.key === predictionDecisionKey
      ? predictionDecision.accurate
      : null

  if (mode === 'guided') return null

  if (mode === 'teach-koji') {
    const check = session.lastTurn?.understandingCheck
    return (
      <section className="koji-mode-workspace" aria-labelledby="teach-koji-heading">
        <div className="koji-mode-workspace__head">
          <GraduationCap size={18} aria-hidden="true" />
          <div>
            <p>Role reversal</p>
            <h3 id="teach-koji-heading">Teach Koji</h3>
          </div>
          <span>{session.machine.teachKoji.stage.replaceAll('-', ' ')}</span>
        </div>
        <p className="koji-mode-workspace__intro">
          Explain the mechanism in your own words. Koji checks what your explanation
          covers; length is not rewarded.
        </p>
        {check && (
          <div className="koji-coverage" role="status">
            <strong>Coverage: {check.coverage}</strong>
            {check.coveredConcepts.length > 0 && (
              <p>Covered: {check.coveredConcepts.join(', ')}</p>
            )}
            {check.missingSteps.length > 0 && (
              <ul>
                {check.missingSteps.map((step) => <li key={step}>{step}</li>)}
              </ul>
            )}
            {check.misunderstanding && (
              <p className="koji-coverage__correction">
                <TriangleAlert size={14} aria-hidden="true" />
                Possible source-supported mix-up: {check.misunderstanding}
              </p>
            )}
            <blockquote>Source evidence: &quot;{check.evidenceQuote}&quot;</blockquote>
          </div>
        )}
        {session.machine.teachKoji.stage === 'complete' ? (
          <p className="koji-mode-complete" role="status">
            <CheckCircle2 size={16} aria-hidden="true" />
            Independent transfer completed. This result can now support the mastery map.
          </p>
        ) : session.machine.teachKoji.stage === 'independent-transfer' ? (
          <button
            type="button"
            className="koji-primary-button"
            disabled={session.isLoading}
            onClick={() => void session.send('transfer')}
          >
            Try an independent transfer
          </button>
        ) : (
          <DraftBox
            label="Your explanation"
            placeholder="Teach the idea as if Koji has never seen it..."
            action={check ? 'Teach it again' : 'Check my explanation'}
            onSubmit={session.submitTeachExplanation}
          />
        )}
      </section>
    )
  }

  if (mode === 'misconception-world') {
    const world = session.machine.misconceptionWorld.world
    const stage = session.machine.misconceptionWorld.stage
    return (
      <section className="koji-mode-workspace koji-mode-workspace--hypothetical" aria-labelledby="what-if-heading">
        <div className="koji-mode-workspace__head">
          <TriangleAlert size={18} aria-hidden="true" />
          <div>
            <p>Counter-model lab</p>
            <h3 id="what-if-heading">Hypothetical - not a fact</h3>
          </div>
          <span>{stage.replaceAll('-', ' ')}</span>
        </div>
        {world ? (
          <>
            <p className="koji-hypothetical-premise">{world.premise}</p>
            {stage === 'predict' && (
              <DraftBox
                label={world.predictionPrompt}
                placeholder="Under this hypothetical, I predict..."
                action="Lock prediction"
                onSubmit={session.submitHypotheticalPrediction}
              />
            )}
            {stage === 'inspect' && (
              <div className="koji-inspect-source">
                <p>Now inspect the rule the source actually states.</p>
                <blockquote>&quot;{world.evidenceQuote}&quot;</blockquote>
                <button type="button" onClick={session.inspectHypothetical}>
                  I inspected the evidence
                </button>
              </div>
            )}
            {stage === 'explain-failure' && (
              <DraftBox
                label={world.failurePrompt}
                placeholder="The hypothetical fails because..."
                action="Explain the failure"
                onSubmit={session.submitFailureExplanation}
              />
            )}
            {stage === 'reconstruct' && (
              <DraftBox
                label={world.reconstructionPrompt}
                placeholder="The correct model is..."
                action="Reconstruct the model"
                onSubmit={session.submitReconstruction}
              />
            )}
            {stage === 'complete' && (
              <p className="koji-mode-complete" role="status">
                <CheckCircle2 size={16} aria-hidden="true" />
                Correct model reconstructed. The hypothetical was not saved as fact.
              </p>
            )}
          </>
        ) : (
          <p>Koji is preparing one bounded hypothetical from the focused source.</p>
        )}
      </section>
    )
  }

  if (mode === 'prediction-cycle') {
    const cycle = session.machine.predictionCycle
    return (
      <section className="koji-mode-workspace" aria-labelledby="prediction-cycle-heading">
        <div className="koji-mode-workspace__head">
          <FlaskConical size={18} aria-hidden="true" />
          <div>
            <p>Interactive reasoning</p>
            <h3 id="prediction-cycle-heading">Predict -&gt; Act -&gt; Observe -&gt; Revise</h3>
          </div>
          <span>{cycle.stage}</span>
        </div>
        {cycle.stage === 'predict' && (
          <DraftBox
            label="What will change, and why?"
            placeholder="If I change one control, I predict... because..."
            action="Lock prediction"
            onSubmit={session.recordPrediction}
          />
        )}
        {cycle.stage === 'act' && (
          <div className="koji-cycle-step">
            <p>Change exactly one control in the connected lab. Koji cannot use screenshots or hidden selectors.</p>
            <button type="button" onClick={session.markSimulationActed}>I changed one control</button>
          </div>
        )}
        {cycle.stage === 'observe' && (
          <div className="koji-cycle-step">
            <p>Capture the current structured controls and outputs.</p>
            <button type="button" onClick={session.captureObservation}>Capture result</button>
          </div>
        )}
        {cycle.stage === 'revise' && (
          <>
            <div className="koji-structured-observation">
              <strong>Observed structured output</strong>
              <dl>
                {Object.entries(cycle.observation?.outputs ?? {}).map(([key, value]) => (
                  <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>
                ))}
              </dl>
            </div>
            <div className="koji-accuracy-choice" role="group" aria-label="Prediction accuracy">
              <span>Did the result match your prediction?</span>
              <button
                type="button"
                aria-pressed={predictionAccurate === true}
                onClick={() => setPredictionDecision({ key: predictionDecisionKey, accurate: true })}
              >Yes</button>
              <button
                type="button"
                aria-pressed={predictionAccurate === false}
                onClick={() => setPredictionDecision({ key: predictionDecisionKey, accurate: false })}
              >Not fully</button>
            </div>
            <DraftBox
              label="Revise your explanation using the observation"
              placeholder="I now think... because the output showed..."
              action="Save revision"
              disabled={predictionAccurate === null}
              onSubmit={(revision) => {
                if (predictionAccurate === null) return false
                session.submitPredictionRevision(revision, predictionAccurate)
                return true
              }}
            />
          </>
        )}
        {cycle.stage === 'complete' && (
          <p className="koji-mode-complete" role="status">
            <CheckCircle2 size={16} aria-hidden="true" />
            Prediction, observation, accuracy, and revision saved as learning evidence.
          </p>
        )}
      </section>
    )
  }

  return (
    <section className="koji-mode-workspace" aria-labelledby="cross-source-heading">
      <div className="koji-mode-workspace__head">
        <GitCompareArrows size={18} aria-hidden="true" />
        <div>
          <p>Permissioned comparison</p>
          <h3 id="cross-source-heading">Connect two focused sources</h3>
        </div>
      </div>
      <p className="koji-mode-workspace__intro">
        Koji receives the current extract and one chosen extract - never an entire upload.
      </p>
      {crossSourceCandidates.length === 0 ? (
        <p className="koji-mode-empty">No second focused extract is available here yet.</p>
      ) : (
        <>
          <label className="koji-cross-source-select">
            <span>Second focused source</span>
            <select
              value={activeCrossSource?.anchor.anchorId ?? ''}
              onChange={(event) => {
                const next = crossSourceCandidates.find(
                  (candidate) => candidate.anchor.anchorId === event.target.value,
                )
                onCrossSourceChange?.(next ?? null)
              }}
            >
              <option value="">Choose a source location</option>
              {crossSourceCandidates.map((candidate) => (
                <option key={candidate.anchor.anchorId} value={candidate.anchor.anchorId}>
                  {candidate.anchor.sourceTitle} - {candidate.anchor.anchorLabel}
                </option>
              ))}
            </select>
          </label>
          {activeCrossSource && (
            <div className="koji-cross-source-consent">
              <ShieldCheck size={16} aria-hidden="true" />
              <p>
                <strong>{crossSourceAllowed ? 'Comparison allowed' : 'Permission required'}</strong>
                <span>
                  {crossSourceAllowed
                    ? 'Only these two focused extracts may be used in this session.'
                    : 'Allow Koji to use this second extract for this comparison?'}
                </span>
              </p>
              <button
                type="button"
                aria-pressed={crossSourceAllowed}
                onClick={() => onCrossSourceAllowedChange?.(!crossSourceAllowed)}
              >
                {crossSourceAllowed ? 'Revoke' : 'Allow comparison'}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
