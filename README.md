# NutriPlan

Gestionale SaaS per nutrizionisti costruito con Next.js, Prisma e Supabase. Copre pazienti, visite antropometriche, database alimenti, piani dieta, report PDF, ricette, integratori e istruzioni dietetiche.

## Stack

- Next.js 16 App Router + TypeScript
- React 19
- Tailwind CSS 4
- componenti UI locali su `@base-ui/react`
- PostgreSQL + Prisma
- Supabase Auth
- Playwright per PDF
- SheetJS per import Excel

## Stato progetto

Il redesign grafico principale e' in corso sul branch `feat/ui-refresh-stitch` ed e' gia' stato applicato a:
- shell applicativa
- dashboard e pagine core
- nuova visita
- wizard piano dieta

Dettagli operativi in `UI_REFRESH_PLAN.md`.

## Setup

```bash
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Configurare `.env` con:
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Funzionalita principali

- **Pazienti**: anagrafica, condizioni, storico visite e piani dieta
- **Visite**: plicometria 7 siti, circonferenze 11 siti, calcolo automatico composizione corporea
- **Alimenti**: database alimenti con categorie e ricerca
- **Piani dieta**: wizard 4-step con metabolismo, distribuzione, selezione alimenti e riepilogo
- **Report PDF**: generazione tramite endpoint dedicato e Playwright
- **Ricette**: ingredienti dinamici e calcolo kcal
- **Integratori**: libreria integratori e assegnazione paziente
- **Istruzioni dietetiche**: raccolta di indicazioni riusabili
- **Import**: caricamento dati da Excel

## Verifiche rapide

```bash
npm run lint
npm run build
```

Nota: Next 16 segnala ancora la deprecazione di `middleware.ts` verso `proxy`.
