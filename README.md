# NutriPlan

Gestionale SaaS per nutrizionisti costruito con Next.js, Prisma e Supabase.

Copre:
- pazienti e anagrafica clinica
- visite antropometriche con calcoli automatici
- database alimenti
- piani dieta con wizard guidato
- report PDF
- ricette, integratori e istruzioni dietetiche
- import dati da Excel

## Stack

- Next.js 16 App Router + TypeScript
- React 19
- Tailwind CSS 4
- componenti UI locali su `@base-ui/react`
- PostgreSQL + Prisma 7
- Supabase Auth
- Playwright / Chromium per PDF
- SheetJS per import Excel

## Avvio locale

```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

Se vuoi applicare le migration gia' versionate invece del sync diretto:

```bash
npx prisma migrate deploy
```

## Variabili ambiente

Configurare `.env` con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_...
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

Note:
- `DATABASE_URL` e' usata dall'app a runtime e dal seed.
- `DIRECT_URL` e' usata da Prisma CLI per `db push` / `migrate`.
- Il progetto usa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, non `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Moduli principali

- **Pazienti**: anagrafica, condizioni, storico visite e piani dieta
- **Visite**: plicometria 7 siti, circonferenze 11 siti, body composition
- **Alimenti**: archivio alimenti con categorie e ricerca
- **Piani dieta**: wizard multi-step con metabolismo, distribuzione e riepilogo
- **Report PDF**: generazione server-side per il paziente
- **Ricette**: ingredienti dinamici e calcolo kcal
- **Integratori**: libreria e assegnazione al paziente
- **Istruzioni dietetiche**: blocchi riusabili per i report
- **Import Excel**: caricamento dati tramite route dedicata

## Struttura

```text
src/app/             App Router, route groups auth/dashboard e API
src/components/      UI e moduli di dominio
src/features/        Server Actions
src/lib/             auth, calcoli, PDF, import, utilita'
src/validations/     schemi Zod
prisma/              schema, seed e migrations
scripts/             utility una tantum
```

## Comandi utili

```bash
npm run dev
npm run lint
npm run build
```

Nota: non c'e' ancora una suite di test automatizzati nel repository.
