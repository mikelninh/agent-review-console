# ACCEPTANCE CRITERIA

The proof is ready to show only when all critical criteria below are demonstrably satisfied.

## A. First-impression UX

- [ ] A reviewer can understand the case, current workflow state and next action within 30 seconds.
- [ ] The interface does not rely on a chat transcript as the primary interaction model.
- [ ] Status, evidence, uncertainty and human authority are visually distinct.

## B. Streaming workflow

- [ ] Starting a review produces incremental progress events without a page refresh.
- [ ] Completed, active, pending and failed steps are visibly different.
- [ ] Partial results remain visible when a later step fails.
- [ ] Reconnecting/retrying does not silently duplicate a final decision.

## C. Evidence & provenance

- [ ] Every material recommendation claim links to at least one evidence item or is explicitly marked unsupported/missing.
- [ ] Evidence shows document name and stable location/page metadata.
- [ ] Missing evidence is not represented as a successful control.

## D. Human-in-the-loop

- [ ] The agent cannot finalize the regulated decision autonomously.
- [ ] Reviewer can approve, edit, request evidence or reject.
- [ ] Human override records actor, timestamp, previous recommendation and final decision.

## E. Failure handling

- [ ] Demo can intentionally simulate at least one dependency failure.
- [ ] Failure explains what failed, what was preserved and what action is available.
- [ ] Retry resumes from an appropriate boundary rather than resetting the entire case unnecessarily.

## F. Auditability

- [ ] Major workflow and decision transitions create audit events.
- [ ] Audit timeline distinguishes agent actions from human actions.
- [ ] Final state can be reconstructed from recorded events in demo mode.

## G. Engineering quality

- [ ] Frontend and backend tests cover the golden path.
- [ ] At least one automated test covers the degraded path.
- [ ] Eval fixtures cover unsupported evidence and human override.
- [ ] CI runs lint/type checks/tests on pull requests.
- [ ] `DEMO_MODE` runs with no external AI provider credentials.

## H. Evidence to show

Before declaring the project portfolio-ready, capture evidence for:

- [ ] golden-path run
- [ ] cited evidence inspection
- [ ] human override
- [ ] degraded run + recovery
- [ ] passing test/eval summary
- [ ] architecture/decision documentation
