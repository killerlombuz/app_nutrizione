# UI Refresh Plan

## Contesto

Questo documento traccia il redesign grafico di NutriPlan basato sul progetto Stitch 2.0 raggiunto via MCP.

- Branch: `feat/ui-refresh-stitch`
- Data avvio: `2026-03-24`
- Progetto Stitch: `projects/5524774794365872444`
- Titolo progetto: `Lista Pazienti - NutriPlan`
- PR verso `main`: `#4`

## Riferimenti Stitch verificati

Schermate controllate via MCP:
- dashboard
- lista pazienti
- dettaglio paziente
- database alimenti
- impostazioni
- nuova visita
- wizard piano dieta
- report
- nuove ricette

Per i workflow complessi sono stati scaricati anche i riferimenti dedicati:
- `Nuova Visita - NutriPlan` (`ac89b8bac56d438abaa7c79989231a2f`)
- `Wizard Piano Dieta - NutriPlan` (`948a26507feb4b73aa0e8cf6fbac6cf0`)

## Obiettivo

Portare l'app verso il linguaggio visivo Stitch:
- shell piu' editoriale e meno CRUD generico
- superfici tonali, gerarchia visiva e metriche piu' forti
- componenti riusabili per le pagine cliniche
- migliore resa responsive per dashboard e workflow lunghi

## Strategia

### Fase 1 - Fondazione visiva

- token CSS
- font, colori, ombre e superfici
- restyle componenti base (`Button`, `Input`, `Card`, `Badge`, `Table`)

### Fase 2 - Shell applicativa

- sidebar
- header
- contenitore dashboard
- pattern condivisi per page header e metriche

### Fase 3 - Pagine core

- dashboard
- lista pazienti
- dettaglio paziente
- impostazioni
- database alimenti

### Fase 4 - Workflow complessi

- nuova visita
- wizard piano dieta

### Fase 5 - Rifiniture successive

- pagine secondarie ancora da riallineare al nuovo linguaggio
- eventuale passaggio `middleware.ts` -> `proxy`

## Implementazione completata

### Fondazione e shell

File chiave:
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/header.tsx`
- `src/components/layout/page-header.tsx`
- `src/components/layout/metric-card.tsx`

### Pagine core migrate

File chiave:
- `src/app/(dashboard)/page.tsx`
- `src/app/(dashboard)/patients/page.tsx`
- `src/app/(dashboard)/patients/[patientId]/page.tsx`
- `src/app/(dashboard)/foods/page.tsx`
- `src/app/(dashboard)/settings/page.tsx`
- allineamento iniziale di `recipes` e `supplements`

### Workflow complessi migrati

File chiave:
- `src/components/visits/visit-form.tsx`
- `src/app/(dashboard)/patients/[patientId]/visits/new/page.tsx`
- `src/app/(dashboard)/patients/[patientId]/visits/[visitId]/edit/page.tsx`
- `src/components/meal-plans/wizard/wizard-container.tsx`
- `src/components/meal-plans/wizard/step-info.tsx`
- `src/components/meal-plans/wizard/step-distribution.tsx`
- `src/components/meal-plans/wizard/step-foods.tsx`
- `src/components/meal-plans/wizard/step-summary.tsx`
- `src/app/(dashboard)/patients/[patientId]/meal-plans/new/page.tsx`
- `src/app/(dashboard)/patients/[patientId]/meal-plans/[planId]/edit/page.tsx`

## Commit di riferimento

- `3ea9e8c` `feat: redesign dashboard shell and core pages`
- `47796d5` `feat: redesign visit and meal plan workflows`

## Verifiche eseguite

- `npm.cmd run lint`
- `npm.cmd run build`

Entrambe verdi sul branch di lavoro.

## Stato attuale

- [x] Branch creato
- [x] Progetto Stitch identificato via MCP
- [x] Materiale grafico verificato
- [x] Fondazione visiva implementata
- [x] Shell applicativa implementata
- [x] Pagine core migrate
- [x] Nuova visita migrata
- [x] Wizard piano dieta migrato
- [x] Lint e build eseguiti
- [ ] Rifiniture finali su pagine secondarie
- [ ] Migrazione eventuale da `middleware.ts` a `proxy`
