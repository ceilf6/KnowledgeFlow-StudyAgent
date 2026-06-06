# Study4ExamAgent Exam Repo Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture the exam-review repository construction practices learned from SR03 into reusable Study4ExamAgent prompts and templates.

**Architecture:** Keep `AGENTS.md` and `CLAUDE.md` mirrored as the active generic agent prompt, and add focused Markdown templates under `templates/` for new course repositories and knowledge-only review plans.

**Tech Stack:** Markdown, Git.

---

### Task 1: Upgrade Generic Agent Prompt

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`

- [x] **Step 1: Replace the minimal prompt with a full exam-review repository construction prompt**

Include source priority, Chinese explanation, exam-language answers with Chinese translation, problem-solving format, source citation, readable conversion rules, visualization rules, review-plan rules, and ask-user-first behavior.

- [ ] **Step 2: Verify prompt files are identical**

Run:

```bash
cmp AGENTS.md CLAUDE.md
```

Expected: no output, exit code 0.

### Task 2: Add Reusable Templates

**Files:**
- Create: `templates/exam-review-repo.md`
- Create: `templates/review-plan.md`

- [x] **Step 1: Add course repository construction template**

The template explains directory layout, source priority, prompt sections, readable conversion, ASR, reference-book handling, visualization, and verification.

- [x] **Step 2: Add knowledge-only review plan template**

The template contains Summary, Source Map, Knowledge Route, High-Priority Exam Patterns, Review Method, and Assumptions without time scheduling.

### Task 3: Verify, Commit, Push

**Files:**
- Modify: repository index only

- [ ] **Step 1: Verify no time-noise terms in the plan template**

Run:

```bash
rg '第[一二三四五六七八九十]+天|周计划|时间安排|Day|Week' templates/review-plan.md
```

Expected: no matches.

- [ ] **Step 2: Commit changes**

Run:

```bash
git add AGENTS.md CLAUDE.md templates docs/superpowers/plans
git commit -m "feat: add exam review repo templates"
```

Expected: commit succeeds.

- [ ] **Step 3: Push changes**

Run:

```bash
git push origin HEAD
```

Expected: push succeeds.
