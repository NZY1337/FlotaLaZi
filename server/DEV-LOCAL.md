# Dezvoltare locală

1. `.env`: `DATABASE_URL=postgres://andreimocanu@localhost:5432/flotalazi_dev` și `E2E_DATABASE_URL=postgres://andreimocanu@localhost:5432/flotalazi_test` (producția doar în Railway).
2. Migrații: `npm run migration:run` + același cu `DATABASE_URL=postgres://andreimocanu@localhost:5432/flotalazi_test` în față.
3. Server: `npm run start:dev`.
4. Teste: `npm test` (unitare) și `npm run test:e2e` (API, pe `flotalazi_test`).
5. Migrație nouă în PR → `DATABASE_URL='<din Railway>' npm run migration:run`, apoi merge.
