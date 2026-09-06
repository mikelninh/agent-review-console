# Product implementation notes

The live demo is intentionally narrow: one synthetic third-party onboarding case with one golden run and one degraded run.

## Reviewer flow

1. Understand the case and recommendation without clicking anything.
2. Open a citation and inspect the exact supporting passage.
3. Notice that the DR claim is `PARTIAL`, not falsely upgraded to supported.
4. Make a human decision and inspect the appended audit event.
5. Replay the golden path or inject the dependency failure.
6. Open **Verification** to see the executable release contract.
7. Open **Run trace** to inspect agent and human actions.

## Important boundaries

- Synthetic data only.
- No Deutsche Bank branding or internal information is reproduced.
- The agent never owns the consequential decision.
- `confidence` is contextual information, never an approval threshold.
- Degraded mode withholds the recommendation and preserves partial work.
