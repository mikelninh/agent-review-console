import type { EvidenceItem, ReviewState, TraceEvent, WorkflowStep } from '../types'

const baseEvidence: EvidenceItem[] = [
  {
    id: 'enc',
    control: 'SEC-04',
    question: 'Is sensitive customer data encrypted at rest?',
    status: 'supported',
    answer: 'AES-256 encryption is applied to production data at rest.',
    citation: {
      document: 'Acme_SOC2_2026.pdf',
      page: 34,
      section: 'CC6.1 · Logical access & encryption',
      excerpt: 'Production databases and object storage use AES-256 encryption at rest with centrally managed keys.'
    }
  },
  {
    id: 'pam',
    control: 'IAM-07',
    question: 'Are privileged accounts individually assigned and reviewed?',
    status: 'supported',
    answer: 'Privileged access is individually assigned, MFA-protected and reviewed quarterly.',
    citation: {
      document: 'Security_Questionnaire.pdf',
      page: 12,
      section: 'Identity & privileged access',
      excerpt: 'Administrative access is individual, protected by MFA and subject to quarterly entitlement review.'
    }
  },
  {
    id: 'dr',
    control: 'BCP-03',
    question: 'Is disaster recovery tested at least annually?',
    status: 'partial',
    answer: 'Disaster recovery testing is documented, but the supplied evidence does not establish annual frequency.',
    citation: {
      document: 'Acme_SOC2_2026.pdf',
      page: 71,
      section: 'CC7.4 · Resilience testing',
      excerpt: 'Management performed a disaster recovery exercise during the audit period and recorded remediation actions.'
    },
    reason: 'The source confirms a test occurred, but does not prove the required annual cadence.'
  },
  {
    id: 'sub',
    control: 'TPRM-11',
    question: 'Is the current subprocessor inventory complete and dated?',
    status: 'missing',
    answer: 'No current subprocessor inventory was found in the submitted evidence.',
    reason: 'Request a current, dated subprocessor register before final approval.'
  }
]

const completedSteps: WorkflowStep[] = [
  { id: 'controls', label: 'Control Retriever', detail: '12 applicable controls selected', status: 'complete', duration: '184 ms' },
  { id: 'evidence', label: 'Evidence Finder', detail: '7 sources inspected · 9 evidence spans', status: 'complete', duration: '821 ms' },
  { id: 'assess', label: 'Evidence Assessor', detail: '8 supported · 1 partial · 3 missing', status: 'complete', duration: '642 ms' },
  { id: 'decision', label: 'Decision Agent', detail: 'Conditional approval proposed', status: 'complete', duration: '312 ms' }
]

const baseTrace: TraceEvent[] = [
  { time: '09:41:02', actor: 'system', title: 'Review started', detail: 'Synthetic third-party onboarding · policy pack v2026.4' },
  { time: '09:41:02', actor: 'ControlRetriever', title: 'Controls resolved', detail: '12 controls selected · 184 ms', tone: 'success' },
  { time: '09:41:03', actor: 'EvidenceFinder', title: 'Evidence collected', detail: '7 documents inspected · 9 spans retained · 821 ms', tone: 'success' },
  { time: '09:41:04', actor: 'EvidenceAssessor', title: 'Grounding checked', detail: '8 supported · 1 partial · 3 missing · 642 ms', tone: 'warning' },
  { time: '09:41:05', actor: 'DecisionAgent', title: 'Recommendation proposed', detail: 'Conditional approval · confidence 0.84 · 312 ms', tone: 'success' },
  { time: '09:41:05', actor: 'policy', title: 'Human gate enforced', detail: 'Agent stopped before consequential decision', tone: 'human' }
]

export const initialReviewState: ReviewState = {
  runId: 'run_7H3K92',
  mode: 'golden',
  status: 'awaiting_human',
  steps: completedSteps,
  evidence: baseEvidence,
  recommendation: 'Conditional approval',
  confidence: 0.84,
  summary: 'Core security controls are evidenced. Final approval is blocked until the subprocessor register is supplied and DR test frequency is confirmed.',
  finalDecision: null,
  trace: baseTrace
}

export const emptyRun = (mode: 'golden' | 'degraded'): ReviewState => ({
  ...initialReviewState,
  runId: mode === 'golden' ? 'run_7H3K93' : 'run_FAIL52',
  mode,
  status: 'running',
  steps: completedSteps.map((step, index) => ({ ...step, status: index === 0 ? 'active' : 'pending', detail: index === 0 ? 'Resolving applicable controls…' : 'Waiting' })),
  evidence: [],
  recommendation: null,
  confidence: null,
  summary: 'Review in progress. No consequential decision can be made until evidence assessment completes.',
  finalDecision: null,
  trace: [{ time: 'now', actor: 'system', title: 'Review started', detail: mode === 'golden' ? 'Golden replay' : 'Degraded-path replay' }],
  failure: undefined
})

export const workflowEvents = (mode: 'golden' | 'degraded') => {
  const controlStep: WorkflowStep[] = completedSteps.map((s, i) => ({ ...s, status: i === 0 ? 'complete' : i === 1 ? 'active' : 'pending' }))
  const evidenceStep: WorkflowStep[] = completedSteps.map((s, i) => ({ ...s, status: i <= 1 ? 'complete' : i === 2 ? 'active' : 'pending' }))

  if (mode === 'degraded') {
    const failedSteps: WorkflowStep[] = completedSteps.map((s, i) => {
      if (i === 0) return { ...s, status: 'complete' }
      if (i === 1) return { ...s, status: 'failed', detail: 'Vendor document service unavailable · HTTP 503' }
      return { ...s, status: 'pending', detail: 'Blocked by upstream failure' }
    })
    return [
      { delay: 500, patch: { steps: controlStep, evidence: baseEvidence.slice(0, 1), trace: [...baseTrace.slice(0, 2)] } },
      { delay: 1100, patch: { status: 'paused' as const, steps: failedSteps, evidence: baseEvidence.slice(0, 2), summary: 'Review paused safely. Retrieved controls and evidence remain available; no recommendation was produced.', failure: { title: 'Evidence service unavailable', detail: 'Vendor document service returned HTTP 503 while retrieving remaining evidence.', preserved: '12 controls and 2 verified evidence items were preserved.' }, trace: [...baseTrace.slice(0, 2), { time: '09:44:11', actor: 'EvidenceFinder', title: 'Dependency failed', detail: 'Vendor document service · HTTP 503 · partial results preserved', tone: 'danger' as const }] } }
    ]
  }

  const assessSteps: WorkflowStep[] = completedSteps.map((s, i) => ({ ...s, status: i <= 2 ? 'complete' : 'active' }))
  return [
    { delay: 450, patch: { steps: controlStep, trace: baseTrace.slice(0, 2) } },
    { delay: 950, patch: { steps: evidenceStep, evidence: baseEvidence.slice(0, 3), trace: baseTrace.slice(0, 3) } },
    { delay: 1500, patch: { steps: assessSteps, evidence: baseEvidence, trace: baseTrace.slice(0, 4) } },
    { delay: 2050, patch: { status: 'awaiting_human' as const, steps: completedSteps, evidence: baseEvidence, recommendation: 'Conditional approval' as const, confidence: 0.84, summary: initialReviewState.summary, trace: baseTrace } }
  ]
}

export function applyDecision(state: ReviewState, decision: string, note?: string): ReviewState {
  if (state.finalDecision) return state
  return {
    ...state,
    status: 'finalized',
    finalDecision: decision,
    trace: [
      ...state.trace,
      {
        time: '09:42:31',
        actor: 'Human reviewer',
        title: decision,
        detail: note || 'Human decision recorded with accountability metadata.',
        tone: 'human'
      }
    ]
  }
}

export function retryDegraded(state: ReviewState): ReviewState {
  if (state.status !== 'paused') return state
  return {
    ...initialReviewState,
    runId: state.runId,
    trace: [
      ...state.trace,
      { time: '09:44:29', actor: 'Human reviewer', title: 'Retry requested', detail: 'Resume from failed EvidenceFinder boundary', tone: 'human' },
      { time: '09:44:30', actor: 'EvidenceFinder', title: 'Dependency recovered', detail: 'Remaining evidence retrieved without discarding preserved results', tone: 'success' },
      ...baseTrace.slice(3)
    ]
  }
}
