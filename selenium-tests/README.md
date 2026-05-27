# Selenium UI Tests

End-to-end UI tests for the Vue frontend, written with
[selenium-webdriver](https://www.npmjs.com/package/selenium-webdriver) and Mocha.

## What's covered

- **Authentication UI** (`tests/auth.spec.js`)
  - Login form renders and validates required fields
  - Email format validation on login and register
  - Invalid credentials show the server error message
  - Register flow creates a user and redirects to suppliers
  - Duplicate email registration shows a server error
  - Login flow works for an existing user
  - Protected routes redirect unauthenticated users to `/login`
  - Logout returns to `/login`
- **Suppliers CRUD UI** (`tests/suppliers.spec.js`)
  - Suppliers list shows table or empty state
  - Create supplier success path
  - Required-field validation on create
  - Duplicate supplier name shows server error
  - Click row → details page
  - Edit supplier success path
  - Conflicting name on edit shows server error
  - Delete from list with confirmation modal
  - Cancel delete keeps the row
  - Delete from details page returns to the list
- **Error pages & messages** (`tests/errors.spec.js`)
  - 404 page for unknown routes (both signed-in and signed-out variants)
  - Missing supplier (`/suppliers/:id`) shows a not-found message
  - Missing supplier on the edit route shows a not-found message
  - `/login?session=expired` shows the session-expired notice

## Prerequisites

- Node.js 20+
- Google Chrome (or Firefox) installed. Selenium Manager (built into
  `selenium-webdriver` 4.6+) auto-downloads the matching driver, so you do not
  need to install ChromeDriver manually.
- The API and frontend must be running locally before the tests start.

## Install

```bash
cd selenium-tests
npm install
cp .env.example .env   # optional; defaults work for the standard local setup
```

## Start the API and the frontend

In two separate terminals at the project root:

```bash
# Terminal 1 — API on http://localhost:3000
npm install
npm run start

# Terminal 2 — Vue frontend on http://localhost:5173
cd frontend
npm install
npm run dev          # or: npm run build && npm run preview
```

The tests assume each user the API has not seen before, so they create fresh
emails on every run (`uniqueSuffix()`) — no manual cleanup needed.

## Run the tests

```bash
# All suites
npm test

# Run the browser headed (visible) instead of headless
npm run test:headed

# Run a single suite
npm run test:auth
npm run test:suppliers
npm run test:errors
```

## Configuration

All configuration is via `.env` (loaded by `dotenv`):

| Variable     | Default                       | Notes                                |
| ------------ | ----------------------------- | ------------------------------------ |
| `BASE_URL`   | `http://localhost:5173`       | Where the Vue app is served          |
| `API_URL`    | `http://localhost:3000/api`   | API base URL for setup helpers       |
| `BROWSER`    | `chrome`                      | `chrome` or `firefox`                |
| `HEADLESS`   | `true`                        | Set `false` to watch tests run       |

## How the suite is wired

- `support/driver.js` builds a `chrome`/`firefox` driver with sensible defaults.
- `support/helpers.js` provides `dt(name)` to locate elements by
  `data-test="..."`, plus tiny wrappers for `goto`, `click`, `typeInto`, waits.
- `support/api.js` talks to the API directly (`fetch`) for fixture work — for
  example, registering a unique user before the CRUD tests so they have a JWT
  ready, or seeding a supplier whose conflict the UI is supposed to surface.
- `support/screenshot.js` exposes `snapshot(driver, name)` and
  `snapshotOnFailure(driver, this)`.

The actual user-facing assertions all happen through the browser — `support/api.js`
is only used to set up the world the test then drives through the UI.

## Snapshots / screenshots

Every suite has an `afterEach` that calls `snapshotOnFailure(driver, this)`. When
a test fails the browser is captured as a PNG into `screenshots/` with a name
like:

```
20260527-141207__FAIL__Suppliers_CRUD_UI_creates_a_new_supplier.png
```

A few tests also capture **named milestone snapshots** at meaningful UI states:

| Snapshot name                          | Where it's taken                                  |
| -------------------------------------- | ------------------------------------------------- |
| `register-form`                        | empty register form, before typing                |
| `register-success-suppliers`           | suppliers list right after a successful register  |
| `supplier-create-form-filled`          | create form filled in, just before submit         |
| `supplier-create-success-details`      | details page after a successful create            |
| `404-unauthenticated`                  | the 404 page when no user is signed in            |

You can drop additional snapshots into any test:

```js
import { snapshot } from '../support/screenshot.js';

await snapshot(driver, 'my-state');
// → screenshots/20260527-141207__my-state.png
```

The `screenshots/` directory is created on demand and is git-ignored.
