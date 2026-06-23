# KnowledgeFlow StudyAgent Knowledge Contract

This document defines how StudyAgent uses contract checks in local development and PR review. The contract verifies that critical skeleton changes include matching tests and a structured impact summary. GitNexus is optional; when unavailable, the contract degrades to classification and summary validation only.

## Local Workflow

Run:

```bash
npm run agent:bootstrap
npm run quality:predev
```

`quality:predev` installs hooks and runs the local contract check. The contract check classifies changed files and validates the impact summary when critical skeleton surfaces are touched.

## Critical Skeleton

Critical skeleton changes require matching tests and a structured PR impact summary.

| Category | Paths | Matching tests |
|----------|-------|----------------|
| `repo-harness` | `.github/workflows/`, `.github/ISSUE_TEMPLATE/`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/CODEOWNERS`, `.githooks/`, `scripts/workflows/`, `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `docs/workflow.md`, `docs/knowledge-contract.md`, `README.md` | `scripts/tests/` |
| `agent-prompts` | `docs/agent-prompts/` | `scripts/tests/` |

## PR Summary Format

Fill this section in the PR template:

```md
## Impact Summary

- Risk level: LOW|MEDIUM|HIGH|CRITICAL
- Critical skeleton changes: explain touched categories or say none
- Impact analysis: mention detect_changes (if GitNexus available) or manual impact conclusion
- Verification: commands run and results, or why unavailable
```

Do not use placeholders such as `-`, `none`, `n/a`, `todo`, or `tbd` for critical skeleton changes.

## CI Contract

`npm run contract:gitnexus` runs in Contract Guard on PRs to `main`. It checks:

- Changed files, including additions, copies, deletions, modifications, renames, type changes, unmerged paths, unknown paths, and broken pairs.
- Whether critical skeleton categories have matching test changes.
- Whether the PR body contains a structured impact summary for critical changes.
- Whether the summary includes `Risk level`, `Critical skeleton changes`, `Impact analysis`, and `Verification`.

For non-critical changes, the contract is advisory.

## GitNexus Optional Degradation

The contract scripts preserve the GitNexus invocation structure for future integration. When `npx gitnexus` is unavailable, the analyze step is skipped with an advisory warning. Contract classification and impact summary validation continue to run.

## Expected Evidence

Before final review, contributors and agents should be able to state:

- Which critical skeleton categories changed, if any.
- Which direct callers, affected processes, or modules the impact analysis reported.
- Which tests or gates were run.
- Which verification could not run and why.
