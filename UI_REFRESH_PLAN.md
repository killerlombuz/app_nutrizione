# UI Refresh Plan

## Contesto

Questo documento traccia il redesign grafico di NutriPlan basato sul progetto Stitch 2.0 gia' disponibile via MCP.

- Branch di lavoro: `feat/ui-refresh-stitch`
- Data avvio: `2026-03-24`
- Progetto Stitch di riferimento: `projects/5524774794365872444`
- Titolo progetto Stitch: `Lista Pazienti - NutriPlan`

## Materiale verificato

Sono state verificate via MCP le schermate principali desktop e mobile:

- Dashboard
- Lista pazienti
- Dettaglio paziente
- Wizard piano dieta
- Database alimenti
- Impostazioni
- Nuova visita
- Nuova ricetta
- Report PDF

## Obiettivo

Portare l'interfaccia corrente verso il linguaggio visivo definito in Stitch:

- shell applicativa piu' editoriale e meno "CRUD generico"
- gerarchia visiva piu' forte per pagine data-heavy
- palette e superfici tonali coerenti con il tema "Clinical Atelier"
- responsive reale per dashboard e navigazione
- componenti base riutilizzabili per le viste del dominio

## Vincoli tecnici

- Stack reale del progetto: Next `16.2.1`, React `19.2.4`, Tailwind `4`
- App Router in `src/app`
- UI basata su componenti `@base-ui/react` + componenti locali stile shadcn
- Nessuna modifica alla logica di dominio se non necessaria al supporto del nuovo layout

## Strategia di implementazione

### Fase 1 - Fondazione visiva

- aggiornare font globali, token CSS e superfici
- riallineare componenti base: `Button`, `Input`, `Card`, `Table`, `Badge`
- introdurre pattern riusabili per header pagina, metriche e visualizzazioni leggere

### Fase 2 - Shell applicativa

- rifare sidebar, header e contenitore dashboard
- introdurre navigazione mobile con sheet
- migliorare densita', spaziatura e allineamento delle azioni ricorrenti

### Fase 3 - Pagine prioritarie

- dashboard
- lista pazienti
- dettaglio paziente
- impostazioni
- database alimenti

### Fase 4 - Pagine secondarie

- ricette
- integratori
- istruzioni
- import
- report PDF

### Fase 5 - Workflow complessi

- wizard piano dieta
- nuova visita
- form lunghi e stati vuoti

## Criteri di review

Ogni tranche deve essere revisionabile separatamente:

1. design tokens e shell
2. pagine prioritarie
3. workflow complessi
4. rifiniture responsive e verifiche finali

## Stato attuale

- [x] Branch creato
- [x] Progetto Stitch identificato via MCP
- [x] Schermate principali ispezionate
- [x] Gap analysis tra UI attuale e UI Stitch
- [ ] Fondazione visiva implementata
- [ ] Shell applicativa implementata
- [ ] Pagine prioritarie migrate
- [ ] Verifica lint/build eseguita
