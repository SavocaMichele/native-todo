# Native To-Do Board

A small, native JavaScript Kanban / To-Do board. It was created as an exercise project and uses only web technologies (HTML, CSS, JavaScript) plus a minimal set of dependencies. The project now persists tasks in a local SQLite database via Sequelize and exposes a small REST API on the server.

## Features

- Kanban board with four columns: `To-Do`, `In Progress`, `Done`, `Archived`.
- Create, edit and delete tasks (popup form).
- Drag & drop between columns to change task status.
- Priority tags and optional deadlines.
- Persistence via SQLite database using Sequelize (server-side).
- Simple REST API for client ↔ server communication.

## Project structure (key files)

- `server.js` – Node/Express server, static file serving and REST API for todos.
- `index.html` – main page of the app (served from `public/`).
- `index.css` – main styling (including `assets/css/*`).
- `public/index.js` – app initialization, rendering and board logic (client-side).
- `assets/js/lib/todo.js` – to-do client module (now communicates with `/api/todos`).
- `assets/js/lib/popup.js` – simple popup module.
- `assets/js/lib/select.js` – custom select components.
- `assets/snippets/todo.html` – form snippet for creating/editing to-dos.
- `assets/js/models/` – Sequelize models and database initialization (SQLite).

## What's changed

This project was originally implemented to persist tasks in `localStorage`. It has been migrated to use a server-side SQLite database (via Sequelize) and a REST API. The client now uses `fetch` to call the API endpoints instead of relying on `localStorage`.

Key implications:
- The server is the source of truth. After any create/edit/delete operation the client refreshes the list from the server.
- Drag & drop updates the task status on the server and the board is reloaded from the database so the UI always reflects the DB state.
- The server seeds example todos on first run (see `assets/js/models/Todo.js`).

## REST API

The server exposes a small REST API for todos under the `/api/todos` route (JSON payloads):

- `GET /api/todos` — list all todos (returns array of todo objects with `key`, `title`, `content`, `status`, `priority`, `deadline`).
- `GET /api/todos/:id` — get single todo.
- `POST /api/todos` — create a todo (JSON body with `title`, `content`, `status`, `priority`, `deadline`).
- `PUT /api/todos/:id` — update a todo (partial/full JSON body).
- `DELETE /api/todos/:id` — delete a todo.

The client code (`assets/js/lib/todo.js`) expects each todo object to include a `key` property that maps to the database primary key.

## Requirements

- Node.js (recommended recent LTS release)
- No separate DB server required; SQLite is used and the database file is created in the project (handled by Sequelize).

## Run the project

1. Install dependencies (if not already installed):

```powershell
npm install
```

2. Start the server:

```powershell
node server.js
```

By default the server listens on `127.0.0.1:3000`. Open `http://127.0.0.1:3000/` in your browser.

Notes:
- On first run the server initializes the database and seeds sample todos (see console output).
- Static files (the client app) are served from `public/` and `assets/` is mounted at `/assets` so client asset paths should use root-relative URLs (e.g. `/assets/js/lib/...`, `/index.js`).

## Development notes & constraints

The original project contained a set of design constraints (kept here for historical context). Some parts of the project were intentionally implemented with older or minimal APIs for exercise purposes. The important differences now:

- Persistence: previously `localStorage`, now Sequelize + SQLite on the server.
- Client network calls: the client uses the Fetch API to call `/api/todos` endpoints.
- Minimal dependencies: the project remains small and self-contained (local jQuery is still present but core client logic uses modern JS and fetch).