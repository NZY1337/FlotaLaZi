# Migrații — ghid scurt

Toate comenzile se rulează din folderul `server/`.

## Pe scurt

| Vreau să… | Comandă |
|---|---|
| Creez fișierul de migrație după ce am schimbat o entitate | `npm run migration:generate -- src/migrations/NumeScurt` |
| Aplic pe bază migrațiile care n-au rulat încă | `npm run migration:run` |
| Desfac ultima migrație aplicată | `npm run migration:revert` |
| Văd ce e aplicat și ce nu | `npm run typeorm -- migration:show -d src/data-source.ts` |
| Verific dacă entitățile și baza se potrivesc | `npm run typeorm -- schema:log -d src/data-source.ts` |

Ultimele două nu modifică nimic, le poți rula oricând.

## Ce e o migrație

Un fișier cu SQL care schimbă **structura** bazei (tabele, coloane). Stă în
`src/migrations/` și se pune în git, ca orice cod.

- **Rulează o singură dată pe fiecare bază.** TypeORM notează în tabelul
  `migrations` din baza de date care au rulat deja și le sare.
- **Are două părți:** `up()` aplică schimbarea, `down()` o desface.
- **Schimbă structura, nu datele.** Rândurile (vehicule, acte etc.) le
  inserezi din SQL Editor, nu prin migrații.

## Regula de aur

**Baza nu se schimbă niciodată singură.** `synchronize` e oprit. Dacă modifici o
entitate, baza rămâne neschimbată până rulezi tu `migration:run`.

## Ce faci când schimbi o entitate

Exemplu: vrei un câmp nou `color` pe `Vehicle`.

1. **Modifici entitatea** (`src/vehicles/entities/vehicle.entity.ts`).
2. **Generezi fișierul:**
   ```bash
   npm run migration:generate -- src/migrations/AddVehicleColor
   ```
   Apare automat `src/migrations/<număr>-AddVehicleColor.ts`. Conține doar
   diferența dintre cod și baza reală. **Baza nu se atinge încă.**
   Numele: scurt, în PascalCase, spune ce se schimbă.
3. **Deschizi fișierul și citești `up()`.** Vezi secțiunea „La ce să fii atent".
4. **Aplici:**
   ```bash
   npm run migration:run
   ```
5. **Repornești backend-ul.**
6. **Commit în git:** entitatea modificată **și** fișierul de migrație, împreună.

Dacă `generate` zice `No changes in database schema were found`, nu ai nimic de
migrat și nu se creează niciun fișier.

## Când NU ai nevoie de migrație

Când nu ai atins nicio entitate (`*.entity.ts`): un controller, o pagină, un
test, un stil.

## La ce să fii atent

**1. Citește mereu SQL-ul din `up()`, înainte de `migration:run`.**
Caută cuvântul **`DROP`**: `DROP COLUMN` sau `DROP TABLE` înseamnă că se pierd
date. Ai o singură bază (Supabase) și e cea reală, nu există „doar de test".

**2. Redenumire + altceva = date pierdute.**
- Doar redenumești un câmp → TypeORM scrie `RENAME COLUMN`. E sigur.
- Redenumești **și** schimbi tipul în același timp → scrie `RENAME`, apoi
  `DROP COLUMN`, apoi `ADD`. Coloana se golește.
- Soluție: faci schimbările pe rând (redenumești + rulezi, apoi schimbi tipul +
  rulezi), sau editezi fișierul generat și scrii de mână `RENAME COLUMN` și
  `ALTER COLUMN ... TYPE`.

**3. Coloană nouă `NOT NULL` pe un tabel care are deja rânduri → pică.**
Fă-o nullable (`nullable: true`) sau pune o valoare implicită (`default`).

**4. Câmpurile nullable cer `type` explicit.**
```ts
// Corect:
@Column({ type: 'varchar', nullable: true })
imageUrl: string | null;
```
Fără `type`, aplicația nu mai pornește (`Data type "Object" is not supported`).

**5. Tabel nou → adaugi RLS de mână.**
`generate` nu face asta. În migrația care creează tabelul adaugi:
```sql
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY
```
Fără RLS, tabelul poate fi citit și scris direct prin API-ul public Supabase de
oricine are cheia publishable. Pentru SQL scris de mână creezi un fișier gol cu
`npm run migration:create -- src/migrations/Nume`.

**6. Nu edita și nu șterge migrațiile deja aplicate.**
Greșeala se repară cu **o migrație nouă**. Fișierele deja aplicate rămân cum sunt.
Nu le șterge nici: fără ele nu poți reface baza pe alt proiect Supabase.

**7. Dacă uiți `migration:run`,** aplicația pornește, dar dă erori la prima
interogare, de genul `column "..." does not exist`.

**8. `DATABASE_URL` din `server/.env`** trebuie să fie *Session pooler*
(port **5432**), nu cel de pe 6543, care strică migrațiile. În URL, parola
înlocuiește `[YOUR-PASSWORD]` **cu tot cu parantezele**. Fișierul `.env` nu
intră în git.

## Cum desfaci o migrație

```bash
npm run migration:revert
```
Rulează `down()` pe **ultima** migrație aplicată și o scoate din tabelul
`migrations`. După aceea poți șterge fișierul ei, dacă nu-l mai vrei.

Dacă migrația a rulat deja pe baza reală și a fost comisă, de obicei e mai
sigur să scrii una nouă care o corectează decât s-o desfaci.

## Unde sunt lucrurile

| Ce | Unde |
|---|---|
| Fișierele de migrație | `src/migrations/` |
| Configurarea pentru comenzile `migration:*` | `src/data-source.ts` |
| `synchronize: false` | `src/app.module.ts` |
| Ce a rulat deja | tabelul `migrations` din baza de date |
| Conexiunea la bază | `DATABASE_URL` în `server/.env` |

Cele două migrații existente:
- `Baseline` — generat automat (users, notifications, services), plus o linie
  scrisă de mână: extensia `uuid-ossp`.
- `EnableRowLevelSecurity` — scris de mână: pornește RLS pe toate tabelele.

## Erori frecvente

| Mesaj | Ce înseamnă |
|---|---|
| `password authentication failed` | Parola din `DATABASE_URL` e greșită sau e încă `[YOUR-PASSWORD]` |
| `type "..." already exists` | Baza are deja tabelele, dar `migrations` nu știe de ele (a fost creată fără migrații) |
| `No migrations are pending` | Tot ce e în fișiere e deja aplicat. Nu e o eroare |
| `column "..." does not exist` | Ai schimbat o entitate și n-ai rulat `migration:run` |
