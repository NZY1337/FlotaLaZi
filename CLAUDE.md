# CLAUDE.md — EuroTrack (fleet admin for small transport firms)

This file is the source of truth for how this project is built. Read it before
implementing anything. When in doubt, prefer whatever this file says over a
"cleaner"-looking alternative.

> History: this codebase started as Streamloop (an n8n automation-business
> portal) and became EuroTrack in PR #4 (repo now `NZY1337/FlotaMea`).
> Auth, the UI shell, notifications and email were kept; the commerce/n8n
> domain was removed. Streamloop's last state is commit `de43723`.

## 1. Product overview

EuroTrack is the **administrative assistant of a small Romanian road-transport
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
```

`/` is the public landing page (`components/Landing/`, same neo-brutalist
style as the old Streamloop homepage; photos hotlinked from Pexels/Unsplash,
credited in the footer, URLs in `Landing/images.ts`). `ProtectedRoute` sends
signed-out users to `/signin` — never to `/`.

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

All money is an integer in minor units (bani / cents). Dates without time
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
- Reminders send a document alert on the days where `daysLeft` is
  `alertDays`, 7, 1, 0 or −1, at most once per day (`lastAlertedOn`). Oil
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
```

Every body has a DTO (class-validator). The one exception is
`POST /import/legacy`: its body is the old app's free-form backup and
`legacy-import/legacy-mapper.ts` validates every field itself (and skips what
it can't use). Error shape: NestJS default.
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

Pricing to test: ~5–8 € per truck per month, first 2 trucks free.

## 11. Development workflow

- Migrations: `synchronize` is **off**. After changing an entity:
  `npm run migration:generate -- src/migrations/<Name>`, review the SQL,
  `npm run migration:run`. Every migration that creates a table must
  `ENABLE ROW LEVEL SECURITY` on it (Supabase exposes `public` through its
  Data API; no policies needed — the backend bypasses RLS).
- `DATABASE_URL`: local Postgres in dev; Supabase session pooler / direct
  connection (port 5432) in production — never the 6543 transaction pooler.
- EuroTrack needs its **own** Supabase project — never point it at
  Streamloop's database.
- Env (server): `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `RESEND_API_KEY` + `MAIL_FROM` (production email; `MAIL_FROM` must be on
  a domain verified in Resend — without it Resend's test sender only reaches
  the Resend account owner), `GMAIL_USERNAME`, `GMAIL_APP_PASSWORD` (local
  dev email), `APP_URL`, `PORT`.
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
- When a change touches both sides, land the backend endpoint/DTO first.
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
