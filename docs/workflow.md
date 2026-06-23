# KnowledgeFlow StudyAgent OSS Workflow

KnowledgeFlow StudyAgent uses a lightweight open-source maintenance workflow. The goal is to keep contributor work small, reviewable, and verifiable without training-camp scoring or task-claim automation.

## Community Loop

For the detailed operational playbook, see [`docs/oss-harness-engineering-workflow.md`](oss-harness-engineering-workflow.md).

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

## Maintainer Triage

Maintainers should clarify scope, affected area, expected behavior, and verification before encouraging implementation. Large or ambiguous work should first become a design doc under `docs/superpowers/specs/` and an implementation plan under `docs/superpowers/plans/`.

## Contributor Rules

- Target PRs at `main`.
- Keep PRs focused and independently reviewable.
- Link an issue, discussion, or explain standalone context in the PR.
- Run the local quality gates described in `CONTRIBUTING.md`.
- Fill the PR template with concrete verification.
- For critical skeleton changes, fill the Impact Summary.
- Do not modify unrelated generated artifacts or vendored output.

## Agent Rules

Agents working in this repository should:

1. Read `CONTRIBUTING.md`, this file, and `docs/knowledge-contract.md` before larger edits.
2. Run `npm run agent:bootstrap` and `npm run quality:predev` before code changes when feasible.
3. Use impact analysis before modifying critical skeleton paths.
4. Ask maintainers when docs conflict or the expected behavior is unclear.
5. Keep changes scoped to the requested work and existing architecture.
6. Run focused tests first, then broader gates as risk increases.

## Agent Authority (Autonomous Mode)

When the maintainer explicitly grants full permissions to the agent (e.g. "你有全部权限" / "you have full permissions"), the agent MAY operate in autonomous mode:

1. **Direct push**: The agent pushes branches and commits directly without asking for confirmation on each step. Every commit MUST include the trailer `Co-authored-by: traeagent <traeagent@users.noreply.github.com>`.
2. **Direct merge**: After Repo Guard CR completes with no blocking issues (no `request changes` or critical findings), the agent merges the PR directly. Do not wait for an additional human maintainer approval in this mode.
3. **Still required**: Issue -> branch -> PR -> CI -> Contract Guard -> Repo Guard CR. The agent skips only the "wait for human maintainer to merge" step.
4. **Scope limit**: Autonomous merge applies to the granted task only. If Repo Guard raises actionable comments, address them with follow-up commits before merging. If a comment is unclear or seems wrong, leave the PR open and ask the maintainer.

## Review And Merge

CI and Contract Guard provide minimum checks. Repo Guard provides advisory AI review. Maintainers decide whether to merge after reviewing product intent, design fit, tests, and risk.

In autonomous mode (see Agent Authority), the agent merges directly after Repo Guard CR passes with no blocking issues.

This repository does not use `认领`, `score:*`, progress ledgers, `确认合并` auto-merge comments, or PR timeout-close automation.
