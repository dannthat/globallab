import { useMemo, useState } from 'react'
import {
  Check,
  ChevronRight,
  CircleAlert,
  EyeOff,
  Map,
  PencilLine,
  Trash2,
} from 'lucide-react'
import type {
  LivingMasteryNode,
  SourceAnchor,
  UnderstandingClaim,
  UnderstandingClaimDecisionAction,
} from '../personalization/types'

interface UnderstandingMirrorPanelProps {
  claims: UnderstandingClaim[]
  masteryMap: LivingMasteryNode[]
  onDecideClaim: (
    claimId: string,
    action: UnderstandingClaimDecisionAction,
    correction?: string,
  ) => void
  onOpenSource?: (anchor: SourceAnchor) => void
}

const KIND_LABELS: Record<UnderstandingClaim['kind'], string> = {
  demonstrated: 'Demonstrated',
  fragile: 'Fragile',
  misconception: 'Possible misconception',
  'missing-reasoning': 'Missing reasoning',
}

export function UnderstandingMirrorPanel({
  claims,
  masteryMap,
  onDecideClaim,
  onOpenSource,
}: UnderstandingMirrorPanelProps) {
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null)
  const [correction, setCorrection] = useState('')
  const visibleClaims = claims.filter((claim) => claim.status !== 'dismissed')
  const dismissedCount = claims.length - visibleClaims.length
  const sourceCount = useMemo(
    () =>
      new Set(
        claims.flatMap((claim) =>
          claim.evidence.map((citation) => citation.anchorKey),
        ),
      ).size,
    [claims],
  )

  return (
    <>
      <section className="understanding-mirror" aria-labelledby="understanding-mirror-heading">
        <div className="learner-controls__section-heading">
          <div>
            <p className="learner-controls__eyebrow">Editable, evidence-backed</p>
            <h3 id="understanding-mirror-heading">Understanding Mirror</h3>
          </div>
          <span>{visibleClaims.length} claims · {sourceCount} sources</span>
        </div>
        <p className="understanding-mirror__intro">
          These are cautious interpretations of your attempts - not ability labels.
          Confirm, correct, dismiss, or delete any claim.
        </p>

        {visibleClaims.length === 0 ? (
          <p className="learner-controls__empty">
            No understanding claims yet. Koji needs a source-grounded attempt before
            showing one.
          </p>
        ) : (
          <ul className="understanding-mirror__claims">
            {visibleClaims.map((claim) => (
              <li key={claim.id} className={'understanding-claim understanding-claim--' + claim.kind}>
                <div className="understanding-claim__head">
                  <span>{KIND_LABELS[claim.kind]}</span>
                  <small>{claim.status}</small>
                </div>
                <p>{claim.correction || claim.summary}</p>
                {claim.correction && (
                  <p className="understanding-claim__original">
                    Previous wording: {claim.summary}
                  </p>
                )}
                <details>
                  <summary>View {claim.evidence.length} evidence item{claim.evidence.length === 1 ? '' : 's'}</summary>
                  <ul className="understanding-claim__evidence">
                    {claim.evidence.map((citation) => (
                      <li key={citation.evidenceId}>
                        <div>
                          <strong>{citation.anchor.sourceTitle}</strong>
                          <span>{citation.anchor.anchorLabel}</span>
                          <code>{citation.evidenceId}</code>
                        </div>
                        {onOpenSource && (
                          <button type="button" onClick={() => onOpenSource(citation.anchor)}>
                            Open source <ChevronRight size={13} aria-hidden="true" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>

                {editingClaimId === claim.id ? (
                  <form
                    className="understanding-claim__correction"
                    onSubmit={(event) => {
                      event.preventDefault()
                      if (!correction.trim()) return
                      onDecideClaim(claim.id, 'correct', correction)
                      setEditingClaimId(null)
                      setCorrection('')
                    }}
                  >
                    <label>
                      <span>What should this claim say instead?</span>
                      <textarea
                        rows={3}
                        value={correction}
                        onChange={(event) => setCorrection(event.target.value)}
                      />
                    </label>
                    <div>
                      <button type="submit" disabled={!correction.trim()}>Save correction</button>
                      <button type="button" onClick={() => setEditingClaimId(null)}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div className="understanding-claim__actions" role="group" aria-label={'Actions for ' + KIND_LABELS[claim.kind]}>
                    <button type="button" onClick={() => onDecideClaim(claim.id, 'confirm')}>
                      <Check size={13} aria-hidden="true" /> Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingClaimId(claim.id)
                        setCorrection(claim.correction ?? '')
                      }}
                    >
                      <PencilLine size={13} aria-hidden="true" /> Correct
                    </button>
                    <button type="button" onClick={() => onDecideClaim(claim.id, 'dismiss')}>
                      <EyeOff size={13} aria-hidden="true" /> Dismiss
                    </button>
                    <button type="button" onClick={() => onDecideClaim(claim.id, 'delete')}>
                      <Trash2 size={13} aria-hidden="true" /> Delete
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {dismissedCount > 0 && (
          <p className="understanding-mirror__dismissed">
            {dismissedCount} dismissed claim{dismissedCount === 1 ? '' : 's'} remain in
            your export so the decision is inspectable.
          </p>
        )}
      </section>

      <section className="living-mastery-map" aria-labelledby="living-mastery-heading">
        <div className="learner-controls__section-heading">
          <h3 id="living-mastery-heading"><Map size={16} aria-hidden="true" /> Living mastery map</h3>
          <span>{masteryMap.length} concepts</span>
        </div>
        {masteryMap.length === 0 ? (
          <p className="learner-controls__empty">
            Concepts appear after source-grounded checks, explanations, or transfers.
          </p>
        ) : (
          <ul>
            {masteryMap.map((node) => (
              <li key={node.conceptKey}>
                <span className={'mastery-status mastery-status--' + node.status}>
                  {node.status === 'misconception' && <CircleAlert size={12} aria-hidden="true" />}
                  {node.status}
                </span>
                <div>
                  <strong>{node.label}</strong>
                  <small>
                    {node.successfulTransfers}/{node.transferAttempts} successful transfers
                    {node.isReviewDue ? ' · review due' : ''}
                  </small>
                </div>
                {onOpenSource && node.sourceAnchors[0] && (
                  <button type="button" onClick={() => onOpenSource(node.sourceAnchors[0])}>
                    Open
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
