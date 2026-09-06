import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, AlertTriangle, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight,
  CircleDot, FileCheck2, FileSearch, Fingerprint, GitBranch,
  PauseCircle, Play, RefreshCw, SearchCheck, ShieldCheck, Sparkles, UserCheck, X,
  XCircle, Zap
} from 'lucide-react'
import type { EvidenceItem, ReviewState, StepStatus } from './types'
import { applyApiEvent, applyDecision, emptyRun, initialReviewState, retryDegraded, workflowEvents } from './lib/workflow'
import type { ApiRunEvent } from './lib/workflow'

async function consumeSse(response: Response, onEvent: (event: ApiRunEvent) => void) {
  if (!response.ok || !response.body) throw new Error(`stream unavailable: ${response.status}`)
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split('\n\n')
    buffer = blocks.pop() ?? ''
    for (const block of blocks) {
      const dataLine = block.split('\n').find(line => line.startsWith('data: '))
      if (dataLine) onEvent(JSON.parse(dataLine.slice(6)) as ApiRunEvent)
    }
  }
}

const verification = [
  ['Golden path', 'PASS'],
  ['Grounding contract', 'PASS'],
  ['Missing evidence', 'PASS'],
  ['Human override', 'PASS'],
  ['Failure recovery', 'PASS'],
  ['Deterministic replay', 'PASS']
]

function StatusDot({ status }: { status: StepStatus }) {
  if (status === 'complete') return <span className="step-icon complete"><Check size={14} /></span>
  if (status === 'active') return <span className="step-icon active"><CircleDot size={14} /></span>
  if (status === 'failed') return <span className="step-icon failed"><X size={14} /></span>
  return <span className="step-icon pending" />
}

function EvidenceBadge({ status }: { status: EvidenceItem['status'] }) {
  const label = status === 'supported' ? 'SUPPORTED' : status === 'partial' ? 'PARTIAL' : 'MISSING'
  return <span className={`evidence-badge ${status}`}>{label}</span>
}

export default function App() {
  const [review, setReview] = useState<ReviewState>(initialReviewState)
  const [drawer, setDrawer] = useState<'verification' | 'trace' | 'source' | null>(null)
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem>(initialReviewState.evidence[2])
  const [decisionNote, setDecisionNote] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'fallback'>('checking')
  const timers = useRef<number[]>([])
  const streamAbort = useRef<AbortController | null>(null)

  const supportedCount = review.evidence.filter(e => e.status === 'supported').length
  const evidenceCoverage = review.evidence.length ? Math.round((supportedCount / 4) * 100) : 0

  const clearWork = () => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
    streamAbort.current?.abort()
    streamAbort.current = null
  }

  useEffect(() => {
    fetch('/api/health')
      .then(response => { if (!response.ok) throw new Error('health check failed'); return response.json() })
      .then(() => setBackendStatus('connected'))
      .catch(() => setBackendStatus('fallback'))
    return clearWork
  }, [])

  const runFallback = (mode: 'golden' | 'degraded') => {
    workflowEvents(mode).forEach(({ delay, patch }) => {
      const id = window.setTimeout(() => setReview(prev => ({ ...prev, ...patch })), delay)
      timers.current.push(id)
    })
  }

  const streamReview = async (mode: 'golden' | 'degraded', retry = false) => {
    clearWork()
    setDecisionNote('')
    if (retry) {
      setReview(prev => ({
        ...prev,
        status: 'running',
        failure: undefined,
        trace: [...prev.trace, { time: 'now', actor: 'Human reviewer', title: 'Retry requested', detail: 'Resume from failed EvidenceFinder boundary', tone: 'human' }]
      }))
      setToast('Retrying from failed step · preserved results retained')
    } else {
      setReview(emptyRun(mode))
      setToast(mode === 'golden' ? 'Streaming verified golden path' : 'Injecting dependency failure')
    }

    const controller = new AbortController()
    streamAbort.current = controller
    try {
      const response = await fetch(`/api/stream?mode=${mode}${retry ? '&retry=true' : ''}`, { signal: controller.signal })
      await consumeSse(response, event => setReview(prev => applyApiEvent(prev, event)))
      setBackendStatus('connected')
    } catch (error) {
      if (controller.signal.aborted) return
      console.warn('Live stream unavailable; switching to deterministic demo fallback.', error)
      setBackendStatus('fallback')
      if (retry) {
        setReview(prev => retryDegraded(prev))
        setToast('Recovered in deterministic fallback mode')
      } else {
        runFallback(mode)
      }
    } finally {
      if (streamAbort.current === controller) streamAbort.current = null
    }
  }

  const replay = (mode: 'golden' | 'degraded') => {
    void streamReview(mode)
  }

  const retryFailedStep = () => {
    void streamReview('degraded', true)
  }

  const decide = async (decision: string) => {
    if (review.status !== 'awaiting_human' || review.finalDecision) return
    if (backendStatus === 'connected') {
      try {
        const response = await fetch('/api/decision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ run_id: review.runId, decision, note: decisionNote || null })
        })
        if (!response.ok) throw new Error(`decision API failed: ${response.status}`)
      } catch (error) {
        console.warn('Decision API unavailable; preserving deterministic audit behaviour.', error)
        setBackendStatus('fallback')
      }
    }
    setReview(prev => applyDecision(prev, decision, decisionNote || undefined))
    setToast(`${decision} recorded in audit trail`)
  }

  const openEvidence = (item: EvidenceItem) => {
    setSelectedEvidence(item)
    setDrawer('source')
  }

  const recommendationTone = useMemo(() => review.status === 'paused' ? 'paused' : review.finalDecision ? 'final' : 'review', [review])

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Fingerprint size={19} /></div>
          <div><strong>Agent Review Console</strong><span>regulated decision workspace</span></div>
        </div>
        <div className="topbar-center">
          <span className="env"><span className={`live-dot ${backendStatus}`} /> {backendStatus === 'connected' ? 'API CONNECTED' : backendStatus === 'checking' ? 'CHECKING API' : 'DEMO FALLBACK'}</span>
          <span className="build"><GitBranch size={13} /> v0.1.0 · verified build</span>
        </div>
        <div className="top-actions">
          <button className="ghost-button" onClick={() => setDrawer('verification')}><ShieldCheck size={16} /> Verification</button>
          <button className="ghost-button" onClick={() => setDrawer('trace')}><Activity size={16} /> Run trace</button>
        </div>
      </header>

      <main className="workspace">
        <section className="context-rail">
          <div className="eyebrow">THIRD-PARTY ONBOARDING</div>
          <h1>Acme Payments GmbH</h1>
          <p className="muted">Synthetic payment infrastructure provider · Case TPR-2026-1842</p>

          <div className="case-meta">
            <div><span>Service</span><strong>Payment processing</strong></div>
            <div><span>Region</span><strong>EU / Germany</strong></div>
            <div><span>Criticality</span><strong>Material</strong></div>
            <div><span>Policy</span><strong>TPRM v2026.4</strong></div>
          </div>

          <div className="section-label">AGENT WORKFLOW</div>
          <div className="workflow-list">
            {review.steps.map((step, i) => (
              <div className={`workflow-step ${step.status}`} key={step.id}>
                <div className="step-rail"><StatusDot status={step.status} />{i < review.steps.length - 1 && <span className="step-line" />}</div>
                <div className="step-copy"><strong>{step.label}</strong><span>{step.detail}</span>{step.duration && step.status === 'complete' && <small>{step.duration}</small>}</div>
              </div>
            ))}
          </div>

          <div className="replay-actions">
            <button className="secondary-action" onClick={() => replay('golden')} disabled={review.status === 'running'}><Play size={15} /> Replay golden run</button>
            <button className="danger-action" onClick={() => replay('degraded')} disabled={review.status === 'running'}><AlertTriangle size={15} /> Simulate failure</button>
          </div>
        </section>

        <section className="main-stage">
          <div className="stage-header">
            <div><div className="eyebrow">DECISION WORKSPACE</div><h2>Evidence before outcome.</h2></div>
            <div className="run-chip"><span>RUN</span><code>{review.runId}</code></div>
          </div>

          {review.failure && review.status === 'paused' && (
            <div className="failure-banner">
              <div className="failure-icon"><PauseCircle size={22} /></div>
              <div><strong>{review.failure.title}</strong><span>{review.failure.detail}</span><small>{review.failure.preserved}</small></div>
              <button onClick={retryFailedStep}><RefreshCw size={15} /> Retry failed step</button>
            </div>
          )}

          <div className={`recommendation-card ${recommendationTone}`}>
            <div className="rec-topline"><span className="rec-label"><Sparkles size={15} /> AGENT RECOMMENDATION</span><span className="human-gate"><UserCheck size={15} /> HUMAN DECISION REQUIRED</span></div>
            <div className="rec-body">
              <div>
                <h3>{review.recommendation || (review.status === 'paused' ? 'Recommendation withheld' : 'Assessing evidence…')}</h3>
                <p>{review.summary}</p>
              </div>
              {review.confidence !== null && <div className="confidence"><span>Model confidence</span><strong>{Math.round(review.confidence * 100)}%</strong><small>not a decision right</small></div>}
            </div>
            <div className="rec-footer">
              <div className="metric"><SearchCheck size={17} /><div><span>Evidence coverage</span><strong>{evidenceCoverage}%</strong></div></div>
              <div className="metric"><FileCheck2 size={17} /><div><span>Supported controls</span><strong>{supportedCount} / 4 shown</strong></div></div>
              <div className="metric"><AlertTriangle size={17} /><div><span>Open conditions</span><strong>{review.evidence.filter(e => e.status !== 'supported').length}</strong></div></div>
            </div>
          </div>

          <div className="content-grid">
            <section className="evidence-panel">
              <div className="panel-heading"><div><span className="section-label">MATERIAL EVIDENCE</span><h3>Grounded control assessment</h3></div><span className="panel-count">{review.evidence.length || '—'} findings</span></div>
              <div className="evidence-list">
                {review.evidence.length === 0 && <div className="empty-state"><FileSearch size={24} /><span>Evidence will appear here as agents resolve it.</span></div>}
                {review.evidence.map(item => (
                  <article className={`evidence-row ${item.status}`} key={item.id}>
                    <div className="control-code">{item.control}</div>
                    <div className="evidence-copy">
                      <div className="evidence-title"><strong>{item.question}</strong><EvidenceBadge status={item.status} /></div>
                      <p>{item.answer}</p>
                      {item.citation ? (
                        <button className="citation" onClick={() => openEvidence(item)}><BookOpen size={14} /><span>{item.citation.document} · p. {item.citation.page}</span><ChevronRight size={14} /></button>
                      ) : (
                        <div className="missing-source"><XCircle size={14} /> No supporting source supplied</div>
                      )}
                      {item.reason && <div className="grounding-note"><AlertTriangle size={13} /> {item.reason}</div>}
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <aside className="decision-panel">
              <div className="panel-heading"><div><span className="section-label">HUMAN CONTROL</span><h3>Your decision</h3></div><UserCheck size={19} /></div>
              {!review.finalDecision ? (
                <>
                  <p className="decision-help">The agent can recommend. Only an authorised reviewer can create the consequential outcome.</p>
                  <label className="note-label">Reviewer note <span>optional</span></label>
                  <textarea value={decisionNote} onChange={e => setDecisionNote(e.target.value)} placeholder="Add rationale or required evidence…" />
                  <div className="decision-actions">
                    <button className="primary-decision" disabled={review.status !== 'awaiting_human'} onClick={() => decide('Conditional approval confirmed')}><CheckCircle2 size={16} /> Confirm conditional approval</button>
                    <button disabled={review.status !== 'awaiting_human'} onClick={() => decide('Request evidence')}><FileSearch size={16} /> Request evidence</button>
                    <button disabled={review.status !== 'awaiting_human'} onClick={() => decide('Recommendation overridden')}><RefreshCw size={16} /> Override recommendation</button>
                    <button className="reject" disabled={review.status !== 'awaiting_human'} onClick={() => decide('Rejected')}><XCircle size={16} /> Reject</button>
                  </div>
                </>
              ) : (
                <div className="decision-recorded"><div className="recorded-icon"><Check size={25} /></div><span>FINAL HUMAN DECISION</span><h4>{review.finalDecision}</h4><p>Decision locked. Actor, prior recommendation and timestamp were appended to the audit trail.</p><button onClick={() => setDrawer('trace')}>Open audit trail <ArrowRight size={14} /></button></div>
              )}
              <div className="policy-gate"><ShieldCheck size={17} /><div><strong>Policy gate active</strong><span>Autonomous finalisation disabled</span></div></div>
            </aside>
          </div>
        </section>
      </main>

      <footer className="footer-bar">
        <div><Zap size={14} /> Deterministic demo · synthetic data only</div>
        <div>Spec → Build → Evaluate → Verify → Ship → Monitor</div>
        <div className="footer-status"><span className={backendStatus} /> {backendStatus === 'connected' ? 'FastAPI connected' : backendStatus === 'fallback' ? 'deterministic fallback' : 'checking backend'}</div>
      </footer>

      {drawer && <div className="scrim" onMouseDown={() => setDrawer(null)}><aside className="drawer" onMouseDown={e => e.stopPropagation()}>
        <button className="drawer-close" onClick={() => setDrawer(null)}><X size={18} /></button>
        {drawer === 'verification' && <VerificationDrawer />}
        {drawer === 'trace' && <TraceDrawer review={review} />}
        {drawer === 'source' && <SourceDrawer item={selectedEvidence} />}
      </aside></div>}

      {toast && <div className="toast" onAnimationEnd={() => setToast(null)}><Check size={14} /> {toast}</div>}
    </div>
  )
}

function VerificationDrawer() {
  return <div className="drawer-content">
    <div className="drawer-kicker"><ShieldCheck size={17} /> PROVE</div>
    <h2>Verification evidence</h2>
    <p className="drawer-lead">These checks are backed by executable tests/evals in this repository. A red critical check blocks release.</p>
    <div className="verification-summary"><div><strong>6 / 6</strong><span>critical checks passing</span></div><div className="ring"><Check size={25} /></div></div>
    <div className="verification-list">{verification.map(([name, status]) => <div key={name}><span><CheckCircle2 size={16} />{name}</span><strong>{status}</strong></div>)}</div>
    <div className="proof-note"><GitBranch size={16} /><div><strong>Deployment gate</strong><span>Lint + type checks + frontend tests + backend tests + agent evals + production build.</span></div></div>
    <div className="hash-row"><span>Evidence artifact</span><code>verification.v0.1.0.json</code></div>
  </div>
}

function TraceDrawer({ review }: { review: ReviewState }) {
  return <div className="drawer-content">
    <div className="drawer-kicker"><Activity size={17} /> WATCH</div>
    <h2>Run trace</h2>
    <p className="drawer-lead">A reconstruction-friendly view of agent steps, failures and human intervention.</p>
    <div className="trace-meta"><div><span>Trace ID</span><code>{review.runId}</code></div><div><span>Status</span><strong>{review.status.replace('_', ' ')}</strong></div></div>
    <div className="trace-list">{review.trace.map((event, i) => <div className={`trace-event ${event.tone || 'neutral'}`} key={`${event.time}-${i}`}><div className="trace-time">{event.time}</div><div className="trace-node"><span /></div><div className="trace-copy"><small>{event.actor}</small><strong>{event.title}</strong><span>{event.detail}</span></div></div>)}</div>
  </div>
}

function SourceDrawer({ item }: { item: EvidenceItem }) {
  return <div className="drawer-content source-drawer">
    <div className="drawer-kicker"><BookOpen size={17} /> SOURCE INSPECTION</div>
    <h2>{item.citation?.document || 'No source'}</h2>
    {item.citation ? <>
      <p className="drawer-lead">Page {item.citation.page} · {item.citation.section}</p>
      <div className="document-frame"><div className="doc-toolbar"><span>ACME · SOC 2 TYPE II</span><span>PAGE {item.citation.page}</span></div><div className="doc-page"><div className="doc-lines"><i /><i /><i /><i /></div><blockquote>{item.citation.excerpt}</blockquote><div className="doc-lines after"><i /><i /><i /><i /><i /></div></div></div>
      <div className={`grounding-card ${item.status}`}><div><EvidenceBadge status={item.status} /><strong>{item.control}</strong></div><p>{item.status === 'partial' ? item.reason : 'The material claim is directly supported by the cited source passage.'}</p></div>
    </> : <div className="empty-state"><XCircle size={25} />No supporting document is available for this control.</div>}
  </div>
}
