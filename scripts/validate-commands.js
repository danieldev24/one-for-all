#!/usr/bin/env node
/**
 * validate-commands.js
 *
 * Validates token-conscious defaults for command entry points.
 *
 * Usage:
 *   node scripts/validate-commands.js
 *
 * Exit codes:
 *   0 = all clear
 *   1 = one or more command checks failed
 */

'use strict';

const fs = require('fs');
const path = require('path');

const COMMANDS_DIR = process.env.COMMANDS_DIR
  ? path.resolve(process.env.COMMANDS_DIR)
  : path.resolve(__dirname, '..', '.claude', 'commands');

const COMMANDS = {
  'ofa-plan.md': 'one-for-all:planning-and-task-breakdown',
  'ofa-build.md': 'one-for-all:incremental-implementation',
  'ofa-test.md': 'one-for-all:test-driven-development',
  'ofa-review.md': 'one-for-all:code-review-and-quality',
  'ofa-code-simplify.md': 'one-for-all:code-simplification',
};

const REQUIRED_TERMS = [
  'concise',
  'lite',
  'standard',
  'strict',
  'escalate',
  'risk',
  'ambiguity',
  'failing verification',
  'user explicitly asks',
  'verification',
];

const MAX_COMMAND_LINES = 35;

const findings = [];

for (const [fileName, canonicalSkill] of Object.entries(COMMANDS)) {
  const filePath = path.join(COMMANDS_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    findings.push({ command: fileName, check: 'file-exists', message: 'Command file is missing' });
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lower = content.toLowerCase();
  const lineCount = content.split(/\r?\n/).length;

  if (!content.includes(canonicalSkill)) {
    findings.push({
      command: fileName,
      check: 'canonical-skill',
      message: `Missing canonical skill invocation: ${canonicalSkill}`,
    });
  }

  for (const term of REQUIRED_TERMS) {
    if (!lower.includes(term)) {
      findings.push({
        command: fileName,
        check: 'token-defaults',
        message: `Missing required token-conscious wording: ${term}`,
      });
    }
  }

  if (lineCount > MAX_COMMAND_LINES) {
    findings.push({
      command: fileName,
      check: 'line-count',
      message: `Command is ${lineCount} lines; keep command defaults concise (max ${MAX_COMMAND_LINES})`,
    });
  }
}

if (findings.length === 0) {
  console.log(`All ${Object.keys(COMMANDS).length} command entry point(s) passed.`);
} else {
  for (const finding of findings) {
    console.log(`✗ ${finding.command}`);
    console.log(`    ${finding.check}: ${finding.message}`);
  }
}

process.exit(findings.length === 0 ? 0 : 1);
