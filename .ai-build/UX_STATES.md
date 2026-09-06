# UX STATES

The interface must make system state legible without requiring the reviewer to understand the implementation.

## Ready / awaiting human

Default demo state. Show the recommendation, unresolved controls and the human decision boundary immediately. Technical workflow completion is secondary.

## Running

Show a calm progress treatment near the decision snapshot. Evidence appears incrementally. Human decision controls remain unavailable until the human gate is reached.

## Partial evidence

A partial claim remains visible and inspectable. The UI states exactly what the source supports and what it does not establish. Partial never appears equivalent to supported.

## Missing evidence

Missing evidence is explicit, not an empty success state. The next useful action is to request the missing evidence.

## Awaiting human

Recommendation is complete but not final. The interface makes human authority unmistakable and presents one clear primary action with secondary alternatives.

## Degraded / dependency failure

The failure state must answer three questions in plain language: what failed, what data was preserved, and what can the reviewer do now. Completed evidence remains visible. No recommendation is produced if the failure invalidates the decision path.

## Recovery

Retry resumes from the failed boundary. Preserved evidence does not disappear or replay as if newly discovered. The audit trace records the retry.

## Finalized

The final human decision replaces decision controls. Show that the decision is human-authored and recorded. Keep prior agent recommendation available in audit detail.

## Source inspection

Source detail appears in a drawer/dialog without navigating away. It includes document, stable page/location, excerpt and grounding status.

## Verification / trace

Verification and run trace are secondary expert surfaces. They are discoverable from the header but never dominate the default decision experience.

## Responsive states

At mobile width, content order is:

1. case and status
2. decision snapshot
3. attention-required evidence
4. human action
5. remaining evidence
6. workflow and technical detail

No primary action should require horizontal scrolling or hover.