# CLAUDE.md — NutriPlan (Next.js)

@AGENTS.md

## Progetto

NutriPlan: gestionale SaaS per nutrizionisti.

Gestisce: pazienti, visite con misure antropometriche (plicometria JP3/JP7, circonferenze), database 282 alimenti, piani dietetici con wizard 4-step, report PDF, ricette, integratori, istruzioni dietetiche.

## Stack

| Componente | Tecnologia |
|-----------|-----------|
| Frontend | Next.js 15 App Router + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui v2 (@base-ui/react) |
| Database | PostgreSQL (Prisma Postgres) |
| ORM | Prisma |
| Auth | Supabase Auth |
| PDF | Playwright (HTML/CSS -> PDF) |
| Import | SheetJS (xlsx) per import Excel |
| Validazione | Zod |

## Avvio

```bash
npm install
# Configurare .env da .env.example (DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY)
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Punti critici — Costanti scientifiche

- **JP3 donna**: costante `1.10994921` (NON `1.0994921`) — file `src/lib/calculations/body-composition.ts`
- **Siri donna JP3**: coefficiente `501` (NON `495`)
- **JP7**: formula identica M/F, costante `1.112`
- **BMR**: Katch-McArdle: `21.6 * FFM + 370`
- **Grammi pasti**: verdure 200g + olio 10ml fissi, carbo 54%, proteine resto
- **3 varianti kcal**: rest, workout1, workout2

## Architettura

- **Server Actions** per tutte le mutazioni (`src/features/*/actions.ts`)
- **Route Handlers** solo per API chiamate client-side (autocomplete alimenti, calcolo metabolismo, calcolo grammi, report PDF, import Excel)
- **Multi-tenancy**: ogni entita' ha `professionalId` legato a Supabase Auth via modello `Professional`
- **shadcn/ui v2**: usa `render` prop (NON `asChild`) per composizione componenti. Esempio: `<Button render={<Link href="..." />}>text</Button>`
- **Enum PostgreSQL** in italiano per termini di dominio: `COLAZIONE`, `PRANZO`, `CENA`, `SPUNTINO_1`, `SPUNTINO_2`, `SPUNTINO_3`

## Struttura directory chiave

```
src/
  app/(auth)/              — login, register
  app/(dashboard)/         — tutte le pagine protette
  app/api/                 — route handlers (foods, metabolism, grams, report, import)
  components/ui/           — shadcn/ui v2
  components/layout/       — sidebar, header
  components/patients/     — form, delete button
  components/visits/       — form misure
  components/foods/        — form alimenti
  components/meal-plans/wizard/ — 4 step + container
  components/recipes/      — form ricette con ingredienti dinamici
  components/supplements/  — form integratori
  components/instructions/ — form istruzioni dietetiche
  components/report/       — generatore PDF con selezione sezioni
  components/settings/     — form profilo professionista
  features/                — server actions (patients, visits, foods, meal-plans, recipes, supplements, instructions, settings)
  lib/calculations/        — body-composition, metabolism, macros, meal-planner, sport
  lib/pdf/                 — template HTML, data loader, generatore Playwright
  lib/supabase/            — client, server, middleware
  lib/excel-importer.ts    — import fogli Excel nutrizionista
  validations/             — schemi Zod
prisma/
  schema.prisma            — 17 modelli, enum PostgreSQL
  seed.ts                  — activity levels, sport activities
scripts/
  migrate-sqlite.ts        — migrazione dati da SQLite legacy
```
