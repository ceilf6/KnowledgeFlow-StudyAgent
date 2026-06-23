# KnowledgeFlow - 工程开发提示词

本文件用于指导开发者开发 KnowledgeFlow 学习智能体平台本身。学习智能体的行为提示词已收纳至 `docs/agent-prompts/`。

## Documents

1. `README.md` is the public product overview.
2. `docs/architecture.md` and `docs/design.md` (when created) define architecture and SDD behavior.
3. `CONTRIBUTING.md`, `docs/workflow.md`, and `docs/knowledge-contract.md` define OSS contribution, Harness, and contract rules.
4. Issue or PR text defines the specific change request.
5. Existing code is evidence, but it does not override the documents above.

When documents conflict or expected behavior is unclear, ask the maintainer instead of silently choosing a new architecture.

## Work

1. **Harness Loop is MANDATORY for non-trivial changes** — see the Harness Loop section below. Do not start coding before completing steps 1–3 of that loop (Issue → branch → predev gates).
2. **Pre-flight gates are MANDATORY for non-trivial changes**: run `npm run agent:bootstrap` and `npm run quality:predev` before editing any file. Trivial changes (e.g. typo-only docs, single-line config tweaks with no contract impact) MAY skip these gates, but MUST state the skip reason in the commit message. There is no "feasibility" escape hatch — if the change touches code, contract, or critical skeleton, the gates MUST run.
3. Before editing critical skeleton paths, run `npm run contract:check` and report the blast radius.
4. Keep changes focused and independently reviewable.
5. Run focused tests for the touched area, then broader gates as risk increases.
6. Before final review, run `npm run quality:precommit` at minimum.
7. For critical skeleton changes, fill the PR Impact Summary with concrete results.

## Harness Loop

**MANDATORY for all non-trivial repository changes.** "Non-trivial" is defined by the SDD section below: new features, architecture adjustments, critical skeleton changes, and any change that warrants a spec/plan doc. If SDD triggers, the Harness Loop MUST also trigger — producing specs/plans is step 0 of this loop, not a replacement for it.

**Hard prohibitions:**
- **NEVER commit directly to `main`.** All non-trivial work MUST land via a PR.
- **NEVER push code without an open Issue and a feature branch.** The Issue grounds the "why"; the branch isolates the "what".
- **NEVER skip Repo Guard CR.** Even in autonomous mode, the PR MUST pass Repo Guard CR before merge.
- **NEVER treat spec/plan docs as the finish line.** They are the entry ticket to the loop, not the exit.
- **NEVER announce work as complete while Repo Guard CR is pending or has unresolved `CHANGES_REQUESTED` findings.** CI passing is necessary but not sufficient — Repo Guard CR is a separate gate that runs AFTER CI, and its review is the final code-quality barrier before merge.

**The loop:**

1. **Issue first.** Start from an Issue, Discussion, or maintainer-approved task description. If none exists, create one before writing any code. If SDD applies, the spec/plan created in step 3 MUST reference this Issue (not the other way around — the Issue exists first, the spec/plan references it after creation).
2. **Branch from `main`.** Create a short-lived branch using `feat/`, `fix/`, `docs/`, or `chore/`. Confirm `git branch` shows the new branch BEFORE editing any file.
3. **Pre-flight gates.** Run `npm run agent:bootstrap` and `npm run quality:predev`. Resolve any contract violations before proceeding.
4. **Implement the smallest reviewable change** with focused tests.
5. **Local quality gate.** Run `npm run quality:local` before pushing when feasible.
6. **Open a PR to `main`** with the PR template filled in, including the Impact Summary for critical skeleton changes. The PR description MUST link the Issue (e.g., `Closes #123`).
7. **Wait for CI, Contract Guard, AND Repo Guard CR to all complete.** Do not merge — and do not announce completion — while any gate is failing or pending. "Wait" means actively polling the PR's Repo Guard output on the **current head commit**, not assuming the gate passed just because CI is green. **GitHub Actions cannot post formal `APPROVED` review events** (HTTP 422 "GitHub Actions is not permitted to approve pull requests"), so Repo Guard posts its approval as a **PR comment** with `处理建议: 批准` / `APPROVE` in the body. Therefore `reviewDecision` may remain `CHANGES_REQUESTED` from an earlier round even after Repo Guard approves — you MUST read the latest Repo Guard comment/review on the current head commit to determine the actual decision. Do NOT rely on `reviewDecision` alone.
8. **Address actionable review comments** — especially any `CHANGES_REQUESTED` state from Repo Guard — with follow-up commits, then push and rerun the relevant gates. The PR is not done until Repo Guard's latest output on the current head commit says `处理建议: 批准` / `APPROVE` (posted as comment due to the GitHub Actions limitation above) OR a formal `APPROVED` review exists (rare/manual). If a finding is unclear or seems wrong, leave the PR open and ask the maintainer; do not silently ignore it.
9. **Maintainer decides merge readiness**; do not add comment-triggered auto-merge behavior.

**Completion criteria (all MUST be true before claiming work is done):**
- [ ] CI passes (lint + build + test + test:workflows).
- [ ] Contract Guard passes.
- [ ] Repo Guard CR has run on the current head commit AND its latest output (review OR comment) on that commit has `处理建议: 批准` / `APPROVE`. Due to GitHub's restriction on Actions approving PRs, this approval is typically posted as a **comment**, not a formal `APPROVED` review event — so `reviewDecision` may still show `CHANGES_REQUESTED` from a previous round. You MUST verify by reading the latest Repo Guard comment body on the current head commit, NOT by checking `reviewDecision` alone.
- [ ] If Repo Guard CR posted `CHANGES_REQUESTED` earlier, a follow-up commit addressed every finding AND the latest Repo Guard output on the new head commit is `处理建议: 批准` / `APPROVE`.
- [ ] No gate is in `pending` state.

**Pre-flight checklist (must be true before step 4):**
- [ ] An Issue exists and is referenced in the branch name or PR.
- [ ] Current branch is NOT `main` (verify with `git branch --show-current`).
- [ ] `npm run quality:predev` passed.
- [ ] If SDD applies: spec under `docs/superpowers/specs/` and plan under `docs/superpowers/plans/` exist.

## Agent Authority

**The Harness Loop applies in ALL modes — interactive, autonomous, or otherwise.** There is no mode in which committing directly to `main` or skipping Repo Guard CR is acceptable.

When the maintainer explicitly grants full permissions to the agent (e.g. "你有全部权限" / "you have full permissions"), the agent MAY operate in autonomous mode:

1. **Direct push**: The agent pushes branches and commits directly without asking for confirmation on each step. Every commit MUST include the trailer `Co-authored-by: traeagent <traeagent@users.noreply.github.com>`.
2. **Direct merge**: After Repo Guard CR completes with no blocking issues (no `request changes` or critical findings), the agent merges the PR directly. Do not wait for an additional human maintainer approval in this mode.
3. **Still required in autonomous mode**: Issue -> branch -> PR -> CI -> Contract Guard -> Repo Guard CR. The agent skips only the "wait for human maintainer to merge" step. This is the SAME baseline as interactive mode — autonomous mode relaxes only the final human approval, nothing else.
4. **Scope limit**: Autonomous merge applies to the granted task only. If Repo Guard raises actionable comments, address them with follow-up commits before merging. If a comment is unclear or seems wrong, leave the PR open and ask the maintainer.

## TDD And SDD

- **TDD**: Bug fixes and new features are encouraged to follow red-green-refactor. Write a failing test first, implement the minimal code to pass, then refactor. Test files live next to source as `*.test.tsx` / `*.test.ts`.
- **SDD**: Non-trivial changes (new features, architecture adjustments, critical skeleton changes) must first produce a design doc under `docs/superpowers/specs/` and an implementation plan under `docs/superpowers/plans/`. Trivial changes may skip this cycle.
- **SDD ⟶ Harness Loop linkage**: Producing the spec/plan is the **entry condition** for the Harness Loop, not a substitute for it. The moment you write a spec/plan, steps 1–2 of the Harness Loop (Issue + branch) MUST already be in place. Do not write specs/plans on `main`.

## OSS Scope

KnowledgeFlow StudyAgent uses an open-source maintainer workflow. Do not add training-camp claim comments, score labels, progress ledgers, timeout-close automation, or comment-triggered auto-merge rules unless maintainers explicitly request a separate workflow.
