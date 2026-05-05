# Knack

> An open-source, all-in-one web utilities app — every tool you keep googling, in one place.

[knack.wtf](https://knack.wtf) is a single, batteries-included Next.js app that bundles the small utilities you reach for every day: format converters, generators, encoders, image and PDF tools, regex playgrounds, and more. No ads, no upsells, no dark patterns — just the tools.

Self-host it, fork it, or contribute new tools. The goal is a community-owned utility belt for the web.

## Status

🚧 **Phase 1 — Bootstrap.** The repo is being scaffolded. Tools land starting in Phase 3.

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
- **[Upstash Redis](https://upstash.com/)** — rate limiting, ephemeral state (Redis-in-Docker for dev)
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

# 2. Boot local infrastructure (Postgres, Redis, MinIO)
docker compose up -d

# 3. Configure environment
cp .env.example .env.local
# then edit .env.local — at minimum, set SESSION_SECRET to 32+ random chars
#   node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"

# 4. Run the dev server
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

## Contributing

PRs welcome — tools, fixes, polish, docs. Read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening one. Significant changes should start as a GitHub issue so we can align on scope first.

If you're adding a new tool, [`CLAUDE.md`](./CLAUDE.md) has a step-by-step checklist.

## License

[MIT](./LICENSE) © 2025 Yigit Bozyaka
