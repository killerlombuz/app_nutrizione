# NutriPlan

Gestionale SaaS per nutrizionisti. Gestisce pazienti, visite con misure antropometriche (plicometria JP3/JP7, circonferenze), database alimenti, piani dietetici, report PDF, ricette, integratori e istruzioni dietetiche.

## Stack

- **Next.js 15** App Router + TypeScript
- **Tailwind CSS v4** + shadcn/ui v2
- **PostgreSQL** + Prisma ORM
- **Supabase Auth**
- **Playwright** per generazione PDF
- **SheetJS** per import Excel

## Setup

```bash
npm install
cp .env.example .env   # configurare le variabili
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

## Variabili d'ambiente

Vedi `.env.example`:

- `DATABASE_URL` — connection string PostgreSQL
- `NEXT_PUBLIC_SUPABASE_URL` — URL progetto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — chiave anonima Supabase

## Funzionalita'

- **Pazienti**: anagrafica, condizioni, storico visite e piani dieta
- **Visite**: plicometria 7 siti, circonferenze 11 siti, calcolo automatico composizione corporea (JP3/JP7, Siri, BMI)
- **Alimenti**: database 282 alimenti con flag allergie (FODMAP, nichel, glutine, lattosio)
- **Piani dieta**: wizard 4-step con calcolo metabolismo, distribuzione pasti, selezione alimenti, esempio settimanale. 3 varianti kcal (riposo, allenamento 1, allenamento 2)
- **Report PDF**: 7 sezioni selezionabili, grafici SVG (donut composizione, trend peso), generato con Playwright
- **Ricette**: ingredienti dinamici con autocomplete alimenti e calcolo kcal automatico
- **Integratori**: libreria integratori + assegnazione per paziente con dosaggio/timing personalizzato
- **Istruzioni dietetiche**: indicazioni per categoria con ordinamento
- **Import Excel**: importazione da fogli Excel del nutrizionista (alimenti, misure, ricette, istruzioni)
- **Settings**: profilo professionista con statistiche

## Migrazione dati da SQLite

```bash
npx tsx scripts/migrate-sqlite.ts <path-to-sqlite.db> <professionalId>
# Flag --dry-run per verifica conteggi senza inserimento
```
