# CLAUDE.md — NutriPlan (Next.js)

@AGENTS.md

## Progetto

NutriPlan: gestionale SaaS per nutrizionisti. Migrazione da Flask + SQLite a Next.js 15 + TypeScript + PostgreSQL + Supabase.

Gestisce: pazienti, visite con misure antropometriche (plicometria JP3/JP7, circonferenze), database 282 alimenti, piani dietetici con wizard 4-step, report PDF.

- **MIGRATION_PLAN.md**: piano completo di migrazione con fasi, schema DB, route mapping
- **Progetto Flask originale**: `c:\_Git\Claude\test\diet_manager\` (repo separato, riferimento per formule e logica)

## Stack

| Componente | Tecnologia |
|-----------|-----------|
| Frontend | Next.js 15 App Router + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui v2 (@base-ui/react) |
| Database | PostgreSQL (Prisma Postgres) |
| ORM | Prisma |
| Auth | Supabase Auth |
| PDF | Playwright (HTML/CSS -> PDF) — Fase 7 |
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
- **Route Handlers** solo per API chiamate client-side (autocomplete alimenti, calcolo metabolismo, calcolo grammi)
- **Multi-tenancy**: ogni entita' ha `professionalId` legato a Supabase Auth via modello `Professional`
- **shadcn/ui v2**: usa `render` prop (NON `asChild`) per composizione componenti. Esempio: `<Button render={<Link href="..." />}>text</Button>`
- **Enum PostgreSQL** in italiano per termini di dominio: `COLAZIONE`, `PRANZO`, `CENA`, `SPUNTINO_1`, `SPUNTINO_2`, `SPUNTINO_3`

## Stato implementazione

### Completate (Fasi 0-6)
- [x] Scaffolding + shadcn/ui + Prisma schema + seed
- [x] Auth Supabase (login/register) + middleware + multi-tenancy
- [x] CRUD Pazienti (Server Actions + pagine + form)
- [x] Calcoli scientifici (body-composition, metabolism, macros, meal-planner, sport)
- [x] CRUD Visite con calcolo automatico body composition
- [x] CRUD Alimenti con search API + emoji
- [x] Wizard Dieta 4-step (info, distribuzione %, alimenti, riepilogo)
- [x] Preview piano, edit, duplica, elimina
- [x] Compilazione TypeScript pulita (solo errori attesi pre `prisma generate`)

### Da implementare
- [ ] **Fase 7**: PDF Report con Playwright (template HTML/CSS 7 sezioni, palette sage/teal/warm)
- [ ] **Fase 8**: CRUD Ricette + Integratori + Istruzioni dietetiche
- [ ] **Fase 9**: Script migrazione dati SQLite -> PostgreSQL (`scripts/migrate-sqlite.ts`)
- [ ] **Fase 10**: Import Excel (SheetJS)
- [ ] **Fase 11**: Settings professionista, README, finalizzazione

## Struttura directory chiave

```
src/
  app/(auth)/          — login, register
  app/(dashboard)/     — tutte le pagine protette
  app/api/             — route handlers (foods search, metabolism calc, grams calc)
  components/ui/       — shadcn/ui v2
  components/layout/   — sidebar, header
  components/patients/ — form, delete button
  components/visits/   — form misure
  components/foods/    — form alimenti
  components/meal-plans/wizard/ — 4 step + container
  features/            — server actions (patients, visits, foods, meal-plans)
  lib/calculations/    — body-composition, metabolism, macros, meal-planner, sport
  lib/supabase/        — client, server, middleware
  validations/         — schemi Zod
prisma/
  schema.prisma        — 17 modelli, enum PostgreSQL
  seed.ts              — activity levels, sport activities
```
