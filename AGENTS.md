# AGENTS.md

Agent guide for working in `nextjs-django-boilerplate`.
This repository is a monorepo with:

- Next.js + TypeScript frontend at repo root (`app/`, `components/`, `actions/`, `lib/`)
- Django REST backend in `server/`

---

## 1) Build, Lint, Test, and Dev Commands

Run commands from repo root unless stated otherwise.

### Frontend (Next.js / Bun)

- Install deps: `bun install`
- Start dev server: `bun run dev`
- Production build: `bun run build`
- Start production server: `bun run start`
- Lint: `bun run lint`
- Type-check: `bun run type-check`
- Format all files: `bun run format`

### Backend (Django / uv)

- Install backend deps: `uv sync --project server`
- Run backend dev server:
  - from root: `uv run --project server uvicorn app.asgi:application --reload --host 0.0.0.0 --port 8000`
  - or use `make start-back`
- Apply migrations: `uv run --project server python server/manage.py migrate`
- Create migrations: `uv run --project server python server/manage.py makemigrations`

### Full stack helpers (Makefile)

- Start frontend + backend: `make start`
- Start frontend only: `make start-front`
- Start backend only: `make start-back`
- Apply migrations: `make migrate`
- Create migrations: `make makemigrations`

### Tests

Current state:

- Backend has Django test modules (`server/users/tests.py`, etc.)
- No frontend JS/TS test runner is configured in `package.json`

Backend test commands:

- Run all backend tests: `uv run --project server python server/manage.py test`
- Run one app tests: `uv run --project server python server/manage.py test users`
- Run one test module: `uv run --project server python server/manage.py test users.tests`
- Run one test class: `uv run --project server python server/manage.py test users.tests.YourTestClass`
- Run one test method:
  `uv run --project server python server/manage.py test users.tests.YourTestClass.test_method_name`

If you run commands inside `server/`, equivalent forms are:

- `uv run --project . python manage.py test`
- `uv run --project . python manage.py test users.tests.YourTestClass.test_method_name`

### Git hook checks (important)

- Commit message is validated with commitlint (`.husky/commit-msg`)
- Pre-push runs:
  - `bun run type-check`
  - `bun run build`
- Pre-commit script exists but is currently commented out

### Commit message convention

Use Conventional Commits. Allowed types include:

- `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`, `revert`

---

## 2) Code Style and Engineering Guidelines

Follow existing patterns over personal preference.

### General

- Keep changes scoped and minimal; avoid broad rewrites.
- Prefer small, composable functions.
- Preserve existing API contracts unless task explicitly requires changes.
- Do not introduce new dependencies unless necessary.

### TypeScript / Next.js style

- TypeScript is strict (`tsconfig.json` has `strict: true`); keep code type-safe.
- Use `@/` import alias for cross-directory imports (configured in `tsconfig.json`).
- Use relative imports for nearby files when already used in that folder.
- Prefer named exports for utilities; keep default exports for page/component patterns that already use them.
- Use `interface` for object shapes in app code; use `type` for inferred/composed unions where clearer.
- Validate user-facing form data with Zod where forms already use it.
- Keep server/client boundaries explicit:
  - add `"use client"` for client components
  - add `"use server"` for server actions
- For async flows, return structured objects rather than throwing for expected validation/auth failures.
- Keep UI feedback user-friendly (existing pattern: toast helpers in `components/ui/notifications.tsx`).

Formatting and linting:

- ESLint config extends `next/core-web-vitals` + Next TypeScript rules.
- Prettier is the formatter (`bunx prettier --write .`).
- Use double quotes, semicolons, and trailing commas as enforced by formatter.
- Do not fight formatter output.

Naming conventions (frontend):

- React component names: PascalCase.
- Route segment folders: kebab-case (e.g., `sign-in`, `change-password`).
- Utility/action/function names: camelCase.
- Constants/schemas: UPPER_SNAKE_CASE only for true constants (e.g., `FORM_SCHEMA`).

### Python / Django style

- Follow Black + Ruff formatting/linting rules (`server/.pre-commit-config.yaml`).
- Use 4-space indentation and Black-compatible wrapping.
- Group imports in this order with blank lines between groups:
  1. standard library
  2. third-party
  3. local app modules
- In DRF views:
  - use serializers for request validation
  - call `is_valid(raise_exception=True)`
  - return `Response(...)` with explicit `status=...` when needed
- Keep API error payload shape consistent with existing backend conventions:
  - typically `{ "error": True/False, "message": "..." }`
- Use DRF status constants (`status.HTTP_...`) rather than raw integers.
- Keep authentication/authorization logic explicit in view classes (`permission_classes`, `throttle_scope`).
- Use model `Meta` for table/ordering conventions when creating new models.

Naming conventions (backend):

- Classes: PascalCase (`LoginSerializer`, `ForceChangePassword`).
- Functions/variables: snake_case.
- App/module names: snake_case (`two_factor`, `users`, `utils`).

### Error handling

- Handle expected failures explicitly and return stable, machine-readable payloads.
- Avoid leaking sensitive internals in error messages.
- For API throttling, keep using central DRF custom exception handler (`utils.exception_handler.custom_exception_handler`).
- In frontend network code, normalize Axios/HTTP errors into user-friendly messages.
- Log useful context for debugging, but avoid logging secrets/tokens.

### Configuration and env vars

- Frontend expects API base URL via `API_BASE_URL`.
- Backend settings are env-driven (`DJANGO_SECRET_KEY`, DB vars, Redis vars, etc.).
- Keep secrets in `.env` files; never hardcode credentials.

### Migrations and schema changes

- When changing Django models, create and commit migrations.
- Keep migration files focused on the model change; avoid unrelated edits.

### What to check before finishing a task

- Frontend: `bun run lint` and `bun run type-check`
- Frontend production sanity: `bun run build`
- Backend touched: run targeted Django tests (single module/class/method first)
- If no test exists for changed backend logic, add one where practical.

---

## 3) Cursor / Copilot Rules Status

Checked for repository-specific AI instruction files:

- `.cursor/rules/` -> not present
- `.cursorrules` -> not present
- `.github/copilot-instructions.md` -> not present

If these files are added later, treat them as high-priority instructions and update this document.
