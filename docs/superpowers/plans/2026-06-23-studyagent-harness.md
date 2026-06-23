# StudyAgent OSS Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a lightweight OSS Harness for KnowledgeFlow StudyAgent that enforces the workflow Issue -> PR -> Repo Guard CR -> maintainer merge, with local quality gates, contract scripts, templates, docs, and TDD/SDD discipline.

**Architecture:** Add a Harness layer around the existing npm single-package React app: contract scripts (preserving GitNexus structure with optional degradation), real git hooks, OSS contributor docs, PR/Issue templates, CODEOWNERS, contract guard CI, Vitest for TDD, and updated engineering prompts. Adapted from FrontAgent-app's OSS Harness for npm/main-branch/no-GitNexus reality.

**Tech Stack:** npm, Node.js ESM workflow scripts, Vitest, ESLint, Vite, GitHub Actions, React+TypeScript.

**Spec:** `docs/superpowers/specs/2026-06-23-studyagent-harness-design.md`

---

## File Structure

- Create `scripts/workflows/install-hooks.mjs`: configure `core.hooksPath=.githooks` and verify hook files exist.
- Create `scripts/workflows/contract-rules.mjs`: classify critical skeleton changes and validate structured impact summaries.
- Create `scripts/workflows/contract-check.mjs`: run bootstrap/local/CI contract modes with optional GitNexus analyze.
- Create `scripts/tests/workflow-rules.test.mjs`: node test coverage for contract rules, scripts, hooks, templates, and workflow invariants.
- Create `.githooks/pre-commit` and `.githooks/pre-push`: run local quality gates with `SKIP_QUALITY_HOOKS=1` bypass.
- Create `.github/PULL_REQUEST_TEMPLATE.md`: structured OSS PR self-check.
- Create `.github/ISSUE_TEMPLATE/bug.yml`, `feature.yml`, `maintenance.yml`, `config.yml`: OSS issue templates.
- Create `.github/CODEOWNERS`: maintainer review requests for Harness and critical surfaces.
- Create `.github/workflows/contract-guard.yml`: enforce contract on PRs to `main`.
- Create `CONTRIBUTING.md`: contributor-facing setup, workflow, quality gates, and PR expectations.
- Create `docs/workflow.md`: maintainer/agent OSS workflow.
- Create `docs/knowledge-contract.md`: contract and critical skeleton policy.
- Create `docs/oss-harness-engineering-workflow.md`: detailed operational playbook.
- Modify `package.json`: add Harness scripts and `vitest` devDependency.
- Modify `AGENTS.md`: add Harness Loop, authority order, OSS scope, TDD/SDD rules.
- Modify `CLAUDE.md`: same updates as AGENTS.md.

## Task 1: Add Contract Rules Module

**Files:**
- Create: `scripts/workflows/contract-rules.mjs`

- [ ] **Step 1: Create contract-rules.mjs**

Create `scripts/workflows/contract-rules.mjs`:

```js
export const CONTRACT_DIFF_FILTER = 'ACDMRTUXB';

const impactSummaryFields = [
  'Risk level',
  'Critical skeleton changes',
  'Impact analysis',
  'Verification',
];
const impactSummaryPlaceholders = new Set(['-', 'none', 'n/a', 'na', 'todo', 'tbd', 'pending']);
const riskLevels = new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const criticalContractRules = [
  {
    category: 'repo-harness',
    testPattern: /^scripts\/tests\//u,
    matches: (file) =>
      file.startsWith('.github/workflows/') ||
      file.startsWith('.github/ISSUE_TEMPLATE/') ||
      file === '.github/PULL_REQUEST_TEMPLATE.md' ||
      file === '.github/CODEOWNERS' ||
      file.startsWith('.githooks/') ||
      file.startsWith('scripts/workflows/') ||
      [
        'README.md',
        'AGENTS.md',
        'CLAUDE.md',
        'CONTRIBUTING.md',
        'docs/workflow.md',
        'docs/knowledge-contract.md',
      ].includes(file),
  },
  {
    category: 'agent-prompts',
    testPattern: /^scripts\/tests\//u,
    matches: (file) => file.startsWith('docs/agent-prompts/'),
  },
];

export function classifyContractPaths(files) {
  const critical = [];
  const nonCritical = [];

  for (const file of normalizeFiles(files)) {
    const rule = criticalContractRules.find((candidate) => candidate.matches(file));
    if (rule) {
      critical.push({ file, category: rule.category });
    } else {
      nonCritical.push(file);
    }
  }

  return { critical, nonCritical };
}

export function combineChangedFiles(...fileGroups) {
  return normalizeFiles(fileGroups.flatMap((files) => files ?? []));
}

export function evaluateGitNexusContract({
  changedFiles,
  impactSummary = '',
  requireImpactSummary = true,
}) {
  const normalized = normalizeFiles(changedFiles);
  const classification = classifyContractPaths(normalized);
  const reasons = [];
  const warnings = [];
  const suggestions = [
    'Run detect_changes (if GitNexus available) or manual impact analysis to inspect current diff.',
    'Use query/context/impact for touched symbols before editing critical skeleton code.',
    'Summarize the impact analysis result in the PR self-check.',
  ];

  if (classification.critical.length === 0) {
    warnings.push(
      'No critical contract surface changed; impact analysis is advisory for this diff.',
    );
    return { ok: true, reasons, warnings, suggestions, ...classification };
  }

  for (const item of classification.critical) {
    const rule = criticalContractRules.find((candidate) => candidate.category === item.category);
    if (!rule) continue;
    const hasMatchingTest = normalized.some((file) => rule.testPattern.test(file));
    if (!hasMatchingTest) {
      reasons.push(`Missing contract test for critical file: ${item.file}`);
    }
  }

  if (requireImpactSummary) {
    reasons.push(...validateStructuredImpactSummary(impactSummary));
  } else if (isPlaceholder(impactSummary)) {
    warnings.push(
      'Structured impact summary is not enforced locally; fill it before opening a PR.',
    );
  } else {
    reasons.push(...validateStructuredImpactSummary(impactSummary));
  }

  return {
    ok: reasons.length === 0,
    reasons,
    warnings,
    suggestions,
    ...classification,
  };
}

export function extractImpactSummary(text) {
  const lines = text.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) =>
    /^#{1,6}\s*Impact\s*Summary\s*$/iu.test(line.trim()),
  );
  if (headingIndex === -1) return text.trim();

  const section = [];
  for (const line of lines.slice(headingIndex + 1)) {
    if (/^#{1,6}\s+\S/u.test(line.trim())) break;
    section.push(line);
  }
  return section.join('\n').trim();
}

export function validateStructuredImpactSummary(value) {
  const normalized = value.trim();
  if (isPlaceholder(normalized)) {
    return [
      'Missing structured impact summary. Fill the PR template fields for critical skeleton changes.',
    ];
  }

  const fields = parseImpactSummaryFields(normalized);
  const reasons = [];
  for (const field of impactSummaryFields) {
    const fieldValue = fields.get(field);
    if (fieldValue === undefined) {
      reasons.push(`Missing impact summary field: ${field}`);
    } else if (isPlaceholder(fieldValue)) {
      reasons.push(`Impact summary field is empty or placeholder: ${field}`);
    }
  }

  const riskLevel = fields.get('Risk level')?.toUpperCase();
  if (riskLevel && !riskLevels.has(riskLevel)) {
    reasons.push('Invalid risk level. Use LOW, MEDIUM, HIGH, or CRITICAL.');
  }

  return reasons;
}

function parseImpactSummaryFields(value) {
  const fields = new Map();
  for (const line of value.split(/\r?\n/)) {
    const match = /^\s*(?:[-*]\s*)?(?:\*\*)?([^:*：]+?)(?:\*\*)?\s*[:：]\s*(.*)\s*$/u.exec(line);
    if (match) fields.set(match[1].trim(), match[2].trim());
  }
  return fields;
}

function isPlaceholder(value) {
  return !value.trim() || impactSummaryPlaceholders.has(value.trim().toLowerCase());
}

function normalizeFiles(files) {
  return [...new Set((files ?? []).map((file) => file.replaceAll('\\', '/')).filter(Boolean))];
}
```

- [ ] **Step 2: Verify module loads**

Run: `node -e "import('./scripts/workflows/contract-rules.mjs').then(m => console.log(Object.keys(m)))"`
Expected: `[ 'CONTRACT_DIFF_FILTER', 'criticalContractRules', 'classifyContractPaths', 'combineChangedFiles', 'evaluateGitNexusContract', 'extractImpactSummary', 'validateStructuredImpactSummary' ]`

## Task 2: Add Hook Installer And Contract Check

**Files:**
- Create: `scripts/workflows/install-hooks.mjs`
- Create: `scripts/workflows/contract-check.mjs`

- [ ] **Step 1: Create install-hooks.mjs**

Create `scripts/workflows/install-hooks.mjs`:

```js
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const requiredHooks = ['.githooks/pre-commit', '.githooks/pre-push'];

if (process.env.CI) {
  console.log('Skipping git hook installation in CI.');
  process.exit(0);
}

for (const hook of requiredHooks) {
  if (!existsSync(hook)) {
    throw new Error(`missing required git hook: ${hook}`);
  }
}

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks'], { stdio: 'inherit' });
  console.log('Git hooks installed via core.hooksPath=.githooks');
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  throw new Error(`failed to install git hooks: ${message}`);
}
```

- [ ] **Step 2: Create contract-check.mjs**

Create `scripts/workflows/contract-check.mjs`:

```js
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import {
  CONTRACT_DIFF_FILTER,
  combineChangedFiles,
  evaluateGitNexusContract,
  extractImpactSummary,
} from './contract-rules.mjs';

const DEFAULT_LOCAL_BASE_BRANCH = 'main';

if (isMainModule()) {
  const command = process.argv[2] ?? 'check';

  try {
    if (command === 'bootstrap') {
      runBootstrap();
    } else if (command === 'local') {
      runContract({ mode: 'local' });
    } else if (command === 'gitnexus') {
      runContract({ mode: 'ci' });
    } else if (command === 'check') {
      runContract({ mode: process.env.CI ? 'ci' : 'local' });
    } else {
      throw new Error(`unknown contract command: ${command}`);
    }
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}

function runBootstrap() {
  execFileSync('node', ['scripts/workflows/install-hooks.mjs'], { stdio: 'inherit' });
  console.log('Agent bootstrap complete.');
  console.log(
    '- Read CONTRIBUTING.md, docs/workflow.md, and docs/knowledge-contract.md before larger changes.',
  );
  console.log('- Before editing code: run npm run quality:predev.');
  console.log('- Commit with git commit so the pre-commit hook runs quality:precommit.');
  console.log('- Push with git push so the pre-push hook runs quality:local.');
  console.log(
    '- For critical skeleton changes: fill the Impact Summary in the PR template.',
  );
  console.log(
    '- This is an OSS workflow: no claim, score, progress ledger, timeout close, or auto-merge commands.',
  );
  console.log('- CI remains the final contract gate.');
}

function runContract({ mode }) {
  runGitNexusAnalyze();

  const changedFiles = getChangedFiles(mode);
  const impactSummary = getImpactSummary();
  const result = evaluateGitNexusContract({
    changedFiles,
    impactSummary,
    requireImpactSummary: mode === 'ci',
  });

  printContractResult('Contract', result);
  if (!result.ok) process.exitCode = 1;
}

export function getChangedFiles(mode, options = {}) {
  const env = options.env ?? process.env;
  const git = options.git ?? {
    lines: gitLines,
    refExists: gitRefExists,
    fetchBaseRef: fetchBaseRef,
  };

  if (env.CONTRACT_CHANGED_FILES) {
    return env.CONTRACT_CHANGED_FILES.split(/\r?\n|,/)
      .map((file) => file.trim())
      .filter(Boolean);
  }

  if (mode === 'ci' && env.GITHUB_BASE_REF) {
    const baseBranch = env.GITHUB_BASE_REF;
    const baseRef = `origin/${baseBranch}`;
    if (!git.refExists(baseRef)) {
      git.fetchBaseRef(baseBranch);
    }
    return git.lines([
      'diff',
      '--name-only',
      `--diff-filter=${CONTRACT_DIFF_FILTER}`,
      `${baseRef}...HEAD`,
    ]);
  }

  const baseBranch = env.CONTRACT_BASE_REF ?? env.GITHUB_BASE_REF ?? DEFAULT_LOCAL_BASE_BRANCH;
  const baseRef = `origin/${baseBranch}`;
  if (git.refExists(baseRef)) {
    return combineChangedFiles(
      git.lines([
        'diff',
        '--name-only',
        `--diff-filter=${CONTRACT_DIFF_FILTER}`,
        `${baseRef}...HEAD`,
      ]),
      git.lines([
        'diff',
        '--name-only',
        '--cached',
        `--diff-filter=${CONTRACT_DIFF_FILTER}`,
        'HEAD',
      ]),
      git.lines(['diff', '--name-only', `--diff-filter=${CONTRACT_DIFF_FILTER}`, 'HEAD']),
      git.lines(['ls-files', '--others', '--exclude-standard']),
    );
  }

  console.warn(
    `warning: ${baseRef} is unavailable; local contract check only includes staged, unstaged, and untracked files.`,
  );
  return combineChangedFiles(
    git.lines(['diff', '--name-only', '--cached', `--diff-filter=${CONTRACT_DIFF_FILTER}`, 'HEAD']),
    git.lines(['diff', '--name-only', `--diff-filter=${CONTRACT_DIFF_FILTER}`, 'HEAD']),
    git.lines(['ls-files', '--others', '--exclude-standard']),
  );
}

function getImpactSummary() {
  if (process.env.GITNEXUS_IMPACT_SUMMARY) {
    return extractImpactSummary(process.env.GITNEXUS_IMPACT_SUMMARY);
  }
  if (process.env.GITHUB_EVENT_PATH && existsSync(process.env.GITHUB_EVENT_PATH)) {
    const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
    return extractImpactSummary(event.pull_request?.body ?? '');
  }
  return '';
}

function runGitNexusAnalyze() {
  const { command, args } = getGitNexusAnalyzeInvocation();
  console.log('Checking GitNexus availability...');

  const checkResult = spawnSync(command, ['--version'], {
    stdio: 'ignore',
  });

  if (checkResult.status !== 0) {
    console.log(
      'GitNexus not available. Skipping analyze step. Contract classification and impact summary validation continue.',
    );
    return;
  }

  console.log('Running GitNexus analyze --force --index-only...');
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    timeout: 60_000,
  });

  if (result.error) {
    console.log(
      'GitNexus analyze failed to start. Continuing with contract classification only.',
    );
    return;
  }

  if (result.status !== 0 || result.signal) {
    console.log(
      `GitNexus analyze failed with exit code ${result.status ?? 'unknown'}. Continuing with contract classification only.`,
    );
  }
}

function getGitNexusAnalyzeInvocation() {
  const args = [
    '--yes',
    '--prefer-offline',
    'gitnexus',
    'analyze',
    '--force',
    '--index-only',
  ];
  if (process.platform === 'win32') {
    return { command: 'cmd.exe', args: ['/d', '/s', '/c', 'npx.cmd', ...args] };
  }
  return { command: 'npx', args };
}

function gitLines(args) {
  const output = execFileSync('git', ['-c', 'core.quotePath=false', ...args], { encoding: 'utf8' });
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function gitRefExists(ref) {
  try {
    execFileSync('git', ['rev-parse', '--verify', `${ref}^{commit}`], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function fetchBaseRef(baseBranch) {
  execFileSync('git', ['fetch', '--no-tags', '--depth=1', 'origin', baseBranch], {
    stdio: 'inherit',
  });
}

function isMainModule() {
  return process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
}

function printContractResult(title, result) {
  console.log(`\n${title}: ${result.ok ? 'passed' : 'failed'}`);
  for (const reason of result.reasons ?? []) console.log(`- ${reason}`);
  for (const warning of result.warnings ?? []) console.log(`- warning: ${warning}`);
  if (result.critical?.length) {
    console.log('Critical contract files:');
    for (const item of result.critical) console.log(`- ${item.category}: ${item.file}`);
  }
  if (result.suggestions?.length) {
    console.log('Suggestions:');
    for (const suggestion of result.suggestions) console.log(`- ${suggestion}`);
  }
}
```

- [ ] **Step 3: Verify bootstrap runs**

Run: `node scripts/workflows/contract-check.mjs bootstrap`
Expected: prints "Git hooks installed via core.hooksPath=.githooks" (may error if .githooks/ missing yet — that is expected until Task 3).

## Task 3: Add Git Hooks And Package Scripts

**Files:**
- Create: `.githooks/pre-commit`
- Create: `.githooks/pre-push`
- Modify: `package.json`

- [ ] **Step 1: Create pre-commit hook**

Create `.githooks/pre-commit`:

```sh
#!/bin/sh
set -eu

if [ "${SKIP_QUALITY_HOOKS:-}" = "1" ]; then
  echo "Skipping pre-commit quality gate because SKIP_QUALITY_HOOKS=1. CI remains authoritative."
  exit 0
fi

npm run quality:precommit
```

- [ ] **Step 2: Create pre-push hook**

Create `.githooks/pre-push`:

```sh
#!/bin/sh
set -eu

if [ "${SKIP_QUALITY_HOOKS:-}" = "1" ]; then
  echo "Skipping pre-push quality gate because SKIP_QUALITY_HOOKS=1. CI remains authoritative."
  exit 0
fi

npm run quality:local
```

- [ ] **Step 3: Make hooks executable**

Run: `chmod +x .githooks/pre-commit .githooks/pre-push`
Expected: no output.

- [ ] **Step 4: Update package.json scripts**

Modify `package.json` scripts section to add Harness scripts. Replace the existing `"scripts"` block with:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
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

- [ ] **Step 5: Add vitest devDependency**

Run: `npm install --save-dev vitest`
Expected: vitest added to devDependencies, package-lock.json updated.

- [ ] **Step 6: Verify hook installer**

Run: `npm run hooks:install && git config --get core.hooksPath`
Expected: prints "Git hooks installed via core.hooksPath=.githooks" then `.githooks`.

## Task 4: Add Workflow Rules Tests

**Files:**
- Create: `scripts/tests/workflow-rules.test.mjs`

- [ ] **Step 1: Create workflow-rules.test.mjs**

Create `scripts/tests/workflow-rules.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import {
  classifyContractPaths,
  evaluateGitNexusContract,
  extractImpactSummary,
  validateStructuredImpactSummary,
} from '../workflows/contract-rules.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..', '..');

function readRootFile(relativePath) {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

function packageJson() {
  return JSON.parse(readRootFile('package.json'));
}

test('classifyContractPaths marks repo-harness files as critical', () => {
  const { critical, nonCritical } = classifyContractPaths([
    '.github/workflows/ci.yml',
    'AGENTS.md',
    'src/App.tsx',
  ]);
  assert.equal(critical.length, 2);
  assert.equal(nonCritical.length, 1);
  assert.equal(nonCritical[0], 'src/App.tsx');
});

test('classifyContractPaths marks agent-prompts as critical', () => {
  const { critical } = classifyContractPaths(['docs/agent-prompts/AGENTS.md']);
  assert.equal(critical.length, 1);
  assert.equal(critical[0].category, 'agent-prompts');
});

test('evaluateGitNexusContract passes for non-critical changes', () => {
  const result = evaluateGitNexusContract({
    changedFiles: ['src/App.tsx'],
    impactSummary: '',
    requireImpactSummary: false,
  });
  assert.equal(result.ok, true);
});

test('evaluateGitNexusContract fails for critical changes without impact summary', () => {
  const result = evaluateGitNexusContract({
    changedFiles: ['AGENTS.md'],
    impactSummary: '',
    requireImpactSummary: true,
  });
  assert.equal(result.ok, false);
});

test('evaluateGitNexusContract fails for placeholder impact summary', () => {
  const result = evaluateGitNexusContract({
    changedFiles: ['.github/workflows/ci.yml'],
    impactSummary: '-',
    requireImpactSummary: true,
  });
  assert.equal(result.ok, false);
});

test('evaluateGitNexusContract passes for critical changes with valid summary', () => {
  const summary = [
    '- Risk level: LOW',
    '- Critical skeleton changes: AGENTS.md only',
    '- Impact analysis: manual review, no public API change',
    '- Verification: npm run quality:precommit passed',
  ].join('\n');
  const result = evaluateGitNexusContract({
    changedFiles: ['AGENTS.md', 'scripts/tests/workflow-rules.test.mjs'],
    impactSummary: summary,
    requireImpactSummary: true,
  });
  assert.equal(result.ok, true);
});

test('validateStructuredImpactSummary rejects invalid risk level', () => {
  const summary = [
    '- Risk level: URGENT',
    '- Critical skeleton changes: none',
    '- Impact analysis: manual review',
    '- Verification: tests passed',
  ].join('\n');
  const reasons = validateStructuredImpactSummary(summary);
  assert.ok(reasons.some((r) => r.includes('Invalid risk level')));
});

test('extractImpactSummary pulls section under heading', () => {
  const text = [
    '## Summary',
    'some text',
    '',
    '## Impact Summary',
    '- Risk level: LOW',
    '- Critical skeleton changes: none',
    '',
    '## Verification',
    'other',
  ].join('\n');
  const summary = extractImpactSummary(text);
  assert.ok(summary.includes('Risk level: LOW'));
  assert.ok(!summary.includes('other'));
});

test('pre-commit hook exists and references quality:precommit', () => {
  const content = readRootFile('.githooks/pre-commit');
  assert.ok(content.includes('npm run quality:precommit'));
  assert.ok(content.includes('SKIP_QUALITY_HOOKS'));
});

test('pre-push hook exists and references quality:local', () => {
  const content = readRootFile('.githooks/pre-push');
  assert.ok(content.includes('npm run quality:local'));
  assert.ok(content.includes('SKIP_QUALITY_HOOKS'));
});

test('package.json contains required Harness scripts', () => {
  const scripts = packageJson().scripts;
  const required = [
    'prepare',
    'hooks:install',
    'agent:bootstrap',
    'contract:local',
    'contract:check',
    'contract:gitnexus',
    'quality:predev',
    'test',
    'test:workflows',
    'quality:precommit',
    'quality:ci',
    'quality:local',
  ];
  for (const name of required) {
    assert.ok(scripts[name], `missing script: ${name}`);
  }
});

test('PR template contains Impact Summary section', () => {
  const content = readRootFile('.github/PULL_REQUEST_TEMPLATE.md');
  assert.ok(content.includes('## Impact Summary'));
  assert.ok(content.includes('Risk level'));
  assert.ok(content.includes('Critical skeleton changes'));
  assert.ok(content.includes('Impact analysis'));
  assert.ok(content.includes('Verification'));
});

test('issue templates exist', () => {
  assert.ok(existsSync(resolve(root, '.github/ISSUE_TEMPLATE/bug.yml')));
  assert.ok(existsSync(resolve(root, '.github/ISSUE_TEMPLATE/feature.yml')));
  assert.ok(existsSync(resolve(root, '.github/ISSUE_TEMPLATE/maintenance.yml')));
  assert.ok(existsSync(resolve(root, '.github/ISSUE_TEMPLATE/config.yml')));
});

test('CODEOWNERS exists and references ceilf6', () => {
  const content = readRootFile('.github/CODEOWNERS');
  assert.ok(content.includes('@ceilf6'));
});

test('contract-guard.yml targets main and calls contract:gitnexus', () => {
  const content = readRootFile('.github/workflows/contract-guard.yml');
  assert.ok(content.includes('branches: [main]'));
  assert.ok(content.includes('npm run contract:gitnexus'));
});

test('repo-guard.yml targets main', () => {
  const content = readRootFile('.github/workflows/repo-guard.yml');
  assert.ok(content.includes('branches: [main]'));
});

test('CONTRIBUTING.md exists', () => {
  assert.ok(existsSync(resolve(root, 'CONTRIBUTING.md')));
});

test('docs/workflow.md exists', () => {
  assert.ok(existsSync(resolve(root, 'docs/workflow.md')));
});

test('docs/knowledge-contract.md exists', () => {
  assert.ok(existsSync(resolve(root, 'docs/knowledge-contract.md')));
});
```

- [ ] **Step 2: Run workflow tests**

Run: `npm run test:workflows`
Expected: tests fail for files not yet created (PR template, issue templates, CODEOWNERS, contract-guard.yml, CONTRIBUTING.md, docs/workflow.md, docs/knowledge-contract.md). Contract rules and hook tests should pass after Task 3.

## Task 5: Add PR And Issue Templates

**Files:**
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `.github/ISSUE_TEMPLATE/bug.yml`
- Create: `.github/ISSUE_TEMPLATE/feature.yml`
- Create: `.github/ISSUE_TEMPLATE/maintenance.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`

- [ ] **Step 1: Create PR template**

Create `.github/PULL_REQUEST_TEMPLATE.md`:

```md
## Linked Issue Or Context

-

## Summary

-

## Impact Scope

-

## Impact Summary

- Risk level: -
- Critical skeleton changes: -
- Impact analysis: -
- Verification: -

## Verification

-

## Checklist

- [ ] I have linked an issue or explained why this PR stands alone.
- [ ] I have kept the diff focused on the stated change.
- [ ] I have run `npm run quality:precommit`, or explained why it could not run.
- [ ] I have run `npm run quality:local` for critical skeleton changes, or explained why it could not run.
- [ ] I have updated docs or tests when behavior, public APIs, or Harness contracts changed.
- [ ] For critical skeleton changes, I have filled the Impact Summary with concrete results.
- [ ] For non-trivial changes, I have written a design doc under `docs/superpowers/specs/`.
```

- [ ] **Step 2: Create bug issue template**

Create `.github/ISSUE_TEMPLATE/bug.yml`:

```yaml
name: Bug Report
description: Report a reproducible problem in KnowledgeFlow StudyAgent.
title: "[Bug] "
labels: ["bug"]
body:
  - type: textarea
    id: summary
    attributes:
      label: Summary
      description: What happened, and what did you expect instead?
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Reproduction
      description: Provide the smallest steps that reproduce the bug.
      placeholder: |
        1. Run ...
        2. Open ...
        3. Observe ...
    validations:
      required: true
  - type: input
    id: affected-area
    attributes:
      label: Affected Area
      description: For example frontend, agent-prompts, docs, CI, Harness.
    validations:
      required: true
  - type: textarea
    id: environment
    attributes:
      label: Environment
      description: Include OS, Node version, npm version, browser, and StudyAgent version or commit.
      placeholder: |
        - OS:
        - Node:
        - npm:
        - Browser:
        - StudyAgent:
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: Logs Or Screenshots
      description: Paste relevant logs or screenshots. Remove secrets before posting.
    validations:
      required: false
  - type: checkboxes
    id: contribution
    attributes:
      label: Contribution
      options:
        - label: I am willing to submit a PR for this bug.
          required: false
```

- [ ] **Step 3: Create feature issue template**

Create `.github/ISSUE_TEMPLATE/feature.yml`:

```yaml
name: Feature Request
description: Propose a new capability or behavior change.
title: "[Feature] "
labels: ["enhancement"]
body:
  - type: textarea
    id: problem
    attributes:
      label: Problem
      description: What user or maintainer problem does this solve?
    validations:
      required: true
  - type: textarea
    id: proposal
    attributes:
      label: Proposed Behavior
      description: Describe the expected behavior and user-facing shape.
    validations:
      required: true
  - type: input
    id: affected-area
    attributes:
      label: Affected Area
      description: For example frontend, agent-prompts, docs, CI, Harness.
    validations:
      required: true
  - type: textarea
    id: alternatives
    attributes:
      label: Alternatives Considered
      description: What other approaches did you consider?
    validations:
      required: false
  - type: textarea
    id: acceptance
    attributes:
      label: Acceptance Criteria
      description: List concrete checks that would prove the feature is complete.
    validations:
      required: true
  - type: checkboxes
    id: contribution
    attributes:
      label: Contribution
      options:
        - label: I am willing to submit a PR for this feature.
          required: false
```

- [ ] **Step 4: Create maintenance issue template**

Create `.github/ISSUE_TEMPLATE/maintenance.yml`:

```yaml
name: Maintenance Task
description: Propose refactoring, documentation, CI, dependency, or Harness maintenance.
title: "[Maintenance] "
labels: ["maintenance"]
body:
  - type: textarea
    id: reason
    attributes:
      label: Reason
      description: Why is this maintenance useful now?
    validations:
      required: true
  - type: input
    id: affected-area
    attributes:
      label: Affected Area
      description: For example CI, docs, Harness, dependency, test suite.
    validations:
      required: true
  - type: textarea
    id: proposed-change
    attributes:
      label: Proposed Change
      description: Describe the intended change and any alternatives.
    validations:
      required: true
  - type: textarea
    id: verification
    attributes:
      label: Verification Plan
      description: Which commands, tests, or reviews should prove this task is safe?
    validations:
      required: true
  - type: checkboxes
    id: contribution
    attributes:
      label: Contribution
      options:
        - label: I am willing to submit a PR for this maintenance task.
          required: false
```

- [ ] **Step 5: Create issue config**

Create `.github/ISSUE_TEMPLATE/config.yml`:

```yaml
blank_issues_enabled: true
contact_links:
  - name: Questions And Discussions
    url: https://github.com/ceilf6/KnowledgeFlow-StudyAgent/discussions
    about: Ask questions or discuss ideas before opening an issue.
```

## Task 6: Add CODEOWNERS

**Files:**
- Create: `.github/CODEOWNERS`

- [ ] **Step 1: Create CODEOWNERS**

Create `.github/CODEOWNERS`:

```
.github/workflows/ @ceilf6
.github/PULL_REQUEST_TEMPLATE.md @ceilf6
.github/ISSUE_TEMPLATE/ @ceilf6
.github/CODEOWNERS @ceilf6
.githooks/ @ceilf6
scripts/workflows/ @ceilf6
scripts/tests/ @ceilf6
AGENTS.md @ceilf6
CLAUDE.md @ceilf6
CONTRIBUTING.md @ceilf6
docs/workflow.md @ceilf6
docs/knowledge-contract.md @ceilf6
docs/agent-prompts/ @ceilf6
```

## Task 7: Add Contract Guard Workflow

**Files:**
- Create: `.github/workflows/contract-guard.yml`

- [ ] **Step 1: Create contract-guard.yml**

Create `.github/workflows/contract-guard.yml`:

```yaml
name: Contract Guard

on:
  pull_request:
    branches: [main]
    types: [opened, edited, synchronize, reopened, ready_for_review]

permissions:
  contents: read

concurrency:
  group: contract-guard-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  contract:
    name: Contract Guard / contract
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - run: npm run contract:gitnexus
        env:
          GITNEXUS_IMPACT_SUMMARY: ${{ github.event.pull_request.body }}
```

## Task 8: Add OSS Docs

**Files:**
- Create: `CONTRIBUTING.md`
- Create: `docs/workflow.md`
- Create: `docs/knowledge-contract.md`
- Create: `docs/oss-harness-engineering-workflow.md`

- [ ] **Step 1: Create CONTRIBUTING.md**

Create `CONTRIBUTING.md`:

```md
# Contributing To KnowledgeFlow StudyAgent

Thanks for helping improve KnowledgeFlow StudyAgent. This repository uses a lightweight OSS Harness: local quality gates, contract checks, CI, Repo Guard advisory review, and maintainer review. It does not use training-camp claim, score, progress-ledger, timeout-close, or auto-merge commands.

## Setup

```bash
npm install
npm run agent:bootstrap
npm run quality:predev
```

`npm run agent:bootstrap` installs repository git hooks and prints the expected local workflow. `npm run quality:predev` refreshes contract context before development.

## Local Quality Gates

- `npm run quality:precommit`: fast gate for commit-time checks. Runs lint, build, test, and workflow tests.
- `npm run quality:ci`: CI-equivalent gate. Runs lint, build, test, and workflow tests.
- `npm run quality:local`: full local gate for push-time checks. Runs contract checks and `quality:ci`.

The repository hooks run `quality:precommit` on commit and `quality:local` on push. If hooks are unavailable, run the same commands manually. Maintainers may use `SKIP_QUALITY_HOOKS=1` for emergencies, but CI remains authoritative.

## Branches And PRs

Open PRs against `main`. Use short-lived branches such as:

```text
feat/learning-plan-ui
fix/auth-redirect
docs/contributor-workflow
```

Keep each PR focused on one behavior, fix, or maintenance task.

## Impact Summary

Critical skeleton changes require a concrete Impact Summary in the PR template. Run the contract check before changing shared surfaces and before final review:

```bash
npm run contract:check
```

Fill the PR Impact Summary section like this:

```md
- Risk level: LOW
- Critical skeleton changes: AGENTS.md only; no public API changes.
- Impact analysis: manual review of prompt references; no runtime behavior change.
- Verification: npm run quality:precommit passed.
```

Do not leave placeholder values for critical skeleton changes.

## TDD And SDD

- **TDD**: Bug fixes and new features are encouraged to follow red-green-refactor. Write a failing test first, implement the minimal code to pass, then refactor. Test files live next to source as `*.test.tsx` / `*.test.ts`.
- **SDD**: Non-trivial changes (new features, architecture adjustments, critical skeleton changes) should first produce a design doc under `docs/superpowers/specs/` and an implementation plan under `docs/superpowers/plans/`. Trivial changes may skip this cycle.

## Documentation Authority

Use this priority when documents and code disagree:

1. `README.md` for public product positioning.
2. `docs/architecture.md` and `docs/design.md` (when created) for architecture and SDD behavior.
3. `docs/workflow.md` and `docs/knowledge-contract.md` for contribution and Harness rules.
4. Issue or PR text for the specific change.
5. Existing code, unless it contradicts the documents above.

If the documents conflict, ask maintainers instead of silently choosing a new architecture.

## Security

Do not paste secrets into issues, PRs, tests, or screenshots. Workflows for fork PRs must not execute untrusted code with write tokens. Repo Guard is advisory; maintainers still decide merges.
```

- [ ] **Step 2: Create docs/workflow.md**

Create `docs/workflow.md`:

```md
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

## Review And Merge

CI and Contract Guard provide minimum checks. Repo Guard provides advisory AI review. Maintainers decide whether to merge after reviewing product intent, design fit, tests, and risk.

This repository does not use `认领`, `score:*`, progress ledgers, `确认合并` auto-merge comments, or PR timeout-close automation.
```

- [ ] **Step 3: Create docs/knowledge-contract.md**

Create `docs/knowledge-contract.md`:

```md
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
```

- [ ] **Step 4: Create docs/oss-harness-engineering-workflow.md**

Create `docs/oss-harness-engineering-workflow.md`:

```md
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
```

## Task 9: Update Engineering Prompts

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update AGENTS.md**

Replace the entire contents of `AGENTS.md` with:

```md
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
```

- [ ] **Step 2: Update CLAUDE.md**

Replace the entire contents of `CLAUDE.md` with:

```md
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
```

## Task 10: Verify And Run Gates

**Files:**
- All created/modified Harness files.

- [ ] **Step 1: Run workflow tests**

Run: `npm run test:workflows`
Expected: all tests PASS.

- [ ] **Step 2: Run contract check**

Run: `npm run contract:check`
Expected: prints contract result. May show advisory warnings if GitNexus unavailable. Should not fail for non-critical working tree state.

- [ ] **Step 3: Run precommit quality gate**

Run: `npm run quality:precommit`
Expected: lint, build, test, and workflow tests all PASS. If lint reports pre-existing warnings, capture them but do not block on unrelated existing issues.

- [ ] **Step 4: Verify hook installation**

Run: `git config --get core.hooksPath`
Expected: `.githooks`

- [ ] **Step 5: Final static checks**

Run: `git status --short`
Expected: only intended Harness files plus `package.json` and `package-lock.json` changes.
