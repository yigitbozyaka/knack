# Knack

> An open-source, all-in-one web utilities app — every tool you keep googling, in one place.

[knack.wtf](https://knack.wtf) is a single, batteries-included Next.js app that bundles the small utilities you reach for every day: format converters, generators, encoders, image and PDF tools, regex playgrounds, and more. No ads, no upsells, no dark patterns — just the tools.

Self-host it, fork it, or contribute new tools. The goal is a community-owned utility belt for the web.

## Status

✅ **Phase 3 — Client tools shipped.** Seven browser-only tools are live, with no account required:

| Tool               | URL                  | Notes                                      |
| ------------------ | -------------------- | ------------------------------------------ |
| UUID Generator     | `/generate/uuid`     | v4 and v7, RFC-compliant                   |
| Password Generator | `/generate/password` | Strength meter, rejection sampling         |
| Secret Generator   | `/generate/secret`   | Hex, Base64, Base64url, alphanumeric       |
| Formatter          | `/format`            | JSON, YAML, XML — format, minify, validate |
| Markdown Viewer    | `/markdown`          | DOMPurify-sanitized, syntax highlighting   |
| Scratchpad         | `/notes`             | localStorage-backed, import/export         |
| What's my IP?      | `/ip`                | Rate-limited, nothing stored               |

Database, auth, storage infrastructure from Phase 2 is in place for future server-side tools.

## Architecture

A few load-bearing decisions worth knowing before you contribute:

- **Token-only accounts.** No email, no password, no recovery. We give you a 20-digit token, store an Argon2id hash plus a deterministic HMAC lookup hash, and you sign in by pasting the token back. Lose it, account's gone.
- **Presigned uploads.** Files never proxy through Next — the client gets a presigned PUT URL, uploads directly to R2/MinIO, and the server only stores metadata.
- **Expirable resources.** Anything that should auto-delete (pastes, notes, uploads, short links) writes a row to `expirable_objects` with an `expires_at`. A scheduled cron (`/api/cron/expire`) sweeps the table and deletes the storage object + resource.
- **Rate limiting at every mutation.** Identifiers are SHA-256 hashed with a daily-rotating salt before being written to the `rate_limits` table, so the rate-limit store is never a tracking ledger.
- **Hashed-IP everywhere we touch IPs.** Abuse reports, rate-limit keys — never raw IPs.

## Features

Coming online incrementally. The roadmap focuses on:

- **Text & data** — JSON / YAML / TOML / CSV converters, base64, URL/HTML encoders, hash generators, JWT decoder, regex tester, diff viewer
- **Images** — convert, compress, resize, strip EXIF, generate favicons, OG images
- **PDF** — merge, split, compress, extract text, redact
- **Network** — DNS / WHOIS lookup, IP info, header inspector, JWT to JSON
- **Generators** — UUID, password, lorem ipsum, fake data, color palettes
- **Dev** — cron parser, regex builder, timestamp converter, color picker, gradient builder

The full roadmap lives in [GitHub Issues](https://github.com/yigitbozyaka/knack/issues).

## Tech stack

- **[Next.js 16](https://nextjs.org)** — App Router, RSC, Server Actions
- **TypeScript** — strict mode, `noUncheckedIndexedAccess`, `noImplicitOverride`
- **[Tailwind CSS 4](https://tailwindcss.com)** + **[shadcn/ui](https://ui.shadcn.com)** — neutral palette, CSS variables, dark mode via `next-themes`
- **PostgreSQL** + **[Drizzle ORM](https://orm.drizzle.team)** — Neon in production, Postgres-in-Docker for dev
- **[Cloudflare R2](https://developers.cloudflare.com/r2/)** — object storage for uploads (MinIO for dev)
- **[Zod](https://zod.dev)** — runtime validation for every external input and env var
- **[Vitest](https://vitest.dev)** + **[Playwright](https://playwright.dev)** — unit and e2e tests
- **[Pino](https://getpino.io)** — structured logging

## Quickstart

You'll need [Node.js 20+](https://nodejs.org), [pnpm 9+](https://pnpm.io), and [Docker](https://www.docker.com).

```bash
# 1. Clone and install
git clone https://github.com/yigitbozyaka/knack.git
cd knack
pnpm install

# 2. Boot local infrastructure (Postgres, MinIO)
docker compose up -d

# 3. Configure environment
cp .env.example .env.local
# then edit .env.local — at minimum, set SESSION_SECRET, RATE_LIMIT_SALT, and
# CRON_SECRET to 32+ random chars each.
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# 4. Migrate the database and seed a demo account
pnpm db:migrate
pnpm db:seed   # prints a one-shot demo token to stdout — save it

# 5. Run the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The MinIO console is at [http://localhost:9001](http://localhost:9001) (login: `minioadmin` / `minioadmin`).

### Useful scripts

| Script              | What it does                 |
| ------------------- | ---------------------------- |
| `pnpm dev`          | Start the Next.js dev server |
| `pnpm build`        | Production build             |
| `pnpm start`        | Run the production build     |
| `pnpm lint`         | Lint with ESLint             |
| `pnpm lint:fix`     | Lint and auto-fix            |
| `pnpm typecheck`    | Run `tsc --noEmit`           |
| `pnpm format`       | Format with Prettier         |
| `pnpm format:check` | Verify formatting in CI      |
| `pnpm test`         | Run Vitest once              |
| `pnpm test:e2e`     | Run Playwright E2E tests     |
| `pnpm db:generate`  | Generate a Drizzle migration |
| `pnpm db:migrate`   | Run pending migrations       |
| `pnpm db:seed`      | Seed a demo account (dev)    |
| `pnpm db:studio`    | Open Drizzle Studio          |

## Contributing

PRs welcome — tools, fixes, polish, docs. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening one. Significant changes should start as a GitHub issue so we can align on scope first.

If you're adding a new tool, [`CLAUDE.md`](./CLAUDE.md) has a step-by-step checklist.

## Security

Found something you think is a vulnerability? Please **don't** open a public issue. Email [security@knack.wtf](mailto:security@knack.wtf) — see [`SECURITY.md`](./SECURITY.md) for the full disclosure policy.

## License

[MIT](./LICENSE) © 2025 Yigit Bozyaka
