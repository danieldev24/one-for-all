#!/usr/bin/env node
/**
 * test-validator.js
 *
 * Fixture-based tests for validate-skills.js.
 *
 * Strategy:
 *   1. Spawn validate-skills.js with SKILLS_DIR pointed at scripts/__fixtures__/skills
 *   2. Parse its --format=ndjson output
 *   3. Assert that the expected (skill, check) pairs appear with the expected severity
 *
 * Run:  node scripts/test-validator.js
 * Exit: 0 = all assertions pass, 1 = any assertion failed.
 */

'use strict';

const path  = require('path');
const fs    = require('fs');
const os    = require('os');
const { spawnSync } = require('child_process');

const VALIDATOR  = path.resolve(__dirname, 'validate-skills.js');
const FIXTURES   = path.resolve(__dirname, '__fixtures__', 'skills');

let failures = 0;

function runValidator({ strict = false, skillsDir = FIXTURES } = {}) {
  const args = ['--format=ndjson'];
  if (strict) args.push('--strict');
  const proc = spawnSync('node', [VALIDATOR, ...args], {
    env: { ...process.env, SKILLS_DIR: skillsDir },
    encoding: 'utf8',
  });
  const lines = proc.stdout.split('\n').filter(Boolean);
  const results = lines.map(l => JSON.parse(l));
  return { results, exitCode: proc.status, stderr: proc.stderr };
}

function assertResult(label, results, predicate, opts = {}) {
  const matches = results.filter(predicate);
  const expected = opts.expectCount === undefined ? '>=1' : opts.expectCount;
  const ok = opts.expectCount === undefined
    ? matches.length >= 1
    : matches.length === opts.expectCount;
  if (ok) {
    console.log(`  ✓  ${label}`);
  } else {
    failures++;
    console.log(`  ✗  ${label}`);
    console.log(`       expected ${expected} match(es), got ${matches.length}`);
    if (matches.length > 0) {
      console.log(`       found: ${JSON.stringify(matches[0])}`);
    }
  }
}

function assertNoResult(label, results, predicate) {
  const matches = results.filter(predicate);
  if (matches.length === 0) {
    console.log(`  ✓  ${label}`);
  } else {
    failures++;
    console.log(`  ✗  ${label}`);
    console.log(`       expected 0 matches, got ${matches.length}`);
    console.log(`       first: ${JSON.stringify(matches[0])}`);
  }
}

// ─── Test 1: all-passing fixture emits no v1.1 warnings ──────────────────────

console.log('\nTest 1: all-passing fixture');
{
  const { results } = runValidator();
  const passingResults = results.filter(r => r.skill === 'all-passing');

  assertNoResult(
    'no errors on all-passing',
    passingResults,
    r => r.severity === 'error'
  );
  assertNoResult(
    'no v1.1 warnings on all-passing (description-min-length)',
    passingResults,
    r => r.check === 'description-min-length'
  );
  assertNoResult(
    'no v1.1 warnings on all-passing (description-trigger-word)',
    passingResults,
    r => r.check === 'description-trigger-word'
  );
  assertNoResult(
    'no v1.1 warnings on all-passing (verification-items)',
    passingResults,
    r => r.check === 'verification-items'
  );
  assertNoResult(
    'no v1.1 warnings on all-passing (rationalization-rows)',
    passingResults,
    r => r.check === 'rationalization-rows'
  );
  assertNoResult(
    'no v1.1 warnings on all-passing (next-rows)',
    passingResults,
    r => r.check === 'next-rows'
  );
  assertNoResult(
    'no v1.1 warnings on all-passing (section-next)',
    passingResults,
    r => r.check === 'section-next'
  );
}

// ─── Test 2: all-failing fixture emits a warning for each v1.1 check ─────────

console.log('\nTest 2: all-failing fixture');
{
  const { results } = runValidator();
  const failing = results.filter(r => r.skill === 'all-failing');

  // Check A: description below 100 chars
  assertResult('flags description-min-length', failing,
    r => r.check === 'description-min-length' && r.severity === 'warn');

  // Check A (cont.): description has no "when" or "trigger"
  assertResult('flags description-trigger-word', failing,
    r => r.check === 'description-trigger-word' && r.severity === 'warn');

  // Check B: missing ## Next section
  assertResult('flags missing ## Next section', failing,
    r => r.check === 'section-next' && r.severity === 'warn');

  // Check C: <3 verification items (fixture has 2)
  assertResult('flags verification-items', failing,
    r => r.check === 'verification-items' && r.severity === 'warn');

  // Check D: <3 rationalization rows (fixture has 1)
  assertResult('flags rationalization-rows', failing,
    r => r.check === 'rationalization-rows' && r.severity === 'warn');
}

// ─── Test 3: --strict promotes v1.1 warnings to errors ───────────────────────

console.log('\nTest 3: --strict promotes warnings');
{
  const { results, exitCode } = runValidator({ strict: true });
  const failing = results.filter(r => r.skill === 'all-failing');

  assertResult('strict makes description-min-length an error', failing,
    r => r.check === 'description-min-length' && r.severity === 'error');
  assertResult('strict makes section-next an error', failing,
    r => r.check === 'section-next' && r.severity === 'error');
  assertResult('strict exits 1 when v1.1 checks fail', [], () => exitCode === 1, { expectCount: 0 });
  // ^ predicate uses exitCode; expectCount: 0 + matches=0 means asserted-correct
  if (exitCode !== 1) {
    failures++;
    console.log(`  ✗  strict exit code: expected 1, got ${exitCode}`);
  } else {
    console.log(`  ✓  strict exit code is 1`);
  }
}

// ─── Test 4: line-count check fires on oversize fixture ──────────────────────

console.log('\nTest 4: line-count cap (Check F)');
{
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ofa-validator-'));
  const oversizeDir = path.join(tmpDir, 'oversize');
  fs.mkdirSync(oversizeDir);
  const header = [
    '---',
    'name: oversize',
    'description: A fixture file deliberately over the 500-line cap to verify the line-count check fires when triggered.',
    '---',
    '',
    '# Oversize',
    '',
    '## Overview',
    'A body that exceeds the cap.',
    '',
    '## When to Use',
    '- Triggering the line-count check',
    '',
    '## Common Rationalizations',
    '| R | Reality |',
    '|---|---|',
    '| a | b |',
    '| c | d |',
    '| e | f |',
    '',
    '## Red Flags',
    '- one',
    '',
    '## Verification',
    '- [ ] one',
    '- [ ] two',
    '- [ ] three',
    '',
    '## Next',
    '| Situation | Suggest |',
    '|---|---|',
    '| a | `b` |',
    '| c | `d` |',
    '',
    '## Filler',
  ].join('\n');
  const filler = Array.from({ length: 600 }, (_, i) => `Line ${i}`).join('\n');
  fs.writeFileSync(path.join(oversizeDir, 'SKILL.md'), header + '\n' + filler + '\n');

  const { results } = runValidator({ skillsDir: tmpDir });
  const oversizeResults = results.filter(r => r.skill === 'oversize');
  assertResult('flags line-count', oversizeResults,
    r => r.check === 'line-count' && r.severity === 'warn');

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${failures === 0 ? 'All tests passed.' : `${failures} test(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
