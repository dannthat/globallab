import { describe, expect, it } from 'vitest'
import { createTutorMachineState } from '../personalization/tutorMachine'
import type { TutorTurnRequest } from '../personalization/tutorTypes'
import {
  buildTutorPrompt,
  createLocalTutorTurn,
  parseTutorResponse,
} from './tutorService'

function request(): TutorTurnRequest {
  return {
    context: {
      sessionId: 'topic::section',
      entryPoint: 'selection',
      objective: 'Understand the selected relationship',
      excerpt: {
        anchor: {
          sourceId: 'topic',
          sourceKind: 'global-lab',
          sourceTitle: 'Trusted source',
          anchorId: 'section',
          anchorLabel: 'Section',
        },
        text: 'ATP stores immediately usable chemical energy for cellular work.',
      },
      scope: 'selection',
      student: {
        interest: 'gaming',
        gradeLevel: 'Grade 11',
        preferredLanguage: 'French',
        learningGoals: ['Understand difficult material'],
        startingSupport: 'quick',
        stuckSupport: 'walk-through',
        approvedPresentation: {},
      },
      cloudAllowed: true,
    },
    machine: createTutorMachineState(),
    messages: [],
    intent: 'test-me',
  }
}

describe('tutor provider protocol', () => {
  it('keeps the interest lens and focused source explicit', () => {
    const prompt = buildTutorPrompt(request())
    expect(prompt).toContain('active interest lens is gaming')
    expect(prompt).toContain('<SOURCE index="1" anchorId="section">')
    expect(prompt).toContain('ATP stores immediately usable')
    expect(prompt).toContain('diagnosis, hints, guided attempts')
    expect(prompt).toContain('Reply in French.')
    expect(prompt).toContain('Current learning goals: Understand difficult material.')
    expect(prompt).toContain('lead with the shortest useful answer')
  })

  it('changes recovery behavior after Still stuck without dropping the profile', () => {
    const recovery = request()
    recovery.intent = 'step-by-step'
    const prompt = buildTutorPrompt(recovery)

    expect(prompt).toContain('Reply in French.')
    expect(prompt).toContain('walkthrough when stuck')
    expect(prompt).toContain('one useful question or give one step at a time')
  })

  it('uses grade guidance and only explicitly approved presentation preferences', () => {
    const gradeTen = request()
    gradeTen.context.student.gradeLevel = 'Grade 10'
    gradeTen.context.student.approvedPresentation = {
      structure: {
        value: 'steps',
        origin: 'explicit',
        approvedAt: '2026-08-28T10:00:00.000Z',
      },
    }
    const schoolPrompt = buildTutorPrompt(gradeTen)
    expect(schoolPrompt).toContain('Keep sentences under 20 words')
    expect(schoolPrompt).toContain(
      'student-approved presentation preferences: {"structure":"steps"}',
    )
    expect(schoolPrompt).not.toContain('silently assign')

    const university = request()
    university.context.student.gradeLevel = 'University'
    expect(buildTutorPrompt(university)).toContain(
      'precise undergraduate-level technical vocabulary',
    )
    expect(buildTutorPrompt(university)).toContain(
      'Do not infer or silently assign any',
    )
  })

  it('accepts a grounded activity and rejects ungrounded evidence', () => {
    const valid = JSON.stringify({
      phase: 'diagnose',
      message: 'Which phrase names the energy form?',
      actions: [
        {
          type: 'present-activity',
          activity: {
            id: 'q1',
            kind: 'short-answer',
            prompt: 'What stores usable energy?',
            acceptedAnswers: ['ATP'],
            requiredKeywords: ['ATP'],
            evidence: 'ATP stores immediately usable chemical energy',
            explanation: 'That exact phrase supplies the answer.',
            skillTag: 'identify-energy-carrier',
            misconceptionTags: ['confuses-energy-carrier'],
          },
        },
      ],
      skillTags: ['identify-energy-carrier'],
      misconceptionTags: [],
      citations: [
        {
          anchorId: 'section',
          quote: 'ATP stores immediately usable chemical energy',
          label: 'Focused source',
        },
      ],
    })
    expect(parseTutorResponse(valid, request()).actions[0].type).toBe(
      'present-activity',
    )

    const invalid = valid.replace(
      'ATP stores immediately usable chemical energy',
      'Mitochondria make all energy',
    )
    expect(() => parseTutorResponse(invalid, request())).toThrow(/grounded/i)
  })

  it('creates a deterministic local activity when cloud use is unavailable', () => {
    const turn = createLocalTutorTurn(request())
    expect(turn.provider).toBe('local')
    expect(turn.actions[0].type).toBe('present-activity')
  })

  it('rejects completion and review actions before independent transfer', () => {
    const premature = JSON.stringify({
      phase: 'diagnose',
      message: 'You are done.',
      actions: [
        { type: 'schedule-review', reason: 'Review tomorrow.' },
        { type: 'complete-session', summary: 'Complete.' },
      ],
      skillTags: [],
      misconceptionTags: [],
      citations: [
        {
          anchorId: 'section',
          quote: 'ATP stores immediately usable chemical energy',
          label: 'Focused source',
        },
      ],
    })
    expect(() => parseTutorResponse(premature, request())).toThrow(/before/i)
  })

  it('requires explicit permission and exact citations for both cross-source extracts', () => {
    const cross = request()
    cross.intent = 'cross-source'
    cross.machine = createTutorMachineState('cross-source')
    cross.context.secondaryExcerpts = [
      {
        anchor: {
          sourceId: 'notes',
          sourceKind: 'upload',
          sourceTitle: 'My notes',
          anchorId: 'page-4',
          anchorLabel: 'Page 4',
          page: 4,
        },
        text: 'ATP couples energy release to cellular work.',
      },
    ]
    cross.context.crossSourcePermissionId = 'approved:page-4'

    const response = {
      phase: 'diagnose',
      message: 'Both sources describe ATP as a bridge to cellular work.',
      actions: [],
      skillTags: ['connect-sources'],
      misconceptionTags: [],
      citations: [
        {
          anchorId: 'section',
          quote: 'ATP stores immediately usable chemical energy',
          label: 'Global Lab source',
        },
        {
          anchorId: 'page-4',
          quote: 'ATP couples energy release to cellular work',
          label: 'Uploaded notes',
        },
      ],
    }
    expect(parseTutorResponse(JSON.stringify(response), cross).citations).toHaveLength(2)
    expect(() =>
      parseTutorResponse(
        JSON.stringify({ ...response, citations: response.citations.slice(0, 1) }),
        cross,
      ),
    ).toThrow(/both/i)

    const noPermission = request()
    noPermission.intent = 'cross-source'
    noPermission.machine = createTutorMachineState('cross-source')
    noPermission.context.secondaryExcerpts = cross.context.secondaryExcerpts
    const prompt = buildTutorPrompt(noPermission)
    expect(prompt).not.toContain('ATP couples energy release')
  })

  it('accepts Teach Koji coverage only when its evidence is an exact source quote', () => {
    const teach = request()
    teach.intent = 'teach-koji'
    teach.machine = createTutorMachineState('teach-koji')
    const payload = {
      phase: 'diagnose',
      message: 'You covered ATP and its usable-energy role.',
      actions: [],
      skillTags: ['energy-carrier'],
      misconceptionTags: [],
      citations: [
        {
          anchorId: 'section',
          quote: 'ATP stores immediately usable chemical energy',
          label: 'Focused source',
        },
      ],
      understandingCheck: {
        coverage: 'complete',
        coveredConcepts: ['ATP', 'usable chemical energy'],
        missingSteps: [],
        evidenceQuote: 'ATP stores immediately usable chemical energy',
      },
    }
    expect(
      parseTutorResponse(JSON.stringify(payload), teach).understandingCheck?.coverage,
    ).toBe('complete')
    expect(() =>
      parseTutorResponse(
        JSON.stringify({
          ...payload,
          understandingCheck: {
            ...payload.understandingCheck,
            evidenceQuote: 'ATP is always made by mitochondria',
          },
        }),
        teach,
      ),
    ).toThrow(/grounded/i)
  })

  it('rejects simulation controls that are not in the client-owned structured state', () => {
    const simulation = request()
    simulation.context.entryPoint = 'simulation'
    simulation.context.simulation = {
      simulationId: 'sim-1',
      topicId: 'biology',
      sectionId: 'section',
      label: 'ATP lab',
      controls: { substrate: 1 },
      outputs: { atp: 2 },
      updatedAt: '2026-08-29T08:00:00.000Z',
    }
    const payload = JSON.stringify({
      phase: 'scaffold',
      message: 'Change the connected substrate control.',
      actions: [
        {
          type: 'set-simulation-control',
          simulationId: 'sim-1',
          controlId: 'hidden-selector',
          value: 2,
        },
      ],
      skillTags: [],
      misconceptionTags: [],
      citations: [
        {
          anchorId: 'section',
          quote: 'ATP stores immediately usable chemical energy',
          label: 'Focused source',
        },
      ],
    })
    expect(() => parseTutorResponse(payload, simulation)).toThrow(/control/i)
  })
})
