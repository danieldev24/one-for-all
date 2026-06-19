#!/usr/bin/env node
/**
 * validate-skills.js
 *
 * Validates every skill in skills/ against the rules in docs/skill-anatomy.md.
 *
 * Usage:
 *   node scripts/validate-skills.js                  # default: pretty output
 *   node scripts/validate-skills.js --strict         # promote v1.1 warnings to errors
 *   node scripts/validate-skills.js --format=ndjson  # one JSON object per check, stdout
 *   SKILLS_DIR=/tmp/foo node scripts/validate-skills.js  # override skills dir (tests)
 *
 * Checks (always errors — block CI):
 *   - SKILL.md exists in every skill directory
 *   - YAML frontmatter present with 'name' and 'description' fields
 *   - frontmatter 'name' matches the directory name
 *   - description does not exceed 1024 characters
 *   - required sections are present (Overview, When to Use, Common
 *     Rationalizations, Red Flags, Verification, Next)
 *
 * Checks (v1.1 — warn by default, error under --strict):
 *   - description is >=100 chars and contains "when" or "trigger"
 *   - Verification has >=3 checklist items (- [ ])
 *   - Common Rationalizations table has >=3 data rows
 *   - Next section contains a markdown table with >=2 data rows
 *   - SKILL.md is <=500 lines
 *   - checklist/numbered workflow lines avoid vague phrases without evidence
 *   - non-exempt skills declare token metadata
 *   - lean-enabled pilot skills reference the Lean Senior SDLC source
 *   - checklist/numbered workflow lines avoid speculative expansion phrases
 *
 * Checks (warnings, never block):
 *   - cross-skill references point to known skills
 *
 * Exit codes: 0 = all clear, 1 = one or more errors.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────────────────────

const SKILLS_DIR = process.env.SKILLS_DIR
  ? path.resolve(process.env.SKILLS_DIR)
  : path.resolve(__dirname, '..', 'skills');

const MAX_DESCRIPTION_LENGTH    = 1024;
const MIN_DESCRIPTION_LENGTH    = 100;
const MIN_VERIFICATION_ITEMS    = 3;
const MIN_RATIONALIZATION_ROWS  = 3;
const MIN_NEXT_ROWS             = 2;
const MAX_SKILL_LINES           = 500;

const VAGUE_PHRASES = [
  'as needed',
  'handle appropriately',
  'ensure quality',
  'improve ux',
  'make robust',
  'best practice',
  'best practices',
  'clean code',
  'polish',
];

const LEAN_EXPANSION_PHRASES = [
  'build a robust framework',
  'robust framework',
  'future-proof framework',
  'future proof framework',
  'generic framework',
  'configurable framework',
  'extensible architecture',
  'abstraction layer',
];

const CONCRETE_EVIDENCE_PATTERN = /`[^`]+`|https?:\/\/|\b(?:exit|returns?)\s+0\b|\b\d+(?:\.\d+)?\s*(?:%|ms|s|sec|secs|seconds?|m|min|mins|minutes?|h|hr|hrs|hours?|files?|lines?|items?|rows?|chars?|checks?)\b/i;

const VALID_WORKFLOW_MODES = new Set(['lite', 'standard', 'strict']);
const VALID_DEFAULT_OUTPUTS = new Set(['concise', 'standard', 'evidence-heavy']);
const MIN_CONTEXT_FILES = 1;
const MAX_CONTEXT_FILES = 12;

// Sections every standard SKILL.md must contain.
// Each entry is an array of acceptable heading strings — the first
// match wins, so you can list canonical + legacy aliases.
const REQUIRED_SECTIONS = [
  ['## Overview'],
  ['## When to Use'],
  ['## Common Rationalizations'],
  ['## Red Flags'],
  ['## Verification'],
  ['## Next'],
];

// Skills that are intentionally exempt from section checks.
// Exemptions live HERE, not in skill frontmatter, so contributors
// cannot bypass the validator by editing their own skill file.
// Every entry must have a documented reason.
const SECTION_EXEMPT_SKILLS = {
  'using-one-for-all': 'Meta-skill — orchestrates other skills; When-to-Use and Verification are not applicable to a routing document.',
  'idea-refine':       'Legacy structure predating skill-anatomy.md — uses How-It-Works/Usage/Anti-patterns instead of standard headings. Tracked for conformance in https://github.com/danieldev24/one-for-all/issues',
};

const LEAN_REFERENCE_REQUIRED_SKILLS = new Set([
  'using-one-for-all',
  'planning-and-task-breakdown',
  'incremental-implementation',
  'test-driven-development',
  'code-review-and-quality',
  'code-simplification',
]);

// Regex patterns that indicate an explicit cross-skill reference.
// Only these patterns trigger the dead-reference warning — generic
// backtick strings in code blocks are intentionally excluded.
const SKILL_REF_PATTERNS = [
  /\buse the `([a-z][a-z0-9-]+[a-z0-9])` skill/g,
  /\bfollow the `([a-z][a-z0-9-]+[a-z0-9])` skill/g,
  /\binvoke the `([a-z][a-z0-9-]+[a-z0-9])` skill/g,
  /\bcontinue with `([a-z][a-z0-9-]+[a-z0-9])`/g,
  /\buse `([a-z][a-z0-9-]+[a-z0-9])` skill/g,
  /`([a-z][a-z0-9-]+[a-z0-9])` skill\b/g,
  /`([a-z][a-z0-9-]+[a-z0-9])` persona\b/g,
  /\bsee `([a-z][a-z0-9-]+[a-z0-9])`/g,
  /──→ ([a-z][a-z0-9-]+[a-z0-9])\b/g,          // ASCII diagram arrows
  /→ `([a-z][a-z0-9-]+[a-z0-9])`/g,
];

// ─── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const opts = { strict: false, format: 'pretty' };
  for (const arg of argv.slice(2)) {
    if (arg === '--strict') opts.strict = true;
    else if (arg.startsWith('--format=')) opts.format = arg.slice('--format='.length);
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: validate-skills.js [--strict] [--format=pretty|ndjson]');
      process.exit(0);
    }
  }
  if (!['pretty', 'ndjson'].includes(opts.format)) {
    console.error(`Unknown format: ${opts.format}`);
    process.exit(2);
  }
  return opts;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Parse YAML-style frontmatter from the top of a markdown file.
 * Returns a key→value object, or null if no frontmatter block found.
 * Values are stripped of surrounding quotes.
 */
function parseFrontmatter(content) {
  const match = content.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n/);
  if (!match) return null;

  const result = {};
  let key = null;
  let buf = [];
  for (const line of match[1].split(/\r?\n/)) {
    if (/^[a-zA-Z_][\w-]*:/.test(line)) {
      if (key) result[key] = buf.join(' ').trim().replace(/^['"]|['"]$/g, '');
      const colonIdx = line.indexOf(':');
      key = line.slice(0, colonIdx).trim();
      buf = [line.slice(colonIdx + 1).trim()];
    } else if (key && line.match(/^\s+\S/)) {
      // YAML continuation line (indented) — append to current value
      buf.push(line.trim());
    }
  }
  if (key) result[key] = buf.join(' ').trim().replace(/^['"]|['"]$/g, '');
  return result;
}

/**
 * Collect all explicit skill cross-references from content.
 */
function extractSkillReferences(content) {
  const refs = new Set();
  for (const pattern of SKILL_REF_PATTERNS) {
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(content)) !== null) {
      refs.add(m[1]);
    }
  }
  return refs;
}

/**
 * Extract the body of a section (lines between `## Heading` and the next H2).
 * Returns null if the section heading is not found.
 */
function getSectionBody(content, heading) {
  const headingIdx = content.indexOf(heading);
  if (headingIdx === -1) return null;
  const after = content.slice(headingIdx + heading.length);
  const nextH2 = after.search(/\n##\s+/);
  return nextH2 === -1 ? after : after.slice(0, nextH2);
}

/**
 * Count GFM table data rows in a chunk of markdown.
 * A data row is a non-empty pipe-row that is not a separator (|---|).
 * Header is excluded by counting only rows after the separator.
 */
function countTableRows(text) {
  if (!text) return 0;
  const lines = text.split(/\r?\n/);
  let inTable = false;
  let sawSeparator = false;
  let dataRows = 0;
  for (const raw of lines) {
    const line = raw.trim();
    const isPipeRow = /^\|.*\|\s*$/.test(line);
    const isSeparator = isPipeRow && /^\|[\s|:-]+\|\s*$/.test(line);

    if (isPipeRow) {
      inTable = true;
      if (isSeparator) sawSeparator = true;
      else if (sawSeparator) dataRows++;
    } else if (inTable && line === '') {
      // blank line ends current table; subsequent table starts fresh
      inTable = false;
      sawSeparator = false;
    } else if (inTable && !isPipeRow) {
      inTable = false;
      sawSeparator = false;
    }
  }
  return dataRows;
}

/**
 * Find token-costly vague phrases in actionable lines. This checks checklist
 * and numbered workflow lines, where vague advice is most likely to become
 * agent behavior. Explanatory prose and examples are left alone unless they
 * become an action item.
 */
function findVagueActionLines(content) {
  const findings = [];
  let inCodeFence = false;
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const isActionLine = /^\s*(?:-\s+\[[ xX]?\]|\d+\.)\s+/.test(line);
    if (!isActionLine) continue;
    if (CONCRETE_EVIDENCE_PATTERN.test(line)) continue;

    const lower = line.toLowerCase();
    for (const phrase of VAGUE_PHRASES) {
      if (lower.includes(phrase)) {
        findings.push({ line: i + 1, phrase });
        break;
      }
    }
  }

  return findings;
}

/**
 * Find speculative expansion phrases in actionable lines. These are warning
 * signals for Lean Senior SDLC because they often create framework-sized work
 * before a current slice proves that surface area is needed.
 */
function findLeanExpansionLines(content) {
  const findings = [];
  let inCodeFence = false;
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (/^```/.test(trimmed)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;

    const isActionLine = /^\s*(?:-\s+\[[ xX]?\]|\d+\.)\s+/.test(line);
    if (!isActionLine) continue;
    if (CONCRETE_EVIDENCE_PATTERN.test(line)) continue;

    const lower = line.toLowerCase();
    for (const phrase of LEAN_EXPANSION_PHRASES) {
      if (lower.includes(phrase)) {
        findings.push({ line: i + 1, phrase });
        break;
      }
    }
  }

  return findings;
}

// ─── Checks ──────────────────────────────────────────────────────────────────
//
// Each check returns an array of result objects:
//   { severity: 'error'|'warn', skill, check, message }
// New v1.1 checks emit severity: 'warn' by default; the runner promotes them
// to 'error' when --strict is passed.

function checkSkill(dirName, knownSkills) {
  const results = [];
  const skillPath = path.join(SKILLS_DIR, dirName, 'SKILL.md');

  if (!fs.existsSync(skillPath)) {
    results.push({ severity: 'error', skill: dirName, check: 'file-exists', message: 'Missing SKILL.md' });
    return results;
  }

  const content = fs.readFileSync(skillPath, 'utf8');
  const lineCount = content.split(/\r?\n/).length;

  // ── Frontmatter
  const fm = parseFrontmatter(content);
  if (!fm) {
    results.push({ severity: 'error', skill: dirName, check: 'frontmatter', message: 'Missing or malformed YAML frontmatter (expected --- block at top of file)' });
    return results;
  }

  if (!fm.name) {
    results.push({ severity: 'error', skill: dirName, check: 'frontmatter-name', message: "Frontmatter missing required field: 'name'" });
  } else if (fm.name !== dirName) {
    results.push({ severity: 'error', skill: dirName, check: 'frontmatter-name-match', message: `Frontmatter name '${fm.name}' does not match directory name '${dirName}'` });
  }

  if (!fm.description) {
    results.push({ severity: 'error', skill: dirName, check: 'frontmatter-description', message: "Frontmatter missing required field: 'description'" });
  } else {
    if (fm.description.length > MAX_DESCRIPTION_LENGTH) {
      results.push({ severity: 'error', skill: dirName, check: 'description-max-length', message: `Description is ${fm.description.length} chars — exceeds the ${MAX_DESCRIPTION_LENGTH}-char limit` });
    }
    // v1.1 Check A: minimum length AND contains a trigger keyword
    if (fm.description.length < MIN_DESCRIPTION_LENGTH) {
      results.push({ severity: 'warn', skill: dirName, check: 'description-min-length', message: `Description is ${fm.description.length} chars — below the ${MIN_DESCRIPTION_LENGTH}-char minimum (sharper triggers)` });
    }
    if (!/\b(when|trigger)/i.test(fm.description)) {
      results.push({ severity: 'warn', skill: dirName, check: 'description-trigger-word', message: `Description does not contain "when" or "trigger" — agents need explicit activation cues` });
    }
  }

  // ── Exemption guard
  if (fm.type === 'meta' || fm.exempt === 'sections') {
    if (!SECTION_EXEMPT_SKILLS[dirName]) {
      results.push({ severity: 'error', skill: dirName, check: 'exemption-bypass', message: `Frontmatter declares 'type: meta' or 'exempt: sections' but '${dirName}' is not in SECTION_EXEMPT_SKILLS allowlist` });
    }
  }

  // ── Required sections
  const exempt = dirName in SECTION_EXEMPT_SKILLS;
  if (!exempt) {
    for (const aliases of REQUIRED_SECTIONS) {
      const found = aliases.some(heading => content.includes(heading));
      if (!found) {
        // ## Next is a v1.1 addition — emit as warn so existing skills don't immediately fail
        const isNext = aliases[0] === '## Next';
        results.push({
          severity: isNext ? 'warn' : 'error',
          skill: dirName,
          check: isNext ? 'section-next' : 'section-required',
          message: `Missing required section: ${aliases[0]}`,
        });
      }
    }
  }

  // ── Token metadata
  if (!exempt) {
    const requiredMetadata = ['workflow_mode', 'max_context_files', 'default_output'];
    for (const field of requiredMetadata) {
      if (!fm[field]) {
        results.push({
          severity: 'warn',
          skill: dirName,
          check: 'token-metadata-missing',
          message: `Missing token metadata field: ${field}`,
        });
      }
    }

    if (fm.workflow_mode && !VALID_WORKFLOW_MODES.has(fm.workflow_mode)) {
      results.push({
        severity: 'warn',
        skill: dirName,
        check: 'token-metadata-invalid',
        message: `workflow_mode must be one of: ${[...VALID_WORKFLOW_MODES].join(', ')}`,
      });
    }

    if (fm.max_context_files) {
      const maxContextFiles = Number(fm.max_context_files);
      if (!Number.isInteger(maxContextFiles) || maxContextFiles < MIN_CONTEXT_FILES || maxContextFiles > MAX_CONTEXT_FILES) {
        results.push({
          severity: 'warn',
          skill: dirName,
          check: 'token-metadata-invalid',
          message: `max_context_files must be an integer from ${MIN_CONTEXT_FILES} to ${MAX_CONTEXT_FILES}`,
        });
      }
    }

    if (fm.default_output && !VALID_DEFAULT_OUTPUTS.has(fm.default_output)) {
      results.push({
        severity: 'warn',
        skill: dirName,
        check: 'token-metadata-invalid',
        message: `default_output must be one of: ${[...VALID_DEFAULT_OUTPUTS].join(', ')}`,
      });
    }
  }

  // ── v1.1 Check C: Verification has >=3 checklist items
  if (!exempt) {
    const verificationBody = getSectionBody(content, '## Verification');
    if (verificationBody !== null) {
      const items = (verificationBody.match(/^- \[ ?\]/gm) || []).length;
      if (items < MIN_VERIFICATION_ITEMS) {
        results.push({ severity: 'warn', skill: dirName, check: 'verification-items', message: `Verification has ${items} checklist item(s) — minimum is ${MIN_VERIFICATION_ITEMS}` });
      }
    }
  }

  // ── v1.1 Check D: Common Rationalizations has >=3 data rows
  if (!exempt) {
    const ratBody = getSectionBody(content, '## Common Rationalizations');
    if (ratBody !== null) {
      const rows = countTableRows(ratBody);
      if (rows < MIN_RATIONALIZATION_ROWS) {
        results.push({ severity: 'warn', skill: dirName, check: 'rationalization-rows', message: `Common Rationalizations has ${rows} data row(s) — minimum is ${MIN_RATIONALIZATION_ROWS}` });
      }
    }
  }

  // ── v1.1 Check E: Next section has a table with >=2 rows
  if (!exempt) {
    const nextBody = getSectionBody(content, '## Next');
    if (nextBody !== null) {
      const rows = countTableRows(nextBody);
      if (rows < MIN_NEXT_ROWS) {
        results.push({ severity: 'warn', skill: dirName, check: 'next-rows', message: `Next section has ${rows} table row(s) — minimum is ${MIN_NEXT_ROWS}` });
      }
    }
  }

  // ── v1.1 Check F: file size cap
  if (lineCount > MAX_SKILL_LINES) {
    results.push({ severity: 'warn', skill: dirName, check: 'line-count', message: `SKILL.md is ${lineCount} lines — over the ${MAX_SKILL_LINES}-line cap; extract content to references/` });
  }

  // ── Lean Senior SDLC reference hook for pilot skills
  if (LEAN_REFERENCE_REQUIRED_SKILLS.has(dirName) && !content.includes('references/lean-senior-sdlc.md')) {
    results.push({
      severity: 'warn',
      skill: dirName,
      check: 'lean-reference-missing',
      message: 'Lean-enabled pilot skill must link to references/lean-senior-sdlc.md instead of duplicating the gate.',
    });
  }

  // ── Check G: vague semantic phrases in actionable lines
  for (const finding of findVagueActionLines(content)) {
    results.push({
      severity: 'warn',
      skill: dirName,
      check: 'semantic-vague-phrase',
      message: `Vague phrase "${finding.phrase}" on line ${finding.line} lacks concrete evidence; name the command, threshold, file check, or observable result.`,
    });
  }

  // ── Check I: speculative expansion phrases in actionable lines
  for (const finding of findLeanExpansionLines(content)) {
    results.push({
      severity: 'warn',
      skill: dirName,
      check: 'semantic-lean-expansion',
      message: `Lean expansion phrase "${finding.phrase}" on line ${finding.line} lacks evidence; name the current slice, trigger, threshold, or defer it.`,
    });
  }

  // ── Cross-skill references (always warn, never error)
  const refs = extractSkillReferences(content);
  for (const ref of refs) {
    if (!knownSkills.has(ref)) {
      results.push({ severity: 'warn', skill: dirName, check: 'dead-reference', message: `Dead cross-reference: \`${ref}\` is not a known skill` });
    }
  }

  return results;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const opts = parseArgs(process.argv);

  if (!fs.existsSync(SKILLS_DIR)) {
    console.error(`ERROR: skills directory not found at ${SKILLS_DIR}`);
    process.exit(1);
  }

  const skillDirs = fs.readdirSync(SKILLS_DIR)
    .filter(d => fs.statSync(path.join(SKILLS_DIR, d)).isDirectory())
    .sort();

  const knownSkills = new Set(skillDirs);

  // Checks that are warnings by default but become errors under --strict.
  // Existing checks (file-exists, frontmatter*, section-required, exemption-bypass,
  // description-max-length) are always errors. dead-reference is always a warning.
  const STRICT_ERROR_CHECKS = new Set([
    'description-min-length',
    'description-trigger-word',
    'verification-items',
    'rationalization-rows',
    'next-rows',
    'section-next',
    'line-count',
    'token-metadata-missing',
    'token-metadata-invalid',
  ]);

  const allResults = [];
  for (const dirName of skillDirs) {
    const skillResults = checkSkill(dirName, knownSkills);
    for (const r of skillResults) {
      if (opts.strict && r.severity === 'warn' && STRICT_ERROR_CHECKS.has(r.check)) {
        r.severity = 'error';
      }
      allResults.push(r);
    }
  }

  // ── Output
  if (opts.format === 'ndjson') {
    for (const r of allResults) {
      process.stdout.write(JSON.stringify(r) + '\n');
    }
  } else {
    const bySkill = new Map();
    for (const r of allResults) {
      if (!bySkill.has(r.skill)) bySkill.set(r.skill, []);
      bySkill.get(r.skill).push(r);
    }
    for (const dirName of skillDirs) {
      const rs = bySkill.get(dirName) || [];
      const errs  = rs.filter(r => r.severity === 'error');
      const warns = rs.filter(r => r.severity === 'warn');
      if (errs.length === 0 && warns.length === 0) {
        const tag = dirName in SECTION_EXEMPT_SKILLS ? ' (section checks exempt)' : '';
        console.log(`  ✓  ${dirName}${tag}`);
      } else {
        const icon = errs.length > 0 ? '  ✗ ' : '  ⚠ ';
        console.log(`${icon} ${dirName}`);
        for (const r of errs)  console.log(`       ERROR: ${r.message}`);
        for (const r of warns) console.log(`       WARN:  ${r.message}`);
      }
    }
    const totalErrors   = allResults.filter(r => r.severity === 'error').length;
    const totalWarnings = allResults.filter(r => r.severity === 'warn').length;
    const status = totalErrors > 0 ? 'FAILED' : totalWarnings > 0 ? 'PASSED WITH WARNINGS' : 'PASSED';
    const mode = opts.strict ? ' [strict]' : '';
    console.log(`\n${skillDirs.length} skills checked${mode} — ${totalErrors} error(s), ${totalWarnings} warning(s) — ${status}`);
  }

  const totalErrors = allResults.filter(r => r.severity === 'error').length;
  if (totalErrors > 0) process.exit(1);
}

main();
