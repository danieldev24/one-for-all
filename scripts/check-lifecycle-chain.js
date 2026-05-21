#!/usr/bin/env node
/**
 * check-lifecycle-chain.js
 *
 * Static analyzer for `## Next` lifecycle handoff sections.
 *
 * For each skill in skills/<name>/SKILL.md:
 *   1. Locate the `## Next` section (if any)
 *   2. Parse the markdown table inside it
 *   3. Extract referenced skill names (`name`) and slash commands (/ofa-name)
 *   4. Verify each reference resolves to a directory in skills/ or a file in
 *      .claude/commands/
 *   5. Build the directed graph and report orphans (no incoming edges) and
 *      dead-ends (no outgoing edges)
 *
 * Usage:
 *   node scripts/check-lifecycle-chain.js          # pretty
 *   node scripts/check-lifecycle-chain.js --json   # machine-readable
 *
 * Exit codes:
 *   0 = no ERRORs (only WARNs allowed)
 *   1 = at least one ERROR (broken reference)
 *   2 = configuration error (skills dir missing, etc.)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const SKILLS_DIR   = process.env.SKILLS_DIR
  ? path.resolve(process.env.SKILLS_DIR)
  : path.resolve(__dirname, '..', 'skills');
const COMMANDS_DIR = process.env.COMMANDS_DIR
  ? path.resolve(process.env.COMMANDS_DIR)
  : path.resolve(__dirname, '..', '.claude', 'commands');

// Skills that are intentional entry points; not flagged as orphans.
const ENTRY_POINT_SKILLS = new Set(['using-one-for-all']);

// ─── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const opts = { json: false };
  for (const arg of argv.slice(2)) {
    if (arg === '--json') opts.json = true;
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: check-lifecycle-chain.js [--json]');
      process.exit(0);
    }
  }
  return opts;
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

function getNextSection(content) {
  const idx = content.indexOf('\n## Next');
  if (idx === -1) return null;
  const after = content.slice(idx + 1);
  const nextH2 = after.search(/\n##\s+/);
  return nextH2 === -1 ? after : after.slice(0, nextH2);
}

/**
 * Extract referenced names from a `## Next` table.
 * Looks for backticked tokens and slash-command tokens in the right-hand
 * column of pipe-row table lines (lines after the separator).
 *
 * Returns array of { type: 'skill'|'command'|'unknown', name, line }
 */
function extractRefs(nextSection) {
  if (!nextSection) return [];
  const refs = [];
  const lines = nextSection.split(/\r?\n/);
  let sawSeparator = false;
  for (const raw of lines) {
    const line = raw.trim();
    if (!/^\|.*\|\s*$/.test(line)) continue;
    if (/^\|[\s|:-]+\|\s*$/.test(line)) { sawSeparator = true; continue; }
    if (!sawSeparator) continue;

    // Split by pipes; ignore the leading + trailing empty cells.
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length < 2) continue;
    const target = cells[cells.length - 1];

    // Slash commands: /ofa-name
    const cmdMatches = [...target.matchAll(/\/(ofa-[a-z][a-z0-9-]*)/g)];
    for (const m of cmdMatches) {
      refs.push({ type: 'command', name: m[1], line });
    }

    // Backticked skill names: `name-with-hyphens`
    const tickMatches = [...target.matchAll(/`([a-z][a-z0-9-]+[a-z0-9])`/g)];
    for (const m of tickMatches) {
      const candidate = m[1];
      // If it starts with `ofa-`, treat as a command we already grabbed
      if (candidate.startsWith('ofa-')) continue;
      refs.push({ type: 'skill', name: candidate, line });
    }
  }
  return refs;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const opts = parseArgs(process.argv);

  if (!fs.existsSync(SKILLS_DIR)) {
    console.error(`ERROR: skills directory not found at ${SKILLS_DIR}`);
    process.exit(2);
  }

  const skillNames = fs.readdirSync(SKILLS_DIR)
    .filter(d => fs.statSync(path.join(SKILLS_DIR, d)).isDirectory())
    .sort();
  const skillSet = new Set(skillNames);

  const commandNames = fs.existsSync(COMMANDS_DIR)
    ? fs.readdirSync(COMMANDS_DIR)
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace(/\.md$/, ''))
    : [];
  const commandSet = new Set(commandNames);

  const findings = [];   // { severity, skill, message }
  const incomingEdges = new Map();   // skill name → count
  const outgoingEdges = new Map();   // skill name → count
  for (const s of skillNames) {
    incomingEdges.set(s, 0);
    outgoingEdges.set(s, 0);
  }

  for (const name of skillNames) {
    const filePath = path.join(SKILLS_DIR, name, 'SKILL.md');
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    const nextSection = getNextSection(content);

    if (!nextSection) {
      findings.push({ severity: 'warn', skill: name, message: 'No `## Next` section — cannot evaluate handoff' });
      continue;
    }

    const refs = extractRefs(nextSection);
    if (refs.length === 0) {
      findings.push({ severity: 'warn', skill: name, message: '`## Next` section has no parseable skill or command references' });
      continue;
    }

    for (const ref of refs) {
      if (ref.type === 'skill') {
        if (!skillSet.has(ref.name)) {
          findings.push({ severity: 'error', skill: name, message: `Reference to unknown skill: \`${ref.name}\`` });
        } else {
          outgoingEdges.set(name, (outgoingEdges.get(name) || 0) + 1);
          incomingEdges.set(ref.name, (incomingEdges.get(ref.name) || 0) + 1);
        }
      } else if (ref.type === 'command') {
        if (!commandSet.has(ref.name)) {
          findings.push({ severity: 'error', skill: name, message: `Reference to unknown command: /${ref.name}` });
        } else {
          // Commands are routes into skills, not first-class graph nodes.
          // Count as outgoing for the source skill.
          outgoingEdges.set(name, (outgoingEdges.get(name) || 0) + 1);
        }
      }
    }
  }

  // Orphans: zero incoming edges (excluding entry points)
  for (const name of skillNames) {
    if (incomingEdges.get(name) === 0 && !ENTRY_POINT_SKILLS.has(name)) {
      findings.push({ severity: 'warn', skill: name, message: 'Orphan: no other skill points to it' });
    }
  }
  // Dead-ends: skill has a Next section but zero outgoing edges
  for (const name of skillNames) {
    if (outgoingEdges.get(name) === 0) {
      // Already warned above if no Next section; suppress dupe.
      const alreadyWarned = findings.some(f => f.skill === name && f.message.startsWith('No `## Next`'));
      if (!alreadyWarned) {
        findings.push({ severity: 'warn', skill: name, message: 'Dead-end: `## Next` section parses but produces no resolvable outgoing edges' });
      }
    }
  }

  // ── Output
  const errors = findings.filter(f => f.severity === 'error');
  const warns  = findings.filter(f => f.severity === 'warn');

  if (opts.json) {
    process.stdout.write(JSON.stringify({
      findings,
      summary: {
        skillsChecked: skillNames.length,
        errors: errors.length,
        warns: warns.length,
      },
    }, null, 2) + '\n');
  } else {
    if (findings.length === 0) {
      console.log(`All ${skillNames.length} skills have valid lifecycle handoffs.`);
    } else {
      const bySkill = new Map();
      for (const f of findings) {
        if (!bySkill.has(f.skill)) bySkill.set(f.skill, []);
        bySkill.get(f.skill).push(f);
      }
      for (const name of skillNames) {
        const fs = bySkill.get(name);
        if (!fs) continue;
        const errs  = fs.filter(f => f.severity === 'error');
        const warns = fs.filter(f => f.severity === 'warn');
        const icon = errs.length > 0 ? '  ✗' : '  ⚠';
        console.log(`${icon} ${name}`);
        for (const f of errs)  console.log(`       ERROR: ${f.message}`);
        for (const f of warns) console.log(`       WARN:  ${f.message}`);
      }
    }
    console.log(`\n${skillNames.length} skill(s) checked — ${errors.length} error(s), ${warns.length} warning(s)`);
  }

  if (errors.length > 0) process.exit(1);
}

main();
