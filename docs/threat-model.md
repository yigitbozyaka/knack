# Threat model

This document captures the security assumptions Knack is built on. It exists so that contributors (and future-us) have a single place to point at when a security trade-off comes up.

It is **not** a checklist. It's a snapshot of what we believe about who attacks Knack, what they're after, and what we've decided to do (and not do) about it. Re-read it once a quarter and after any meaningful infrastructure change.

---

## Trust boundaries

```
                ┌────────────────────────────────────────────────────────┐
                │                       Internet                         │
                └───────────────────────────┬────────────────────────────┘
                                            │   (TLS, hosting WAF/DDoS)
                                            ▼
   ┌──────────────────────┐        ┌──────────────────────┐
   │  Untrusted browser   │        │  Untrusted bot /     │
   │  (real user, hostile │        │  scraper / scanner   │
   │   user, or both)     │        │                      │
   └───────────┬──────────┘        └───────────┬──────────┘
               │ HTTPS                          │
               ▼                                ▼
   ┌────────────────────────────────────────────────────────┐
   │              Knack server (Next.js, our code)          │
   │                                                        │
   │   middleware  ─►  RSC / route handlers / Server Actions│
   │       │                       │                        │
   │       │                       └─► tool logic (lib/)    │
   │       │                                  │             │
   │       ▼                                  ▼             │
   │   security    ─►  rate-limit / sanitize / SSRF checks  │
   │   headers          (lib/security/*, lib/rate-limit.ts) │
   └───────────┬──────────────┬──────────────┬──────────────┘
               │              │              │
               ▼              ▼              ▼
    ┌──────────────────┐ ┌──────────┐ ┌────────────┐
    │  Postgres (Neon) │ │ R2 / MinIO │
    │  via Drizzle     │ │ via S3 SDK │
    └──────────────────┘ └──────────┘ └────────────┘
                                ▲
                                │ outbound only,
                                │ via lib/security/safe-fetch
                                ▼
                       ┌────────────────────┐
                       │ Third-party APIs   │
                       │ (DNS, WHOIS, etc.) │
                       └────────────────────┘
```

Anything coming **into** the server is untrusted until validated. Anything going **out** of the server (DB writes, external fetches, file storage) is privileged and must not be steerable by user input without a check.

---

## Assets and sensitivity

| Asset                                                           | Sensitivity  | Where it lives                                               |
| --------------------------------------------------------------- | ------------ | ------------------------------------------------------------ |
| Server-side secrets (`DATABASE_URL`, R2 keys, `SESSION_SECRET`) | **critical** | Hosting env, `.env.local` (dev)                              |
| Session cookies / auth tokens (when added)                      | **high**     | Browser cookies, signed/HttpOnly                             |
| User-pasted tool input (text, JSON, etc.)                       | **medium**   | Memory, sometimes Postgres (TTL'd)                           |
| Uploaded files (images, PDFs)                                   | **medium**   | R2 / MinIO, scoped per-session                               |
| Generated artifacts (converted output)                          | **low**      | Returned to browser, not stored unless user explicitly saves |
| Server logs                                                     | **medium**   | Pino, hosting log sink                                       |
| CI secrets (GitHub Actions tokens, deploy keys)                 | **critical** | GitHub Secrets                                               |

**Note on user input:** even though tool input is "low sensitivity" from our side, it's the user's data. We don't log it, we don't persist it unless required for the tool, and we don't reuse it.

---

## Adversaries we plan for

1. **Casual abuse / scrapers** — automated traffic hammering tool endpoints. Blunt cost: bandwidth, compute, R2 egress. Mitigation: rate limiting + hosting-layer DDoS.
2. **Hostile users sending malicious input** — XSS payloads in tool input, prototype-pollution JSON, zip bombs in uploads, SSRF URLs, etc. Mitigation: input validation, output encoding, safe parsers, SSRF guard, file-type sniffing.
3. **Compromised dependency** — a transitive npm dep ships malicious code. Mitigation: lockfile, `pnpm audit` in CI, Dependabot, gitleaks pre-commit so any leaked credential is caught fast.
4. **Stolen contributor credential** — somebody pushes a malicious commit. Mitigation: branch protection on `master` and `dev`, required review on PRs, signed commits encouraged, no force-push to protected branches.
5. **Misconfigured ourselves** — leaked `.env`, missing CSP, debug endpoint left on. Mitigation: gitleaks, Zod env validation that **fails closed** on missing critical vars, security checklist on each tool PR.

We are **not** designing for nation-state-grade adversaries, targeted phishing of maintainers, or supply-chain attacks beyond what `pnpm audit` and Dependabot will catch.

---

## Threats and current state

A row marked _planned_ refers to a control that lands later in the security baseline phase or in a later phase. The point of listing them now is to make sure nothing falls through the cracks.

| #   | Threat                                                                    | Mitigation                                                                                                                                                                                                         | State                     |
| --- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- |
| 1   | XSS via user-rendered tool output                                         | React auto-escapes; never `dangerouslySetInnerHTML` raw input; sanitize HTML output via `lib/security/sanitize.ts` when an output is HTML. CSP with `script-src 'self'`.                                           | partial / planned         |
| 2   | SSRF via user-supplied URL ("fetch this URL" tools)                       | All outbound fetches go through `lib/security/safe-fetch` which rejects private IP ranges, non-HTTP schemes, redirects to private targets.                                                                         | planned                   |
| 3   | SQL injection                                                             | Drizzle parameterizes by default; raw SQL only via `sql` template tag with explicit bindings. **Lint rule (planned):** ban `sql.raw(...)` outside reviewed helpers.                                                | mitigated by stack        |
| 4   | Prototype pollution / parser abuse (JSON, YAML, TOML)                     | Use `JSON.parse` for JSON; for YAML/TOML use safe parsers (`yaml` `parse` not `parseDocument(..., { ... })` with merge keys, `@iarna/toml`). Validate result shape with Zod, never `Object.assign({}, userInput)`. | per-tool                  |
| 5   | File upload abuse (malware, zip bombs, polyglots)                         | Server-side content-type sniffing (magic bytes), per-file size cap, total request size cap, stream-decompress with size limit, disallow nested archives unless tool requires it.                                   | planned (per upload-tool) |
| 6   | CSRF on Server Actions                                                    | Next 16 Server Actions are origin-checked and use double-submit token by default. **Don't disable.** Public route handlers must check `Origin`/`Sec-Fetch-Site` if they mutate.                                    | mitigated by stack        |
| 7   | Session hijack / cookie theft                                             | Cookies: `HttpOnly`, `Secure`, `SameSite=Lax` minimum (`Strict` for auth). `SESSION_SECRET` ≥ 32 bytes, rotated on suspected leak. CSP blocks injected `<script>`.                                                 | partial                   |
| 8   | Secret exfiltration via logs                                              | Pino redact list for `authorization`, `cookie`, `set-cookie`, `password`, common token field names. Never log raw request bodies.                                                                                  | planned                   |
| 9   | Secret leakage via commits                                                | gitleaks pre-commit hook + CI check, `.env*` gitignored, secret values only in hosting env / GitHub Secrets.                                                                                                       | planned (next commit)     |
| 10  | Vulnerable dependency                                                     | `pnpm audit --prod` in CI (high/critical fail), Dependabot weekly PRs to `dev`. Manual review for major bumps.                                                                                                     | planned                   |
| 11  | Compromised CI runner                                                     | Pin GitHub Actions by SHA where feasible; minimum permissions per workflow (`permissions: contents: read` default); secrets scoped to needed jobs only.                                                            | partial                   |
| 12  | Public abuse — repeated requests, mass tool calls                         | Fixed-window rate limit per IP+route in Postgres; hashed IPs with daily-rotating salt so logs aren't a tracking ledger.                                                                                            | planned (next commit)     |
| 13  | Click-jacking on tool pages with no sensitive action                      | `frame-ancestors 'none'` in CSP; `X-Frame-Options: DENY` for older browsers.                                                                                                                                       | planned (CSP commit)      |
| 14  | MIME confusion / drive-by download                                        | `X-Content-Type-Options: nosniff`; explicit `Content-Disposition: attachment` for user-generated downloads; never serve user content from the same origin as the app shell when possible.                          | planned                   |
| 15  | Open redirect                                                             | If we ever add a redirect param, allowlist destinations; never echo arbitrary `?next=` to `Location`.                                                                                                              | by-design                 |
| 16  | Misuse of tools to harm a third party (abusive content, illegal scraping) | Abuse-reporting channel surfaced in footer (Server Action → email). Do not log content of reports beyond what's needed to act.                                                                                     | planned                   |

---

## Threats we explicitly accept (for now)

- **Network-layer DDoS.** Handled by Cloudflare / Vercel / hosting provider. We don't try to absorb it ourselves.
- **Side-channel timing on tool computation.** Most tools are deterministic format converters with no secret-dependent branches. Not worth designing constant-time paths for.
- **Casual scraping of public utility pages.** Robots can hit `/` and tool pages all day — they're public. We rate-limit _expensive_ operations (file uploads, third-party fetches) but we don't try to gate read-only pages.
- **Self-XSS** (user pastes a payload into their own browser via devtools, tells nobody else).
- **Browser-extension malware** modifying our DOM in the user's own tab.
- **Sub-resource integrity for our own JS bundles** in the short term — Next handles cache-busting and we serve from one origin. Will revisit if/when we add a CDN with separate origin.

If one of these starts mattering (e.g. a sustained abuse campaign), promote it from "accepted" to "mitigated" with a real control and update this table.

---

## Per-tool security checklist

Every new tool PR (the "Add a new tool" flow in `CLAUDE.md`) must be able to answer these:

1. **Inputs.** What does the tool accept? text? files? URLs? options? Are all of them validated with Zod before use?
2. **Output rendering.** Is any output rendered as HTML? If yes, is it sanitized (`lib/security/sanitize.ts`) or escaped by React's default?
3. **Outbound calls.** Does the tool fetch anything server-side? If yes, does it use `safeFetch`?
4. **File handling.** Does the tool read user-supplied files? Are size, type, and count bounded? Streamed where possible?
5. **Persistence.** Does the tool write to DB / R2? Are keys namespaced per session/user? Is there a TTL?
6. **Rate limiting.** Is the route covered by the default limiter, or does it need a stricter custom limit (file upload, third-party fetch)?
7. **Logs.** Are we logging anything we shouldn't? (User input, full request bodies, headers with auth.)
8. **Failure mode.** When validation fails, do we return a friendly typed error without leaking internal structure (stack traces, env names, file paths)?

If a tool can't answer "no concern" or "covered by existing control" for any of these, the PR description must say what's mitigating it.

### Markdown Viewer

| Question         | Answer                                                                                                                                                                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Inputs           | Single `string` — the raw markdown text. No file upload, no URL. Not validated with Zod (no structured schema needed; any string is accepted and sanitized).                                                                                                            |
| Output rendering | Yes — output is set via `dangerouslySetInnerHTML`. Sanitized with DOMPurify before use. `FORBID_TAGS` blocks `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`, `<button>`. `FORBID_ATTR` blocks event handlers and `style`. `ALLOW_DATA_ATTR: false`. |
| `data:` URLs     | `data:` is in `ALLOWED_URI_REGEXP` to support inline images in markdown. The `afterSanitizeAttributes` hook rewrites `data:` (and `javascript:`) hrefs on `<a>` to `#`, preventing link-navigation to data:text/html XSS payloads. Images are unaffected.               |
| Outbound calls   | None. Runs entirely in the browser.                                                                                                                                                                                                                                     |
| File handling    | None.                                                                                                                                                                                                                                                                   |
| Persistence      | None. No DB or R2 writes.                                                                                                                                                                                                                                               |
| Rate limiting    | No server-side route — client-only tool. N/A.                                                                                                                                                                                                                           |
| Logs             | Nothing logged.                                                                                                                                                                                                                                                         |
| Failure mode     | Marked and DOMPurify never throw user-visible errors; malformed input is silently rendered as-is or stripped.                                                                                                                                                           |

---

## Process

- **Disclosure** — see [`SECURITY.md`](../SECURITY.md). Email `security@knack.wtf`, no public issues until coordinated.
- **Review cadence** — re-read this doc once a quarter, and on any of: new external service, new auth flow, new file-handling tool, major dependency upgrade (Next/Tailwind/Drizzle).
- **Updates** — this is a living document. If you mitigate a row, change its state. If a new threat shows up, add a row. Don't delete history unless it's wrong; strike through and dated-edit if context matters.

---

_Last reviewed: 2026-05-06._
