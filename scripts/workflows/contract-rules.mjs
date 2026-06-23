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
