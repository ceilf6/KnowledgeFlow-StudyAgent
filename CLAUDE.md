# KnowledgeFlow - 工程开发提示词

本文件用于指导开发者开发 KnowledgeFlow 学习智能体平台本身。学习智能体的行为提示词已收纳至 `docs/agent-prompts/`。

> **Canonical source:** `AGENTS.md` is the canonical source for the Harness Loop, hard prohibitions, completion criteria, and Agent Authority rules. This file mirrors those rules for convenience but MUST NOT weaken them. If any conflict exists, `AGENTS.md` wins. All hard prohibitions (NEVER commit to `main`, NEVER push without Issue+branch, NEVER skip Repo Guard CR, NEVER announce done while CR is pending) apply in full here.

## Documents

1. `README.md` is the public product overview.
2. `docs/architecture.md` and `docs/design.md` (when created) define architecture and SDD behavior.
3. `CONTRIBUTING.md`, `docs/workflow.md`, and `docs/knowledge-contract.md` define OSS contribution, Harness, and contract rules.
4. Issue or PR text defines the specific change request.
5. Existing code is evidence, but it does not override the documents above.

When documents conflict or expected behavior is unclear, ask the maintainer instead of silently choosing a new architecture.

## Work

1. **Pre-flight gates are MANDATORY for non-trivial changes**: run `npm run agent:bootstrap` and `npm run quality:predev` before editing any file. Trivial changes (e.g. typo-only docs, single-line config tweaks with no contract impact) MAY skip these gates, but MUST state the skip reason in the commit message. There is no "feasibility" escape hatch — if the change touches code, contract, or critical skeleton, the gates MUST run.
2. Before editing critical skeleton paths, run `npm run contract:check` and report the blast radius.
3. Keep changes focused and independently reviewable.
4. Run focused tests for the touched area, then broader gates as risk increases.
5. Before final review, run `npm run quality:precommit` at minimum.
6. For critical skeleton changes, fill the PR Impact Summary with concrete results.

## Harness Loop

For non-trivial repository changes, use this loop:

1. Start from an Issue, Discussion, or maintainer-approved task description.
2. Create a short-lived branch from `main` using `feat/`, `fix/`, `docs/`, or `chore/`.
3. Run `npm run agent:bootstrap` and `npm run quality:predev`.
4. Implement the smallest reviewable change with focused tests.
5. Run `npm run quality:local` before pushing when feasible.
6. Open a PR to `main` with the PR template filled in, including the Impact Summary for critical skeleton changes.
7. Wait for CI, Contract Guard, Repo Guard CR, and maintainer review comments.
8. Address actionable review comments with follow-up commits, then rerun the relevant gates.
9. Let maintainers decide merge readiness; do not add comment-triggered auto-merge behavior.

## Agent Authority

When the maintainer explicitly grants full permissions to the agent (e.g. "你有全部权限" / "you have full permissions"), the agent MAY operate in autonomous mode:

1. **Direct push**: The agent pushes branches and commits directly without asking for confirmation on each step. Every commit MUST include the trailer `Co-authored-by: traeagent <traeagent@users.noreply.github.com>`.
2. **Direct merge**: After Repo Guard CR completes with no blocking issues (no `request changes` or critical findings), the agent merges the PR directly. Do not wait for an additional human maintainer approval in this mode.
3. **Still required**: Issue -> branch -> PR -> CI -> Contract Guard -> Repo Guard CR. The agent skips only the "wait for human maintainer to merge" step.
4. **Scope limit**: Autonomous merge applies to the granted task only. If Repo Guard raises actionable comments, address them with follow-up commits before merging. If a comment is unclear or seems wrong, leave the PR open and ask the maintainer.

## TDD And SDD

- **TDD**: Bug fixes and new features are encouraged to follow red-green-refactor. Write a failing test first, implement the minimal code to pass, then refactor. Test files live next to source as `*.test.tsx` / `*.test.ts`.
- **SDD**: Non-trivial changes (new features, architecture adjustments, critical skeleton changes) must first produce a design doc under `docs/superpowers/specs/` and an implementation plan under `docs/superpowers/plans/`. Trivial changes may skip this cycle.

## OSS Scope

KnowledgeFlow StudyAgent uses an open-source maintainer workflow. Do not add training-camp claim comments, score labels, progress ledgers, timeout-close automation, or comment-triggered auto-merge rules unless maintainers explicitly request a separate workflow.
