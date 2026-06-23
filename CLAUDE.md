# KnowledgeFlow - Claude 开发提示词

本文件用于指导 Claude 协助开发 KnowledgeFlow 学习智能体平台。

## Documents

1. `README.md` is the public product overview.
2. `docs/architecture.md` and `docs/design.md` (when created) define architecture and SDD behavior.
3. `CONTRIBUTING.md`, `docs/workflow.md`, and `docs/knowledge-contract.md` define OSS contribution, Harness, and contract rules.
4. Issue or PR text defines the specific change request.
5. Existing code is evidence, but it does not override the documents above.

When documents conflict or expected behavior is unclear, ask the maintainer instead of silently choosing a new architecture.

## Work

1. Run `npm run agent:bootstrap` and `npm run quality:predev` before code changes when feasible.
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

## TDD And SDD

- **TDD**: Bug fixes and new features are encouraged to follow red-green-refactor. Write a failing test first, implement the minimal code to pass, then refactor. Test files live next to source as `*.test.tsx` / `*.test.ts`.
- **SDD**: Non-trivial changes (new features, architecture adjustments, critical skeleton changes) must first produce a design doc under `docs/superpowers/specs/` and an implementation plan under `docs/superpowers/plans/`. Trivial changes may skip this cycle.

## OSS Scope

KnowledgeFlow StudyAgent uses an open-source maintainer workflow. Do not add training-camp claim comments, score labels, progress ledgers, timeout-close automation, or comment-triggered auto-merge rules unless maintainers explicitly request a separate workflow.

## 项目信息

- **项目名称**: KnowledgeFlow
- **口号**: AI智能体驱动的学习平台，让知识轻松流入你的脑海
- **官网**: https://ceilf6.github.io/KnowledgeFlow-StudyAgent/
- **仓库**: https://github.com/ceilf6/KnowledgeFlow-StudyAgent

## 技术栈

- 前端: React@18 + TypeScript + TailwindCSS@3 + Vite
- 状态管理: Zustand
- 路由: React Router DOM
- 后端: Express@4 + TypeScript
- 数据库: PostgreSQL + Prisma ORM
- 文件存储: Supabase Storage
- AI集成: OpenAI API / Claude API

## 开发指引

1. 遵循 [AGENTS.md](AGENTS.md) 中的工程开发规则。
2. PRD 位于 `.trae/documents/PRD.md`，开发前务必阅读。
3. 学习智能体行为提示词位于 `docs/agent-prompts/`，不要与工程开发提示词混淆。
4. 前端代码放在 `src/` 目录，使用 Vite 构建。
5. 部署通过 GitHub Actions 自动推送到 GitHub Pages。

## 设计规范

- **主色调**: 清新蓝绿色系 (#10B981, #06B6D4)
- **辅助色**: 温暖橙色 (#F59E0B)
- **字体**: Inter（标题 Bold，正文 Regular）
- **图标**: Lucide 图标库
- **布局**: 卡片式布局，清晰的信息层级

## 路由

| 路由 | 用途 |
|------|------|
| `/` | 首页 - 学习概览 |
| `/plans` | 学习计划列表 |
| `/plans/:id` | 学习计划详情 |
| `/study` | 智能复习页面 |
| `/resources` | 资源管理 |
| `/profile` | 个人中心 |
