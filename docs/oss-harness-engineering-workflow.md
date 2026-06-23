# OSS Harness Engineering Workflow

This document is the detailed repository asset for the KnowledgeFlow StudyAgent OSS Harness engineering workflow. It expands the lightweight loop in `docs/workflow.md` into an operational playbook that agents, maintainers, and contributors can follow for non-trivial repository work.

The workflow is adapted from FrontAgent-app's OSS Harness, scoped to open-source community maintenance. It excludes training-camp mechanics such as task claiming, scoring, progress ledgers, timeout-close automation, and comment-triggered auto-merge.

## Goals

- Keep work small, reviewable, and independently verifiable.
- Make authority documents explicit before code changes.
- Require impact evidence before risky edits and before final review.
- Keep local gates, CI, Contract Guard, Repo Guard, and maintainer review aligned.
- Preserve maintainer judgment as the final merge-readiness authority.

## Authority Order

When documents and code disagree, use this order:

1. `README.md` for public product positioning.
2. `docs/architecture.md` and `docs/design.md` (when created) for architecture and SDD behavior.
3. `CONTRIBUTING.md`, `docs/workflow.md`, and `docs/knowledge-contract.md` for contribution and Harness rules.
4. Issue, discussion, or PR text for the specific change request.
5. Existing code as implementation evidence.

If expected behavior remains unclear, ask maintainers instead of silently choosing a new architecture.

## Workflow Phases

### 1. Scope And Authority

Start from an issue, discussion, PR comment, or maintainer-approved task. Clarify affected area, expected behavior, and verification before implementation. For large or ambiguous work, create a design doc under `docs/superpowers/specs/` and an implementation plan under `docs/superpowers/plans/`.

**Gate:** Do not implement when scope, expected behavior, or verification is unclear.

### 2. Bootstrap And Branch

```bash
npm install
npm run agent:bootstrap
npm run quality:predev
```

Use a short-lived branch from `main`: `feat/<topic>`, `fix/<topic>`, `docs/<topic>`, or `chore/<topic>`.

**Gate:** Proceed to edits only after setup and contract context are ready, or after documenting why they cannot run.

### 3. Pre-Change Intelligence

Before editing critical skeleton paths, run `npm run contract:check` to classify the affected surfaces. For symbol-level impact, use GitNexus if available; otherwise perform manual impact analysis.

Record risk level, affected categories, and decision.

**Gate:** Do not edit critical skeleton until impact analysis is captured.

### 4. Implementation

Implement only the approved scope. Preserve existing architecture and minimal diff. For critical skeleton surfaces, add matching tests in the same PR.

**Critical skeleton categories:**

| Category | Paths | Matching tests |
|----------|-------|----------------|
| `repo-harness` | `.github/workflows/`, `.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS`, `.githooks/`, `scripts/workflows/`, `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `docs/workflow.md`, `docs/knowledge-contract.md`, `README.md` | `scripts/tests/` |
| `agent-prompts` | `docs/agent-prompts/` | `scripts/tests/` |

**Gate:** If the diff expands beyond the approved scope, split the work or return to design/plan review.

### 5. Local Verification

Run focused tests for the touched area first. Before final review, run at minimum:

```bash
npm run quality:precommit
```

Before pushing, run the full local gate when feasible:

```bash
npm run quality:local
```

Use `SKIP_QUALITY_HOOKS=1` only as an emergency escape hatch. CI remains authoritative.

**Gate:** Do not request final review with failing relevant tests or unexplained skipped minimum gates.

### 6. PR Preparation

Open PRs to `main`. Link the issue, discussion, or explain why the PR stands alone. Fill the PR template with summary, impact scope, verification, and gate results. For critical skeleton changes, fill a concrete Impact Summary.

**Required Impact Summary format:**

```md
## Impact Summary

- Risk level: LOW|MEDIUM|HIGH|CRITICAL
- Critical skeleton changes: explain touched categories or say none
- Impact analysis: mention detect_changes (if GitNexus available) or manual impact conclusion
- Verification: commands run and results, or why unavailable
```

**Gate:** Critical skeleton PRs must not use placeholders and must include matching tests plus a structured impact summary.

### 7. CI, Review, And Merge Readiness

Wait for CI, Contract Guard, Repo Guard, and maintainer feedback. Treat CI and Contract Guard as minimum required checks. Treat Repo Guard as advisory review-assist. Address actionable review comments with follow-up commits. Rerun relevant gates after follow-up changes. Let maintainers decide merge readiness through normal GitHub review and branch protection.

**Gate:** Merge only through maintainer judgment and standard GitHub controls.

### 8. Harness Maintenance

When changing any of these surfaces:

- `.github/workflows/`
- `.github/ISSUE_TEMPLATE/`
- `.github/PULL_REQUEST_TEMPLATE.md`
- `.github/CODEOWNERS`
- `.githooks/`
- `scripts/workflows/`
- `scripts/tests/`
- `AGENTS.md`
- `CLAUDE.md`
- `CONTRIBUTING.md`
- `docs/workflow.md`
- `docs/knowledge-contract.md`

also check whether to update:

- `scripts/tests/workflow-rules.test.mjs`
- `package.json` scripts
- `CONTRIBUTING.md`
- `docs/workflow.md`
- `docs/knowledge-contract.md`

**Rules:**

- Keep workflow YAML thin by invoking named package scripts.
- Keep Contract Guard focused on critical skeleton changes and structured impact summaries.
- Keep Repo Guard advisory, not a merge authority.
- Do not change Harness policy without synchronized docs, scripts, and tests.
