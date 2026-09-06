# DESIGN SYSTEM

Frontend quality is part of the product contract, not a final polish pass.

## Experience intent

Agent Review Console should feel calm, precise and consequential. The reviewer should understand the case outcome, unresolved evidence and next human action before noticing workflow telemetry.

The interface must communicate:

1. what the agent recommends,
2. what still needs attention,
3. what evidence supports that recommendation,
4. what the human can decide now,
5. where deeper technical detail lives if needed.

## Visual direction

- light institutional workspace rather than dark developer dashboard
- restrained surfaces, generous whitespace and strong typographic hierarchy
- one dominant decision card per screen
- blue used for interactive emphasis, green/amber/red reserved for semantic status
- no neon AI styling, gradients as decoration, glassmorphism or dense telemetry chrome
- no imitation of Deutsche Bank branding or proprietary internal UI

## Hierarchy

Default screen order:

1. Case context
2. Decision snapshot
3. Items requiring attention
4. Human decision controls
5. Verified evidence
6. Workflow / trace / verification as progressive disclosure

Technical metadata must never compete visually with the consequential decision.

## Design tokens

### Colour roles

- canvas: warm neutral near-white
- surface: white
- text-primary: deep ink/navy
- text-secondary: muted slate
- border: neutral cool grey
- interactive: accessible blue
- success: green
- warning: amber
- danger: red

### Typography

Use system fonts only. No external font requests.

- display: 32–40px, medium/semi-bold, tight line-height
- section title: 18–22px, semi-bold
- body: 14–16px, readable line-height
- metadata: 12–13px
- monospace only for IDs, traces and technical evidence

### Spacing

Use an 8px base rhythm. Prefer 16 / 24 / 32 / 48 spacing groups. Avoid micro-spacing that creates visual noise.

### Radius & elevation

- cards: 14–18px
- controls: 10–12px
- pills: 999px
- shadows: subtle and structural, never decorative

## Components

Components must be composable and state-aware. Core primitives:

- CaseHeader
- DecisionSnapshot
- AttentionList
- EvidenceRow
- HumanDecisionPanel
- WorkflowSummary
- StatusBadge
- DetailDrawer
- VerificationPanel
- TraceTimeline

## Interaction rules

- primary action is visually singular
- secondary technical actions are quiet
- evidence inspection opens contextual detail without losing review position
- failure states explain what failed, what was preserved and the recovery action
- motion is short, functional and reduced under prefers-reduced-motion
- focus states remain visible for every interactive control

## Responsive behaviour

Desktop uses a focused two-column review layout only where the secondary column genuinely helps. On smaller screens all content becomes one reading order with the consequential action appearing before technical detail. No horizontal scrolling at 320px width.

## Accessibility

- WCAG AA contrast target
- semantic buttons and headings
- visible focus states
- keyboard-operable drawers and controls
- status is never communicated by colour alone
- support 200% browser zoom without loss of functionality
- respect prefers-reduced-motion

## Anti-patterns

Do not ship:

- dashboard soup
- three equally prominent columns
- all-caps labels everywhere
- model confidence presented as decision authority
- raw agent traces in the primary workflow
- tiny text used to fit more information
- decorative AI visual effects
- hidden failure or missing-evidence states

## Frontend definition of done

Engineering green is necessary but insufficient. A frontend milestone is done only when desktop and mobile renders have been visually reviewed, the 20-second HR comprehension test passes, the 90-second hiring-manager flow is coherent, keyboard/focus behaviour is checked and no critical information competes with the primary decision.