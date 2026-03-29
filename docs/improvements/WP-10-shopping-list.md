# WP-10: Lista della Spesa Automatica

**Agente:** Codex (CX)
**Priorita:** P2 | **Effort:** Medio | **Dipendenze:** Nessuna

## Contesto

That Clean Life e Nutrium generano automaticamente una lista della spesa dal piano dieta settimanale. NutriPlan ha i dati necessari (alimenti con grammi per pasto) ma non offre questa funzionalita'.

## Obiettivo

Generare una lista della spesa aggregata dagli alimenti del piano dieta, raggruppata per categoria alimentare.

## Specifiche

### 1. Utility di calcolo

Creare `src/lib/calculations/shopping-list.ts`:

```typescript
interface ShoppingItem {
  foodId: string | null;
  foodName: string;
  category: FoodCategory | null;
  totalGrams: number;        // somma di tutti i pasti
  meals: string[];           // in quali pasti appare
  perMealGrams: { mealType: string; grams: number }[];
}

interface ShoppingList {
  items: ShoppingItem[];
  planName: string;
  scenario: 'rest' | 'workout1' | 'workout2';
}

function generateShoppingList(
  mealTemplates: MealTemplateWithOptions[],
  scenario: 'rest' | 'workout1' | 'workout2',
  daysCount: number  // default 7
): ShoppingList {
  // 1. Itera tutti i mealTemplate e le loro options
  // 2. Per ogni alimento, prendi i grammi dello scenario scelto
  // 3. Moltiplica per daysCount / 7 (normalizza a settimana)
  // 4. Aggrega per foodId (o foodName se foodId e' null)
  // 5. Raggruppa per categoria
  // 6. Ordina: prima per categoria, poi per nome
  // 7. Per alimenti "fixed" (verdure, olio), calcola totale settimanale
}
```

### 2. Componente lista della spesa

Creare `src/components/meal-plans/shopping-list.tsx` ("use client"):

**Layout:**
```
Lista della Spesa - Piano "Mediterraneo"
Scenario: [Riposo v]  Giorni: [7]

FRUTTA
  - Mele           1400g  (200g x 7)
  - Banana          700g  (100g x 7)

CEREALI
  - Pasta integrale 560g  (80g x 7)
  - Pane di segale  350g  (50g x 7)

CARNE
  - Petto di pollo  840g  (120g x 7)
  ...

[Copia lista]  [Stampa]
```

**Funzionalita':**
- Dropdown per scegliere scenario (riposo, allenamento 1, allenamento 2)
- Input per numero di giorni (default 7)
- Ricalcolo automatico al cambio scenario/giorni
- Bottone "Copia lista" - copia testo plain in clipboard
- Bottone "Stampa" - window.print() con stile dedicato

### 3. Integrazione nella pagina piano

In `src/app/(dashboard)/patients/[patientId]/meal-plans/[planId]/page.tsx`:
- Aggiungere bottone "Lista della spesa" accanto a "Modifica", "Duplica", "PDF"
- Al click: apre un dialog/sheet con il componente ShoppingList
- I dati del piano sono gia' caricati nella pagina (passarli come props)

### 4. Inclusione nel link condivisibile (se WP-02 completato)

Se la pagina pubblica (`/shared/plan/[token]`) esiste:
- Aggiungere sezione "Lista della spesa" in fondo alla pagina pubblica
- Il paziente puo' consultarla direttamente

## File da creare/modificare

| File | Azione |
|------|--------|
| Nuovo: `src/lib/calculations/shopping-list.ts` | Logica di aggregazione |
| Nuovo: `src/components/meal-plans/shopping-list.tsx` | Componente UI |
| `src/app/(dashboard)/patients/[patientId]/meal-plans/[planId]/page.tsx` | Bottone + dialog |

## Perche' Codex

- La utility di calcolo e' una funzione pura con input/output chiari
- Il componente UI e' isolato (riceve dati via props)
- Nessuna query DB necessaria (i dati vengono dal server component padre)
- Pattern dialog/sheet gia' presente nell'app

## Tipi gia' disponibili

Da `src/features/meal-plans/actions.ts` e schema Prisma:
- `MealTemplate` con `mealType`, `options`
- `MealOption` con `foodId`, `foodName`, `gramsRest`, `gramsWorkout1`, `gramsWorkout2`, `isFixed`
- `Food` con `category` (FoodCategory enum)

Da `src/lib/constants.ts`:
- `MEAL_TYPE_LABELS` - label italiane per tipo pasto

## Acceptance Criteria

- [x] Bottone "Lista della spesa" nella pagina piano
- [x] Lista aggregata per categoria alimentare
- [x] Selezione scenario (riposo/allenamento)
- [x] Input giorni con ricalcolo automatico
- [x] Grammi totali = grammi per pasto x giorni
- [x] "Copia lista" copia testo plain in clipboard
- [x] "Stampa" apre dialogo di stampa del browser
- [x] Alimenti duplicati in pasti diversi sono aggregati correttamente
