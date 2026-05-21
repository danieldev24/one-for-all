#!/usr/bin/env node
/**
 * scan-duplication.js
 *
 * Cross-skill duplicate-content detector.
 *
 * Reads every skills/<name>/SKILL.md, normalizes lines, and flags any block of
 * >= MIN_BLOCK_LINES consecutive eligible lines that appears verbatim in two
 * or more files.
 *
 * Excluded from comparison (treated as "trivial" lines that break a block):
 *   - empty / whitespace-only lines
 *   - markdown table separators (|---|---|)
 *   - section headers (^## or ^### )
 *   - YAML frontmatter delimiters (---) and frontmatter key lines
 *
 * Usage:
 *   node scripts/scan-duplication.js          # pretty output
 *   node scripts/scan-duplication.js --json   # machine-readable
 *   SKILLS_DIR=... node scripts/scan-duplication.js
 *
 * Exit codes: 0 = no duplicates of length > MAX_ALLOWED_BLOCK,
 *             1 = duplicates exceeding the threshold.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const SKILLS_DIR = process.env.SKILLS_DIR
  ? path.resolve(process.env.SKILLS_DIR)
  : path.resolve(__dirname, '..', 'skills');

const MIN_BLOCK_LINES   = 5;   // minimum eligible lines for a duplicate block to be reported
const MAX_ALLOWED_BLOCK = 4;   // exit-1 threshold; v1.1 spec exit gate is "zero blocks > 4 lines"

// ─── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const opts = { json: false };
  for (const arg of argv.slice(2)) {
    if (arg === '--json') opts.json = true;
    else if (arg === '--help' || arg === '-h') {
      console.log('Usage: scan-duplication.js [--json]');
      process.exit(0);
    }
  }
  return opts;
}

// ─── Line classification ─────────────────────────────────────────────────────

const FRONTMATTER_KEY = /^[a-zA-Z_][\w-]*:\s/;
const TABLE_SEPARATOR = /^\|[\s|:-]+\|\s*$/;
const SECTION_HEADER  = /^#{1,6}\s+/;

function isTrivial(line) {
  const t = line.trim();
  if (t === '') return true;
  if (t === '---') return true;            // hr or frontmatter delimiter
  if (TABLE_SEPARATOR.test(t)) return true;
  if (SECTION_HEADER.test(t)) return true;
  if (FRONTMATTER_KEY.test(t)) return true;
  return false;
}

/**
 * Strip frontmatter block from content. Returns content starting after the
 * second `---` (if a frontmatter block exists), with line numbers preserved by
 * substituting blanks for the stripped region.
 */
function stripFrontmatter(content) {
  const m = content.match(/^---[ \t]*\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n/);
  if (!m) return content;
  const blanks = '\n'.repeat(m[0].split('\n').length - 1);
  return blanks + content.slice(m[0].length);
}

// ─── Duplicate detection ─────────────────────────────────────────────────────

/**
 * Build a map: normalized-line-string → [{file, lineNo}, ...]
 * Only eligible (non-trivial) lines are indexed.
 */
function indexLines(skills) {
  const index = new Map();
  for (const { name, lines } of skills) {
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i];
      if (isTrivial(raw)) continue;
      const key = raw.trimEnd();
      if (!index.has(key)) index.set(key, []);
      index.get(key).push({ file: name, lineNo: i + 1 });
    }
  }
  return index;
}

/**
 * Greedy block-extension. For each line that appears in >= 2 files, try to
 * extend the block forward as long as the next non-trivial line also matches
 * across the same set of files.
 *
 * Returns an array of duplicate blocks:
 *   { length, locations: [{file, startLine, endLine}], snippet }
 *
 * De-dups subblocks: if a 7-line block A→G is reported, do not also report
 * the 5-line subblocks A→E, B→F, C→G.
 */
function findBlocks(skills, index) {
  const blocks = [];
  const seen = new Set();   // `${file}:${startLine}` to avoid re-reporting

  // Map skill name → lines for fast lookup
  const linesByName = new Map(skills.map(s => [s.name, s.lines]));

  for (const [, locations] of index) {
    if (locations.length < 2) continue;

    // Anchor on the first location only; extending finds the others.
    const anchor = locations[0];
    const anchorKey = `${anchor.file}:${anchor.lineNo}`;
    if (seen.has(anchorKey)) continue;

    // Try to find every other location and extend the block from each pair.
    for (let i = 1; i < locations.length; i++) {
      const other = locations[i];
      if (other.file === anchor.file) continue;   // intra-file dup not interesting

      const aLines = linesByName.get(anchor.file);
      const bLines = linesByName.get(other.file);

      // Walk forward to find block length (counting eligible lines only,
      // but still requiring exact textual match including trivial lines that
      // appear interleaved — i.e., the *file content* at those positions
      // must match as long as the eligible lines also match).
      let aIdx = anchor.lineNo - 1;
      let bIdx = other.lineNo - 1;
      let aStart = aIdx, bStart = bIdx;
      let eligibleCount = 0;
      let totalLines = 0;

      while (aIdx < aLines.length && bIdx < bLines.length) {
        if (aLines[aIdx].trimEnd() !== bLines[bIdx].trimEnd()) break;
        if (!isTrivial(aLines[aIdx])) eligibleCount++;
        totalLines++;
        aIdx++;
        bIdx++;
      }

      if (eligibleCount >= MIN_BLOCK_LINES) {
        const snippet = aLines.slice(aStart, Math.min(aStart + 3, aIdx)).join('\n');
        blocks.push({
          length: eligibleCount,
          totalLines,
          locations: [
            { file: anchor.file, startLine: aStart + 1, endLine: aIdx },
            { file: other.file,  startLine: bStart + 1, endLine: bIdx },
          ],
          snippet,
        });
        // mark both endpoints to avoid re-reporting subblocks
        for (let k = aStart; k < aIdx; k++) seen.add(`${anchor.file}:${k + 1}`);
        for (let k = bStart; k < bIdx; k++) seen.add(`${other.file}:${k + 1}`);
      }
    }
  }

  // Sort by length desc, then by location count desc
  blocks.sort((a, b) => b.length - a.length || b.locations.length - a.locations.length);

  return blocks;
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

  const skills = [];
  for (const name of skillNames) {
    const p = path.join(SKILLS_DIR, name, 'SKILL.md');
    if (!fs.existsSync(p)) continue;
    const stripped = stripFrontmatter(fs.readFileSync(p, 'utf8'));
    skills.push({ name, lines: stripped.split(/\r?\n/) });
  }

  const index = indexLines(skills);
  const blocks = findBlocks(skills, index);

  if (opts.json) {
    process.stdout.write(JSON.stringify({ blocks, threshold: MAX_ALLOWED_BLOCK }, null, 2) + '\n');
  } else {
    if (blocks.length === 0) {
      console.log('No duplicate blocks of >= ' + MIN_BLOCK_LINES + ' eligible lines found.');
    } else {
      console.log(`Found ${blocks.length} duplicate block(s) (>= ${MIN_BLOCK_LINES} eligible lines):\n`);
      for (const b of blocks) {
        const locs = b.locations.map(l => `skills/${l.file}/SKILL.md:${l.startLine}-${l.endLine}`).join(' ↔ ');
        console.log(`[${b.length} eligible lines, ${b.locations.length} locations] ${locs}`);
        const lines = b.snippet.split('\n');
        for (const line of lines.slice(0, 3)) console.log(`    ${line}`);
        if (lines.length === 3) console.log('    ...');
        console.log('');
      }
    }
    const overThreshold = blocks.filter(b => b.length > MAX_ALLOWED_BLOCK).length;
    console.log(`${overThreshold} block(s) exceed the ${MAX_ALLOWED_BLOCK}-line threshold.`);
  }

  const overThreshold = blocks.filter(b => b.length > MAX_ALLOWED_BLOCK).length;
  if (overThreshold > 0) process.exit(1);
}

main();
