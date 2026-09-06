export type StepStatus = 'complete' | 'active' | 'pending' | 'failed'
export type EvidenceStatus = 'supported' | 'partial' | 'missing'

export type Citation = {
  document: string
  page: number
  section: string
  excerpt: string
}

export type EvidenceItem = {
  id: string
  control: string
  question: string
  status: EvidenceStatus
  answer: string
  citation?: Citation
  reason?: string
}

export type WorkflowStep = {
  id: string
  label: string
  detail: string
  status: StepStatus
  duration?: string
}

export type TraceEvent = {
  time: string
  actor: string
  title: string
  detail: string
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'human'
}

export type ReviewState = {
  runId: string
  mode: 'golden' | 'degraded'
  status: 'ready' | 'running' | 'paused' | 'awaiting_human' | 'finalized'
  steps: WorkflowStep[]
  evidence: EvidenceItem[]
  recommendation: 'Conditional approval' | null
  confidence: number | null
  summary: string
  finalDecision: string | null
  trace: TraceEvent[]
  failure?: {
    title: string
    detail: string
    preserved: string
  }
}
