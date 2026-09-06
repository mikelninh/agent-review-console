import { describe, expect, it } from 'vitest'
import { applyApiEvent, applyDecision, emptyRun, initialReviewState, retryDegraded, workflowEvents } from './workflow'

describe('regulated review state machine', () => {
  it('never finalizes without a human decision', () => {
    expect(initialReviewState.recommendation).toBe('Conditional approval')
    expect(initialReviewState.finalDecision).toBeNull()
    expect(initialReviewState.status).toBe('awaiting_human')
  })

  it('preserves partial results in degraded mode', () => {
    const events = workflowEvents('degraded')
    const failed = events[events.length - 1].patch
    expect(failed.status).toBe('paused')
    expect(failed.evidence?.length).toBe(2)
    expect('recommendation' in failed ? failed.recommendation : undefined).toBeUndefined()
  })

  it('retries from the failure boundary and restores reviewable state', () => {
    const degraded = emptyRun('degraded')
    const failed = { ...degraded, status: 'paused' as const }
    const retried = retryDegraded(failed)
    expect(retried.status).toBe('awaiting_human')
    expect(retried.evidence.length).toBeGreaterThan(0)
  })

  it('prevents duplicate final decisions', () => {
    const first = applyDecision(initialReviewState, 'Request evidence')
    const second = applyDecision(first, 'Approve')
    expect(second.finalDecision).toBe('Request evidence')
  })

  it('uses backend events to stop at the human gate', () => {
    let state = emptyRun('golden')
    state = applyApiEvent(state, { type: 'run.started', run_id: 'run_API01', mode: 'golden' })
    state = applyApiEvent(state, { type: 'step.completed', step: 'ControlRetriever' })
    state = applyApiEvent(state, { type: 'step.completed', step: 'EvidenceFinder' })
    state = applyApiEvent(state, { type: 'step.completed', step: 'EvidenceAssessor' })
    state = applyApiEvent(state, { type: 'recommendation.proposed', outcome: 'Conditional approval', confidence: 0.84 })
    state = applyApiEvent(state, { type: 'human_gate.required' })

    expect(state.runId).toBe('run_API01')
    expect(state.status).toBe('awaiting_human')
    expect(state.recommendation).toBe('Conditional approval')
    expect(state.finalDecision).toBeNull()
    expect(state.evidence).toHaveLength(4)
  })

  it('maps backend failure events to a safe paused state', () => {
    let state = emptyRun('degraded')
    state = applyApiEvent(state, { type: 'evidence.partial', items: [{ id: 'enc' }, { id: 'pam' }] })
    state = applyApiEvent(state, { type: 'step.failed', step: 'EvidenceFinder', http_status: 503, preserved: { controls: 12, evidence_items: 2 } })
    state = applyApiEvent(state, { type: 'run.paused' })

    expect(state.status).toBe('paused')
    expect(state.evidence).toHaveLength(2)
    expect(state.recommendation).toBeNull()
    expect(state.failure?.preserved).toContain('2 verified evidence items')
  })
})
