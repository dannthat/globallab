import katex from 'katex'
import { AlertCircle, Loader2, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { TutorConversation } from './TutorConversation'
import { useTutorSession } from '../hooks/useTutorSession'
import type { TutorContext } from '../personalization/tutorTypes'
import type { UseCompanionSessionResult } from '../hooks/useCompanionSession'
import type { StudentProfile, UserBook } from '../types'
import type { useLearnerModel } from '../hooks/useLearnerModel'
import { canUseCloudForUserSelection } from '../services/sourceContext'

export interface CompanionPanelProps extends UseCompanionSessionResult {
  book: UserBook
  profile: StudentProfile
  previewKind: string
  focusedPage: number
  learnerModel: ReturnType<typeof useLearnerModel>
}

export function CompanionPanel({
  profile,
  previewKind,
  focusedPage,
  learnerModel,
  activeArtifact,
  activeSourceContext,
  companionMode,
  isCompanionLoading,
  lensError,
  cloudTutorAllowed,
  setCloudTutorAllowed,
  setIsLensOpen,
  handwritingPrompt,
  setHandwritingPrompt,
  isHandwritingPromptOpen,
  setIsHandwritingPromptOpen,
  localOcrStatus,
  crossSourceCandidates,
  runCompanion,
  handleManualPromptSubmit,
}: CompanionPanelProps) {
  const {
    approvedPresentation,
    recordHelpful,
    recordTutorAttempt,
    recordTutorHint,
    recordTeachKoji,
    hasCrossSourcePermission,
    setCrossSourcePermission,
  } = learnerModel
  const [activeCrossSource, setActiveCrossSource] = useState<
    (typeof crossSourceCandidates)[number] | null
  >(null)
  const crossSourceAllowed = Boolean(
    activeSourceContext &&
    activeCrossSource &&
    hasCrossSourcePermission(
      activeSourceContext.anchor,
      activeCrossSource.anchor,
    ),
  )
  const selectionCloudAllowed = activeSourceContext
    ? canUseCloudForUserSelection(activeSourceContext, cloudTutorAllowed)
    : false
  const tutorContext = useMemo<TutorContext | null>(() => {
    if (!activeSourceContext) return null
    return {
      sessionId: [
        activeSourceContext.anchor.anchorId,
        activeArtifact?.id ?? 'focused',
        crossSourceAllowed ? activeCrossSource?.anchor.anchorId : 'one-source',
      ].join('::'),
      entryPoint: 'upload',
      objective: `Understand the focused extract from ${activeSourceContext.anchor.sourceTitle}`,
      excerpt: {
        anchor: activeSourceContext.anchor,
        text: activeSourceContext.body,
      },
      scope: activeSourceContext.selectionOnly ? 'selection' : 'section',
      student: {
        interest: profile.interest,
        gradeLevel: profile.gradeLevel,
        preferredLanguage: profile.preferredLanguage,
        learningGoals: profile.learningGoals,
        startingSupport: profile.startingSupport,
        stuckSupport: profile.stuckSupport,
        approvedPresentation,
      },
      cloudAllowed: selectionCloudAllowed,
      secondaryExcerpts:
        crossSourceAllowed && activeCrossSource
          ? [{
              anchor: activeCrossSource.anchor,
              text: activeCrossSource.body,
            }]
          : undefined,
      crossSourcePermissionId:
        crossSourceAllowed && activeCrossSource
          ? `approved:${activeCrossSource.anchor.anchorId}`
          : undefined,
    }
  }, [
    activeArtifact?.id,
    activeCrossSource,
    activeSourceContext,
    approvedPresentation,
    crossSourceAllowed,
    profile,
    selectionCloudAllowed,
  ])
  const tutorMode = activeArtifact?.mode ?? companionMode
  const tutorSession = useTutorSession({
    context: tutorContext,
    seed: activeArtifact,
    onAttempt: (attempt) => {
      if (!activeSourceContext) return
      recordTutorAttempt(activeSourceContext.anchor, tutorMode, {
        phase: attempt.phase,
        activityKind: attempt.activityKind,
        correct: attempt.correct,
        independent: attempt.independent,
        hintsUsed: attempt.hintsUsed,
        revealed: attempt.revealed,
        skillTag: attempt.skillTag,
        misconceptionTags: attempt.misconceptionTags,
        sessionId: attempt.sessionId,
        turnId: attempt.turnId,
        responseSummary: attempt.responseSummary,
        coverage: attempt.coverage,
      })
    },
    onHint: (phase, revealed) => {
      if (!activeSourceContext) return
      recordTutorHint(
        activeSourceContext.anchor,
        tutorMode,
        { phase, revealed },
        revealed,
      )
    },
    onIntent: (intent) => {
      if (!activeSourceContext) return
      const modes: Partial<Record<typeof intent, typeof tutorMode>> = {
        hint: 'simpler',
        'explain-differently': 'simpler',
        'show-visually': 'another-example',
        'another-example': 'another-example',
        'step-by-step': 'step-by-step',
        'test-me': 'test-me',
      }
      const mode = modes[intent]
      if (mode) learnerModel.recordRefinement(activeSourceContext.anchor, mode)
    },
    onTeachKojiCheck: (check, turn) => {
      if (!activeSourceContext) return
      recordTeachKoji(activeSourceContext.anchor, tutorMode, {
        phase: turn.phase,
        correct: check.coverage === 'complete',
        independent: false,
        skillTag: turn.skillTags[0] ?? activeSourceContext.anchor.anchorLabel,
        misconceptionTags: turn.misconceptionTags,
        sessionId: tutorContext?.sessionId,
        turnId: turn.id,
        coverage: check.coverage,
        sourceQuotes: [check.evidenceQuote],
        responseSummary: turn.message.slice(0, 500),
      })
    },
  })

  return (
    <div className="lc-card ubr-companion-inner">
      {/* Amber accent bar */}
      <div className="lc-accent-bar" aria-hidden="true" />

      <div className="lc-header">
        <div className="lc-eyebrow-row">
          <span className="lc-eyebrow">
            {previewKind === 'pdf' ? 'Page ' + focusedPage : 'Focused source'}
          </span>
          <strong className="lc-lens-label">Lens: {profile.interest}</strong>
        </div>
      </div>

      {activeArtifact && (
        <div className="ubr-provider-badge">
          {activeArtifact.provider === 'gemini'
            ? '✦ AI · via GlobalLab'
            : '⬡ Local · stays in your browser'}
        </div>
      )}

      {localOcrStatus && (
        <div className='ubr-lens-loading' role='status' aria-live='polite'>
          <span>{localOcrStatus}</span>
        </div>
      )}
      {!activeSourceContext && isCompanionLoading && (
        <div className="ubr-lens-loading" aria-live="polite">
          <Loader2 size={20} className="ubr-spinner" aria-hidden="true" />
          <span>Reading only the focused source context…</span>
        </div>
      )}
      {!activeSourceContext && lensError && !isHandwritingPromptOpen && (
        <div className="ubr-lens-error" role="alert">
          <AlertCircle size={16} aria-hidden="true" /><p>{lensError}</p>
          <button type="button" onClick={() => setIsLensOpen(false)}>Dismiss</button>
        </div>
      )}
      {!activeSourceContext && isHandwritingPromptOpen && (
        <div className="ubr-handwriting-card animate-reveal" role="region" aria-label="Manual concept input">
          <div className="ubr-handwriting-header">
            <Sparkles size={16} aria-hidden="true" />
            <strong>Handwritten or Visual Source</strong>
          </div>
          <p className="ubr-handwriting-copy">
            {lensError || 'On-device OCR is best suited for printed text.'} Type a concept from this page to explain it with your {profile.interest} lens:
          </p>
          <form
            className="ubr-handwriting-form"
            onSubmit={(e) => {
              e.preventDefault()
              void handleManualPromptSubmit()
            }}
          >
            <input
              type="text"
              className="ubr-handwriting-input"
              placeholder="e.g. directed graph adjacency, in-degree"
              value={handwritingPrompt}
              onChange={(e) => setHandwritingPrompt(e.target.value)}
              autoFocus
            />
            <div className="ubr-handwriting-actions">
              <button
                type="button"
                className="ubr-handwriting-cancel"
                onClick={() => {
                  setIsHandwritingPromptOpen(false)
                  setIsLensOpen(false)
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ubr-handwriting-submit"
                disabled={!handwritingPrompt.trim() || isCompanionLoading}
              >
                {isCompanionLoading ? 'Explaining…' : 'Explain with my lens'}
              </button>
            </div>
          </form>
        </div>
      )}
      {activeSourceContext && (
        <>
          {activeSourceContext.parsedMath && (
            <div className="ubr-detected-formula-strip animate-reveal" role="region" aria-label="Detected formula">
              <div className="ubr-detected-formula-header">
                <span className="ubr-badge ubr-badge-vision">Math Vision</span>
                <strong>{activeSourceContext.parsedMath.topic}</strong>
              </div>
              {activeSourceContext.parsedMath.theoremLatex && (
                <div
                  className="ubr-detected-formula-math"
                  dangerouslySetInnerHTML={{
                    __html: katex.renderToString(activeSourceContext.parsedMath.theoremLatex, {
                      displayMode: true,
                      throwOnError: false,
                    }),
                  }}
                />
              )}
              {activeSourceContext.parsedMath.stepsLatex.length > 0 && (
                <div className="ubr-detected-formula-steps">
                  {activeSourceContext.parsedMath.stepsLatex.map((step, index) => (
                    <div
                      key={`step-${index}`}
                      className="ubr-detected-step-line"
                      dangerouslySetInnerHTML={{
                        __html: katex.renderToString(step, {
                          displayMode: false,
                          throwOnError: false,
                        }),
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
          {!activeArtifact && lensError && (
            <div className='ubr-lens-error' role='alert'>
              <AlertCircle size={16} aria-hidden='true' />
              <p>{lensError}</p>
              <button type='button' onClick={() => void runCompanion(companionMode, true)}>
                Try again
              </button>
            </div>
          )}
          <TutorConversation
            session={tutorSession}
            sourceAnchor={activeSourceContext.anchor}
            interest={profile.interest}
            startingSupport={profile.startingSupport}
            stuckSupport={profile.stuckSupport}
            cloudAllowed={selectionCloudAllowed}
            onCloudAllowedChange={activeSourceContext.selectionOnly
              ? (allowed) => {
                  setCloudTutorAllowed(allowed)
                  void runCompanion(
                    companionMode,
                    true,
                    activeSourceContext.body,
                    allowed,
                  )
                }
              : undefined}
            onOutcome={(helpful) => {
              recordHelpful(
                activeSourceContext.anchor,
                tutorMode,
                helpful,
              )
            }}
            onDismiss={() => setIsLensOpen(false)}
            crossSourceCandidates={crossSourceCandidates.map((candidate) => ({
              anchor: candidate.anchor,
              text: candidate.body,
            }))}
            activeCrossSource={
              activeCrossSource
                ? { anchor: activeCrossSource.anchor, text: activeCrossSource.body }
                : null
            }
            crossSourceAllowed={crossSourceAllowed}
            onCrossSourceChange={(excerpt) => {
              setActiveCrossSource(
                crossSourceCandidates.find(
                  (candidate) =>
                    candidate.anchor.anchorId === excerpt?.anchor.anchorId,
                ) ?? null,
              )
            }}
            onCrossSourceAllowedChange={(allowed) => {
              if (!activeSourceContext || !activeCrossSource) return
              setCrossSourcePermission(
                activeSourceContext.anchor,
                activeCrossSource.anchor,
                allowed,
              )
            }}
          />
        </>
      )}
    </div>
  )
}
