# CLAUDE.md — FlotaLaZi (fleet admin for small transport firms)

This file is the source of truth for how this project is built. Read it before
implementing anything. When in doubt, prefer whatever this file says over a
"cleaner"-looking alternative.

> History: this codebase started as Streamloop (an n8n automation-business
> portal), became EuroTrack in PR #4 and was renamed **FlotaLaZi** (domain
> `flotalazi.ro`) in PR #13; the repo is `NZY1337/FlotaLaZi` (formerly
> `NZY1337/FlotaMea` — GitHub still redirects the old name).
> Auth, the UI shell, notifications and email were kept; the commerce/n8n
> domain was removed. Streamloop's last state is commit `de43723`.

## 1. Product overview

FlotaLaZi is the **administrative assistant of a small Romanian road-transport
firm (1–10 trucks, no dispatcher)**. It answers two questions without the
owner having to remember anything:

1. **What expires soon?** ITP, RCA, CASCO, rovinietă, tahograf, copie
   conformă, licență, ADR, CMR — for trucks, trailers, drivers and the firm.
2. **What does each truck earn?** Income vs. expenses (RON + EUR), per truck,
   per month, per category.

What the platform does:

1. Fleet: trucks and trailers (semiremorci / remorci), coupling a trailer to a
   truck, VIN, odometer, oil-change interval (by km **and** by months).
2. Documents with expiry dates, attached to a vehicle, a driver, or the firm.
3. Drivers (name, phone) and their documents (permis, atestat, card tahograf,
   aviz medical/psihologic).
4. Transactions: income and expenses, RON or EUR, by category, per vehicle.
5. Dashboard: alerts (documents + oil), this month's totals, recent expenses.
6. Daily reminders: in-app notification + email digest. WhatsApp is the next
   channel (see §10) — not built yet.
7. Import of the legacy single-file EuroTrack/"Flota Mea" JSON backup.

What the platform explicitly is **not**:

- Not GPS / telematics — "no hardware" is a selling point, not a gap.
- Not a TMS — no route planning, no freight exchange, no dispatch.
- Not accounting — no invoices, no e-Factura, no VAT. Export, don't rebuild.
- Not a native app — responsive web (installable on the phone) is enough.
- Not multi-user per firm (yet) — see §6 Tenancy.

## 2. Product philosophy

Minimal, fast, works for a 55-year-old truck owner on a phone. Every extra
button is a reason to close the app.

Hard rules, not suggestions:

- No microservices, no event bus, no message queue.
- No custom auth — Supabase Auth is the identity provider.
- No feature exists "because it might be needed later."
- The app must be useful **without being opened**: reminders go out on their
  own. A feature that only helps when the owner remembers to look is weaker
  than one that reaches them.
- Romanian UI, transport vocabulary (ITP, RCA, copie conformă, semiremorcă).

## 3. Architecture (high level)

Two deployables, developed and deployed independently:

```
client/   React + TypeScript SPA (Vite, Tailwind, React Query)
server/   NestJS REST API (TypeORM, Postgres)
```

External systems:

- **Supabase** — authentication only (`SupabaseAuthGuard`, `SupabaseService`).
- **PostgreSQL** — all business data (Supabase Postgres in production).
  The frontend never queries tables directly; it only talks to the backend.
- **Email** — reminder and welcome emails, sent by `NodemailerService`
  (`server/services/nodemailer/`): Resend's HTTPS API when `RESEND_API_KEY`
  is set (production — Railway blocks outbound SMTP below the Pro plan),
  otherwise Gmail SMTP (local dev). The welcome email is sent in the
  background, once per user; a mail failure never fails a request.
- **WhatsApp Cloud API** — planned reminder channel (§10).

No shared runtime, no shared code, no monorepo tooling.

## 4. Frontend architecture (`client/`)

```
client/src/
  pages/         route-level screens (thin: compose hooks + components)
  components/    reusable UI (auth, common, form, header, ui, fleet, Landing)
  hooks/         React Query hooks — one file per resource
  services/      fetch functions per resource (the API client layer)
  context/       session, theme, sidebar — don't add more
  layout/        shell (AppLayout, AppSidebar, AppHeader)
  helpers/       constants, formatting helpers
```

Each resource follows the same pattern:

```
services/<resource>/index.ts   → fetch functions, typed, take the access token
hooks/use<Resource>.ts          → React Query hooks wrapping them
```

`services/api.ts` holds the one shared `apiFetch(token, path, init)` helper
(adds the bearer token, JSON headers, throws on non-2xx, `null` on 204).

Routes:

```
/dashboard   Panou        (alerts, month totals, recent expenses)
/fleet       Flotă        (trucks + trailers, km / oil change, coupling)
/documents   Acte         (all documents, urgent filter)
/drivers     Șoferi
/finance     Financiar    (period summary, chart, per category / vehicle, list)
/settings    Setări       (EUR rate, alert thresholds, email alerts, import)
/admin       Admin        (platform owner only: clients, usage counts)
```

`/` is the public landing page (`components/Landing/`, same neo-brutalist
style as the old Streamloop homepage; photos hotlinked from Pexels/Unsplash,
credited in the footer, URLs in `Landing/images.ts`). `ProtectedRoute` sends
signed-out users to `/signin` — never to `/`.

Landing details:

- The hero's product shot (`HeroMockup.tsx`) is drawn in code, not an image:
  the dashboard on a phone, the 08:00 email and the profit card. Animations
  use framer-motion and always respect `useReducedMotion()` (reduced motion =
  the final, still picture). Scroll-in animations use `whileInView` with
  `viewport={{ once: true }}` (see `Core.tsx`).
- Prices live in `Pricing.tsx` only (and §10 below); the FAQ, hero and CTA
  mention the free plan in words — keep them in step.
- SEO: title, description, canonical and Open Graph tags are in
  `client/index.html` itself (crawlers and WhatsApp/Facebook previews don't
  run JS); `public/og-image.png` (1200×630) is the link preview,
  `public/robots.txt` keeps the logged-in pages out, `public/sitemap.xml`
  lists `/` and `/signup` (submitted in Google Search Console — the
  `flotalazi.ro` Domain property, verified by a TXT record at Netim).
  `PageMeta` (react-helmet-async) only changes the **title**: its
  description never reaches the page with React 19, so the description in
  `index.html` is the site's description.

Form inputs (`components/fleet/ui.tsx`) — use these, never a native
`type="number"` or `type="date"` input:

- `NumberField`: numbers typed the Romanian way ("1.500", "1.500,50", "12,5";
  a native number input reads "1.500" as 1.5), parsed by `parseNumberInput`.
- `DateField`: dates shown and typed as zz.ll.aaaa whatever the browser's
  language (a native date input shows mm/dd/yyyy on an English browser),
  with a calendar button that opens the browser's own picker; value stays
  `YYYY-MM-DD`, limited to 2000–2099 like the server.
- `SelectField`, `TextField` for the rest; document types offered in the
  form are `DOCUMENT_TYPES` / `DRIVER_DOCUMENT_TYPES` in `helpers/fleet.ts`
  (the type is free text, so the list is only a convenience).

## 5. Backend architecture (`server/`)

NestJS, one module per real responsibility:

```
server/src/
  auth/ user/ notifications/ interceptors/    (kept from Streamloop)
  settings/       FleetSettings per owner (EUR rate, thresholds)
  vehicles/       Vehicle entity (trucks + trailers), oil change
  drivers/        Driver entity
  documents/      Document entity, expiry status
  transactions/   Transaction entity, period summary
  dashboard/      GET /dashboard — read-only aggregation of the above
  reminders/      daily cron: decides which alerts are due and sends them
  legacy-import/  POST /import/legacy — maps the old JSON backup
  admin/          GET /admin/overview — platform owner's read-only counts
  fleet/          pure, framework-free helpers shared by the modules above
                  (dates in Europe/Bucharest, expiry + oil status, money)
server/services/  infrastructure: nodemailer, supabase
```

No `repositories/` layer, no generic `BaseService`, no CQRS. A `*.service.ts`
talks to its own TypeORM repository directly.

Status logic (days left, red/yellow/green, oil due, RON conversion, alert
thresholds) lives **only** in `fleet/` and is unit-tested there. The
frontend renders what the backend returns; it never recomputes a status.

## 6. Tenancy & domain model

**Tenancy: one account = one firm.** Every business row carries `ownerId`
(the Supabase user id). Every query filters by `ownerId`. A `Company` entity
and logins for drivers/accountants are deliberately **not** built: add them
only when a real firm needs more than one login, then migrate `ownerId` →
`companyId`.

All money is an integer in minor units (bani / cents), in Postgres `int`
columns: one amount is at most 1,000,000 (RON or EUR) and the EUR rate at most
20, so the largest amountRon still fits (`MAX_AMOUNT` / `MAX_EUR_RATE` in
`fleet/money.ts`; raising them needs a `bigint` migration). EUR → RON rounds
half up with integer math, never floats. Dates without time
(expiry, transaction date, oil date) are Postgres `date` columns, handled as
`YYYY-MM-DD` strings; "today" is always computed in `Europe/Bucharest`.

```ts
FleetSettings {            // one row per owner, created on first read
  ownerId: uuid (PK)
  eurRate: number          // RON per 1 EUR, numeric(10,4)
  oilAlertKm: number       // warn this many km before an oil change
  docAlertDays: number     // default alertDays for new documents
  emailAlerts: boolean
}

Vehicle {
  id, ownerId
  kind: 'TRUCK' | 'TRAILER'
  plate, name, vin, notes
  trailerType?: 'SEMIREMORCA' | 'REMORCA'      // trailers only
  attachedTrailerId?: uuid                       // trucks only, unique
  km?, lastOilKm?, oilIntervalKm?, lastOilDate?, oilIntervalMonths?   // trucks only
  lastOilAlertOn?: date                          // reminder bookkeeping
}

Driver { id, ownerId, name, phone?, email?, notes? }

Document {
  id, ownerId
  vehicleId?: uuid    // at most one of vehicleId / driverId;
  driverId?: uuid     // both null = firm-level (e.g. licență transport)
  type: string        // free text, UI offers the usual list
  expiresOn: date
  alertDays: number
  notes?
  lastAlertedOn?: date   // reminder bookkeeping
}

Transaction {
  id, ownerId
  type: 'INCOME' | 'EXPENSE'
  date: date
  amount: int            // minor units, in `currency`
  currency: 'RON' | 'EUR'
  eurRate: number        // rate captured when saved (historical totals don't
                         // move when the owner changes the current rate)
  amountRon: int         // computed by the backend from amount + eurRate
  category: string
  vehicleId?: uuid
  liters?: number        // fuel only
  notes?
}

Notification — kept from Streamloop (user_id, message, type, is_read)
```

Deletes: deleting a vehicle deletes its documents and detaches it from
transactions (`SET NULL`) and from a coupled truck. Deleting a driver deletes
their documents.

## 7. Status rules (implemented in `fleet/`)

- `daysLeft = expiresOn − today`. `≤ 0` → **red** (expirat / expiră azi),
  `≤ alertDays` → **yellow**, else **green**.
- Oil: red when `km ≥ lastOilKm + oilIntervalKm` or the months interval has
  passed; yellow when within `oilAlertKm` km or 30 days; else green.
- Reminders (`shouldAlertDocument`) send a document alert at most once per
  day (`lastAlertedOn`): the first one as soon as the document is inside its
  window (`daysLeft ≤ alertDays` and not alerted since the window opened — so
  a document added or renewed late is caught up at once), then on days 7, 1,
  0 and −1, then weekly while it stays expired, until renewed or deleted. Oil
  alerts at most once every 7 days while yellow/red. One digest per owner per
  run: one in-app notification per item + one email.
- `POST /reminders/test` ("Trimite-mi alertele acum" in Setări) sends the
  caller everything currently red/yellow — no threshold days, emails even
  with `emailAlerts` off, reports email errors in its result, never touches
  `lastAlertedOn` / `lastOilAlertOn`, and is limited to once a minute.

## 8. API conventions

REST, plural nouns, every route authenticated with `SupabaseAuthGuard`:

```
GET   /settings                PATCH /settings
GET   /vehicles                POST  /vehicles
PATCH /vehicles/:id            DELETE /vehicles/:id
POST  /vehicles/:id/oil-change  { km, date, cost?, currency? }
GET   /drivers                 POST /drivers   PATCH/DELETE /drivers/:id
GET   /documents               POST /documents PATCH/DELETE /documents/:id
GET   /transactions?from&to&vehicleId&type
POST  /transactions            PATCH/DELETE /transactions/:id
GET   /transactions/summary?from&to&vehicleId
GET   /dashboard
POST  /import/legacy            (body = legacy JSON backup)
POST  /reminders/test           (no body; see §7)
GET   /notifications …          (kept)
GET   /user/me                  (kept)
GET   /admin/overview           (Role.ADMIN only; see below)
```

Every body has a DTO (class-validator). The one exception is
`POST /import/legacy`: its body is the old app's free-form backup and
`legacy-import/legacy-mapper.ts` validates every field itself (and skips what
it can't use). Error shape: NestJS default.
**Admin**: `users.role = 'admin'` (set by hand in the database) unlocks
`GET /admin/overview` via `RolesGuard`, which answers 404 to everyone else. It
returns counts per client (vehicles, drivers, documents, transactions, last
activity), never amounts, plates or document contents.
**HTTP hardening** (`server/src/http-setup.ts`, shared by `main.ts` and the
API tests): helmet headers, CORS only for `ALLOWED_ORIGINS` (default: the
flotalazi.ro and flota-mea.vercel.app sites and localhost:5173), `trust proxy`
for Railway. Rate limit (`@nestjs/throttler`, `throttle.guard.ts`): 300
requests/minute per session token (IP when there is none), 5/minute on
`POST /import/legacy`, none on the notifications stream. Malformed ids are a
400 (`ParseUUIDPipe`), never a 500.
**Ownership**: a record of another owner is a 404, never a 403. Ids coming
from the client (vehicleId, driverId, attachedTrailerId) are verified to
belong to the same owner before use.

## 9. Coding conventions

- TypeScript strict null checks; no `any` without a one-line reason.
- DTOs + `class-validator` for every request body.
- Small, single-responsibility services; no design patterns for their own
  sake. An interface needs a second real implementation to exist.
- React components stay small; pages compose hooks + components; no
  business logic in components.
- Server state → React Query. UI/form state → local `useState`. No Redux.
- Query keys are flat and resource-first: `['vehicles']`, `['documents']`,
  `['drivers']`, `['transactions', filters]`, `['transactions-summary', …]`,
  `['dashboard']`, `['settings']`. A mutation invalidates its own key plus
  `['dashboard']`.
- Prefer extending an existing module over creating one that overlaps it.

## 10. Roadmap (in order — build the next item only when the previous works)

1. ✅ Cloud account, fleet, documents, drivers, transactions, dashboard,
   email + in-app reminders, legacy import.
2. WhatsApp reminders (Meta Cloud API, approved template). Add a `phone` +
   `whatsappAlerts` setting and a `WhatsappService` in `server/services/`;
   the reminders module calls it next to email. Needs Meta business
   verification first.
3. Documents from photos: upload a photo of a policy / talon, AI extracts
   type, plate and expiry, the owner confirms. Supabase Storage for files.
4. Drivers report via WhatsApp (odometer, fuel receipt photo).
5. Monthly export for the accountant (CSV/PDF).

Pricing (in lei, per firm, by number of **trucks** — trailers, drivers and
documents are unlimited; every feature is in every plan; yearly = 2 months
free):

| Plan    | Trucks     | Monthly  | Yearly    |
|---------|------------|----------|-----------|
| Gratuit | 1          | 0        | 0         |
| Mic     | up to 5    | 39 lei   | 390 lei   |
| Flotă   | up to 10   | 79 lei   | 790 lei   |
| Mare    | unlimited  | 149 lei  | 1.490 lei |

Set against FlotaDesk (the closest competitor: 39 / 89 / 179 RON per month for
5 / 10 / unlimited vehicles, 14-day trial, email-only alerts). There is **no
billing yet**: plans are not enforced in the app and everyone uses it for
free — the pricing section says so ("În perioada de testare … gratuit",
prices "de la lansare"); remove that note when billing ships. When billing is built, count trucks only and keep the 1-truck plan free.
Don't advertise a feature on the landing before it exists — mark it
"(în curând)".

## 11. Development workflow

- Migrations: `synchronize` is **off**. After changing an entity:
  `npm run migration:generate -- src/migrations/<Name>`, review the SQL,
  `npm run migration:run`. Every migration that creates a table must
  `ENABLE ROW LEVEL SECURITY` on it (Supabase exposes `public` through its
  Data API; no policies needed — the backend bypasses RLS).
- `DATABASE_URL`: local Postgres in dev; Supabase session pooler / direct
  connection (port 5432) in production — never the 6543 transaction pooler.
  The session pooler allows 15 clients per project, shared by every server
  using it, so each server's pool is capped at 5 (`DB_POOL_MAX` overrides).
- FlotaLaZi needs its **own** Supabase project — never point it at
  Streamloop's database.
- Env (server): `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `RESEND_API_KEY` + `MAIL_FROM` (production email; `MAIL_FROM` must be on
  a domain verified in Resend — without it Resend's test sender only reaches
  the Resend account owner), `GMAIL_USERNAME`, `GMAIL_APP_PASSWORD` (local
  dev email), `APP_URL`, `PORT`, `ALLOWED_ORIGINS` (optional, comma-separated
  browser origins allowed by CORS). A Railway variable's value is only the
  value: `MAIL_FROM` = `FlotaLaZi <alerte@flotalazi.ro>` (once it held
  `MAIL_FROM = FlotaLaZi …`, which became the sender's name).
  Env (client): `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`,
  `VITE_BACKEND_URL` (defaults to `http://localhost:3010/api`).
- Deploy: `client/` → Vercel (root `client`, `vercel.json` rewrites every
  path to `index.html` for client-side routes); `server/` → an always-on host
  such as Railway (root `server`, build `npm run build`, start
  `npm run start:prod` = `node dist/src/main` — the build nests output under
  `dist/src/` because `services/` lives outside `src/`). Never a host that
  sleeps: the 08:00 reminder cron must run. Migrations are run by hand
  (`npm run migration:run` with the production `DATABASE_URL`) before
  deploying a schema change.
- Domain and accounts: `flotalazi.ro` is registered at Netim (DNS there:
  Vercel, Resend's records, the Google Search Console TXT; apex redirects to
  `www`). Plans: Railway needs Hobby ($5/month) — its free tier sleeps and
  the cron would stop; Vercel Hobby is free but non-commercial, so move to
  Pro once customers pay; Supabase and Resend free tiers are enough for now
  (Resend free: 100 emails/day — one digest per owner per day).
- When a change touches both sides, land the backend endpoint/DTO first.
- CI: `.github/workflows/ci.yml` runs the server build, unit tests and API
  tests (against a Postgres service container, migrated first) and the client
  tests and build on every pull request and push to `main`. Merge only green.
  Dependabot (`.github/dependabot.yml`) opens weekly update PRs per folder:
  merge the green ones one at a time; a red one is usually a major version
  that needs code changes — close it and upgrade on purpose in its own PR.
  Known and accepted: 3 moderate advisories in TypeORM 0.3's `glob`/`minimatch`
  (fixed only in TypeORM 1.x; used with fixed patterns at startup).
- Tests: `server` → `npm test` (jest, unit) and
  `E2E_DATABASE_URL=postgres://… npm run test:e2e` (API against a **throwaway**
  migrated database — the suite truncates every fleet table);
  `client` → `npm test` (vitest).

## 12. Rules for Claude Code

- Check this file and the codebase before implementing; don't re-derive the
  architecture.
- Don't add a library without a real reason (check `package.json` first).
- Don't change the architecture described here without explaining why first.
- Don't build GPS, TMS, accounting or a native app, however the request is
  phrased.
- Status/money/date logic only in `server/src/fleet/`, with unit tests.
- Every resource access is ownership-checked — no exceptions for "MVP".
- Large change (new module, integration, schema change): explain the
  approach first, then implement. Small change: implement directly.
