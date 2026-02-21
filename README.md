# Native To-Do Board

A small, native JavaScript Kanban / To-Do board. It was created as an exercise project and uses only web technologies (HTML, CSS, JavaScript) plus a minimal dependency: jQuery (included locally). The project stores tasks in `localStorage` and optionally loads demo data from `assets/data/todos.json`.

## Features

- Kanban board with four columns: `To-Do`, `In Progress`, `Done`, `Archived`.
- Create, edit and delete tasks (popup form).
- Drag & drop between columns to change task status.
- Priority tags and optional deadlines.
- Persistence via `localStorage`.
- Easily customizable custom select components and popups.

## Project structure (key files)

- `index.html` – main page of the app.
- `index.css` – main styling (including `assets/css/*`).
- `index.js` – app initialization, rendering and board logic.
- `assets/js/lib/todo.js` – to-do module (create, edit, save, load).
- `assets/js/lib/popup.js` – simple popup module.
- `assets/js/lib/select.js` – custom select components.
- `assets/snippets/todo.html` – form snippet for creating/editing to-dos.
- `assets/data/todos.json` – example/demo data that is imported into `localStorage` on the first run.

(Files/folders correspond to the project root)

## Requirements

- A modern browser (Chrome, Firefox, Edge).
- A static web server is recommended (see note below). No additional build tools required.

## Explanation of important functions

- `window.todo` (see `assets/js/lib/todo.js`)
  - `create(title, content, status, priority, deadline)` – creates a new task.
  - `edit(key, updates)` – edits a task by key.
  - `get(key)` – retrieves a task.
  - `getAll()` – retrieves all tasks.
  - `loadTemplateData(callback)` – loads demo data and initializes `localStorage` if empty.

- `window.popup` – popup factory for form windows (see `assets/js/lib/popup.js`).
- `window.ui.Select` – custom select UI (see `assets/js/lib/select.js`).

## Known limitations / ToDos

- No authentication or multi-user support.
- Persistence only via `localStorage`.
- No automated tests included.
- CORS / file loading issues can be avoided by using a local server.

### Development constraints (important)

During the development of this project there were intentionally strong constraints that influenced design and implementation:

- No `fetch`: It was not allowed to use the modern Fetch API. Network accesses are implemented using `jQuery.ajax` instead.
- Basic JavaScript: The project was deliberately implemented without build steps, modules or modern tooling stacks. It uses direct DOM access, simple functions and minimal language features to keep it easy to understand.
- Minimal dependencies: No bundlers/transpilers are used and only a local copy of jQuery is included.

These constraints explain some decisions (e.g. using `jQuery.ajax` instead of `fetch`, classic module pattern via global objects) and are important to know if the project is to be extended or modernized.
