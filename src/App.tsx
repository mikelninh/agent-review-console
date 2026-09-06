import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDot,
  FileSearch,
  Fingerprint,
  GitBranch,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
  XCircle
} from 'lucide-react'
import type { EvidenceItem, ReviewState, StepStatus } from './types'
import {
  applyApiEvent,
  applyDecision,
  emptyRun,
  initialReviewState,
  retryDegraded,
  workflowEvents
} from './lib/workflow'
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

function EvidenceBadge({ status }: { status: EvidenceItem['status'] }) {
  const label = status === 'supported' ? 'Supported' : status === 'partial' ? 'Partial' : 'Missing'
  return <span className={`status-badge ${status}`}>{label}</span>
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'complete') return <span className="step-dot complete"><Check size={13} /></span>
  if (status === 'active') return <span className="step-dot active"><CircleDot size={13} /></span>
  if (status === 'failed') return <span className="step-dot failed"><X size={13} /></span>
  return <span className="step-dot pending" />
}

export default function App() {
  const isStaticDemo = import.meta.env.MODE === 'pages'
  const [review, setReview] = useState<ReviewState>(initialReviewState)
  const [drawer, setDrawer] = useState<'verification' | 'trace' | 'source' | null>(null)
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem>(initialReviewState.evidence[2])
  const [decisionNote, setDecisionNote] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const [showSupported, setShowSupported] = useState(false)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'fallback' | 'static'>(isStaticDemo ? 'static' : 'checking')
  const timers = useRef<number[]>([])
  const streamAbort = useRef<AbortController | null>(null)

  const attentionItems = useMemo(() => review.evidence.filter(item => item.status !== 'supported'), [review.evidence])
  const supportedItems = useMemo(() => review.evidence.filter(item => item.status === 'supported'), [review.evidence])
  const completedSteps = review.steps.filter(step => step.status === 'complete').length
  const evidenceCoverage = review.evidence.length ? Math.round((supportedItems.length / 4) * 100) : 0

  const clearWork = () => {
    timers.current.forEach(window.clearTimeout)
    timers.current = []
    streamAbort.current?.abort()
    streamAbort.current = null
  }

  useEffect(() => {
    if (isStaticDemo) return clearWork
    fetch('/api/health')
      .then(response => {
        if (!response.ok) throw new Error('health check failed')
        return response.json()
      })
      .then(() => setBackendStatus('connected'))
      .catch(() => setBackendStatus('fallback'))
    return clearWork
  }, [])

  useEffect(() => {
    if (!drawer) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawer(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [drawer])

  const runFallback = (mode: 'golden' | 'degraded') => {
    workflowEvents(mode).forEach(({ delay, patch }) => {
      const id = window.setTimeout(() => setReview(prev => ({ ...prev, ...patch })), delay)
      timers.current.push(id)
    })
  }

  const streamReview = async (mode: 'golden' | 'degraded', retry = false) => {
    clearWork()
    setDecisionNote('')

    if (isStaticDemo) {
      setBackendStatus('static')
      if (retry) {
        setReview(prev => retryDegraded(prev))
        setToast('Recovered from preserved state')
      } else {
        setReview(emptyRun(mode))
        setToast(mode === 'golden' ? 'Replaying verified golden path' : 'Injecting dependency failure')
        runFallback(mode)
      }
      return
    }

    if (retry) {
      setReview(prev => ({
        ...prev,
        status: 'running',
        failure: undefined,
        trace: [
          ...prev.trace,
          {
            time: 'now',
            actor: 'Human reviewer',
            title: 'Retry requested',
            detail: 'Resume from failed EvidenceFinder boundary',
            tone: 'human'
          }
        ]
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

  const scrollToDecision = () => {
    document.getElementById('human-decision')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-mark"><Fingerprint size={18} /></div>
          <div>
            <strong>Agent Review</strong>
            <span>Third-party risk workspace</span>
          </div>
        </div>

        <div className="header-actions">
          <span className={`environment ${backendStatus}`}>
            <span className="environment-dot" />
            {backendStatus === 'static'
              ? 'Verified demo'
              : backendStatus === 'connected'
                ? 'API connected'
                : backendStatus === 'checking'
                  ? 'Checking API'
                  : 'Demo mode'}
          </span>
          <button className="quiet-button" onClick={() => setDrawer('verification')}>
            <ShieldCheck size={16} /> Verification
          </button>
          <button className="quiet-button" onClick={() => setDrawer('trace')}>
            <Activity size={16} /> Run trace
          </button>
        </div>
      </header>

      <main className="review-page">
        <section className="case-header" aria-labelledby="case-title">
          <div>
            <div className="breadcrumb">Third-party reviews <ChevronRight size={14} /> TPR-2026-1842</div>
            <h1 id="case-title">Acme Payments GmbH</h1>
            <p>Payment processing · EU / Germany · Material service</p>
          </div>
          <div className="case-status">
            <span>Review status</span>
            <strong>{review.finalDecision ? 'Decision recorded' : review.status === 'paused' ? 'Review paused' : 'Decision required'}</strong>
          </div>
        </section>

        {review.failure && review.status === 'paused' && (
          <section className="failure-callout" aria-live="polite">
            <div className="failure-symbol"><AlertTriangle size={20} /></div>
            <div>
              <strong>{review.failure.title}</strong>
              <p>{review.failure.detail}</p>
              <span>{review.failure.preserved}</span>
            </div>
            <button onClick={retryFailedStep}><RefreshCw size={15} /> Retry failed step</button>
          </section>
        )}

        <section className={`decision-snapshot ${review.status === 'paused' ? 'paused' : ''}`}>
          <div className="snapshot-heading">
            <span className="snapshot-label"><Sparkles size={16} /> Agent recommendation</span>
            <span className="human-boundary"><UserCheck size={15} /> Human decision required</span>
          </div>

          <div className="snapshot-body">
            <div className="snapshot-copy">
              <h2>{review.recommendation || (review.status === 'paused' ? 'Recommendation withheld' : 'Reviewing evidence…')}</h2>
              <p>{review.summary}</p>
              {attentionItems.length > 0 && review.status !== 'running' && (
                <div className="condition-row">
                  {attentionItems.map(item => (
                    <button key={item.id} className={`condition-chip ${item.status}`} onClick={() => openEvidence(item)}>
                      {item.control} · {item.status === 'partial' ? 'Needs confirmation' : 'Evidence missing'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="snapshot-action">
              <div className="confidence-note">
                <span>Evidence coverage</span>
                <strong>{evidenceCoverage}%</strong>
                <small>{review.confidence !== null ? `Model confidence ${Math.round(review.confidence * 100)}% · advisory only` : 'No recommendation produced'}</small>
              </div>
              {!review.finalDecision && (
                <button className="primary-action" onClick={scrollToDecision} disabled={review.status !== 'awaiting_human'}>
                  Review decision <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="snapshot-metrics">
            <div><span>Needs attention</span><strong>{attentionItems.length || '—'}</strong></div>
            <div><span>Evidence shown</span><strong>{review.evidence.length || '—'} / 4</strong></div>
            <div><span>Workflow</span><strong>{completedSteps} / 4 complete</strong></div>
            <div><span>Decision authority</span><strong>Human reviewer</strong></div>
          </div>
        </section>

        <div className="review-layout">
          <section className="evidence-workspace" aria-labelledby="attention-title">
            <div className="section-heading">
              <div>
                <span className="section-kicker">Evidence review</span>
                <h2 id="attention-title">Needs attention</h2>
                <p>Resolve these items before final approval.</p>
              </div>
              <span className="attention-count">{attentionItems.length} open</span>
            </div>

            <div className="attention-list">
              {attentionItems.length === 0 && review.status === 'running' && (
                <div className="empty-evidence"><FileSearch size={21} /> Evidence appears as the review progresses.</div>
              )}
              {attentionItems.map(item => (
                <EvidenceRow key={item.id} item={item} onOpen={openEvidence} attention />
              ))}
            </div>

            <div className="verified-section">
              <button className="verified-toggle" onClick={() => setShowSupported(value => !value)} aria-expanded={showSupported}>
                <span><CheckCircle2 size={17} /> {supportedItems.length} verified controls</span>
                <ChevronDown size={17} className={showSupported ? 'rotated' : ''} />
              </button>
              {showSupported && (
                <div className="verified-list">
                  {supportedItems.map(item => <EvidenceRow key={item.id} item={item} onOpen={openEvidence} />)}
                </div>
              )}
            </div>
          </section>

          <aside className="human-panel" id="human-decision" aria-labelledby="human-title">
            <div className="human-panel-heading">
              <div className="human-icon"><UserCheck size={19} /></div>
              <div>
                <span>Human checkpoint</span>
                <h2 id="human-title">Your decision</h2>
              </div>
            </div>

            {!review.finalDecision ? (
              <>
                <p className="human-intro">The agent can recommend. Only an authorised reviewer can create the consequential outcome.</p>

                <label className="note-label" htmlFor="reviewer-note">
                  Reviewer note <span>Optional</span>
                </label>
                <textarea
                  id="reviewer-note"
                  value={decisionNote}
                  onChange={event => setDecisionNote(event.target.value)}
                  placeholder="Add rationale or required evidence…"
                  disabled={review.status !== 'awaiting_human'}
                />

                <div className="human-actions">
                  <button className="confirm-action" disabled={review.status !== 'awaiting_human'} onClick={() => decide('Conditional approval confirmed')}>
                    <Check size={16} /> Confirm conditional approval
                  </button>
                  <button disabled={review.status !== 'awaiting_human'} onClick={() => decide('Request evidence')}>
                    <FileSearch size={16} /> Request evidence
                  </button>
                  <button disabled={review.status !== 'awaiting_human'} onClick={() => decide('Recommendation overridden')}>
                    <RefreshCw size={16} /> Override recommendation
                  </button>
                  <button className="reject-action" disabled={review.status !== 'awaiting_human'} onClick={() => decide('Rejected')}>
                    <XCircle size={16} /> Reject
                  </button>
                </div>

                <div className="policy-note"><ShieldCheck size={16} /><span><strong>Policy gate active.</strong> Autonomous finalisation is disabled.</span></div>
              </>
            ) : (
              <div className="decision-complete">
                <div className="complete-mark"><Check size={23} /></div>
                <span>Final human decision</span>
                <h3>{review.finalDecision}</h3>
                <p>Actor, prior recommendation and timestamp were appended to the audit trail.</p>
                <button onClick={() => setDrawer('trace')}>Open audit trail <ArrowRight size={15} /></button>
              </div>
            )}
          </aside>
        </div>

        <section className="workflow-section" aria-labelledby="workflow-title">
          <div className="workflow-header">
            <div>
              <span className="section-kicker">System behaviour</span>
              <h2 id="workflow-title">Agent workflow</h2>
              <p>Technical progress is available when you need it, not before.</p>
            </div>
            <div className="workflow-actions">
              <button onClick={() => void streamReview('golden')} disabled={review.status === 'running'}><Play size={15} /> Replay golden run</button>
              <button className="failure-button" onClick={() => void streamReview('degraded')} disabled={review.status === 'running'}><AlertTriangle size={15} /> Simulate failure</button>
            </div>
          </div>

          <div className="workflow-strip">
            {review.steps.map((step, index) => (
              <div className={`workflow-item ${step.status}`} key={step.id}>
                <div className="workflow-node">
                  <StepIcon status={step.status} />
                  {index < review.steps.length - 1 && <span className="workflow-connector" />}
                </div>
                <div>
                  <strong>{step.label}</strong>
                  <span>{step.detail}</span>
                  {step.duration && step.status === 'complete' && <small>{step.duration}</small>}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <span>Synthetic data · deterministic demo</span>
        <span className="build-ref"><GitBranch size={13} /> v0.2 · verified build</span>
      </footer>

      {drawer && (
        <div className="scrim" onMouseDown={() => setDrawer(null)}>
          <aside className="drawer" role="dialog" aria-modal="true" onMouseDown={event => event.stopPropagation()}>
            <button className="drawer-close" onClick={() => setDrawer(null)} aria-label="Close detail panel"><X size={18} /></button>
            {drawer === 'verification' && <VerificationDrawer />}
            {drawer === 'trace' && <TraceDrawer review={review} />}
            {drawer === 'source' && <SourceDrawer item={selectedEvidence} />}
          </aside>
        </div>
      )}

      {toast && <div className="toast" role="status" onAnimationEnd={() => setToast(null)}><Check size={14} /> {toast}</div>}
    </div>
  )
}

function EvidenceRow({ item, onOpen, attention = false }: { item: EvidenceItem; onOpen: (item: EvidenceItem) => void; attention?: boolean }) {
  return (
    <article className={`evidence-row ${item.status} ${attention ? 'attention' : ''}`}>
      <div className="evidence-status-mark">
        {item.status === 'supported' ? <CheckCircle2 size={18} /> : item.status === 'partial' ? <AlertTriangle size={18} /> : <FileSearch size={18} />}
      </div>
      <div className="evidence-main">
        <div className="evidence-meta"><span>{item.control}</span><EvidenceBadge status={item.status} /></div>
        <h3>{item.question}</h3>
        <p>{item.answer}</p>
        {item.reason && <div className="evidence-reason">{item.reason}</div>}
      </div>
      <div className="evidence-source">
        {item.citation ? (
          <button onClick={() => onOpen(item)}><BookOpen size={15} /><span>{item.citation.document}<small>Page {item.citation.page}</small></span><ChevronRight size={15} /></button>
        ) : (
          <span className="no-source"><XCircle size={15} /> No source supplied</span>
        )}
      </div>
    </article>
  )
}

function VerificationDrawer() {
  return (
    <div className="drawer-content">
      <div className="drawer-kicker"><ShieldCheck size={17} /> PROVE</div>
      <h2>Verification evidence</h2>
      <p className="drawer-lead">Executable checks back the claims shown in this demo. Critical failures block release.</p>

      <div className="verification-summary">
        <div><strong>6 / 6</strong><span>critical behavioural checks passing</span></div>
        <div className="verification-mark"><Check size={22} /></div>
      </div>

      <div className="verification-list">
        {verification.map(([name, status]) => (
          <div key={name}><span><CheckCircle2 size={16} /> {name}</span><strong>{status}</strong></div>
        ))}
      </div>

      <div className="proof-note"><GitBranch size={16} /><span><strong>Release gate</strong>Lint · typecheck · frontend tests · backend tests · agent evals · production build.</span></div>
      <div className="artifact-row"><span>Evidence artifact</span><code>verification.v0.1.0.json</code></div>
    </div>
  )
}

function TraceDrawer({ review }: { review: ReviewState }) {
  return (
    <div className="drawer-content">
      <div className="drawer-kicker"><Activity size={17} /> WATCH</div>
      <h2>Run trace</h2>
      <p className="drawer-lead">A reconstruction-friendly view of agent steps, failures and human intervention.</p>

      <div className="trace-meta">
        <div><span>Trace ID</span><code>{review.runId}</code></div>
        <div><span>Status</span><strong>{review.status.replace('_', ' ')}</strong></div>
      </div>

      <div className="trace-list">
        {review.trace.map((event, index) => (
          <div className={`trace-event ${event.tone || 'neutral'}`} key={`${event.time}-${index}`}>
            <div className="trace-time">{event.time}</div>
            <div className="trace-line"><span /></div>
            <div className="trace-copy"><small>{event.actor}</small><strong>{event.title}</strong><span>{event.detail}</span></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SourceDrawer({ item }: { item: EvidenceItem }) {
  return (
    <div className="drawer-content source-drawer">
      <div className="drawer-kicker"><BookOpen size={17} /> SOURCE INSPECTION</div>
      <h2>{item.citation?.document || 'No source available'}</h2>

      {item.citation ? (
        <>
          <p className="drawer-lead">Page {item.citation.page} · {item.citation.section}</p>
          <div className="document-preview">
            <div className="document-toolbar"><span>ACME · EVIDENCE</span><span>PAGE {item.citation.page}</span></div>
            <div className="document-page">
              <div className="fake-lines"><i /><i /><i /></div>
              <blockquote>{item.citation.excerpt}</blockquote>
              <div className="fake-lines after"><i /><i /><i /><i /></div>
            </div>
          </div>
          <div className={`grounding-card ${item.status}`}>
            <div><EvidenceBadge status={item.status} /><strong>{item.control}</strong></div>
            <p>{item.status === 'partial' ? item.reason : 'The material claim is directly supported by the cited source passage.'}</p>
          </div>
        </>
      ) : (
        <div className="source-empty"><FileSearch size={25} /><strong>Evidence missing</strong><span>No supporting document was supplied for this control.</span></div>
      )}
    </div>
  )
}
