#!/usr/bin/env node
/**
 * test-check-lifecycle-chain.js
 *
 * Fixture-based test for check-lifecycle-chain.js.
 *
 * Generates a tmp skills dir + commands dir with:
 *   - skill `alpha`  → references `beta` (valid skill) and /ofa-build (valid cmd)
 *   - skill `beta`   → references `alpha` and /ofa-nope (invalid cmd)
 *   - skill `gamma`  → references `nonexistent` (invalid skill)
 *   - skill `delta`  → no `## Next` section at all
 *
 * Asserts:
 *   - error finding for beta's bad command
 *   - error finding for gamma's bad skill
 *   - warn finding for delta's missing section
 *   - exit code is 1 (errors present)
 *   - alpha has zero findings
 */

'use strict';

const path = require('path');
const fs   = require('fs');
const os   = require('os');
const { spawnSync } = require('child_process');

const CHECKER = path.resolve(__dirname, 'check-lifecycle-chain.js');
let failures = 0;

function check(label, ok, extra) {
  if (ok) console.log(`  ✓  ${label}`);
  else { failures++; console.log(`  ✗  ${label}`); if (extra) console.log(`       ${extra}`); }
}

const tmpDir   = fs.mkdtempSync(path.join(os.tmpdir(), 'ofa-chain-'));
const skillsDir = path.join(tmpDir, 'skills');
const cmdsDir   = path.join(tmpDir, 'commands');
fs.mkdirSync(skillsDir, { recursive: true });
fs.mkdirSync(cmdsDir, { recursive: true });

fs.writeFileSync(path.join(cmdsDir, 'ofa-build.md'), '# build');

const wrap = (name, salt, nextSection) => `---
name: ${name}
description: Fixture skill ${name} ${salt} for lifecycle chain test, used to verify reference resolution and orphan/dead-end detection when running.
---
# ${name}
## Overview
overview ${salt}
## When to Use
- when ${salt}
## Common Rationalizations
| R | Reality |
|---|---|
| a-${salt} | b-${salt} |
| c-${salt} | d-${salt} |
| e-${salt} | f-${salt} |
## Red Flags
- one ${salt}
## Verification
- [ ] one ${salt}
- [ ] two ${salt}
- [ ] three ${salt}
${nextSection}
`;

// alpha → beta + /ofa-build (both valid)
const alphaNext = `## Next
| If situation | Suggest |
|---|---|
| Need work breakdown | \`beta\` |
| Ready to implement | /ofa-build |
`;
fs.mkdirSync(path.join(skillsDir, 'alpha'));
fs.writeFileSync(path.join(skillsDir, 'alpha', 'SKILL.md'), wrap('alpha', 'sa', alphaNext));

// beta → alpha (valid) + /ofa-nope (invalid)
const betaNext = `## Next
| If | Suggest |
|---|---|
| Step back | \`alpha\` |
| Run command | /ofa-nope |
`;
fs.mkdirSync(path.join(skillsDir, 'beta'));
fs.writeFileSync(path.join(skillsDir, 'beta', 'SKILL.md'), wrap('beta', 'sb', betaNext));

// gamma → nonexistent (invalid)
const gammaNext = `## Next
| If | Suggest |
|---|---|
| Bad ref | \`nonexistent\` |
| Another bad | \`also-missing\` |
`;
fs.mkdirSync(path.join(skillsDir, 'gamma'));
fs.writeFileSync(path.join(skillsDir, 'gamma', 'SKILL.md'), wrap('gamma', 'sg', gammaNext));

// delta — no `## Next` section
fs.mkdirSync(path.join(skillsDir, 'delta'));
fs.writeFileSync(path.join(skillsDir, 'delta', 'SKILL.md'), wrap('delta', 'sd', ''));

const proc = spawnSync('node', [CHECKER, '--json'], {
  env: { ...process.env, SKILLS_DIR: skillsDir, COMMANDS_DIR: cmdsDir },
  encoding: 'utf8',
});
const json = JSON.parse(proc.stdout);
const exitCode = proc.status;

console.log('\nTest: check-lifecycle-chain.js fixture run');

check('exit code is 1 (errors present)', exitCode === 1, `got ${exitCode}`);
check('summary.errors >= 2', json.summary.errors >= 2, `got ${json.summary.errors}`);
check(
  'beta gets an error for /ofa-nope',
  json.findings.some(f => f.skill === 'beta' && f.severity === 'error' && f.message.includes('ofa-nope')),
);
check(
  'gamma gets an error for `nonexistent`',
  json.findings.some(f => f.skill === 'gamma' && f.severity === 'error' && f.message.includes('nonexistent')),
);
check(
  'delta gets a warn for missing ## Next',
  json.findings.some(f => f.skill === 'delta' && f.severity === 'warn'),
);
check(
  'alpha has zero findings (clean reference)',
  !json.findings.some(f => f.skill === 'alpha'),
);

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log(`\n${failures === 0 ? 'All tests passed.' : `${failures} test(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
