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

test('AGENTS.md documents Agent Authority autonomous mode', () => {
  const content = readRootFile('AGENTS.md');
  assert.ok(content.includes('## Agent Authority'), 'AGENTS.md missing Agent Authority section');
  assert.ok(content.includes('Co-authored-by: traeagent <traeagent@users.noreply.github.com>'), 'AGENTS.md missing Co-authored-by trailer rule');
  assert.ok(content.includes('Direct merge'), 'AGENTS.md missing direct merge rule');
});

test('CLAUDE.md documents Agent Authority autonomous mode', () => {
  const content = readRootFile('CLAUDE.md');
  assert.ok(content.includes('## Agent Authority'), 'CLAUDE.md missing Agent Authority section');
  assert.ok(content.includes('Co-authored-by: traeagent <traeagent@users.noreply.github.com>'), 'CLAUDE.md missing Co-authored-by trailer rule');
  assert.ok(content.includes('Direct merge'), 'CLAUDE.md missing direct merge rule');
});

test('docs/workflow.md documents Agent Authority and autonomous merge', () => {
  const content = readRootFile('docs/workflow.md');
  assert.ok(content.includes('## Agent Authority'), 'workflow.md missing Agent Authority section');
  assert.ok(content.includes('autonomous mode'), 'workflow.md missing autonomous mode rule');
  assert.ok(content.includes('agent merges directly'), 'workflow.md missing autonomous merge rule');
});
