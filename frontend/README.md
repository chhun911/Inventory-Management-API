# Inventory Management Frontend (Vue 3)

Vue 3 + Vite + Pinia + Vue Router frontend for the NestJS Inventory Management API.

## Features

- Authentication UI: Login, Register, route guards, persisted JWT in `localStorage`
- Suppliers CRUD UI: list, create, view details, edit, delete with confirmation
- Inline form validation and field-level error messages
- Server error display (duplicate name, invalid credentials, etc.)
- 404 page for unknown routes; not-found state for missing supplier resources
- Auto-redirect to `/login?session=expired` on 401 from the API

## Prerequisites

- Node.js 20+
- A running instance of the API on `http://localhost:3000`

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # optional; defaults already point to http://localhost:3000/api
```

## Run the dev server

```bash
npm run dev
```

App is served at http://localhost:5173.

## Build and preview production

```bash
npm run build
npm run preview
```

`preview` also serves on port 5173 (the URL the Selenium tests target).

## Environment variables

| Variable               | Default                       | Purpose                  |
| ---------------------- | ----------------------------- | ------------------------ |
| `VITE_API_BASE_URL`    | `http://localhost:3000/api`   | Base URL for API calls   |

## Project structure

```
src/
  api/         axios client + per-resource API modules
  router/      Vue Router setup with auth guards
  stores/      Pinia auth store (token, user, login/register/logout)
  views/       Page-level components (Login, Register, Suppliers*, NotFound)
  styles/      Global CSS
  App.vue      Root layout with navbar
  main.js      App bootstrap
```

Every interactive element has a stable `data-test="..."` attribute used by the
Selenium suite in `../selenium-tests`.

## Running the UI tests

See [../selenium-tests/README.md](../selenium-tests/README.md).
