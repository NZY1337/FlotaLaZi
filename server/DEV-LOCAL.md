# Baza de date locală — ghid scurt

Pe laptop lucrezi **doar** pe o bază Postgres locală. Baza de producție
(Supabase) o folosește doar serverul de pe Railway.

De ce contează:

- O greșeală pe laptop (o migrație proastă, un test, un `DELETE`) nu atinge
  datele clienților.
- Serverul pornit pe laptop are și el cron-ul de alerte de la 08:00. Legat la
  producție, ar trimite alerte clienților reali, pe lângă Railway.
- `npm run test:e2e` golește tabelele. Pe o bază de test asta nu contează.

Login-ul rămâne prin Supabase Auth, cu aceleași conturi. Baza locală pornește
goală: rândul din `users` se creează singur la primul login, iar flota o umpli
tu (Setări → Import sau adaugi câteva vehicule de test).

## O singură dată: instalare (macOS, Homebrew)

```bash
brew install postgresql@16
brew services start postgresql@16    # pornește singur și după restart

createdb flotalazi_dev                # baza pe care lucrezi
createdb flotalazi_test               # baza pentru testele de API
```

Utilizatorul e numele tău de pe Mac (`whoami`), fără parolă.

În `server/.env`:

```
DATABASE_URL=postgres://NUMELE_TAU@localhost:5432/flotalazi_dev
```

URL-ul de producție **nu** stă în `.env`. Îl găsești în Railway → serviciul
server → Variables, când ai nevoie de el (vezi mai jos).

Apoi, din `server/`, creezi tabelele în ambele baze:

```bash
npm run migration:run
DATABASE_URL=postgres://NUMELE_TAU@localhost:5432/flotalazi_test npm run migration:run
```

## Zi de zi

```bash
npm run start:dev                     # server pe baza locală
npm test                              # teste unitare
E2E_DATABASE_URL=postgres://NUMELE_TAU@localhost:5432/flotalazi_test npm run test:e2e
```

Ai schimbat o entitate și ai generat o migrație? O rulezi pe ambele baze
locale (cele două comenzi `migration:run` de mai sus).

## Cum ajunge o schimbare în producție

1. Lucrezi pe un branch, cu baza locală.
2. Deschizi un PR. CI-ul rulează testele pe o bază proprie, temporară.
3. **Dacă PR-ul are o migrație nouă**, o aplici pe producție **înainte** de
   merge. Copiezi URL-ul din Railway direct în comandă, ca să nu ajungă în
   `.env`:
   ```bash
   DATABASE_URL='url-ul-din-railway' npm run migration:run
   ```
   Citește SQL-ul înainte (vezi `MIGRATIONS.md`): pe producție nu există
   „doar de test".
4. Merge pe `main` → Vercel și Railway publică singure.
5. În aplicație, Setări → „Trimite-mi alertele acum", ca să vezi că merg
   alertele.

O migrație bună pentru producție doar **adaugă** (coloane nullable sau cu
`default`, tabele noi): codul vechi, încă pornit pe Railway câteva minute,
merge și cu ea.

## Erori frecvente

| Mesaj | Ce înseamnă |
|---|---|
| `connection refused` pe 5432 | Postgres nu e pornit: `brew services start postgresql@16` |
| `database "flotalazi_dev" does not exist` | N-ai rulat `createdb flotalazi_dev` |
| `relation "..." does not exist` | N-ai rulat `migration:run` pe baza respectivă |
| Testele de API sunt „skipped" | Lipsește `E2E_DATABASE_URL` din comandă |
