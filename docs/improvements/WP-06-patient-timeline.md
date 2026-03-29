# WP-06: Timeline Paziente Unificata

**Agente:** Claude Code (CC)
**Priorita:** P1 | **Effort:** Medio | **Dipendenze:** Nessuna

## Contesto

La pagina paziente (`src/app/(dashboard)/patients/[patientId]/page.tsx`, ~419 righe) mostra visite, piani dieta e integratori in sezioni separate. I competitor (Healthie, Nutrium) mostrano una timeline cronologica unificata che racconta la "storia clinica" del paziente.

## Obiettivo

Aggiungere una timeline cronologica nella pagina paziente che unifica visite, piani dieta e note cliniche in un unico flusso.

## Specifiche

### 1. Schema DB — Note cliniche

Aggiungere un model per note rapide non legate a visite:

```prisma
model PatientNote {
  id          String   @id @default(cuid())
  patientId   String
  content     String
  category    String?  // "clinica", "comunicazione", "follow-up", "altro"
  isPinned    Boolean  @default(false)
  createdAt   DateTime @default(now())

  patient     Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  @@index([patientId, createdAt])
}
```

### 2. Componente Timeline

Creare `src/components/patients/patient-timeline.tsx` (server component):

```typescript
interface TimelineEvent {
  id: string;
  type: 'visit' | 'meal_plan' | 'note' | 'supplement';
  date: Date;
  title: string;
  summary: string;
  link?: string;   // URL per dettaglio
  metadata?: Record<string, string | number>;
}
```

**Layout:**
- Linea verticale a sinistra
- Ogni evento e' un nodo sulla linea con:
  - Icona colorata per tipo (stethoscope = visita, utensils = piano, sticky-note = nota, pill = integratore)
  - Data (formattata in italiano)
  - Titolo + riassunto
  - Link "Dettagli" se applicabile

**Dati per ogni tipo:**
- **Visita**: "Visita del {data}" — peso {kg}, BF {%}, BMI {val}
- **Piano dieta**: "Piano {nome}" — {kcal} kcal, {numVariants} varianti
- **Nota**: "{contenuto}" (troncato a 200 char)
- **Integratore**: "Aggiunto {nome}" — dosaggio, timing

### 3. Quick-add nota

Sopra la timeline, un campo di testo inline + dropdown categoria + bottone "Aggiungi":

```
[Scrivi una nota rapida...]  [Categoria v]  [+ Aggiungi]
```

Server action: `createPatientNote(patientId, content, category)`

### 4. Integrazione nella pagina paziente

Nella pagina `patients/[patientId]/page.tsx`:
- Aggiungere tab "Timeline" accanto ai contenuti esistenti (usare il componente `Tabs` gia' disponibile)
- Tab "Panoramica" = vista attuale (metriche, grafici, liste)
- Tab "Timeline" = nuova timeline cronologica
- Tab "Note" = solo le note cliniche con filtro per categoria

### 5. Pin note

Le note con `isPinned: true` appaiono sempre in cima alla timeline, indipendentemente dalla data. Utile per allergie, patologie, avvertenze.

## File da modificare/creare

| File | Azione |
|------|--------|
| `prisma/schema.prisma` | Aggiungere model PatientNote |
| Nuovo: `src/features/patient-notes/actions.ts` | createNote, updateNote, deleteNote, togglePin |
| Nuovo: `src/components/patients/patient-timeline.tsx` | Componente timeline |
| Nuovo: `src/components/patients/quick-note-form.tsx` | Form inline nota rapida |
| `src/app/(dashboard)/patients/[patientId]/page.tsx` | Ristrutturare con Tabs |
| Nuovo: `src/validations/patient-note.ts` | Schema Zod |

## Perche' Claude Code

- Ristrutturazione della pagina paziente esistente (419 righe) in layout a tab
- Nuovo model Prisma con relazioni
- Query che combina 4 tabelle diverse ordinate cronologicamente
- Decisioni su come fondere dati eterogenei in un'unica timeline

## Acceptance Criteria

- [x] Timeline mostra visite, piani e note in ordine cronologico
- [x] Icone e colori distinti per tipo evento
- [x] Quick-add nota rapida funzionante
- [x] Note pinnate appaiono in cima
- [x] Pagina paziente con tab Panoramica / Timeline / Note
- [x] Navigazione a dettaglio da ogni evento nella timeline
- [x] Nessuna regressione sulla vista panoramica esistente
