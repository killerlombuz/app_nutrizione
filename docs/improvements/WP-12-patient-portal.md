# WP-12: Portale Paziente Completo

**Agente:** Claude Code (CC)
**Priorita:** P3 | **Effort:** Molto alto | **Dipendenze:** WP-02 (link condivisibile)

## Contesto

Tutti i competitor di fascia alta (Nutrium, Healthie, Practice Better) offrono un portale o app dedicata per i pazienti. Il paziente puo' vedere il proprio piano, loggare i pasti, messaggiare il nutrizionista e tracciare i progressi. Questo e' il differenziatore principale tra software "basic" e "premium".

WP-02 introduce un link condivisibile read-only. Questo WP lo evolve in un vero portale con login paziente e interazioni bidirezionali.

## Obiettivo

Creare un'area autenticata per i pazienti dove possono: consultare il piano dieta, visualizzare i propri progressi, tenere un diario alimentare, e comunicare con il professionista.

## Specifiche

### 1. Auth paziente

Usare Supabase Auth con un meccanismo separato:
- Il professionista invita il paziente via email
- Il paziente riceve un magic link per impostare la password
- Dopo il login, accede al suo portale personale

Aggiungere al model `Patient`:
```prisma
model Patient {
  // campi esistenti...
  authId          String?  @unique  // Supabase auth ID paziente
  portalEnabled   Boolean  @default(false)
  invitedAt       DateTime?
  lastPortalLogin DateTime?
}
```

### 2. Route group portale

Nuova sezione app completamente separata:

```
src/app/(portal)/
  layout.tsx          — layout minimale con branding professionista
  login/page.tsx      — login paziente
  dashboard/page.tsx  — home portale
  plan/page.tsx       — piano dieta attivo
  progress/page.tsx   — grafici peso, BF%, misure
  diary/page.tsx      — diario alimentare
  messages/page.tsx   — messaggi con professionista
```

### 3. Dashboard portale

Vista semplice per il paziente:
- Card piano attivo con link
- Grafico trend peso (ultime 10 visite)
- Obiettivi con progress bar (se impostati, WP-09)
- Prossimo appuntamento (se WP-11 implementato)
- Messaggi non letti

### 4. Diario alimentare

Nuovo model:

```prisma
model FoodDiary {
  id          String   @id @default(cuid())
  patientId   String
  date        DateTime @default(now())
  mealType    MealType
  description String   // testo libero
  imageUrl    String?  // foto del pasto (opzionale)
  notes       String?
  createdAt   DateTime @default(now())

  patient     Patient  @relation(fields: [patientId], references: [id], onDelete: Cascade)
  @@index([patientId, date])
}
```

Il paziente puo':
- Aggiungere entry per pasto (colazione, pranzo, cena, spuntini)
- Scrivere cosa ha mangiato (testo libero, non da database alimenti)
- Allegare foto (opzionale)
- Il professionista vede le entry nella timeline paziente (WP-06)

### 5. Messaggistica

Nuovo model:

```prisma
model Message {
  id              String   @id @default(cuid())
  conversationId  String   // = patientId (1 conversazione per paziente)
  senderId        String   // professionalId o patientId
  senderType      String   // "professional" | "patient"
  content         String
  isRead          Boolean  @default(false)
  createdAt       DateTime @default(now())

  @@index([conversationId, createdAt])
}
```

**UI professionista:**
- Nuova pagina `/messages` con lista conversazioni (una per paziente)
- Chat view con storico messaggi
- Notifica nella campanella per messaggi non letti (integra WP-07)

**UI paziente:**
- Pagina `/messages` nel portale con chat singola verso il proprio professionista

### 6. Invito paziente

Nella pagina paziente (`patients/[patientId]/page.tsx`):
- Bottone "Invita al portale" (se `portalEnabled = false`)
- Al click: invia magic link via Supabase Auth
- Cambia stato a `portalEnabled = true`, salva `invitedAt`
- Se gia' abilitato, mostra stato e ultimo login

## File da creare/modificare

| File | Azione |
|------|--------|
| `prisma/schema.prisma` | Nuovi campi Patient + model FoodDiary + Message |
| Nuovo: `src/app/(portal)/` | Intera sezione portale (6+ pagine) |
| Nuovo: `src/components/portal/` | Componenti portale |
| Nuovo: `src/features/food-diary/actions.ts` | CRUD diario |
| Nuovo: `src/features/messages/actions.ts` | CRUD messaggi |
| Nuovo: `src/lib/supabase/patient-auth.ts` | Auth per pazienti |
| `src/app/(dashboard)/patients/[patientId]/page.tsx` | Bottone invito |
| `src/components/layout/sidebar.tsx` | Aggiungere "Messaggi" |
| Nuovo: `src/app/(dashboard)/messages/page.tsx` | Chat professionista |

## Perche' Claude Code

- Modulo piu' complesso dell'intero progetto
- Richiede setup auth separato per pazienti
- Architettura nuova sezione app con layout dedicato
- Logica bidirezionale (professionista ↔ paziente)
- Integrazione con WP-02, WP-06, WP-07, WP-09, WP-11
- Decisioni di sicurezza critiche (isolamento dati tra pazienti)

## Sicurezza

- Il paziente vede SOLO i propri dati
- Middleware auth separato per route (portal)
- Il paziente NON puo' accedere a dati di altri pazienti
- Le foto del diario devono essere scansionate/limitate in dimensione
- I messaggi sono visibili solo ai due partecipanti
- Rate limiting sulle API del portale

## Acceptance Criteria

- [ ] Professionista puo' invitare paziente al portale via email
- [ ] Paziente effettua login con magic link / password
- [ ] Dashboard portale mostra piano attivo e progressi
- [ ] Diario alimentare con entry per pasto e foto opzionale
- [ ] Messaggistica bidirezionale funzionante
- [ ] Professionista vede diario nella timeline paziente
- [ ] Isolamento dati: paziente vede solo i propri dati
- [ ] Layout portale distinto dal dashboard professionista
