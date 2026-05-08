# CLAUDE.md — guide for AI agents working on Knack

This file is loaded automatically when Claude Code (or any agent following the CLAUDE.md convention) is run inside this repo. Read it end-to-end before making changes.

## What Knack is

Knack ([knack.wtf](https://knack.wtf)) is an open-source, all-in-one web utilities app: a single Next.js app that bundles small utilities developers and users keep reaching for (converters, encoders, image/PDF tools, generators, etc.). Think of it as a community-owned utility belt for the web. The repo is `github.com/yigitbozyaka/knack`. License: MIT.

## Branches

- `master` — production. **Never push directly.** Only merged via PR from `dev`.
- `dev` — integration branch. Feature branches merge here.
- Feature/work branches — `feat/<thing>`, `fix/<thing>`, `chore/<thing>`, etc. Branch off `dev`.

## Tech stack

- Next.js 16 (App Router, RSC, Server Actions)
- TypeScript — `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`
- Tailwind CSS 4 + shadcn/ui (neutral, CSS variables, dark mode via `next-themes`)
- PostgreSQL + Drizzle ORM (Neon in prod, Postgres-in-Docker in dev)
- Upstash Redis (Redis-in-Docker in dev)
- Cloudflare R2 (MinIO in dev)
- Zod for all runtime validation
- Vitest + Playwright for tests
- Pino for structured logging
- pnpm 9+ on Node 20+

## Conventions (apply to everything you write)

### File and identifier naming

- Files: `kebab-case.ts` (e.g. `parse-csv.ts`)
- React components: `PascalCase.tsx` (e.g. `ToolCard.tsx`)
- Hooks: `useThing.ts`
- DB tables: `snake_case`, plural (e.g. `tool_runs`)
- DB columns: `snake_case`
- Env vars: `SCREAMING_SNAKE_CASE`, server-only by default; client-exposed vars must be prefixed `NEXT_PUBLIC_`

### TypeScript

- Never use `any`. Use `unknown` and narrow.
- Validate every external input (request bodies, query strings, file uploads, env vars) with Zod before you trust it.
- Read env vars only via `lib/env.ts`. Never `process.env` directly outside that file.
- Prefer named exports; default exports only for Next.js page/layout/route conventions that require them.
- Use inline `import { type Foo }` for type-only imports (ESLint enforces this).

### React / Next.js

- Default to **Server Components**. Only mark a component `'use client'` if it needs state, effects, or browser APIs.
- Server Actions for mutations; route handlers (`app/api/.../route.ts`) only when an actual HTTP API is needed (webhooks, third-party callbacks).
- Don't fetch data inside client components — fetch on the server and pass props down.
- Co-locate small components with the page that uses them; promote to `components/` only when reused.

### Styling

- Tailwind utility classes only — no inline `style={{ ... }}` unless dynamic values force it.
- Use shadcn primitives (`@/components/ui/*`) before reaching for custom UI. Add new shadcn components via `pnpm dlx shadcn@latest add <name>`.
- Theme tokens (`bg-background`, `text-foreground`, `border-border`, etc.) instead of hardcoded colors. The neutral palette is wired through CSS variables — dark mode is handled by `next-themes` toggling a `class="dark"` on `<html>`.

### Code quality

- One concern per commit. A bug fix doesn't need surrounding cleanup.
- No comments unless the WHY is non-obvious (a hidden constraint, a workaround for a specific bug, a subtle invariant). Code should be self-explanatory.
- Don't introduce abstractions that aren't required by the change in front of you.
- Don't add error handling, fallbacks, or validation for scenarios that can't happen. Only validate at system boundaries.
- For API routes / Server Actions: validate input with Zod, return typed errors, never leak internal details.
- For UI changes: test in the browser. Type checks ≠ feature works.

### Commits

[Conventional Commits](https://www.conventionalcommits.org). Format: `<type>(<scope>): <subject>`.

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `ci`, `build`.

Examples:

- `feat(tools/json): add minify mode`
- `fix(env): reject empty SESSION_SECRET with a clear error`
- `chore(deps): bump next to 16.3.0`
- `docs(readme): clarify quickstart`

## Project structure

```
app/                    Next.js App Router routes, layouts, pages
  (tools)/              Route group for utility tools (one folder per tool)
  actions/              Server Actions (e.g. report-abuse)
  api/                  Route handlers (only when an HTTP API is genuinely needed)
  layout.tsx            Root layout (theme provider, header, footer, fonts)
components/
  ui/                   shadcn primitives — do not edit directly, regenerate via shadcn CLI
  <feature>/            Feature-specific components (when reused across pages)
lib/
  env.ts                Zod-validated env loader — only place that reads process.env
  utils.ts              cn() helper and other tiny utilities
  rate-limit.ts         Sliding-window limiter on Upstash, hashed-IP keying
  email/                Outbound email helpers (currently stub)
  redis/                Upstash REST client wrapper
  security/             sanitize.ts (escape helpers), ssrf.ts (safeFetch)
  db/                   Drizzle client (lib/db/client.ts), schemas (lib/db/schema/*), migrations (lib/db/migrations/*)
  storage/              S3 client + presigned URL helpers + magic-byte mime sniffing
  auth/                 Token generation/hashing, iron-session cookie, requireAccount()
  tools/registry.ts     Typed registry of all tools, surfaced on the homepage
  errors.ts             Typed AppError subclasses (Unauthorized, RateLimit, Validation, …)
hooks/                  Reusable React hooks
public/                 Static assets
proxy.ts                Edge proxy (security headers, CSP nonce)
scripts/                tsx scripts: migrate.ts, seed.ts
docker-compose.yml      Local Postgres + Redis + Serverless Redis HTTP + MinIO
```

## Local commands

| Command                | What it does                              |
| ---------------------- | ----------------------------------------- |
| `pnpm dev`             | Start dev server on http://localhost:3000 |
| `pnpm build`           | Production build                          |
| `pnpm start`           | Run the production build                  |
| `pnpm lint`            | Lint with ESLint                          |
| `pnpm lint:fix`        | Lint and auto-fix                         |
| `pnpm typecheck`       | `tsc --noEmit`                            |
| `pnpm test`            | Run Vitest unit tests once                |
| `pnpm test:watch`      | Vitest in watch mode                      |
| `pnpm test:coverage`   | Vitest with v8 coverage reporter          |
| `pnpm format`          | Format with Prettier                      |
| `pnpm format:check`    | Format check (used by CI)                 |
| `pnpm db:generate`     | Generate a Drizzle migration from schema  |
| `pnpm db:migrate`      | Run pending migrations                    |
| `pnpm db:seed`         | Seed a demo account (dev only)            |
| `pnpm db:studio`       | Open Drizzle Studio                       |
| `pnpm db:push`         | Push schema directly (dev experiments)    |
| `docker compose up -d` | Boot Postgres, Redis, SRH proxy, MinIO    |
| `docker compose down`  | Stop them                                 |

Pre-commit hook (husky + lint-staged) runs `eslint --fix` and `prettier --write` on staged files automatically. Don't bypass it with `--no-verify` unless you have a real reason.

## Security rules

These apply to every change. The full picture is in [`docs/threat-model.md`](./docs/threat-model.md); below is the always-on subset.

- **Never use `dangerouslySetInnerHTML` on user input.** React escapes by default — let it. For non-React boundaries (CSV, filenames, JSON-echoed strings), use `escapeHtml` / `stripHtmlTags` from `lib/security/sanitize.ts`.
- **Never call `fetch` with a URL that came (directly or indirectly) from user input.** Use `safeFetch` from `lib/security/ssrf.ts`. It validates the URL, rejects loopback / private ranges, applies a timeout, and disables auto-redirect by default.
- **Validate every external input with Zod** before you trust it: request bodies, form data, query strings, file uploads, env vars. Reject at the boundary, return typed errors.
- **Read env vars only via `lib/env.ts`.** Never `process.env` outside that file. New env vars go in the Zod schema (fail-closed) **and** `.env.example` (placeholder).
- **Rate-limit write paths.** `checkRateLimit` from `lib/rate-limit.ts` with `defaultLimiter` or `strictLimiter`. IP hashing with daily salt is automatic.
- **Don't roll your own crypto.** Use `crypto.subtle` (Web Crypto) or `node:crypto`. No third-party crypto libs without prior discussion.
- **Don't disable security headers, CSP, env validation, or lint rules** to make a change land. If a rule is wrong, propose changing it in a separate commit/PR.
- **Don't commit secrets.** Pre-commit gitleaks catches them locally; CI catches them on push. Real secrets live in your hosting provider's env, never in the repo.
- **Tools that render parsed user input** (markdown, HTML, JSON) must follow the per-tool checklist in [`docs/threat-model.md#per-tool-security-checklist`](./docs/threat-model.md#per-tool-security-checklist) before merging.

If you need to discuss a real vulnerability, follow [`SECURITY.md`](./SECURITY.md). Don't open public issues.

## Database

Drizzle ORM on Postgres. Schemas live in `lib/db/schema/<table>.ts` and are re-exported from `lib/db/schema/index.ts`. The Drizzle client (`db`) is in `lib/db/client.ts` — pool size is `1` in dev (HMR-safe via `globalThis`) and `10` in prod.

- **Adding a schema**: create `lib/db/schema/<table>.ts`, define the table, re-export from `index.ts`, run `pnpm db:generate` to produce a migration SQL file, and commit both the schema and the generated migration in the same PR.
- **Never edit a migration after it's merged.** Generate a follow-up migration instead. Migrations are forward-only; rewriting history breaks anyone who's already migrated.
- **Use `check()` constraints** for enum-like columns instead of Postgres `enum` types — easier to extend without ALTER TYPE pain.
- **Indexes**: add them at schema time. Anything you'll query by, anything used in a `WHERE` or `JOIN`, gets an index.

## Storage

S3-compatible: Cloudflare R2 in prod, MinIO in dev. Always use `lib/storage/upload.ts`:

- **Client uploads** → `getUploadUrl({ key, contentType, contentLength })` returns a presigned PUT URL with content-type and content-length pinned. The browser uploads directly to R2/MinIO. **Never proxy file bytes through a Next route or Server Action** — it kills request budgets and removes the size cap that the presigned URL enforces.
- **Downloads** → `getDownloadUrl({ key, filename })` returns a presigned GET URL. Pass `filename` to force `content-disposition: attachment` for non-images.
- **Object keys** → `generateObjectKey({ prefix })` produces `prefix/yyyy/mm/dd/<nanoid24>`. Keys must NEVER include account IDs, user IDs, or any identifier that could be enumerated.
- **MIME validation** → `validateUpload({ buffer, declaredType, mode })` from `lib/storage/mime.ts` sniffs magic bytes and rejects mismatches, executables, scripts, HTML, and SVG. Use `mode: 'image'` for image-only paths.

## Auth

Mullvad-style tokens. No email, no password, no recovery. The flow is:

1. `createAccountAction` generates a 20-digit token (~66 bits entropy), stores `argon2id(token)` and `hmac_sha256(token, SESSION_SECRET)` (the deterministic "lookup hash"), and shows the raw token to the user once.
2. `signInAction` normalizes the input, computes the lookup hash, finds the row by it, and verifies the Argon2 hash in constant time. Failures always return a generic "Invalid token." with a 1s artificial delay.
3. The session is a 90-day sliding `iron-session` cookie (`httpOnly`, `sameSite=lax`, `secure` in prod).

How to use it in code:

- **Gate a Server Action**: `import { requireAccount } from '@/lib/auth/account'`, then `const account = await requireAccount()` at the top. It throws `UnauthorizedError` (from `lib/errors.ts`) when there's no session.
- **Optional sign-in**: `getCurrentAccount()` returns `{ id, createdAt } | null`. It's `cache()`-wrapped, so calling it more than once per request is free.
- **Anonymous use**: tools that work for both signed-in and anonymous users should add a nullable `account_id uuid references accounts(id) on delete set null` column to their resource table. When `account_id` is null, the resource is anonymous and bound only to its expiry.

## Expirable resources

Anything that should auto-delete (paste, note, upload, short link) MUST insert a row into `expirable_objects` at create time:

```ts
await db.insert(expirableObjects).values({
  kind: 'paste', // 'paste' | 'note' | 'upload' | 'short'
  resourceId: paste.id,
  storageKey: null, // set this for file uploads so the cron deletes the S3 object too
  expiresAt: new Date(Date.now() + ttlMs),
})
```

The cron at `/api/cron/expire` (gated by `CRON_SECRET`) sweeps the table, deletes the S3 object if `storage_key` is set, then deletes the `expirable_objects` row. Resource-row deletion (the actual `pastes` / `notes` / `uploads` row) is wired in each tool's PR; do that as part of your tool's expire path.

## Workflow for any non-trivial change

1. Branch off `dev` with a Conventional-style branch name.
2. Write the change. Lean on `pnpm dev` and your browser to verify behavior — don't ship UI you haven't seen run.
3. Run `pnpm lint && pnpm typecheck && pnpm build` locally. CI will run all three on PR; fail fast locally.
4. Commit in small, focused chunks with Conventional Commit messages.
5. Open a PR targeting `dev`. Fill in the PR template.
6. Once `dev` is stable, a maintainer opens a PR `dev → master` to ship.

## Tool patterns established in Phase 3

These conventions were locked in during Phase 3 (client-only tools). Apply them to every new tool.

### Client-only tool structure

```
features/<tool>/
  lib.ts (or lib/*)   — pure, testable logic (no React, no browser APIs)
  <Component>.tsx     — 'use client' interactive component
  __tests__/          — Vitest unit tests co-located with the logic

app/<slug>/
  page.tsx            — Server Component shell: just metadata + <ToolShell><Component /></ToolShell>
```

Tools that group by verb use nested slugs: `generate/uuid`, `generate/password`, `generate/secret`.

### Shared UI primitives

- `<ToolShell>` — wraps with `max-w-4xl px-4 py-8`, breadcrumb, and `<ToolErrorBoundary>`.
- `<ToolPageHeader title description icon>` — consistent heading with optional `actions` slot.
- `<CopyButton value label size>` — clipboard copy with toast and CheckIcon feedback.
- `<OutputPanel value language? actions? monospace?>` — scrollable pre with built-in copy.

### Random number generation

Always use `crypto.getRandomValues`. Never `Math.random`. Use rejection sampling when selecting from a charset (draw until the value fits without bias).

### State without effects

Avoid `useEffect` for derived or computed state. Compute inline or in event handlers. The `react-hooks/set-state-in-effect` ESLint rule enforces this.

### localStorage tools

Pattern: `features/<tool>/lib/storage.ts` (pure CRUD with Zod import validation) + `features/<tool>/lib/use-<tool>.ts` (React hook with optimistic state + debounced persist). Tests stub `localStorage` via `vi.stubGlobal('localStorage', mock)` and check `typeof localStorage !== 'undefined'` (not `typeof window`) to ensure the stub is visible.

### data-testid for E2E hooks

Primary output elements get a `data-testid` so Playwright tests can find them reliably:
`uuid-output`, `password-output`, `secret-output`, `format-output`.

### TypeScript quirks

- **ES2017 target** — no BigInt literals (`10n`). Use integer arithmetic for 64-bit timestamp fields.
- **`noImplicitOverride`** — class methods that override a parent must use the `override` keyword (applies to class components like `ToolErrorBoundary`).
- **`catch (err)`** — type is `unknown`. Narrow with `instanceof Error` or a type assertion with a guard before reading properties.

## Adding a new tool — checklist

When you're asked to add a new utility tool to Knack, follow this:

1. **Pick the slug.** Kebab-case, short, memorable. Example: `json-to-yaml`. The tool will live at `/<slug>` and on disk at `app/(tools)/<slug>/`.
2. **Open / find a tracking issue.** Discuss scope first if it's non-trivial.
3. **Branch.** `feat/<slug>` from `dev`.
4. **Scaffold the route.** Create `app/(tools)/<slug>/page.tsx`. Default to a Server Component shell that imports a client component for the interactive part if needed.
5. **Pure logic in `lib/`.** The actual conversion / parsing / generation logic goes in `lib/tools/<slug>/` as pure, testable functions. Never put logic in the component.
6. **Validate input with Zod.** Define schemas for any text input, file upload, or option set. Reject early; surface friendly errors.
7. **UI from shadcn primitives.** `Card`, `Button`, `Input`, `Textarea`, `Tabs`, `Toggle`, etc. Match the visual rhythm of existing tools.
8. **Tests.** A Vitest unit-test file next to the lib code (`lib/tools/<slug>/__tests__/<thing>.test.ts`) covering happy path + at least one edge case + one invalid input.
9. **Register the tool.** Add it to `lib/tools/registry.ts` with `{ slug, name, description, icon, status, category }`. Default to `status: 'soon'` until the tool is shippable; flip to `'live'` in the same PR that lands the working route.
10. **Wire expiry if it's persistent.** If your tool stores anything with a TTL (paste, note, upload, short link), insert into `expirable_objects` at create time — see the **Expirable resources** section above.
11. **Metadata.** Page-level `<metadata>` export with title, description, OG image (auto-generated by the OG route in Phase 3).
12. **Accessibility.** Labels for every input, focus order makes sense, errors announced to screen readers, keyboard usable end-to-end.
13. **Security pass.** Walk the per-tool checklist in [`docs/threat-model.md`](./docs/threat-model.md#per-tool-security-checklist): validated inputs, sanitized output, `safeFetch` for outbound, file bounds, rate limit, no leaking logs, friendly failure mode.
14. **Manual smoke test.** Run `pnpm dev`, exercise the tool with valid + invalid input, confirm dark/light mode both look good.
15. **Lint, typecheck, test, build.** All clean before pushing.
16. **PR.** Target `dev`. Use the template. Include a screenshot or short clip of the tool in action.

## Things to avoid

- **Don't run `git add .` or `git add -A`.** Stage files explicitly to avoid pulling in `.env.local`, scratch files, or unrelated edits.
- **Don't commit secrets.** `.env.local` is gitignored; keep it that way. If you need a new secret, add it to `.env.example` (with a placeholder) and to the Zod schema in `lib/env.ts`.
- **Don't merge with red CI** or with known issues you haven't surfaced.
- **Don't disable type checks or lint rules** to make a fix easier. If a rule is genuinely wrong, propose changing it in a separate commit/PR.
- **Don't introduce a new dependency** without checking it's necessary, well-maintained, and has compatible licensing. A few lines of code beats a 200kB dep.
- **Don't break the open-source promise.** No telemetry, no ads, no upsells, no dark patterns. Tools work without an account whenever possible.

## When in doubt

Open an issue or draft PR and ask. Better to align early than rewrite later.
