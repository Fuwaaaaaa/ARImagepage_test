#!/usr/bin/env node
/**
 * Parse the most-recent `next build` Route (app) table and fail when any
 * tracked route's First Load JS exceeds its budget.
 *
 * Designed to be run AFTER `next build` (the build output is consumed from
 * stdin, or by re-running build if stdin is empty). The CI workflow pipes
 * build output through this script so the build runs once.
 *
 * Budgets are kept inline rather than in a JSON file because they evolve
 * with the codebase; the noisy diff in this file is the point — bumping a
 * budget should be a deliberate, reviewable commit.
 */

import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const ROUTE_BUDGETS = {
  '/': 200, // landing — client component now, but stays well below the budget
  '/ar': 180, // AR shell — A-Frame / MindAR loaded via CDN at runtime, not bundled
};

function readBuildOutput() {
  // 1) Prefer stdin (CI: `next build | node scripts/check-bundle-size.mjs`)
  if (!process.stdin.isTTY) {
    const data = readFileSync(0, 'utf8');
    if (data.trim().length > 0) return data;
  }
  // 2) Fallback: invoke `next build` directly so the script is useful locally
  //    without any pipe wiring. The `--no-lint` skips ESLint to keep this
  //    focused on bundle metrics — lint is its own CI job.
  return execSync('pnpm exec next build', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
}

/**
 * Parse a row from the build's Route (app) table. The table is rendered
 * with box-drawing characters and indentation that varies between Next.js
 * versions, so we read the *last two* `<num> kB` cells from any line that
 * mentions a tracked route — the rightmost being First Load JS.
 *
 * Returns null for non-matching lines so the caller can filter.
 */
function parseRouteLine(line, route) {
  // Match the route as a standalone token. We anchor on whitespace so `/ar`
  // does not accidentally match `/ar-invalid` (which is the test-only route
  // we deliberately keep out of the budget table).
  const tokenPattern = new RegExp(`(^|\\s)${escapeRegex(route)}(\\s|$)`);
  if (!tokenPattern.test(line)) return null;

  const sizeMatches = [...line.matchAll(/([\d.]+)\s*kB/g)];
  if (sizeMatches.length < 2) return null;
  const firstLoadKb = Number.parseFloat(sizeMatches[sizeMatches.length - 1][1]);
  if (!Number.isFinite(firstLoadKb)) return null;
  return firstLoadKb;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
  const output = readBuildOutput();
  process.stdout.write(output);

  const lines = output.split(/\r?\n/);
  const findings = [];
  const failures = [];

  for (const [route, budgetKb] of Object.entries(ROUTE_BUDGETS)) {
    let measured = null;
    for (const line of lines) {
      const value = parseRouteLine(line, route);
      if (value !== null) {
        measured = value;
        break;
      }
    }
    if (measured === null) {
      failures.push(
        `route ${route} not found in build output — did Next.js change its Route table format?`,
      );
      continue;
    }
    findings.push({ route, measured, budgetKb });
    if (measured > budgetKb) {
      failures.push(
        `route ${route}: First Load JS ${measured} kB exceeds budget of ${budgetKb} kB`,
      );
    }
  }

  const reportLines = ['', 'Bundle size budget report:'];
  for (const f of findings) {
    const pad = (s) => String(s).padStart(7);
    const status = f.measured > f.budgetKb ? 'FAIL' : 'pass';
    reportLines.push(
      `  ${status}  ${f.route.padEnd(12)} ${pad(f.measured)} kB  (budget ${pad(f.budgetKb)} kB)`,
    );
  }
  reportLines.push('');
  process.stdout.write(reportLines.join('\n'));

  if (failures.length > 0) {
    for (const msg of failures) console.error(`bundle-size: ${msg}`);
    process.exit(1);
  }
}

main();
