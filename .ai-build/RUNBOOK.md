# RUNBOOK

## Local demo target

The project must support a deterministic local demo with no external AI credentials.

Expected developer flow once implementation lands:

```bash
# backend
cd apps/api
python -m venv .venv
# activate venv for your shell
pip install -r requirements.txt
uvicorn app.main:app --reload

# frontend
cd apps/web
npm install
npm run dev
```

## Demo scenarios

### Golden path
1. Open Acme Payments case.
2. Start review.
3. Confirm streamed workflow progress.
4. Inspect evidence for material claims.
5. Review conditional recommendation.
6. Approve or override.
7. Inspect audit history.

### Degraded path
1. Reset case.
2. Enable/switch to degraded scenario.
3. Start review.
4. Confirm dependency failure is explicit.
5. Verify prior successful evidence remains visible.
6. Retry failed step.
7. Confirm workflow resumes safely.

## Pre-demo verification

- CI green.
- Golden-path test green.
- Degraded-path test green.
- Eval summary generated.
- No secrets required.
- No real customer/vendor data present.
- README screenshots/video match current UI.

## Failure triage

1. Reproduce with deterministic fixture.
2. Identify whether failure is UI, API, state-transition or fixture-related.
3. Preserve the failing case as a regression test/eval.
4. Fix behaviour without weakening acceptance criteria.
5. Record material architecture/product changes in `DECISIONS.md`.

## Release rule

Do not present the project as portfolio-ready until critical acceptance criteria in `ACCEPTANCE.md` are satisfied and evidence has been captured.
