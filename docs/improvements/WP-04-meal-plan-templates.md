# WP-04: Template e Auto-suggest Meal Plan

**Agente:** Claude Code (CC)
**Priorita:** P1 | **Effort:** Alto | **Dipendenze:** WP-08 (tag ricette, opzionale)

## Contesto

Il wizard meal plan (`src/components/meal-plans/wizard/`, 4 step) e' completo ma interamente manuale. Il professionista deve selezionare ogni alimento uno per uno. I competitor (That Clean Life, Nutrium, NutriAdmin) generano piani automaticamente dato un target kcal/macro.

## Obiettivo

1. Creare un sistema di template pre-configurati da cui partire
2. Aggiungere auto-suggest degli alimenti basato su target kcal e distribuzione macro

## Specifiche

### 1. Template piani dieta

Nuovo model Prisma:

```prisma
model MealPlanTemplate {
  id              String   @id @default(cuid())
  professionalId  String?  // null = template di sistema
  name            String
  description     String?
  dietType        String?  // "mediterranea", "low-carb", "iperproteica", "vegetariana", "vegana"
  pctBreakfast    Float    @default(0.17)
  pctLunch        Float    @default(0.45)
  pctDinner       Float    @default(0.25)
  pctSnack1       Float    @default(0.065)
  pctSnack2       Float    @default(0.065)
  pctSnack3       Float    @default(0.0)
  meals           MealPlanTemplateMeal[]
  createdAt       DateTime @default(now())

  professional    Professional? @relation(fields: [professionalId], references: [id])
  @@index([professionalId])
}

model MealPlanTemplateMeal {
  id            String   @id @default(cuid())
  templateId    String
  mealType      MealType
  foods         MealPlanTemplateFood[]

  template      MealPlanTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
}

model MealPlanTemplateFood {
  id                String   @id @default(cuid())
  templateMealId    String
  foodCategory      FoodCategory  // categoria, non alimento specifico
  portionType       String        // "carbs_source", "protein_source", "fat_source", "vegetable"
  isFixed           Boolean  @default(false)
  sortOrder         Int      @default(0)

  templateMeal      MealPlanTemplateMeal @relation(fields: [templateMealId], references: [id], onDelete: Cascade)
}
```

### 2. Template di sistema (seed)

Aggiungere al seed 4-5 template standard:
- **Mediterranea**: colazione cereali+latte, pranzo pasta+proteine+verdure, cena proteine+verdure
- **Low-carb**: colazione uova+frutta, pranzo proteine+verdure, cena proteine+verdure
- **Iperproteica**: distribuzione proteine alta su tutti i pasti
- **Vegetariana**: legumi come fonte proteica

### 3. Step 0 del wizard: scelta template

Inserire uno step iniziale prima di "Info & kcal":

```
[Parti da zero]  [Mediterranea]  [Low-carb]  [Iperproteica]  [Vegetariana]
                 [I miei template...]
```

Se il professionista sceglie un template:
- Pre-popola le % di distribuzione (step 2)
- Pre-popola le categorie di alimenti per pasto (step 3)
- Il professionista puo' modificare tutto

### 4. Auto-suggest alimenti (step 3)

Quando il professionista aggiunge un pasto, suggerire alimenti dal database basandosi su:
- Categoria richiesta dal template (es. CEREALI per fonte carbo)
- Target kcal del pasto
- Allergie/intolleranze del paziente (flag FODMAP, nichel, glutine, lattosio dal model `PatientCondition`)

```typescript
// Logica auto-suggest
async function suggestFoods(params: {
  category: FoodCategory;
  targetKcal: number;
  excludeFodmap?: boolean;
  excludeNickel?: boolean;
  requireGlutenFree?: boolean;
  requireLactoseFree?: boolean;
  professionalId: string;
}): Promise<SuggestedFood[]> {
  // Query foods filtrati per categoria e allergie
  // Calcola grammi per raggiungere target kcal
  // Ritorna top 5 suggerimenti con grammi pre-calcolati
}
```

UI: Nella selezione alimenti, mostrare una sezione "Suggeriti" sopra la ricerca manuale, con chip cliccabili.

### 5. "Salva come template"

Nella pagina di visualizzazione del piano (`meal-plans/[planId]/page.tsx`), aggiungere un bottone "Salva come template" che estrae la struttura del piano in un `MealPlanTemplate` personale.

## File da modificare/creare

| File | Azione |
|------|--------|
| `prisma/schema.prisma` | Nuovi model: MealPlanTemplate, MealPlanTemplateMeal, MealPlanTemplateFood |
| `prisma/seed.ts` | Aggiungere template di sistema |
| Nuovo: `src/features/meal-plan-templates/actions.ts` | CRUD template |
| Nuovo: `src/components/meal-plans/wizard/step-template.tsx` | Step 0 scelta template |
| `src/components/meal-plans/wizard/` (vari) | Integrare pre-compilazione da template |
| Nuovo: `src/app/api/foods/suggest/route.ts` | API auto-suggest |
| `src/app/(dashboard)/patients/[patientId]/meal-plans/[planId]/page.tsx` | Bottone "Salva come template" |

## Perche' Claude Code

- Modifica architetturale del wizard (aggiunta step)
- Nuovi model Prisma con relazioni
- Logica di business complessa (auto-suggest con calcolo porzioni)
- Integrazione profonda con il sistema esistente
- Seed data

## Acceptance Criteria

- [x] Wizard mostra step 0 con scelta template o "parti da zero"
- [x] Template pre-compila distribuzione % e categorie alimenti
- [x] Auto-suggest mostra alimenti filtrati per categoria e allergie paziente
- [x] Auto-suggest calcola grammi per raggiungere target kcal
- [x] "Salva come template" funziona dalla vista piano
- [x] Template di sistema presenti nel seed
- [x] Il professionista puo' modificare tutto dopo la pre-compilazione
