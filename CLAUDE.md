# CLAUDE.md - NutriPlan

@AGENTS.md

## Progetto

NutriPlan e' un gestionale SaaS per nutrizionisti.

Domini coperti:
- pazienti e anagrafica clinica
- visite con misure antropometriche, plicometria JP3/JP7 e circonferenze
- database alimenti
- piani dieta con wizard a step
- report PDF
- ricette, integratori e istruzioni dietetiche
- import dati da Excel

## Stack corrente

| Componente | Tecnologia |
|-----------|-----------|
| Frontend | Next.js 16 App Router + TypeScript |
| Runtime UI | React 19 |
| Styling | Tailwind CSS 4 |
| UI Kit | componenti locali su `@base-ui/react` |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Auth | Supabase Auth |
| PDF | Playwright |
| Import | SheetJS |
| Validazione | Zod |

## Comandi principali

```bash
npm install
npm run dev
npm run lint
npm run build
npx prisma db push
npx prisma migrate deploy
npx prisma db seed
```

## Avvio locale

```bash
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
npm run dev
```

## Configurazione `.env`

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_...
DATABASE_URL="postgresql://<user>:<password>@<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://<user>:<password>@<region>.pooler.supabase.com:5432/postgres?sslmode=require"
```

Note:
- `DATABASE_URL` usa il transaction pooler (porta 6543, PgBouncer) ed e' usata dall'app a runtime
- `DIRECT_URL` usa il session pooler (porta 5432) ed e' usata da Prisma CLI per `db push` / `migrate`
- non usare l'host diretto `db.<project>.supabase.co:5432`: la porta e' spesso bloccata da firewall o VPN
- non aggiungere `sslmode=require` a `DATABASE_URL`: causa errori TLS con `@prisma/adapter-pg`

## Note Prisma 7

- Le connection URL vanno in `prisma.config.ts`, non in `schema.prisma`
- `prisma.config.ts` usa `DIRECT_URL` per le operazioni di schema
- Per sincronizzare lo schema locale usare `npx prisma db push`, non `prisma migrate dev`
- Il client generato finisce in `src/generated/prisma`: non modificarlo a mano

## Vincoli scientifici

- **JP3 donna**: costante `1.10994921` in `src/lib/calculations/body-composition.ts`
- **Siri donna JP3**: coefficiente `501`
- **JP7**: formula identica M/F, costante `1.112`
- **BMR**: Katch-McArdle `21.6 * FFM + 370`
- **Meal planner**: verdure `200g` + olio `10ml` fissi, carbo `54%`, proteine sul resto
- **Scenari kcal**: `rest`, `workout1`, `workout2`

## Note architetturali

- Mutazioni via Server Actions in `src/features/*/actions.ts`
- Route handlers usati per API client-side: autocomplete alimenti, metabolismo, report, import
- Multi-tenancy tramite `professionalId`
- I componenti UI usano `render` prop, non `asChild`
- Il progetto usa naming di dominio italiano per molti enum (`COLAZIONE`, `PRANZO`, `CENA`, ...)
- Il rendering PDF vive in `src/lib/pdf/*` ed e' esposto da `src/app/api/report/[patientId]/route.ts`
- Le utility Supabase sono in `src/lib/supabase/*`

## Documentazione

- `README.md` e `CLAUDE.md` sono la documentazione generale da mantenere aggiornata
- Evitare file di handoff o migration plan temporanei salvo richiesta esplicita
- Se una decisione progettuale va conservata, integrarla qui o nel README invece di creare nuovi documenti transitori

## Struttura chiave

```text
src/
  app/(auth)/              login, register
  app/(dashboard)/         pagine protette
  app/api/                 route handlers
  components/ui/           primitive UI
  components/layout/       shell applicativa
  components/visits/       workflow visita
  components/meal-plans/   wizard piano dieta
  components/report/       generazione PDF
  features/                server actions
  lib/calculations/        body composition, metabolismo, meal planner
  lib/supabase/            client, server, middleware
  validations/             schemi Zod
prisma/
  schema.prisma
  seed.ts
scripts/
  migrate-sqlite.ts
```

## Note Next.js

- Prima di modificare codice Next, leggere la documentazione locale in `node_modules/next/dist/docs/`
- Il repository usa ancora `middleware.ts`; Next 16 segnala la deprecazione verso `proxy`, ma build e runtime sono ancora allineati
