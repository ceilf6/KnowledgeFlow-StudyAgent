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
