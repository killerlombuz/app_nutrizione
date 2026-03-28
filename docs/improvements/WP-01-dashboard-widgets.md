# WP-01: Dashboard Smart Widgets

**Agente:** Claude Code (CC)
**Priorita:** P0 | **Effort:** Medio | **Dipendenze:** Nessuna

## Contesto

La dashboard attuale (`src/app/(dashboard)/page.tsx`, ~256 righe) mostra solo:
- 4 metric card statiche (pazienti, visite, piani, alimenti)
- Lista ultimi 5 pazienti
- Grafico trend visite 6 mesi

I competitor (Nutrium, Practice Better, NutriAdmin) mostrano widget azionabili:
pazienti da ricontattare, piani in scadenza, task del giorno, KPI clinici.

## Obiettivo

Trasformare la dashboard da "riassunto statico" a "centro operativo" con widget smart.

## Specifiche

### 1. Widget "Pazienti da ricontattare"

Mostrare pazienti la cui ultima visita e' piu' vecchia di 30 giorni.

```sql
-- Query logica
SELECT p.id, p.name, MAX(v.date) as lastVisit
FROM Patient p
LEFT JOIN Visit v ON v.patientId = p.id
WHERE p.professionalId = :profId
GROUP BY p.id
HAVING MAX(v.date) < NOW() - INTERVAL '30 days'
   OR MAX(v.date) IS NULL
ORDER BY lastVisit ASC NULLS FIRST
LIMIT 5
```

UI: Card con lista, ogni riga ha nome + "ultima visita X giorni fa" + link rapido a nuova visita.

### 2. Widget "Piani dieta in scadenza"

Piani creati da piu' di 30 giorni senza un piano piu' recente per lo stesso paziente.

```sql
-- Query logica
SELECT mp.id, mp.name, mp.date, p.name as patientName
FROM MealPlan mp
JOIN Patient p ON p.id = mp.patientId
WHERE p.professionalId = :profId
AND mp.date < NOW() - INTERVAL '30 days'
AND NOT EXISTS (
  SELECT 1 FROM MealPlan mp2
  WHERE mp2.patientId = mp.patientId AND mp2.date > mp.date
)
ORDER BY mp.date ASC
LIMIT 5
```

UI: Card con lista, ogni riga ha paziente + nome piano + "creato X giorni fa" + link a nuovo piano.

### 3. Quick Actions Bar

Barra di azioni rapide sopra i widget:

```
[+ Nuovo Paziente]  [+ Nuova Visita]  [+ Nuovo Piano]  [+ Nuova Ricetta]
```

Per "Nuova Visita" e "Nuovo Piano" serve selezionare il paziente: aprire un dialog con ricerca paziente, poi redirect.

### 4. KPI Cards migliorate

Sostituire le 4 card statiche con:
- **Pazienti attivi** (con visita negli ultimi 60gg) / totale — mostrare trend vs mese precedente
- **Visite questo mese** — con confronto mese precedente (+/- %)
- **Piani attivi** (creati negli ultimi 30gg)
- **Prossima scadenza** — quanti giorni al piano piu' vecchio da rinnovare

## File da modificare

| File | Azione |
|------|--------|
| `src/app/(dashboard)/page.tsx` | Riscrivere query + layout |
| `src/components/layout/metric-card.tsx` | Aggiungere prop `trend` (+/- %) |
| Nuovo: `src/components/dashboard/follow-up-widget.tsx` | Widget pazienti da ricontattare |
| Nuovo: `src/components/dashboard/expiring-plans-widget.tsx` | Widget piani in scadenza |
| Nuovo: `src/components/dashboard/quick-actions.tsx` | Barra azioni rapide |
| Nuovo: `src/components/dashboard/patient-search-dialog.tsx` | Dialog ricerca paziente per quick action |

## Perche' Claude Code

Richiede:
- Riscrittura del server component principale con query Prisma complesse
- Integrazione con il layout esistente e i pattern di navigazione (PendingLink)
- Decisioni architetturali su dove mettere i dialog client-side in un contesto server
- Coordinamento multi-file

## Acceptance Criteria

- [ ] Dashboard mostra widget "Pazienti da ricontattare" con link operativi
- [ ] Dashboard mostra widget "Piani in scadenza" con link operativi
- [ ] Quick actions bar funzionante con dialog ricerca paziente
- [ ] Metric card mostrano trend % vs mese precedente
- [ ] Nessuna regressione sulle funzionalita' esistenti
- [ ] Performance: la pagina carica in <2s (query parallele)
