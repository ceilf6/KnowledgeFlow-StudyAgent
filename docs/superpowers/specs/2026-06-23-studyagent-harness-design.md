# StudyAgent OSS Harness Engineering Design

Date: 2026-06-23
Repository: `ceilf6/KnowledgeFlow-StudyAgent`
Base branch: `main`
Reference: `/Users/a86198/Desktop/Wiki/AI/3-Application/FrontAgent-app`

## Goal

Build a lightweight open-source repository Harness for KnowledgeFlow StudyAgent, adapted from FrontAgent's OSS Harness without GitNexus runtime dependency, training-camp claim/score/progress workflows, or auto-merge rules. The Harness should enforce the workflow: Issue -> PR -> wait for Repo Guard CR -> maintainer merge.

## Context

FrontAgent-app provides a mature OSS Harness pattern: authority documents, local quality gates, contract scripts with critical skeleton allowlist and structured impact summary validation, PR/Issue templates, CODEOWNERS, workflow tests, and repo-guard advisory review.

StudyAgent should borrow the engineering control loop, adapted to its reality:

- **Package manager**: npm (not pnpm).
- **Structure**: single-package React app (not pnpm/Turbo monorepo).
- **Base branch**: `main` (not `develop`). PRs target `main` directly.
- **Code intelligence**: GitNexus is not installed. Contract scripts preserve the GitNexus structure but the `analyze` step is optional and degrades gracefully.
- **Critical skeleton**: 2 categories (`repo-harness`, `agent-prompts`) instead of FrontAgent's 6.
- **TDD/SDD**: medium depth. Vitest introduced for TDD; superpowers specs/plans for SDD on non-trivial changes.

## Design Principles

1. Keep authority explicit. Contributors and agents must know which documents define expected behavior before editing code.
2. Keep local commands predictable. A contributor can run the same named gates locally that CI runs remotely.
3. Keep the contract useful, not ritualistic. Critical skeleton changes must include a structured impact summary and matching tests.
4. Keep Repo Guard advisory. It provides AI code review signals but is not a merge authority.
5. Keep OSS friction reasonable. No claim comments, score labels, progress ledgers, timeout-close, or auto-merge.

## Explicitly Not Borrowed

The following FrontAgent mechanisms are either GitNexus-specific or training-camp-specific and are excluded or degraded:

- GitNexus runtime `analyze` as a hard requirement (degraded to optional).
- GitNexus `detect_changes` / `query` / `context` / `impact` as required PR evidence (replaced by manual impact analysis when GitNexus unavailable).
- `认领` issue claim comments.
- `score:*` labels, contributor scoring, penalty mechanics.
- Progress ledgers or cohort reports.
- `确认合并` auto-merge comments.
- PR timeout-close automation.

## Authority Layer

When documents and code disagree, use this priority:

1. `README.md` for public product positioning and user-facing overview.
2. `docs/architecture.md` and `docs/design.md` (when created) for architecture and SDD behavior.
3. `CONTRIBUTING.md`, `docs/workflow.md`, and `docs/knowledge-contract.md` for contribution and Harness rules.
4. Issue or PR text for the specific change.
5. Existing code as implementation evidence, unless it contradicts the above.

If expected behavior remains unclear, ask maintainers instead of silently choosing a new architecture.

## OSS Workflow

The target community loop is:

```text
Issue or Discussion
-> maintainer triage
-> contributor branch (feat/, fix/, docs/, chore/)
-> npm install
-> npm run agent:bootstrap
-> npm run quality:predev
-> focused implementation and tests
-> npm run quality:local before pushing
-> PR to main with structured self-check
-> CI + Contract Guard + Repo Guard CR + maintainer review
-> maintainer merge (triggers GitHub Pages deploy)
```

## Local Gate Layer

Root `package.json` exposes these scripts:

```json
{
  "prepare": "npm run hooks:install",
  "hooks:install": "node scripts/workflows/install-hooks.mjs",
  "agent:bootstrap": "node scripts/workflows/contract-check.mjs bootstrap",
  "contract:local": "node scripts/workflows/contract-check.mjs local",
  "contract:check": "node scripts/workflows/contract-check.mjs check",
  "contract:gitnexus": "node scripts/workflows/contract-check.mjs gitnexus",
  "quality:predev": "npm run hooks:install && npm run contract:local",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:workflows": "node --test scripts/tests/*.test.mjs",
  "quality:precommit": "npm run lint && npm run build && npm run test && npm run test:workflows",
  "quality:ci": "npm run lint && npm run build && npm run test && npm run test:workflows",
  "quality:local": "npm run contract:local && npm run quality:ci"
}
```

`quality:precommit` includes `npm run build` because StudyAgent is a small single-package app where the build is fast and catches type errors that `tsc -b` in the build script surfaces. This differs from FrontAgent which defers build to pre-push.

### Git Hooks

- `.githooks/pre-commit` runs `npm run quality:precommit`.
- `.githooks/pre-push` runs `npm run quality:local`.
- Both honor `SKIP_QUALITY_HOOKS=1` for maintainer emergencies and print that CI remains authoritative.
- `install-hooks.mjs` sets `git config core.hooksPath .githooks` and verifies hook files exist. CI environment skips installation.

## Knowledge Contract

Critical skeleton changes require both matching tests and a structured impact summary.

### Critical Skeleton Categories

| Category | Paths | Matching tests |
|----------|-------|----------------|
| `repo-harness` | `.github/workflows/`, `.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS`, `.githooks/`, `scripts/workflows/`, `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `docs/workflow.md`, `docs/knowledge-contract.md`, `README.md` | `scripts/tests/` |
| `agent-prompts` | `docs/agent-prompts/` | `scripts/tests/` |

Authority docs (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `docs/workflow.md`, `docs/knowledge-contract.md`, `README.md`) are folded into the `repo-harness` category rather than a separate `authority-docs` category, keeping the classification simple for a single-package app.

### Contract Scripts

`scripts/workflows/contract-rules.mjs` exports:

- `CONTRACT_DIFF_FILTER` = `'ACDMRTUXB'`
- `criticalContractRules` — array of `{ category, testPattern, matches, matchesTest? }` for the 2 categories above.
- `classifyContractPaths(files)` — returns `{ critical, nonCritical }`.
- `combineChangedFiles(...groups)` — deduplicates file lists.
- `extractImpactSummary(text)` — extracts the `## Impact Summary` section from PR body.
- `evaluateGitNexusContract({ changedFiles, impactSummary, requireImpactSummary })` — returns `{ ok, reasons, warnings, suggestions, critical, nonCritical }`.
- `validateStructuredImpactSummary(value)` — validates the 4 required fields and rejects placeholders.

`scripts/workflows/contract-check.mjs` supports 4 modes:

- `bootstrap` — runs hook installer and prints the required contributor/agent workflow.
- `local` — runs GitNexus analyze (optional) then evaluates current changed and untracked files.
- `gitnexus` — runs GitNexus analyze (optional) then evaluates PR changed files against `GITNEXUS_IMPACT_SUMMARY`.
- `check` — chooses CI or local mode based on `process.env.CI`.

### GitNexus Optional Degradation

The `runGitNexusAnalyze` function detects whether `npx gitnexus` is available. If unavailable, it prints an advisory warning and continues with contract classification and impact summary validation only. This preserves the FrontAgent structure for future GitNexus integration without making it a hard dependency.

### Structured Impact Summary

Fill this section in the PR template for critical skeleton changes:

```md
## Impact Summary

- Risk level: LOW|MEDIUM|HIGH|CRITICAL
- Critical skeleton changes: explain touched categories or say none
- Impact analysis: mention detect_changes (if GitNexus available) or manual impact conclusion
- Verification: commands run and results, or why unavailable
```

Do not use placeholders such as `-`, `none`, `n/a`, `todo`, or `tbd` for critical skeleton changes.

## CI And Review Layer

### Contract Guard (new)

`.github/workflows/contract-guard.yml`:

- Triggers on PR to `main`, types: opened/edited/synchronize/reopened/ready_for_review.
- Runs `npm run contract:gitnexus` with `GITNEXUS_IMPACT_SUMMARY=${{ github.event.pull_request.body }}`.
- Uses Node 20, `npm ci`, checkout with `fetch-depth: 0`.
- Concurrency group to cancel stale runs.

### Repo Guard (existing, unchanged)

`.github/workflows/repo-guard.yml` remains as-is, targeting `main`. It provides advisory AI code review. Maintainers still decide merges.

### Deploy (existing, unchanged)

`.github/workflows/deploy.yml` remains as-is. Push to `main` triggers GitHub Pages deployment.

### Review Order

CI (lint/build/test) -> Contract Guard (critical skeleton contract) -> Repo Guard (advisory AI CR) -> maintainer review -> merge. Maintainers decide merge readiness through normal GitHub review and branch protection. No comment-triggered auto-merge.

## Templates And Ownership

### PR Template

`.github/PULL_REQUEST_TEMPLATE.md` sections:

- `## Linked Issue Or Context`
- `## Summary`
- `## Impact Scope`
- `## Impact Summary` (required for critical skeleton changes)
- `## Verification`
- `## Checklist` (includes TDD/SDD checks)

### Issue Templates

- `bug.yml`: Summary, Reproduction, Affected Area, Environment, Logs/Screenshots, Contribution checkbox.
- `feature.yml`: Problem, Proposed Behavior, Affected Area, Alternatives, Acceptance Criteria, Contribution checkbox.
- `maintenance.yml`: Reason, Affected Area, Proposed Change, Verification Plan, Contribution checkbox.
- `config.yml`: blank issues enabled, discussions contact link.

### CODEOWNERS

`@ceilf6` requested as reviewer for:

- `.github/workflows/`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/`, `.github/CODEOWNERS`
- `.githooks/`, `scripts/workflows/`, `scripts/tests/`
- `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `docs/workflow.md`, `docs/knowledge-contract.md`
- `docs/agent-prompts/`

## TDD And SDD Discipline

### TDD (Test-Driven Development)

- Introduce **Vitest** as a devDependency for the test runner.
- Engineering prompts (AGENTS.md, CLAUDE.md) encourage red-green-refactor for bug fixes and new features.
- Test files live next to source as `*.test.tsx` / `*.test.ts` under `src/`.
- `quality:precommit` and `quality:ci` include `npm run test`.
- TDD is encouraged, not enforced on every PR. Trivial changes (typo, copy) may skip tests.

### SDD (Spec-Driven Development)

- **Non-trivial changes** (new features, architecture adjustments, critical skeleton changes) must first produce a design doc at `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`.
- Then an implementation plan at `docs/superpowers/plans/YYYY-MM-DD-<topic>.md`.
- Trivial changes (typo, copy, small bug fixes) may skip the spec/plan cycle.
- PR template Checklist includes: "For non-trivial changes, I have written a design doc under docs/superpowers/specs/."

## Engineering Prompts Update

`AGENTS.md` and `CLAUDE.md` are updated to add, after the existing project overview:

- **Documents** section listing authority priority.
- **Work** section with required commands before code changes.
- **Harness Loop** section describing the issue -> PR -> Repo Guard CR -> merge workflow.
- **OSS Scope** section excluding training-camp mechanics.
- **TDD/SDD** section with the discipline rules above.

The existing project overview, tech stack, and design specs sections are preserved. The `docs/agent-prompts/` reference is preserved with a note that those are product runtime prompts, not engineering prompts.

## Testing Strategy

Harness tests (`scripts/tests/workflow-rules.test.mjs`) cover:

- Critical path classification for `repo-harness` and `agent-prompts` categories.
- Non-critical changes pass with advisory warnings.
- Placeholder impact summaries fail for critical changes.
- Impact summaries must include `Risk level`, `Critical skeleton changes`, `Impact analysis`, and `Verification`.
- Required hook files exist and reference `npm run quality:precommit` / `npm run quality:local`.
- `package.json` contains required Harness scripts.
- `contract-guard.yml` targets `main` and calls `npm run contract:gitnexus`.
- `repo-guard.yml` targets `main` and remains advisory.
- PR template contains `## Impact Summary`.
- Issue templates exist for bug, feature, and maintenance.

## File Inventory

### New Files (17)

- `.githooks/pre-commit`
- `.githooks/pre-push`
- `scripts/workflows/install-hooks.mjs`
- `scripts/workflows/contract-rules.mjs`
- `scripts/workflows/contract-check.mjs`
- `scripts/tests/workflow-rules.test.mjs`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/bug.yml`
- `.github/ISSUE_TEMPLATE/feature.yml`
- `.github/ISSUE_TEMPLATE/maintenance.yml`
- `.github/ISSUE_TEMPLATE/config.yml`
- `.github/CODEOWNERS`
- `.github/workflows/contract-guard.yml`
- `CONTRIBUTING.md`
- `docs/workflow.md`
- `docs/knowledge-contract.md`
- `docs/oss-harness-engineering-workflow.md`

### Modified Files (3)

- `package.json` — add Harness scripts and `vitest` devDependency.
- `AGENTS.md` — add Harness Loop, authority order, OSS scope, TDD/SDD rules.
- `CLAUDE.md` — same updates as AGENTS.md.

### Unchanged Files

- `.github/workflows/repo-guard.yml` (already configured on `main`).
- `.github/workflows/deploy.yml` (GitHub Pages deploy on push to `main`).
- `docs/agent-prompts/` (product runtime prompts, not modified).

## Rollout

1. Add workflow contract scripts and tests.
2. Add local gate scripts and hooks.
3. Add OSS templates and ownership.
4. Add OSS docs and update engineering prompts.
5. Add CI contract guard.
6. Install Vitest and verify gates.

## Verification

Completion requires evidence from:

- `node --test scripts/tests/workflow-rules.test.mjs` passes.
- `npm run contract:check` passes (or documents why GitNexus is unavailable).
- `npm run quality:precommit` passes at minimum.
- Static inspection of hook files and workflow YAML.
- `git status --short` shows only intended Harness files.
