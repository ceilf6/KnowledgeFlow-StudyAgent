# KnowledgeFlow - 工程开发提示词

本文件用于指导开发者开发 KnowledgeFlow 学习智能体平台本身。学习智能体的行为提示词已收纳至 `docs/agent-prompts/`。

## Documents

1. `README.md` is the public product overview.
2. `docs/architecture.md` and `docs/design.md` (when created) define architecture and SDD behavior.
3. `CONTRIBUTING.md`, `docs/workflow.md`, and `docs/knowledge-contract.md` define OSS contribution, Harness, and contract rules.
4. Issue or PR text defines the specific change request.
5. Existing code is evidence, but it does not override the documents above.

When documents conflict or expected behavior is unclear, ask the maintainer instead of silently choosing a new architecture.

## 项目概述

KnowledgeFlow 是一个 AI 智能体驱动的学习平台，让知识轻松流入用户的脑海。

- **官网**: https://ceilf6.github.io/KnowledgeFlow-StudyAgent/
- **仓库**: https://github.com/ceilf6/KnowledgeFlow-StudyAgent
- **赛道**: 学习工作
- **版本**: 1.0.0

## 技术栈

- **前端**: React@18 + TypeScript + TailwindCSS@3 + Vite
- **状态管理**: Zustand
- **路由**: React Router DOM
- **后端**: Express@4 + TypeScript
- **数据库**: PostgreSQL + Prisma ORM
- **文件存储**: Supabase Storage
- **AI集成**: OpenAI API / Claude API

## 项目结构

```
StudyAgent/
├── docs/                    # 文档与提示词
│   ├── agent-prompts/       # 学习智能体行为提示词（产品运行时使用）
│   │   ├── AGENTS.md
│   │   └── CLAUDE.md
│   ├── superpowers/         # 设计文档与实施计划
│   │   ├── specs/
│   │   └── plans/
│   ├── workflow.md          # OSS 工作流
│   ├── knowledge-contract.md # 知识契约
│   ├── oss-harness-engineering-workflow.md # Harness 操作手册
│   └── 创意提案.md
├── scripts/                 # Harness 脚本
│   ├── workflows/           # 契约与钩子脚本
│   └── tests/               # Harness 测试
├── src/                     # 前端源码（React + TS + Vite）
├── .githooks/               # Git 钩子
├── .github/workflows/       # CI/CD 与部署
├── .trae/documents/         # PRD 等需求文档
├── templates/               # 仓库模板
├── AGENTS.md                # 本文件：工程开发提示词
├── CLAUDE.md                # Claude 开发提示词
├── CONTRIBUTING.md          # 贡献者指南
└── README.md
```

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

## 开发规则

### 代码规范
1. 使用 TypeScript 严格模式。
2. 组件使用函数式组件，优先使用 Hooks。
3. 样式使用 TailwindCSS，避免内联样式。
4. 提交前运行 `npm run lint` 和 `npm run build` 确保无错误。

### 分支策略
- `main`: 生产分支，保护分支，PR 目标分支
- `feature/*`: 功能分支
- `fix/*`: 修复分支

### 部署
- 前端通过 GitHub Actions 自动部署到 GitHub Pages。
- 部署触发：推送到 `main` 分支。

## 学习智能体提示词

学习智能体（产品运行时）的行为提示词位于 `docs/agent-prompts/`：
- [`docs/agent-prompts/AGENTS.md`](docs/agent-prompts/AGENTS.md): 学习智能体核心行为规则
- [`docs/agent-prompts/CLAUDE.md`](docs/agent-prompts/CLAUDE.md): Claude 学习智能体配置

开发时请勿修改这些文件，除非明确需要调整学习智能体行为。
