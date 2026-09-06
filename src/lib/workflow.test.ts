import { describe, expect, it } from 'vitest'
import { applyDecision, emptyRun, initialReviewState, retryDegraded, workflowEvents } from './workflow'

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
})
