# WP-02: Link Condivisibile Piano Dieta

**Agente:** Claude Code (CC)
**Priorita:** P0 | **Effort:** Basso | **Dipendenze:** Nessuna

## Contesto

That Clean Life permette di condividere piani dieta con un link unico senza login.
Nutrium ha un'app mobile dedicata. NutriPlan non ha nessun modo per il paziente di vedere il piano digitalmente — solo il PDF.

## Obiettivo

Generare un link pubblico (token-based, no auth) per ogni piano dieta, che il paziente puo' aprire da browser per consultare il proprio piano in formato leggibile e mobile-friendly.

## Specifiche

### 1. Schema DB

Aggiungere campo `shareToken` al model `MealPlan`:

```prisma
model MealPlan {
  // ... campi esistenti
  shareToken  String?  @unique @default(cuid())
}
```

Il token e' generato automaticamente alla creazione del piano. Puo' essere rigenerato o rimosso (revoca accesso).

### 2. Route pubblica

Creare una route **fuori** dal layout dashboard, senza auth:

```
src/app/shared/plan/[token]/page.tsx
```

Questa route:
- Cerca il `MealPlan` by `shareToken`
- Se non trovato: 404
- Se trovato: renderizza il piano in layout pulito, senza sidebar/header

### 3. Layout della pagina pubblica

Design pulito, mobile-first:
- Header con logo professionista (se presente) + nome studio
- Nome paziente (solo nome, no dati sensibili)
- Nome piano + data
- Per ogni pasto: card con alimenti, grammi (per lo scenario appropriato)
- Sezione ricette collegate (se presenti)
- Sezione istruzioni dietetiche (se presenti)
- Footer: "Piano creato con NutriPlan"

### 4. UI per il professionista

Nella pagina del piano (`src/app/(dashboard)/patients/[patientId]/meal-plans/[planId]/page.tsx`):
- Aggiungere bottone "Condividi" con icona link
- Al click: mostra dialog con:
  - URL copiabile
  - QR code (generato client-side con libreria leggera)
  - Bottone "Copia link"
  - Bottone "Rigenera link" (nuovo token)
  - Bottone "Revoca accesso" (rimuove token)

### 5. QR nel PDF

Nel report PDF, se il piano ha un `shareToken`, aggiungere un QR code nell'intestazione della sezione dieta che punta al link condivisibile.

## File da modificare/creare

| File | Azione |
|------|--------|
| `prisma/schema.prisma` | Aggiungere `shareToken` a MealPlan |
| `src/features/meal-plans/actions.ts` | Aggiungere `regenerateShareToken`, `revokeShareToken` |
| Nuovo: `src/app/shared/plan/[token]/page.tsx` | Pagina pubblica |
| Nuovo: `src/app/shared/plan/[token]/layout.tsx` | Layout minimale pubblico |
| `src/app/(dashboard)/patients/[patientId]/meal-plans/[planId]/page.tsx` | Bottone condividi |
| Nuovo: `src/components/meal-plans/share-dialog.tsx` | Dialog con link + QR |
| `src/lib/pdf/renderers/diet.ts` | QR code nel PDF (opzionale, fase 2) |

## Perche' Claude Code

- Crea una nuova sezione dell'app (route pubblica) fuori dal layout autenticato
- Richiede modifiche allo schema Prisma + server actions + nuova route
- Decisioni di sicurezza: cosa mostrare/nascondere nella vista pubblica
- Integrazione con il sistema PDF esistente

## Sicurezza

- Il token e' un CUID (non indovinabile)
- La pagina pubblica NON mostra: email, telefono, data di nascita, note cliniche
- La pagina pubblica MOSTRA: nome paziente, piano dieta, alimenti, grammi
- Il professionista puo' revocare l'accesso in qualsiasi momento
- Nessun dato viene cached o indicizzato (meta noindex, nofollow)

## Acceptance Criteria

- [ ] Ogni nuovo piano dieta genera automaticamente un `shareToken`
- [ ] La pagina pubblica `/shared/plan/[token]` renderizza il piano senza auth
- [ ] Layout mobile-friendly e pulito
- [ ] Dialog condivisione con copia link e QR code
- [ ] Rigenera token e revoca accesso funzionanti
- [ ] Pagina pubblica non espone dati sensibili
- [ ] Meta tag noindex/nofollow sulla pagina pubblica
