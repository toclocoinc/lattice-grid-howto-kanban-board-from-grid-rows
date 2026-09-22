/**
 * Load the demo in a real headless browser and check that it works.
 *
 * Serves the project locally and drives it with the same minimal Chrome
 * driver the grid's own test suite uses (tools/browser.js), so this needs no
 * dependency beyond Chrome itself.
 *
 * Checks:
 *   - the grid and the kanban module both arrived (LatticeGrid.createGrid,
 *     LatticeGridKanban.createKanban);
 *   - all 12 tasks land in the grid (grid.rows.matchCount(), not a DOM count);
 *   - the board shows one lane per status with the right card count in each
 *     (4 todo, 4 doing, 4 done), read from the board's own column model;
 *   - calling the board's move() API on an owned card writes the new status
 *     straight back into the grid's row (grid.rows.byKey(key).data.status),
 *     read through the grid API rather than the DOM;
 *   - the same move on an unowned card is refused by onBeforeMove: the row's
 *     status is unchanged and the card count in Done does not grow;
 *   - typing in the filter box narrows both the grid (rows.matchCount()) and
 *     the board (summed column counts) to the same number of matches;
 *   - nothing logged a console error or threw while the page ran.
 *
 * Exits non-zero on any failure, so it can gate a deployment.
 *
 * Usage: node tools/verify.mjs
 */

import { startServer } from './serve.mjs';
import { Browser, available } from './browser.js';

if (!available()) {
  console.log('No headless browser on this machine; skipping verify.mjs.');
  process.exit(0);
}

// The same 12 tasks demo.js loads, so every expected figure is computed here
// rather than hard-coded, and stays honest if the data ever changes.
const TASKS = [
  { id: 'T-1', task: 'Password reset flow', owner: 'Ana', status: 'todo' },
  { id: 'T-2', task: 'Single sign-on providers', owner: 'Bo', status: 'todo' },
  { id: 'T-3', task: 'Session expiry banner', owner: 'Ana', status: 'todo' },
  { id: 'T-4', task: 'Currency rounding fix', owner: 'Bo', status: 'todo' },
  { id: 'T-5', task: 'Invoice PDF export', owner: 'Cy', status: 'doing' },
  { id: 'T-6', task: 'Proration engine', owner: 'Bo', status: 'doing' },
  { id: 'T-7', task: 'Tax rules by region', owner: 'Cy', status: 'doing' },
  { id: 'T-8', task: 'Retire the old importer', owner: '', status: 'doing' },
  { id: 'T-9', task: 'Login rate limit', owner: 'Ana', status: 'done' },
  { id: 'T-10', task: 'Two-factor prompt', owner: 'Bo', status: 'done' },
  { id: 'T-11', task: 'Dashboard empty states', owner: 'Cy', status: 'done' },
  { id: 'T-12', task: 'Audit log export', owner: 'Ana', status: 'done' },
];
const countOf = (status) => TASKS.filter((t) => t.status === status).length;

const { server, port } = await startServer();
const browser = new Browser();

try {
  await browser.start();

  await browser.send('Page.addScriptToEvaluateOnNewDocument', {
    source: `
      window.__errs = [];
      addEventListener('error', (e) => window.__errs.push(String(e.message || e)));
      addEventListener('unhandledrejection', (e) => window.__errs.push('unhandledrejection: ' + String(e.reason)));
      const origError = console.error.bind(console);
      console.error = (...args) => { window.__errs.push('console.error: ' + args.map(String).join(' ')); origError(...args); };
    `,
  });

  await browser.open(`http://127.0.0.1:${port}/`);
  await new Promise((r) => setTimeout(r, 500));

  const failures = [];

  const hasGrid = await browser.evaluate(`typeof LatticeGrid !== 'undefined' && typeof LatticeGrid.createGrid === 'function'`);
  if (!hasGrid) failures.push('LatticeGrid.createGrid was not found on the page');

  const hasKanban = await browser.evaluate(`typeof LatticeGridKanban !== 'undefined' && typeof LatticeGridKanban.createKanban === 'function'`);
  if (!hasKanban) failures.push('LatticeGridKanban.createKanban was not found on the page');

  const taskCount = await browser.evaluate(`window.__demoGrid.rows.matchCount()`);
  if (taskCount !== TASKS.length) failures.push(`expected ${TASKS.length} tasks (grid.rows.matchCount()), grid reports ${taskCount}`);

  // --- One lane per status, with the right card count in each ---
  for (const status of ['todo', 'doing', 'done']) {
    const expected = countOf(status);
    const got = await browser.evaluate(`window.__demoBoard.column('${status}').count`);
    if (got !== expected) failures.push(`column "${status}": expected ${expected} cards, board reports ${got}`);
  }

  // --- Moving an owned card via the board API writes the row's status ---
  await browser.evaluate(`window.__demoBoard.move(['T-1'], 'done')`);
  await new Promise((r) => setTimeout(r, 200));
  const movedStatus = await browser.evaluate(`window.__demoGrid.rows.byKey('T-1').data.status`);
  if (movedStatus !== 'done') failures.push(`T-1 after move(): expected grid status "done", got ${JSON.stringify(movedStatus)}`);
  const doneAfterMove = await browser.evaluate(`window.__demoBoard.column('done').count`);
  if (doneAfterMove !== countOf('done') + 1) failures.push(`Done column after moving T-1 in: expected ${countOf('done') + 1}, got ${doneAfterMove}`);

  // --- onBeforeMove vetoes a move into Done for an unowned card (T-8) ---
  await browser.evaluate(`window.__demoBoard.move(['T-8'], 'done')`);
  await new Promise((r) => setTimeout(r, 200));
  const vetoedStatus = await browser.evaluate(`window.__demoGrid.rows.byKey('T-8').data.status`);
  if (vetoedStatus !== 'doing') failures.push(`T-8 (no owner) after a vetoed move: expected grid status still "doing", got ${JSON.stringify(vetoedStatus)}`);
  const doneAfterVeto = await browser.evaluate(`window.__demoBoard.column('done').count`);
  if (doneAfterVeto !== doneAfterMove) failures.push(`Done column after the vetoed move: expected to stay at ${doneAfterMove}, got ${doneAfterVeto}`);

  // --- The quick filter narrows the grid and the board to the same count ---
  await browser.evaluate(`document.getElementById('quick').value = 'Invoice'`);
  await browser.evaluate(`document.getElementById('quick').dispatchEvent(new Event('input', { bubbles: true }))`);
  await new Promise((r) => setTimeout(r, 200));
  const filteredGrid = await browser.evaluate(`window.__demoGrid.rows.matchCount()`);
  if (filteredGrid !== 1) failures.push(`grid after filtering to "Invoice": expected 1 row, got ${filteredGrid}`);
  const filteredBoard = await browser.evaluate(`
    ['todo','doing','done'].reduce((n, id) => n + window.__demoBoard.column(id).count, 0)
  `);
  if (filteredBoard !== 1) failures.push(`board after filtering to "Invoice": expected 1 card across all columns, got ${filteredBoard}`);

  const errors = await browser.evaluate('window.__errs');
  if (errors.length) failures.push(`console/window errors: ${errors.join(' | ')}`);

  if (failures.length) {
    console.error('FAILED:\n' + failures.map((f) => `  - ${f}`).join('\n'));
    process.exitCode = 1;
  } else {
    console.log(
      'OK: 12 tasks loaded, one lane per status with the right card counts, board.move() on an ' +
      'owned card wrote the new status back into the grid row, the same move on an unowned card ' +
      'was refused by onBeforeMove and left the grid and the board unchanged, and the quick filter ' +
      'narrowed the grid and the board to the same single match. 0 console errors.'
    );
  }
} finally {
  await browser.close();
  server.close();
}
