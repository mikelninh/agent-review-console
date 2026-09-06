# AUTONOMY BOUNDARIES

## Principle

Agents are implementation accelerators, not product owners or final authorities. Autonomy expands only where behaviour is specified and verifiable.

## Agents MAY autonomously

- implement components and backend endpoints already defined by the spec
- add or improve tests that preserve acceptance criteria
- refactor internal code without changing observable behaviour
- improve accessibility, typing, error messages and documentation
- generate deterministic synthetic fixtures consistent with the golden case
- add observability that does not expose secrets or sensitive data

## Agents MUST ASK / RECORD A DECISION before

- changing product scope or primary user workflow
- changing the human approval boundary
- adding a new external dependency or AI provider
- changing data retention, privacy or security assumptions
- changing public API contracts
- replacing SSE/state-machine architecture with another orchestration model
- weakening an acceptance criterion or eval threshold

When interactive approval is not available, record the unresolved choice in `DECISIONS.md` and choose the safest reversible implementation.

## Agents MUST NOT

- claim compatibility with Deutsche Bank internal systems
- use real confidential banking/vendor/customer data
- autonomously approve a regulated decision
- fabricate evidence or citations
- hide failed/partial states to make the demo appear successful
- remove or weaken failing tests merely to produce a green build
- commit secrets, API keys or credentials

## Risk tiers

### Tier 1 — Low risk / autonomous
UI polish, refactors, tests, docs, deterministic fixtures.

### Tier 2 — Bounded autonomy
New workflow implementation that is explicitly covered by SPEC + ACCEPTANCE.

### Tier 3 — Human decision required
Security/privacy architecture, production integrations, autonomy expansion, consequential decision policy, acceptance/eval weakening.
