#!/usr/bin/env node
/**
 * test-scan-duplication.js
 *
 * Fixture-based test for scan-duplication.js. Generates a temp dir with
 * three SKILL.md files: two share a verbatim 6-line block, one is unique.
 * Asserts the scanner finds the duplicate and ignores the unique file.
 */

'use strict';

const path  = require('path');
const fs    = require('fs');
const os    = require('os');
const { spawnSync } = require('child_process');

const SCANNER = path.resolve(__dirname, 'scan-duplication.js');
let failures = 0;

function check(label, ok, extra) {
  if (ok) {
    console.log(`  ✓  ${label}`);
  } else {
    failures++;
    console.log(`  ✗  ${label}`);
    if (extra) console.log(`       ${extra}`);
  }
}

function runScanner(skillsDir) {
  const proc = spawnSync('node', [SCANNER, '--json'], {
    env: { ...process.env, SKILLS_DIR: skillsDir },
    encoding: 'utf8',
  });
  return { json: JSON.parse(proc.stdout || '{}'), exitCode: proc.status };
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofa-dedup-'));

// Shared 6-line block (eligible content lines, non-trivial)
const shared = [
  'These six lines are deliberately duplicated across two skill files',
  'to verify the duplication scanner can detect them.',
  'Each line is non-trivial and should be indexed.',
  'The scanner reports verbatim repeats of >= 5 eligible lines.',
  'A 6-line block crosses the threshold and should appear.',
  'After this line, the two files diverge.',
].join('\n');

// Each fixture has its own unique scaffolding so the only line-level overlap
// across files is the explicit `body` block we inject.
const skillTemplate = (name, salt, body) => `---
name: ${name}
description: Fixture skill ${name} for the duplication scanner test ${salt}, exercising the >= 5 eligible-line threshold when running detection.
---

# Heading specific to ${name} ${salt}

## Overview
A unique overview line written for ${name} only ${salt}.

## When to Use
- Trigger phrase exclusive to ${name} ${salt}

## Common Rationalizations

| R-${salt} | Reality |
|---|---|
| a-${salt} | b-${salt} |
| c-${salt} | d-${salt} |
| e-${salt} | f-${salt} |

## Red Flags
- A flag specific to ${name} ${salt}

## Verification
- [ ] First check for ${name} ${salt}
- [ ] Second check for ${name} ${salt}
- [ ] Third check for ${name} ${salt}

${body}

## Next
| If situation specific to ${name} ${salt} | Suggest |
|---|---|
| a-${salt} | \`one-${salt}\` |
| c-${salt} | \`two-${salt}\` |
`;

fs.mkdirSync(path.join(tmpDir, 'shared-a'), { recursive: true });
fs.writeFileSync(
  path.join(tmpDir, 'shared-a', 'SKILL.md'),
  skillTemplate('shared-a', 'salt-a', shared),
);

fs.mkdirSync(path.join(tmpDir, 'shared-b'), { recursive: true });
fs.writeFileSync(
  path.join(tmpDir, 'shared-b', 'SKILL.md'),
  skillTemplate('shared-b', 'salt-b', shared),
);

fs.mkdirSync(path.join(tmpDir, 'unique'), { recursive: true });
fs.writeFileSync(
  path.join(tmpDir, 'unique', 'SKILL.md'),
  skillTemplate(
    'unique',
    'salt-c',
    'This file has its own original content and should not be flagged as a duplicate of any other.',
  ),
);

console.log('\nTest: scan-duplication.js detects a 6-line shared block');

const { json, exitCode } = runScanner(tmpDir);

check('returns a blocks array', Array.isArray(json.blocks));
check(
  'finds at least one duplicate block',
  Array.isArray(json.blocks) && json.blocks.length >= 1,
  `got ${json.blocks?.length ?? 'N/A'} blocks`,
);

const sharedBlock = (json.blocks || []).find(
  b =>
    b.locations.some(l => l.file === 'shared-a') &&
    b.locations.some(l => l.file === 'shared-b'),
);
check('detected block spans shared-a and shared-b', !!sharedBlock);
check(
  'detected block has >= 5 eligible lines',
  sharedBlock && sharedBlock.length >= 5,
  sharedBlock ? `length=${sharedBlock.length}` : 'no block',
);
check(
  'unique fixture is not in any duplicate block',
  (json.blocks || []).every(b => b.locations.every(l => l.file !== 'unique')),
);
check(
  'exit code is 1 when block exceeds threshold',
  exitCode === 1,
  `exitCode=${exitCode}`,
);

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log(`\n${failures === 0 ? 'All tests passed.' : `${failures} test(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
