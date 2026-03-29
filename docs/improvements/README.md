# Piano Migliorie NutriPlan

Benchmark: Nutrium, Practice Better, Healthie, That Clean Life, Cronometer Pro, NutriAdmin.

## Struttura

Ogni work package (WP) e' indipendente e puo' essere assegnato a un agente diverso.
I file `WP-XX.md` contengono specifiche complete: contesto, file coinvolti, schema DB, acceptance criteria.

## Assegnazione agenti

| Simbolo | Agente consigliato | Motivazione |
|---------|-------------------|-------------|
| **CC** | Claude Code | Richiede contesto ampio, multi-file, decisioni architetturali, integrazione |
| **CX** | Codex | Task isolato, input/output chiari, singolo componente o funzione |

## Priorita' e work packages

### P0 - Quick wins ad alto impatto

| WP | Titolo | Agente | Effort | File principali |
|----|--------|--------|--------|-----------------|
| [WP-01](WP-01-dashboard-widgets.md) | Dashboard smart widgets [x] | CC | Medio | page.tsx (dashboard), metric-card.tsx |
| [WP-02](WP-02-shareable-plan-link.md) | Link condivisibile piano dieta [x] | CC | Basso | nuovo route + page pubblica |
| [WP-03](WP-03-command-palette.md) | Command palette globale (Cmd+K) [x] | CX | Basso | command.tsx, header.tsx, layout.tsx |

### P1 - Feature strategiche

| WP | Titolo | Agente | Effort | File principali |
|----|--------|--------|--------|-----------------|
| [WP-04](WP-04-meal-plan-templates.md) | Template e auto-suggest meal plan [x] | CC | Alto | wizard/, actions.ts, schema.prisma |
| [WP-05](WP-05-branded-pdf.md) | Report PDF brandizzato + grafici [x] | CX | Medio | lib/pdf/renderers/, report-generator.tsx |
| [WP-06](WP-06-patient-timeline.md) | Timeline paziente unificata [x] | CC | Medio | patients/[patientId]/page.tsx, schema.prisma |
| [WP-07](WP-07-notifications.md) | Sistema notifiche in-app [x] | CC | Medio | header.tsx, schema.prisma, nuovo componente |

### P2 - Miglioramenti UX

| WP | Titolo | Agente | Effort | File principali |
|----|--------|--------|--------|-----------------|
| [WP-08](WP-08-recipes-enhancement.md) | Ricette: foto, istruzioni, tag [x] | CX | Basso | recipe-form.tsx, schema.prisma, recipes/page.tsx |
| [WP-09](WP-09-patient-goals.md) | Obiettivi paziente con progress [x] | CX | Basso | patients/[patientId]/page.tsx, schema.prisma |
| [WP-10](WP-10-shopping-list.md) | Lista della spesa automatica [x] | CX | Medio | meal-plans/[planId]/page.tsx, nuovo util |

### P3 - Feature avanzate (fase 2)

| WP | Titolo | Agente | Effort | File principali |
|----|--------|--------|--------|-----------------|
| [WP-11](WP-11-scheduling.md) | Scheduling e appuntamenti [x] | CC | Alto | nuovo modulo, schema.prisma |
| [WP-12](WP-12-patient-portal.md) | Portale paziente completo | CC | Molto alto | nuovo modulo app, auth, schema.prisma |

## Ordine di esecuzione consigliato

```text
Fase 1 (parallelo):  WP-01 (CC) + WP-03 (CX) + WP-05 (CX)
Fase 2 (parallelo):  WP-02 (CC) + WP-08 (CX) + WP-09 (CX)
Fase 3 (parallelo):  WP-06 (CC) + WP-10 (CX)
Fase 4 (sequenziale): WP-04 (CC) - dipende da WP-08 per i tag ricette
Fase 5 (parallelo):  WP-07 (CC) + WP-11 (CC)
Fase 6:              WP-12 (CC) - dipende da WP-02
```

## Convenzioni per tutti i WP

- Server actions in `src/features/<domain>/actions.ts`
- Validazione con Zod in `src/validations/`
- Componenti UI su `@base-ui/react`, no `asChild`, usare `render` prop
- Naming italiano per enum e label UI
- Multi-tenancy: filtrare sempre per `professionalId`
- Leggere la doc Next.js in `node_modules/next/dist/docs/` prima di modificare codice Next
- Test manuale dopo ogni WP
