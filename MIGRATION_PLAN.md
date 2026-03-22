# Piano di Migrazione: NutriPlan Flask → Next.js

## Contesto

NutriPlan è un gestionale per nutrizionisti costruito in Flask + SQLite. Gestisce pazienti, visite con misure antropometriche (plicometria JP3/JP7, circonferenze), database di 282 alimenti, piani dietetici con wizard 5-step, e report PDF con ReportLab. L'app è usata durante visite reali e deve privilegiare velocità di inserimento dati, affidabilità dei calcoli scientifici e PDF professionali.

**Motivazione della migrazione**: passare a uno stack moderno (Next.js + TypeScript + PostgreSQL + Supabase) per abilitare autenticazione, multi-tenancy, deploy cloud, e futura monetizzazione SaaS.

---

## Assessment Progetto Esistente

### Struttura Flask
- **1 monolite** `app.py` con 23 route (nessun Blueprint)
- **5 moduli di calcolo** in `calculations/` (body_composition, metabolism, macros, meal_planner, sport)
- **6 modelli CRUD** in `models/` (client, food, measurement, diet_plan, meal, recipe)
- **14 tabelle SQLite** in `database/schema.py`
- **12 template Jinja2** in `templates/`
- **PDF ReportLab** con 7 sezioni in `pdf/`
- **Wizard JS** da ~500 righe in `static/js/diet-wizard.js`
- **Nessuna autenticazione**
- **Dipendenze**: Flask, openpyxl, reportlab, matplotlib, Pillow

### Punti critici da preservare
- JP3 donna: costante `1.10994921` (non `1.0994921`)
- Siri donna JP3: coefficiente `501` (non `495`)
- JP7: formula identica M/F, costante `1.112`
- Calcolo età: `Math.floor(diffMs / (365.25 * 86400000))`
- 3 varianti kcal: rest, workout1, workout2
- Grammi pasti: verdure 200g + olio 10ml fissi, carbo 54%, proteine resto

---

## Stack Target

| Componente | Tecnologia |
|-----------|-----------|
| Frontend | Next.js 15 App Router + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| PDF | Playwright (HTML/CSS → PDF) |
| Validazione | Zod |
| Forms | React Hook Form |

---

## Schema Prisma — Mapping SQLite → PostgreSQL

| SQLite | Prisma Model | Note |
|--------|-------------|------|
| clients | Patient | Rinominato; aggiunto `professionalId` per multi-tenancy |
| measurements | Visit | Contiene plicometria + circonferenze + calcolati |
| foods | Food | `professionalId` nullable (null = globale seed) |
| diet_plans | MealPlan | Rinominato |
| meal_templates | MealTemplate | Invariato |
| meal_options | MealOption | Invariato |
| weekly_examples | WeeklyExample | Invariato |
| activity_levels | ActivityLevel | Invariato |
| sport_activities | SportActivity | Invariato |
| body_fat_reference | BodyFatReference | Invariato |
| recipes | Recipe | Aggiunto `professionalId` |
| recipe_ingredients | RecipeIngredient | Invariato |
| dietary_instructions | DietaryInstruction | Aggiunto `professionalId` |
| supplements | Supplement | Aggiunto `professionalId` |
| client_supplements | PatientSupplement | Segue renaming |
| client_conditions | PatientCondition | Segue renaming |
| — (nuovo) | Professional | Multi-tenancy: legato a Supabase Auth |

**Decisioni chiave**:
- ID `cuid()` invece di autoincrement (non enumerable, distribuito)
- Enum PostgreSQL per `Gender`, `MealType`, `FoodCategory`
- Nomi enum in italiano (COLAZIONE, PRANZO, ecc.) perché sono termini di dominio
- `foodName` denormalizzato in MealOption per evitare JOIN nei piani/PDF

---

## Struttura Progetto Next.js

```
nutriplan/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                    # 5 activity_levels, 29 sport, 282 foods
│   └── migrations/
├── scripts/
│   └── migrate-sqlite.ts         # Import dati da SQLite
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx         # Sidebar + header
│   │   │   ├── page.tsx           # Dashboard stats
│   │   │   ├── patients/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [patientId]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── edit/page.tsx
│   │   │   │       ├── visits/new/page.tsx
│   │   │   │       ├── visits/[visitId]/edit/page.tsx
│   │   │   │       ├── meal-plans/page.tsx
│   │   │   │       ├── meal-plans/new/page.tsx
│   │   │   │       ├── meal-plans/[planId]/page.tsx
│   │   │   │       ├── meal-plans/[planId]/edit/page.tsx
│   │   │   │       └── report/page.tsx
│   │   │   ├── foods/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [foodId]/edit/page.tsx
│   │   │   ├── recipes/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [recipeId]/edit/page.tsx
│   │   │   └── settings/page.tsx
│   │   └── api/
│   │       ├── foods/route.ts                        # GET search
│   │       ├── foods/[foodId]/route.ts
│   │       ├── patients/[patientId]/metabolism/route.ts
│   │       ├── meal-plans/calculate-grams/route.ts
│   │       ├── report/[patientId]/route.ts           # GET → PDF
│   │       └── import/route.ts
│   ├── components/
│   │   ├── ui/                    # shadcn/ui
│   │   ├── layout/ (sidebar, header, breadcrumb)
│   │   ├── patients/ (form, card, list)
│   │   ├── visits/ (form, measurement-fields, body-composition-card)
│   │   ├── foods/ (form, search, table)
│   │   ├── meal-plans/
│   │   │   └── wizard/ (container, 5 step components, use-wizard-state hook)
│   │   ├── report/
│   │   │   └── pdf-template/ (7 sezioni React per HTML→PDF)
│   │   └── shared/ (data-table, confirm-dialog, stats-card)
│   ├── features/
│   │   ├── patients/actions.ts
│   │   ├── visits/actions.ts
│   │   ├── foods/actions.ts
│   │   ├── meal-plans/actions.ts
│   │   ├── recipes/actions.ts
│   │   └── report/actions.ts
│   ├── lib/
│   │   ├── db.ts                  # Prisma singleton
│   │   ├── auth.ts                # getCurrentProfessional()
│   │   ├── supabase/ (client.ts, server.ts, middleware.ts)
│   │   ├── calculations/
│   │   │   ├── body-composition.ts   # JP3, JP7, Siri, BMI
│   │   │   ├── metabolism.ts         # BMR, TDEE
│   │   │   ├── macros.ts            # Range macro g/kg
│   │   │   ├── meal-planner.ts      # Grammi pasti
│   │   │   └── sport.ts            # Kcal sport, BCAA
│   │   ├── pdf/generator.ts
│   │   ├── storage.ts
│   │   ├── food-emoji.ts
│   │   └── constants.ts
│   ├── validations/ (patient.ts, visit.ts, food.ts, meal-plan.ts)
│   ├── types/ (patient.ts, visit.ts, food.ts, meal-plan.ts)
│   └── middleware.ts              # Auth guard
```

---

## Route Mapping Flask → Next.js

| Flask | Next.js | Tipo |
|-------|---------|------|
| `GET /` | `(dashboard)/page.tsx` | RSC |
| `GET/POST /clients/new` | `patients/new/page.tsx` + `createPatient` action | Page + Server Action |
| `GET /clients/<id>` | `patients/[patientId]/page.tsx` | RSC |
| `GET/POST /clients/<id>/edit` | `patients/[patientId]/edit/page.tsx` + `updatePatient` | Page + SA |
| `POST /clients/<id>/delete` | `deletePatient` action | Server Action |
| `GET/POST .../measurements/new` | `visits/new/page.tsx` + `createVisit` | Page + SA |
| `GET /foods` | `foods/page.tsx` | RSC |
| `GET/POST /clients/<id>/diets/new` | `meal-plans/new/page.tsx` + `saveMealPlan` | Client Page + SA |
| `GET /diets/<id>/preview` | `meal-plans/[planId]/page.tsx` | RSC |
| `GET /clients/<id>/report/pdf` | `api/report/[patientId]/route.ts` | Route Handler |
| `GET /api/foods/search` | `api/foods/route.ts` | Route Handler |
| `GET /api/clients/<id>/metabolism` | `api/patients/[patientId]/metabolism/route.ts` | Route Handler |
| `POST /api/diets/calculate-grams` | `api/meal-plans/calculate-grams/route.ts` | Route Handler |

---

## Fasi di Implementazione

### FASE 0 — Scaffolding [ALTA]
1. `npx create-next-app@latest nutriplan --typescript --tailwind --eslint --app --src-dir`
2. Installare: prisma, @prisma/client, @supabase/supabase-js, @supabase/ssr, zod, react-hook-form, @hookform/resolvers
3. `npx shadcn@latest init` + componenti base (button, input, card, dialog, form, select, table, tabs, badge, toast, command, separator)
4. Creare `prisma/schema.prisma` con schema completo
5. Creare `src/lib/db.ts` (Prisma singleton)
6. Creare `.env.example`

### FASE 1 — Auth + Layout [ALTA]
1. Configurare Supabase (client.ts, server.ts)
2. `src/middleware.ts` — protezione route
3. Pagine login/register
4. Layout dashboard con sidebar (port di base.html)
5. `src/lib/auth.ts` — `getCurrentProfessional()` con filtro multi-tenant

### FASE 2 — CRUD Pazienti [ALTA]
1. Schema Zod `src/validations/patient.ts`
2. Server Actions `src/features/patients/actions.ts`
3. Pagine lista, nuovo, dettaglio, edit
4. Componenti form e card
5. Dashboard con statistiche

### FASE 3 — Calcoli Body Composition [ALTA — critica]
1. Port `body-composition.ts` — JP3, JP7, Siri con costanti esatte
2. Port `metabolism.ts` — BMR Katch-McArdle, TDEE
3. Port `macros.ts` — range macro g/kg
4. Port `meal-planner.ts` — grammi pasti con costanti (200g verdure, 10ml olio, 54% carbo)
5. Port `sport.ts` — kcal sport, BCAA
6. **Test unitari** con valori noti dal foglio Excel per verificare identità numerica

### FASE 4 — CRUD Visite/Misure [ALTA]
1. Schema Zod per misure
2. Server Actions con calcolo body composition server-side
3. Form con sezioni collassabili (7 pliche + 11 circonferenze)
4. Card composizione corporea con feedback real-time

### FASE 5 — CRUD Alimenti [ALTA]
1. Server Actions + validazione Zod
2. Lista con filtro categoria e ricerca
3. API `/api/foods?q=...` per autocomplete (port di `/api/foods/search`)
4. Port `food-emoji.ts`
5. Seed 282 alimenti da SQLite

### FASE 6 — Wizard Dieta [ALTA — il più complesso]
1. Hook `useWizardState()` — sostituisce variabili globali JS
2. Step 1: Info piano + varianti
3. Step 2: Calcolo metabolismo (API call)
4. Step 3: Distribuzione % pasti
5. Step 4: Selezione alimenti con autocomplete + calcolo grammi
6. Step 5: Esempio settimanale
7. Server Action `saveMealPlan` — transazione Prisma (piano + templates + options + weekly)
8. Preview piano
9. Duplica/elimina piano

### FASE 7 — PDF Report [MEDIA]
1. Template HTML/CSS per 7 sezioni (React → `renderToStaticMarkup`)
2. `src/lib/pdf/generator.ts` — Playwright render
3. API route `/api/report/[patientId]`
4. Pagina configurazione report (checkbox sezioni)
5. Palette colori: sage (#6B8F71), teal (#73BAAD), warm (#D9896C)

### FASE 8 — Ricette + Integratori + Istruzioni [MEDIA]
1. CRUD ricette con ingredienti dinamici
2. Integratori e condizioni per paziente
3. Istruzioni dietetiche

### FASE 9 — Migrazione Dati [MEDIA]
1. Script `scripts/migrate-sqlite.ts` con `better-sqlite3`
2. Mapping ID integer → cuid con tabella di corrispondenza
3. Validazione conteggi prima/dopo

### FASE 10 — Import Excel [BASSA]
1. API upload con `xlsx` (SheetJS)
2. Port logica da `importers/excel_importer.py`

### FASE 11 — Finalizzazione [BASSA]
1. Settings professionista (logo, contatti)
2. README con istruzioni setup
3. MIGRATION_NOTES.md con mapping completo
4. `.env.example` finale

---

## Rischi e Mitigazioni

| Rischio | Priorità | Mitigazione |
|---------|----------|-------------|
| Errore nei calcoli scientifici (JP3/Siri/BMR) | CRITICO | Test unitari con valori Excel. Confronto output Python vs TS |
| Wizard dieta troppo complesso (~500 righe JS) | ALTO | Scomposizione in 5 componenti React + hook stato dedicato |
| Playwright pesante per serverless (Vercel) | MEDIO | Fallback: `@react-pdf/renderer` o Gotenberg container |
| Migrazione dati con perdita relazioni | MEDIO | Script con dry-run, validazione conteggi, mapping ID |
| Naming misto IT/EN | BASSO | Enum domain in italiano, codice in inglese |

---

## File Critici da Leggere Durante Implementazione

- `diet_manager/calculations/body_composition.py` — formule JP3/JP7/Siri
- `diet_manager/calculations/metabolism.py` — BMR, TDEE
- `diet_manager/calculations/meal_planner.py` — costanti e algoritmi grammi
- `diet_manager/app.py` — tutte le 23 route, funzioni `_save_diet_plan`, `_save_meals`
- `diet_manager/static/js/diet-wizard.js` — wizard 5-step (stato, calcoli, salvataggio)
- `diet_manager/database/schema.py` — schema SQLite di riferimento
- `diet_manager/pdf/report_generator.py` — struttura PDF
- `diet_manager/config.py` — colori, naming professionista

---

## Verifica End-to-End

1. **Calcoli**: creare test con dati Sonia Caliendo dal foglio Excel, verificare BMI, %FM, massa grassa/magra
2. **CRUD**: creare paziente → aggiungere visita → verificare calcoli automatici
3. **Wizard**: creare piano dieta → verificare grammi calcolati per 3 varianti
4. **PDF**: generare report → verificare che contenga tutte le 7 sezioni
5. **Auth**: login → accesso dati → logout → verifica che i dati siano isolati per professionista
6. **Migrazione**: importare dati SQLite → contare record → confrontare con originale
