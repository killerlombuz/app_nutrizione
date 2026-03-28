# WP-07: Sistema Notifiche In-App

**Agente:** Claude Code (CC)
**Priorita:** P1 | **Effort:** Medio | **Dipendenze:** Nessuna

## Contesto

L'header (`src/components/layout/header.tsx`) ha un'icona campanella (Bell da lucide-react) che e' un placeholder non funzionale. I competitor (Healthie, Practice Better, Nutrium) hanno sistemi di notifica push/in-app per follow-up, scadenze, messaggi.

## Obiettivo

Implementare un sistema di notifiche in-app che informa il professionista di eventi importanti: pazienti da ricontattare, piani scaduti, nuovi pazienti senza visita.

## Specifiche

### 1. Schema DB

```prisma
model Notification {
  id              String   @id @default(cuid())
  professionalId  String
  type            String   // "follow_up", "plan_expired", "no_visit", "welcome"
  title           String
  message         String
  link            String?  // URL di navigazione
  isRead          Boolean  @default(false)
  createdAt       DateTime @default(now())

  professional    Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  @@index([professionalId, isRead, createdAt])
}
```

### 2. Generazione notifiche

Creare `src/lib/notifications/generate.ts`:

Le notifiche vengono generate **on-demand** quando il professionista carica la dashboard o apre il pannello notifiche. Non serve un cron job.

```typescript
async function generateNotifications(professionalId: string): Promise<void> {
  // 1. Pazienti senza visita da 30+ giorni (se notifica non gia' creata)
  // 2. Piani dieta creati da 30+ giorni senza rinnovo
  // 3. Pazienti creati ma senza nessuna visita (dopo 7 giorni)

  // Per ogni evento, crea notifica solo se non ne esiste gia' una
  // dello stesso tipo per lo stesso soggetto nelle ultime 24h
  // (evita duplicati al refresh)
}
```

### 3. Componente pannello notifiche

Creare `src/components/layout/notification-panel.tsx` ("use client"):

- Dropdown che si apre al click sulla campanella
- Lista notifiche ordinate per data (piu' recenti prima)
- Ogni notifica: icona tipo + titolo + messaggio + tempo relativo ("2 ore fa")
- Click su notifica: segna come letta + naviga al link
- "Segna tutte come lette" in alto
- Badge rosso con contatore non-lette sulla campanella

### 4. API endpoints

**`src/app/api/notifications/route.ts`**
```typescript
// GET — ritorna notifiche (genera se necessario, poi ritorna lista)
// PATCH — segna come lette (body: { ids: string[] } oppure { all: true })
```

### 5. Integrazione header

In `src/components/layout/header.tsx`:
- Sostituire il bottone Bell statico con `<NotificationPanel />`
- Il componente fa fetch delle notifiche al mount
- Badge con contatore non-lette

### 6. Tipi di notifica

| Tipo | Titolo | Messaggio | Link |
|------|--------|-----------|------|
| `follow_up` | "Ricontattare {paziente}" | "Ultima visita {X} giorni fa" | `/patients/{id}` |
| `plan_expired` | "Piano da rinnovare" | "{paziente}: piano '{nome}' ha {X} giorni" | `/patients/{id}/meal-plans/new` |
| `no_visit` | "Paziente senza visite" | "{paziente} registrato {X} giorni fa, nessuna visita" | `/patients/{id}/visits/new` |
| `welcome` | "Benvenuto su NutriPlan" | "Inizia aggiungendo il tuo primo paziente" | `/patients/new` |

## File da modificare/creare

| File | Azione |
|------|--------|
| `prisma/schema.prisma` | Aggiungere model Notification |
| Nuovo: `src/lib/notifications/generate.ts` | Logica generazione notifiche |
| Nuovo: `src/components/layout/notification-panel.tsx` | Componente dropdown notifiche |
| Nuovo: `src/app/api/notifications/route.ts` | API GET + PATCH |
| `src/components/layout/header.tsx` | Integrare NotificationPanel |

## Perche' Claude Code

- Logica di business per la generazione notifiche (query complesse multi-tabella)
- Integrazione con header/layout esistente (server + client component boundary)
- Decisioni architetturali: generazione on-demand vs cron, deduplicazione
- Pattern API nuovo per l'app (PATCH per update batch)

## Acceptance Criteria

- [ ] Campanella nell'header mostra badge con contatore non-lette
- [ ] Click apre dropdown con lista notifiche
- [ ] Notifiche generate per: follow-up 30gg, piani scaduti, pazienti senza visita
- [ ] Click su notifica naviga al link e segna come letta
- [ ] "Segna tutte come lette" funzionante
- [ ] Nessun duplicato al refresh della pagina
- [ ] Notifica "Benvenuto" per nuovi professionisti
