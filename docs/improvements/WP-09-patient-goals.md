# WP-09: Obiettivi Paziente con Progress

**Agente:** Codex (CX)
**Priorita:** P2 | **Effort:** Basso | **Dipendenze:** Nessuna

## Contesto

La pagina paziente (`src/app/(dashboard)/patients/[patientId]/page.tsx`) mostra peso e BF% attuali ma non ha il concetto di "obiettivo". I competitor (Practice Better, Healthie) permettono di impostare target e mostrare il progresso.

## Obiettivo

Permettere al professionista di impostare obiettivi per il paziente (peso target, BF% target) e visualizzare il progresso con barre e indicatori.

## Specifiche

### 1. Schema DB

Aggiungere al model `Patient`:

```prisma
model Patient {
  // campi esistenti...

  // NUOVI CAMPI:
  targetWeightKg    Float?
  targetBodyFatPct  Float?
  targetNotes       String?   // es. "Raggiungere 75kg entro giugno"
}
```

### 2. Form obiettivi

Creare `src/components/patients/patient-goals-form.tsx` ("use client"):

- Form compatto (inline o dialog) con:
  - Peso obiettivo (kg) - input number
  - Body fat % obiettivo - input number
  - Note obiettivo - textarea breve
  - Bottone "Salva obiettivi"

Server action: `updatePatientGoals(patientId, { targetWeightKg, targetBodyFatPct, targetNotes })`

### 3. Card obiettivi nella pagina paziente

Nella pagina `patients/[patientId]/page.tsx`, sotto le metric card, aggiungere una card "Obiettivi":

```
+-----------------------------------------------+
| Obiettivi                          [Modifica]  |
|                                                |
| Peso: 82.5 kg -> 75.0 kg                       |
| [============================------] 78%       |
|                                                |
| Body Fat: 22.3% -> 15.0%                       |
| [=======================---------] 65%          |
|                                                |
| "Raggiungere 75kg entro giugno"                |
+-----------------------------------------------+
```

**Logica progress:**
```typescript
// Per il peso (la direzione dipende: se target < attuale, progresso = calo)
const startWeight = firstVisit.weightKg; // prima visita
const currentWeight = lastVisit.weightKg; // ultima visita
const targetWeight = patient.targetWeightKg;

// Se obiettivo e' dimagrire:
const progress = (startWeight - currentWeight) / (startWeight - targetWeight) * 100;
// Clamp 0-100
```

**Colore barra:**
- < 25%: rosso
- 25-75%: ambra
- \> 75%: verde

Se nessun obiettivo impostato, mostrare un bottone "Imposta obiettivi" invece della card.

### 4. Aggiornamento form paziente

In `src/app/(dashboard)/patients/[patientId]/edit/page.tsx` (o nel form paziente):
- Aggiungere sezione "Obiettivi" al form di modifica paziente
- Oppure mantenere come form separato nella pagina dettaglio (preferibile per UX rapida)

### 5. Validazione

Schema Zod per gli obiettivi:
```typescript
const patientGoalsSchema = z.object({
  targetWeightKg: z.number().positive().max(300).optional().nullable(),
  targetBodyFatPct: z.number().min(3).max(60).optional().nullable(),
  targetNotes: z.string().max(500).optional().nullable(),
});
```

## File da modificare/creare

| File | Azione |
|------|--------|
| `prisma/schema.prisma` | Nuovi campi su Patient |
| Nuovo: `src/components/patients/patient-goals-form.tsx` | Form obiettivi |
| Nuovo: `src/components/patients/patient-goals-card.tsx` | Card con progress bar |
| `src/app/(dashboard)/patients/[patientId]/page.tsx` | Integrare goals card |
| `src/features/patients/actions.ts` | Nuova action updatePatientGoals |
| Nuovo: `src/validations/patient-goals.ts` | Schema Zod |

## Perche' Codex

- Componenti isolati e ben definiti
- Logica di calcolo progress semplice e deterministica
- Pattern CRUD gia' presente nel progetto
- Nessuna interazione complessa con altri moduli

## Acceptance Criteria

- [x] Professionista puo' impostare peso e BF% target per ogni paziente
- [x] Card obiettivi mostra progress bar colorata
- [x] Progress calcolato correttamente (prima visita -> ultima visita -> target)
- [x] Se nessun obiettivo, mostra bottone "Imposta obiettivi"
- [x] Note obiettivo visibili nella card
- [x] Validazione Zod impedisce valori fuori range
- [x] Funziona anche se il paziente non ha visite (progress = 0%)
