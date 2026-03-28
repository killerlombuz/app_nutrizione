# WP-03: Command Palette Globale (Cmd+K)

**Agente:** Codex (CX)
**Priorita:** P0 | **Effort:** Basso | **Dipendenze:** Nessuna

## Contesto

Il componente `src/components/ui/command.tsx` (~197 righe) esiste gia' ed e' basato sulla libreria `cmdk`. Non e' usato da nessuna parte nell'app. L'header (`src/components/layout/header.tsx`) ha un campo ricerca pazienti che funziona via form submit.

## Obiettivo

Attivare la command palette con `Cmd+K` (Mac) / `Ctrl+K` (Win) come ricerca globale: pazienti, alimenti, ricette, integratori, pagine di navigazione.

## Specifiche

### 1. Componente CommandPalette

Creare `src/components/layout/command-palette.tsx` ("use client"):

```typescript
// Struttura del componente
interface CommandPaletteProps {}

// Gruppi di risultati:
// 1. "Navigazione" — pagine statiche (Dashboard, Pazienti, Ricette, Alimenti, etc.)
// 2. "Pazienti" — ricerca dinamica per nome
// 3. "Alimenti" — ricerca dinamica per nome
// 4. "Ricette" — ricerca dinamica per nome
```

Comportamento:
- `Cmd+K` / `Ctrl+K` apre il dialog
- Digitando, il testo filtra prima i risultati di navigazione (client-side)
- Dopo 2+ caratteri, lancia ricerche API in parallelo (debounce 300ms):
  - `GET /api/foods?q=...` (gia' esistente)
  - `GET /api/patients/search?q=...` (da creare)
  - `GET /api/recipes/search?q=...` (da creare)
- Ogni risultato ha: icona, nome, categoria, shortcut per azione
- Enter o click naviga alla risorsa
- Escape chiude

### 2. API endpoints di ricerca

Creare due route handler minimali:

**`src/app/api/patients/search/route.ts`**
```typescript
// GET /api/patients/search?q=mario
// Ritorna: [{ id, name, lastVisitDate }]
// Filtra per professionalId
// LIMIT 5
```

**`src/app/api/recipes/search/route.ts`**
```typescript
// GET /api/recipes/search?q=pasta
// Ritorna: [{ id, name, kcalPerPortion }]
// Filtra per professionalId
// LIMIT 5
```

### 3. Integrazione nel layout

In `src/app/(dashboard)/layout.tsx`, aggiungere `<CommandPalette />` dentro il layout (una sola istanza globale).

### 4. Hint nell'header

Sostituire o affiancare il campo ricerca pazienti nell'header con un bottone "Cerca..." che mostra `Cmd+K` come hint e apre la palette al click.

## File da modificare/creare

| File | Azione |
|------|--------|
| Nuovo: `src/components/layout/command-palette.tsx` | Componente principale |
| Nuovo: `src/app/api/patients/search/route.ts` | API ricerca pazienti |
| Nuovo: `src/app/api/recipes/search/route.ts` | API ricerca ricette |
| `src/app/(dashboard)/layout.tsx` | Aggiungere CommandPalette |
| `src/components/layout/header.tsx` | Hint Cmd+K sul campo ricerca |

## API gia' esistente

`src/app/api/foods/route.ts` — GET con query param `q` per ricerca alimenti. Usare lo stesso pattern per le nuove API.

## Componenti UI gia' disponibili

Tutto in `src/components/ui/command.tsx`:
- `CommandDialog` — dialog modale
- `CommandInput` — input con icona ricerca
- `CommandList` — lista scrollabile
- `CommandEmpty` — stato vuoto
- `CommandGroup` — gruppo con titolo
- `CommandItem` — singolo risultato
- `CommandShortcut` — shortcut display

## Perche' Codex

- Task isolato con input/output chiari
- I componenti UI primitivi esistono gia'
- Le API da creare seguono un pattern gia' presente (`/api/foods`)
- Non richiede decisioni architetturali complesse

## Acceptance Criteria

- [ ] `Cmd+K` / `Ctrl+K` apre la command palette
- [ ] Navigazione statica filtrata client-side (Dashboard, Pazienti, Ricette, etc.)
- [ ] Ricerca pazienti, alimenti, ricette via API con debounce
- [ ] Click/Enter naviga alla risorsa selezionata
- [ ] Escape chiude la palette
- [ ] Hint `Cmd+K` visibile nell'header
- [ ] Non interferisce con shortcut del browser (es. non cattura se un input e' focused)
