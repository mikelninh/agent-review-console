# AGENTS.md

This repository follows the **AI Build OS**. Agents may implement substantial parts of the system, but they operate inside explicit specifications, autonomy boundaries and verification gates.

## Operating model

1. **SHAPE** — understand problem, user, constraints and architecture.
2. **SPECIFY** — define requirements, boundaries and acceptance criteria before implementation.
3. **DELEGATE** — agents execute only within explicit autonomy limits.
4. **PROVE** — tests, evals, benchmarks and adversarial cases must support claims.
5. **SHIP** — CI and deployment gates must pass before release.
6. **WATCH** — traces, logs, regressions and user feedback inform iteration.

## Agent rules

- Read `.ai-build/SPEC.md`, `.ai-build/ARCHITECTURE.md`, `.ai-build/ACCEPTANCE.md` and `.ai-build/AUTONOMY.md` before making material changes.
- Do not invent product requirements that are not specified. Record unresolved choices in `.ai-build/DECISIONS.md`.
- Prefer deterministic, inspectable behaviour in demo mode.
- Every user-visible claim about system behaviour should be backed by tests, evals or evidence where practical.
- Preserve human approval for regulated/high-impact decisions.
- Treat failure states, retries, partial results and provenance as first-class product behaviour.
- Do not weaken tests or acceptance criteria merely to make CI pass.
- Keep secrets and real customer data out of the repository.

## Definition of done

A change is not done because code exists. It is done when the relevant acceptance criteria pass, tests/evals are updated, and evidence is available for the behaviour claimed.
