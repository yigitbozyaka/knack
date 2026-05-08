# Contributing to Knack

Thanks for your interest in helping out — Knack is meant to be a community-owned utility belt for the web, and that only works if people show up. This doc covers everything you need to land a clean PR.

## Code of conduct

Be kind. Assume good faith. Disagree with ideas, not people. Maintainers reserve the right to remove comments or block contributors that don't follow this.

## Before you start

- For **anything non-trivial** (a new tool, a behavior change, a refactor), [open an issue](https://github.com/yigitbozyaka/knack/issues) first. Aligning on scope upfront saves everyone time.
- For **small fixes** (typos, broken links, obvious bugs, tiny polish), feel free to open a PR directly. No issue needed.
- For **new tools**, follow the "Adding a new tool" checklist in [`CLAUDE.md`](./CLAUDE.md).

## Setting up locally

You'll need [Node.js 20+](https://nodejs.org), [pnpm 9+](https://pnpm.io), and [Docker](https://www.docker.com).

```bash
git clone https://github.com/yigitbozyaka/knack.git
cd knack
pnpm install
docker compose up -d
cp .env.example .env.local
# edit .env.local — at minimum, set SESSION_SECRET to 32+ random chars
pnpm dev
```

Open <http://localhost:3000>. See [README.md](./README.md) for the full quickstart.

### Install gitleaks (recommended)

The pre-commit hook runs [gitleaks](https://github.com/gitleaks/gitleaks) to catch accidentally committed secrets (API keys, tokens, credentials). It's optional locally — if gitleaks isn't installed, the hook prints a warning and skips. CI runs the same scan on every PR and **will block** a leak from landing.

Install it once:

```bash
# macOS
brew install gitleaks

# Windows (Scoop)
scoop install gitleaks

# Linux / anywhere with Go
go install github.com/gitleaks/gitleaks/v8@latest
```

Knack's gitleaks config lives at [`.gitleaks.toml`](./.gitleaks.toml). If you hit a false positive, open a PR adding the file to the allowlist (with a one-line comment explaining why).

## Branch naming

Branch off `dev`, never off `master`. Use a short, descriptive, kebab-case branch name with a Conventional Commits-style prefix:

| Prefix      | When to use                           | Example                            |
| ----------- | ------------------------------------- | ---------------------------------- |
| `feat/`     | new feature, new tool                 | `feat/json-to-yaml`                |
| `fix/`      | bug fix                               | `fix/json-parser-empty-input`      |
| `chore/`    | tooling, deps, infra                  | `chore/bump-next`                  |
| `docs/`     | documentation only                    | `docs/contributing-clarifications` |
| `refactor/` | restructuring without behavior change | `refactor/extract-tool-registry`   |
| `test/`     | tests only                            | `test/json-parser-edge-cases`      |
| `perf/`     | performance work                      | `perf/lazy-load-pdf-tool`          |
| `ci/`       | CI / GitHub Actions                   | `ci/cache-pnpm-store`              |

## Commit messages

Knack uses [Conventional Commits](https://www.conventionalcommits.org). Format:

```
<type>(<scope>): <subject>
```

- **type**: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `ci`, `build`
- **scope** (optional but encouraged): the area touched — `tools/json`, `env`, `ui`, `db`, `auth`, etc.
- **subject**: imperative, lowercase, no trailing period. Under ~70 chars.

Good:

- `feat(tools/json): add minify mode`
- `fix(env): reject empty REDIS_URL with clear error`
- `chore(deps): bump zod to 4.5.0`
- `docs(contributing): explain branch naming`

Bad:

- `Updated stuff` — what stuff?
- `feat: I added a new tool for converting JSON to YAML and also fixed two bugs and refactored the env loader` — split into multiple commits.

**One concern per commit.** A bug fix doesn't need surrounding cleanup. If you spot unrelated issues while working, file them as separate issues or PRs.

## Code style

The repo enforces formatting and lint via Prettier + ESLint. The pre-commit hook runs `eslint --fix` and `prettier --write` on staged files automatically. Don't bypass it with `--no-verify`.

Before pushing, run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

CI runs the same three; fail fast locally.

A few rules worth calling out (full list in [`CLAUDE.md`](./CLAUDE.md)):

- TypeScript `strict` + `noUncheckedIndexedAccess`. No `any` — use `unknown` and narrow.
- Validate every external input with Zod.
- Read env vars only via `lib/env.ts`. Never `process.env` outside that file.
- Default to Server Components. Mark client only when needed.
- Tailwind utility classes only (no inline `style` unless the value is dynamic).
- Files: `kebab-case.ts`. Components: `PascalCase.tsx`. Hooks: `useThing.ts`. DB tables: `snake_case` plural.

## Security

Knack tools take user input and sometimes call third parties. Treat security as part of the diff, not a separate concern.

### Disclosure

If you think you've found a vulnerability, **don't** open a public issue. See [`SECURITY.md`](./SECURITY.md) for how to report.

### Don't roll your own

- **HTML in React** — React escapes by default. Don't use `dangerouslySetInnerHTML` on user input. For escaping into non-React boundaries (CSV cells, filenames, error strings echoed in JSON), use `escapeHtml` / `stripHtmlTags` from [`lib/security/sanitize.ts`](./lib/security/sanitize.ts).
- **Outbound HTTP** — anything fetching a URL that came (directly or indirectly) from user input must go through `safeFetch` in [`lib/security/ssrf.ts`](./lib/security/ssrf.ts), never raw `fetch`. It validates the URL, blocks loopback / private IP ranges, applies a timeout, and disables auto-redirect by default.
- **Rate limiting** — write paths and any expensive operation should call `checkRateLimit` from [`lib/rate-limit.ts`](./lib/rate-limit.ts) with the appropriate preset (`defaultLimiter` or `strictLimiter`). The IP hashing with daily-rotating salt is handled for you.
- **Cryptography** — if you need a hash or token, use `crypto.subtle` (Web Crypto) or `node:crypto`. Don't import a third-party crypto library or invent a scheme.
- **SQL** — Drizzle parameterizes by default. If you reach for `sql.raw(...)`, expect the reviewer to ask for a real reason.

### Per-tool checklist

Every new tool PR should be able to answer the questions in the threat model's [per-tool security checklist](./docs/threat-model.md#per-tool-security-checklist). If the honest answer for a row is "concern, but mitigated by X", say so in the PR description.

### Secrets and env

- `.env*` is gitignored except `.env.example`. Real secrets go in your hosting provider's env, never in the repo.
- The pre-commit gitleaks hook (see [Install gitleaks](#install-gitleaks-recommended) above) catches accidentally committed secrets. CI runs the same scan and **will block** on a leak.
- New environment variables go in `lib/env.ts` (Zod schema, fail-closed at startup) **and** `.env.example` (with an obviously-fake placeholder).

## Tests

Add tests for any logic that isn't trivially correct from reading. Pure utility functions go in `lib/tools/<slug>/` with a co-located `__tests__/` folder.

- **Unit tests:** Vitest. Cover happy path, at least one edge case, one invalid input. Run with `pnpm test`.
- **E2E tests:** Playwright, in `tests/e2e/`. Reach for these when behavior crosses several components or requires a real browser. Run with `pnpm test:e2e` (requires a running dev or prod server — the config auto-starts `pnpm dev` locally if none is found).

  To install Playwright browsers the first time:

  ```bash
  pnpm exec playwright install chromium --with-deps
  ```

A PR that adds tools without tests will be asked to add them. A PR that adds a bug fix without a regression test will be asked too.

## Pull requests

Use the PR template. The bare minimum:

- **Target `dev`**, not `master`. Maintainers cut releases from `dev` to `master`.
- Link the issue you're solving (`Closes #123`) when there is one.
- Describe what changed and why. Screenshots / clips for UI changes.
- Confirm `pnpm lint && pnpm typecheck && pnpm build` are green locally.
- Confirm tests pass.
- Keep PRs focused. If a PR is doing two unrelated things, split it.

Reviewers may ask for changes. That's the point of review — push back politely if you disagree, but the maintainers have the final say on what lands.

## Adding a new tool

The "Adding a new tool" checklist in [`CLAUDE.md`](./CLAUDE.md) walks through the full process: pick a slug, scaffold the route, put pure logic in `lib/`, validate input with Zod, build the UI from shadcn primitives, write tests, register the tool, ship.

## Things we won't accept

- Telemetry, analytics, or tracking that isn't strictly anonymous and disclosed.
- Ads, upsells, or feature gating behind paid tiers.
- Tools that require an account when they don't need to.
- Dependencies that aren't actively maintained or have incompatible licenses.
- PRs that disable type checks or lint rules to make a fix easier.

## Reporting bugs / requesting features

Use the issue templates. Bugs need: what you did, what you expected, what happened, environment (browser, OS). Features need: the use case, why the existing tools don't solve it, and a sketch of the desired behavior.

## License

By contributing, you agree your contributions are licensed under the [MIT License](./LICENSE).

## Thanks

Seriously — the project only exists because people show up to fix small things. Welcome.
