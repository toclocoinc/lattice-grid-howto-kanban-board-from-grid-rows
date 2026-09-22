/**
 * A kanban board built from the very same rows a grid shows.
 *
 * createKanban(el, { grid, ... }) binds the board to a live grid instead of
 * handing it a rows array of its own: it reads the grid's rows, and when a
 * card is dragged (or moved with the keyboard) into another column, it
 * writes the change back through the grid's own edit path,
 * grid.edit.setCells. There is only ever one copy of the data.
 */

// Tied to toclocoinc.github.io only; has no effect anywhere else and needs
// no key at all to run this page from a local copy.
LatticeGrid.setLicence(
  'LG1.eyJ2IjoxLCJwIjoibGF0dGljZS1ncmlkIiwidCI6IlRPQ0xPQ08gSW5jIC0gcHVibGljIGRlbW9zIiwiZSI6IjIwMzAtMDEtMDEiLCJkIjpbInRvY2xvY29pbmMuZ2l0aHViLmlvIl19.9De42ua3aCGpiMB6EVRP7Tv-upUlDI-0T07rlSPzvCrsqg8t4YJi7SRnStEpAg48uzmcG7il1fR_TfwkUE7iCA'
);

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

const grid = LatticeGrid.createGrid(document.getElementById('grid'), {
  rowKey: 'id',
  edit: true,
  columns: [
    { field: 'task', title: 'Task', layout: { flex: 1, min: 220 } },
    { field: 'owner', title: 'Owner', layout: { width: 110 } },
    { field: 'status', title: 'Status', edit: true, layout: { width: 110 } },
  ],
  rows: TASKS,
});
window.__demoGrid = grid; // read by tools/verify.mjs

// The board has no rows of its own: it reads and writes through the grid above.
const board = LatticeGridKanban.createKanban(document.getElementById('board'), {
  grid,
  rowKey: 'id',
  columnProperty: 'status',
  columns: [
    { id: 'todo', title: 'To do' },
    { id: 'doing', title: 'In progress' },
    { id: 'done', title: 'Done' },
  ],
  card: { title: 'task', subtitle: 'owner' },
  ariaLabel: 'Tasks board',
  // A card needs an owner before it can land in Done.
  onBeforeMove: (card, from, to) => to !== 'done' || Boolean(grid.rows.byKey(card.key).data.owner),
});
window.__demoBoard = board; // read by tools/verify.mjs

document.getElementById('quick').addEventListener('input', (e) => {
  const text = e.target.value;
  grid.filters.quick(text);
  board.setQuickFilter(text);
});
