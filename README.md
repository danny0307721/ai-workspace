# Ledger AI

Next.js + TypeScript + MySQL + Ollama starter for import/sales ledgers, profit calculation, and AI sales tips.

## Run

1. Install Node.js 20+ and Docker.
2. Copy `.env.example` to `.env`.
3. Start services:

```bash
docker compose up -d
```

4. Install packages:

```bash
npm install
npx prisma generate
npx prisma db push
```

To populate the ledger with synthetic demo data, run:

```bash
npm run db:seed
```

This inserts 1,000 imports and 1,000 sales. Set `FAKE_DATA_COUNT` to change the number inserted in each table, for example `FAKE_DATA_COUNT=2500 npm run db:seed` (PowerShell: `$env:FAKE_DATA_COUNT=2500; npm run db:seed`). Each run appends additional rows.

To update prices on existing synthetic rows without inserting more data, set `FAKE_DATA_COUNT=0` (PowerShell: `$env:FAKE_DATA_COUNT=0; npm run db:seed`).

5. Pull a local model:

```bash
docker exec -it $(docker ps -qf name=ollama) ollama pull llama3.1:8b
```

6. Start Next.js:

```bash
npm run dev
```

Open http://localhost:3000.

## Notes

The profit estimate uses product-level weighted-average landed import cost (unit cost plus shipping and tax), then subtracts recorded other sale costs. It uses all recorded purchases and sales, so it does not model inventory timing or individual purchase lots. For production accounting, add dated inventory valuation, currency/tax rules, returns, stock adjustments, and audit trails.

The AI forecast is advisory: it consumes ledger aggregates and must not be treated as guaranteed predictions.
