# How to build a kanban board from the same rows as a grid

A grid of twelve tasks sits above a kanban board built from those same rows, not a copy of them.
Drag a card to another column and the grid's Status cell changes with it, because the board reads
and writes through the grid's own edit path. Type in the filter box and both the grid and the
board narrow to the match.

Live demo: https://toclocoinc.github.io/lattice-grid-howto-kanban-board-from-grid-rows/

**Read the how-to:** https://www.latticegrid.dev/docs/how-to/kanban-board-from-grid-rows/

## index.html

```html
<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>How to build a kanban board from the same rows as a grid</title>
    <meta
      name="description"
      content="A grid of twelve tasks sits above a kanban board built from those same rows. Drag a card to another column and the grid's Status cell changes with it; filter either one and both narrow together. Built with Lattice Grid loaded by script tag, no install and no build."
    />
    <link rel="icon" href="data:," />
    <!--
      The grid's stylesheet, from jsDelivr. The address names the exact
      release, 1.68.2, and carries the hash of the file it expects, so the
      page can never quietly pick up a different build than the one it was
      checked against.
    -->
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/@toclocoinc/lattice-grid@1.68.2/lattice-grid.min.css"
      integrity="sha384-mcpd7S8C5nz58bZDAXdYH6rzezEhfN7B4u2SlW426dSe20GnkxTu4TygyOILnCth"
      crossorigin="anonymous"
    />
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; background: #f4f6f9; color: #131a24; }
      header { padding: 1.5rem 1.5rem 0.5rem; max-width: 960px; margin: 0 auto; }
      header p { color: #4a5568; }
      header a { color: #2d6bff; }
      main { max-width: 960px; margin: 0 auto; padding: 0 1.5rem 2.5rem; }
      #toolbar { margin: 0 0 0.75rem; }
      #quick { font: inherit; padding: 0.4rem 0.75rem; border: 1px solid #ccd3dc; border-radius: 4px; width: 240px; }
      #grid { height: 280px; margin-bottom: 1rem; }
      #board { height: 420px; }
      .caveats { font-size: 0.9rem; color: #4a5568; }
    </style>
  </head>
  <body>
    <header>
      <h1>How to build a kanban board from the same rows as a grid</h1>
      <p>
        Twelve tasks sit in the grid below; the board underneath reads and writes through that
        same grid rather than a copy. Drag a card to another column and the grid's Status cell
        changes with it. Type in the box and both the grid and the board narrow to the match. Read
        the
        <a href="https://www.latticegrid.dev/docs/how-to/kanban-board-from-grid-rows/">full how-to</a>
        on latticegrid.dev.
      </p>
    </header>
    <main>
      <div id="toolbar">
        <input id="quick" type="search" placeholder="Filter tasks…" aria-label="Filter tasks" />
      </div>
      <div id="grid"></div>
      <div id="board"></div>
      <p class="caveats">
        Two things to know: the columns appear in the order they are declared, not the order
        statuses happen to occur in the data; and a card can carry a rule of its own, here a veto
        that refuses to move an unowned task into Done.
      </p>
    </main>

    <!--
      The library and the kanban module, as classic script tags. No npm
      install, no bundler, no type="module": each file runs as it arrives.
      The kanban module defines its own LatticeGridKanban global rather than
      extending LatticeGrid, so it can load in either order, but after the
      core makes more sense to read.
    -->
    <script
      src="https://cdn.jsdelivr.net/npm/@toclocoinc/lattice-grid@1.68.2/lattice-grid.min.js"
      integrity="sha384-vCzLyFYn0T0lz/vkdH4x0JpJZkOazZgI2LiGui7lm5uerdZd0Z46G9hr3Aq1FFPS"
      crossorigin="anonymous"
    ></script>
    <script
      src="https://cdn.jsdelivr.net/npm/@toclocoinc/lattice-grid@1.68.2/modules/kanban.min.js"
      integrity="sha384-tDh16gPrK1ZZ0EIdgyb320WNVyZpssh+D/MlMEscUngs1J6jZ8M/BOPN0CrFu+nu"
      crossorigin="anonymous"
    ></script>
    <script src="./demo.js"></script>
  </body>
</html>
```

## demo.js

```js
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
```

`createKanban(el, { grid, columnProperty, columns, card })` groups the bound grid's rows into
cards under the property named by `columnProperty`; `columns` lists which columns show, in the
order given, even when one is empty. Drag a card, or grab it with Space and drop it with the
arrows, and the move writes back through `grid.edit.setCells`, the same commit path a fill or a
paste uses, so the grid's Status cell changes with it. `onBeforeMove(card, from, to)` runs before
every move and can return `false` to refuse it.

## Running it yourself

Open `index.html` in a browser, or serve the folder with any static file server. The grid and the
board both load from jsDelivr by script tag, so there is no install and no build step. It runs
keyless on `localhost`; the licence key in `demo.js` is bound to `toclocoinc.github.io` and has no
effect anywhere else.

## Licence

MIT, see [LICENSE](./LICENSE). Lattice Grid itself is licensed separately per domain:
https://www.latticegrid.dev/pricing/
