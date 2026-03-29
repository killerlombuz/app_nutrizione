# WP-11: Scheduling e Appuntamenti

**Agente:** Claude Code (CC)
**Priorita:** P3 | **Effort:** Alto | **Dipendenze:** Nessuna

## Contesto

Tutti i competitor principali (Practice Better, Healthie, NutriAdmin, Nutrium) offrono un sistema di scheduling integrato con calendario, reminder e booking link. NutriPlan non ha nessuna gestione appuntamenti.

## Obiettivo

Aggiungere un modulo appuntamenti con calendario settimanale/mensile, slot configurabili, e link di prenotazione.

## Specifiche

### 1. Schema DB

```prisma
model Appointment {
  id              String    @id @default(cuid())
  professionalId  String
  patientId       String?   // null = slot bloccato/personale
  title           String?
  date            DateTime
  startTime       String    // "09:00" — HH:mm
  endTime         String    // "09:30" — HH:mm
  duration        Int       @default(30)  // minuti
  status          String    @default("scheduled") // "scheduled", "completed", "cancelled", "no_show"
  type            String?   // "prima_visita", "controllo", "consegna_piano", "altro"
  notes           String?
  createdAt       DateTime  @default(now())

  professional    Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  patient         Patient?     @relation(fields: [patientId], references: [id], onDelete: SetNull)
  @@index([professionalId, date])
  @@index([patientId])
}

model WorkingHours {
  id              String   @id @default(cuid())
  professionalId  String
  dayOfWeek       Int      // 0=dom, 1=lun, ..., 6=sab
  startTime       String   // "09:00"
  endTime         String   // "18:00"
  slotDuration    Int      @default(30)  // minuti
  isActive        Boolean  @default(true)

  professional    Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  @@unique([professionalId, dayOfWeek])
}
```

### 2. Pagina calendario

Nuova route: `src/app/(dashboard)/calendar/page.tsx`

**Vista settimanale** (default):
- Griglia oraria (7:00-20:00) × 7 giorni
- Appuntamenti come blocchi colorati per tipo
- Click su slot vuoto → dialog nuovo appuntamento
- Click su appuntamento → dialog dettaglio/modifica

**Vista mensile**:
- Griglia mensile con indicatore numerico appuntamenti per giorno
- Click su giorno → zoom su vista giornaliera

**Vista giornaliera**:
- Colonna singola con tutti gli slot
- Dettaglio completo per ogni appuntamento

### 3. Dialog nuovo appuntamento

Campi:
- Data (pre-compilata dal click)
- Orario inizio/fine
- Paziente (autocomplete — riutilizzare la ricerca di WP-03 o /api/patients/search)
- Tipo (prima visita, controllo, consegna piano, altro)
- Note

### 4. Configurazione orari di lavoro

In settings (`src/app/(dashboard)/settings/page.tsx`):
- Sezione "Orari di lavoro"
- Per ogni giorno della settimana: attivo/inattivo, orario inizio, orario fine, durata slot
- Default: lun-ven 9:00-18:00, slot 30min

### 5. Navigazione

Aggiungere "Agenda" al gruppo "Clinica" nella sidebar, sotto "Pazienti":

```
Clinica
  Dashboard
  Pazienti
  Agenda       ← NUOVO
```

### 6. Widget dashboard (collegato a WP-01)

Se WP-01 e' completato, aggiungere widget "Prossimi appuntamenti" nella dashboard:
- Lista dei prossimi 5 appuntamenti con paziente, ora, tipo
- Link rapido a ogni appuntamento

### 7. Link prenotazione pubblica (fase 2)

Creare pagina pubblica `/booking/[professionalId]`:
- Mostra slot disponibili (basati su WorkingHours meno Appointment esistenti)
- Il paziente sceglie uno slot
- Crea Appointment con status "scheduled"
- Conferma via pagina di ringraziamento

## File da creare/modificare

| File | Azione |
|------|--------|
| `prisma/schema.prisma` | Model Appointment + WorkingHours |
| Nuovo: `src/app/(dashboard)/calendar/page.tsx` | Pagina calendario |
| Nuovo: `src/components/calendar/` | Componenti calendario (week-view, month-view, day-view, appointment-dialog) |
| Nuovo: `src/features/appointments/actions.ts` | CRUD appuntamenti |
| Nuovo: `src/features/working-hours/actions.ts` | CRUD orari lavoro |
| `src/components/layout/sidebar.tsx` | Aggiungere voce "Agenda" |
| `src/app/(dashboard)/settings/page.tsx` | Sezione orari di lavoro |
| Nuovo: `src/validations/appointment.ts` | Schema Zod |

## Perche' Claude Code

- Modulo completamente nuovo con molteplici componenti interrelati
- UI calendario complessa con gestione stato, drag, resize
- Integrazione con sidebar, dashboard, settings
- Schema DB con vincoli di unicita' e logica di slot disponibili
- Decisioni architetturali sulla gestione fusi orari

## Acceptance Criteria

- [x] Pagina calendario con vista settimanale, mensile, giornaliera
- [x] CRUD appuntamenti con dialog
- [x] Configurazione orari di lavoro in settings
- [x] Voce "Agenda" nella sidebar
- [x] Appuntamenti collegati a pazienti
- [x] Status tracking (schedulato, completato, cancellato, no-show)
- [x] Nessuna sovrapposizione di appuntamenti consentita

## Implementazione

**Completato il 2026-03-29.**

### File creati

| File | Descrizione |
|------|-------------|
| `prisma/schema.prisma` | Model `Appointment` + `WorkingHours` con relazioni verso `Professional` e `Patient` |
| `src/validations/appointment.ts` | Schema Zod con validazione HH:mm e status enum |
| `src/validations/working-hours.ts` | Schema Zod per orari di lavoro |
| `src/features/appointments/actions.ts` | CRUD: create/update/delete + controllo sovrapposizioni |
| `src/features/working-hours/actions.ts` | Upsert singolo e bulk per orari di lavoro |
| `src/components/calendar/types.ts` | Tipi condivisi, costanti colori per tipo/status, griglia oraria |
| `src/components/calendar/appointment-dialog.tsx` | Dialog creazione/modifica con autocomplete paziente |
| `src/components/calendar/appointment-card.tsx` | Card colorata per appuntamento in griglia |
| `src/components/calendar/week-view.tsx` | Vista settimanale 7:00-20:00 con blocchi posizionati |
| `src/components/calendar/month-view.tsx` | Vista mensile con badge per giorno |
| `src/components/calendar/day-view.tsx` | Vista giornaliera con dettaglio completo |
| `src/components/calendar/calendar-shell.tsx` | Orchestratore client: navigazione, viste, dialog |
| `src/app/(dashboard)/calendar/page.tsx` | Pagina server con fetch per range di date |
| `src/components/settings/working-hours-form.tsx` | Form interattivo per configurare orari giornalieri |
| `src/components/dashboard/upcoming-appointments-widget.tsx` | Widget dashboard prossimi 5 appuntamenti |

### File modificati

| File | Modifica |
|------|----------|
| `prisma/schema.prisma` | Aggiunte relazioni `appointments` e `workingHours` a `Professional` e `Patient` |
| `src/components/layout/sidebar.tsx` | Aggiunta voce "Agenda" nel gruppo Pazienti con icona `CalendarDays` |
| `src/app/(dashboard)/settings/page.tsx` | Aggiunta sezione "Orari di lavoro" con `WorkingHoursForm` |
| `src/app/(dashboard)/page.tsx` | Aggiunto widget `UpcomingAppointmentsWidget` e query prossimi appuntamenti |

### Note architetturali

- La pagina `/calendar` è un server component che legge `searchParams` (`view`, `date`) e fetcha gli appuntamenti per il range corrente
- `CalendarShell` è client e usa `router.push` per navigare (cambia URL → re-render del server component con nuovi dati)
- Il controllo sovrapposizioni avviene lato server nella action `createAppointment`/`updateAppointment`
- La griglia temporale copre 07:00-20:00 (costanti `GRID_START_HOUR`, `GRID_END_HOUR`, `HOUR_HEIGHT_PX` in `types.ts`)
- Colori per tipo appuntamento: emerald=prima visita, blue=controllo, amber=consegna piano, violet=altro
