/**
 * Script migrazione dati: SQLite (Flask) → PostgreSQL (Prisma)
 *
 * Uso:
 *   npx tsx scripts/migrate-sqlite.ts <path-to-sqlite.db> <professionalId>
 *
 * Il professionalId deve corrispondere a un Professional già presente nel DB.
 * Lo script:
 * 1. Legge tutti i dati dal SQLite
 * 2. Mappa gli ID integer → cuid (tabella di corrispondenza in memoria)
 * 3. Inserisce i dati nel PostgreSQL via Prisma
 * 4. Valida i conteggi prima/dopo
 *
 * Flag opzionale --dry-run: mostra i conteggi senza inserire
 */

import Database from "better-sqlite3";
import { PrismaClient, FoodCategory, Gender, MealType } from "../src/generated/prisma/client";
import { createId } from "@paralleldrive/cuid2";

const prisma = new PrismaClient();

// --- Utilità ---

function toDate(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function toFloat(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function toBool(v: unknown): boolean {
  return v === 1 || v === true || v === "1";
}

// Mapping meal_type SQLite → enum Prisma
const MEAL_TYPE_MAP: Record<string, MealType> = {
  COLAZIONE: "COLAZIONE",
  SPUNTINO_MATTINA: "SPUNTINO_MATTINA",
  SPUNTINO_1: "SPUNTINO_MATTINA",
  PRANZO: "PRANZO",
  SPUNTINO_POMERIGGIO: "SPUNTINO_POMERIGGIO",
  SPUNTINO_2: "SPUNTINO_POMERIGGIO",
  CENA: "CENA",
  SPUNTINO_SERA: "SPUNTINO_SERA",
  SPUNTINO_3: "SPUNTINO_SERA",
};

// Mapping category SQLite → enum Prisma
const FOOD_CATEGORY_MAP: Record<string, FoodCategory> = {
  FRUTTA: "FRUTTA",
  "FRUTTA SECCA": "FRUTTA_SECCA",
  FRUTTA_SECCA: "FRUTTA_SECCA",
  "FRUTTA ESSICCATA": "FRUTTA_ESSICCATA",
  FRUTTA_ESSICCATA: "FRUTTA_ESSICCATA",
  VERDURA: "VERDURA",
  "LEGUMI E PROTEINE VEGETALI": "LEGUMI_E_PROTEINE_VEGETALI",
  LEGUMI_E_PROTEINE_VEGETALI: "LEGUMI_E_PROTEINE_VEGETALI",
  "UOVA E ALBUMI": "UOVA_E_ALBUMI",
  UOVA_E_ALBUMI: "UOVA_E_ALBUMI",
  "LATTICINI E SOSTITUTI": "LATTICINI_E_SOSTITUTI",
  LATTICINI_E_SOSTITUTI: "LATTICINI_E_SOSTITUTI",
  CARNE: "CARNE",
  PESCE: "PESCE",
  CEREALI: "CEREALI",
  "CEREALI ELABORATI": "CEREALI_ELABORATI",
  CEREALI_ELABORATI: "CEREALI_ELABORATI",
  "OLI, BURRO E CIOCCOLATA": "OLI_BURRO_E_CIOCCOLATA",
  OLI_BURRO_E_CIOCCOLATA: "OLI_BURRO_E_CIOCCOLATA",
  "JUNK FOOD": "JUNK_FOOD",
  JUNK_FOOD: "JUNK_FOOD",
  ALCOLICI: "ALCOLICI",
  ALTRO: "ALTRO",
};

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const filteredArgs = args.filter((a) => a !== "--dry-run");

  if (filteredArgs.length < 2) {
    console.error("Uso: npx tsx scripts/migrate-sqlite.ts <sqlite.db> <professionalId> [--dry-run]");
    process.exit(1);
  }

  const [sqlitePath, professionalId] = filteredArgs;

  // Verifica professional esiste
  const prof = await prisma.professional.findUnique({ where: { id: professionalId } });
  if (!prof) {
    console.error(`Professional con id "${professionalId}" non trovato nel DB.`);
    process.exit(1);
  }

  console.log(`Migrazione da: ${sqlitePath}`);
  console.log(`Professional: ${prof.name} (${prof.id})`);
  console.log(`Dry run: ${dryRun}`);
  console.log("---");

  const sqlite = new Database(sqlitePath, { readonly: true });

  // Tabelle ID mapping: oldId (int) → newId (cuid)
  const idMap = {
    clients: new Map<number, string>(),
    foods: new Map<number, string>(),
    measurements: new Map<number, string>(),
    dietPlans: new Map<number, string>(),
    mealTemplates: new Map<number, string>(),
    activityLevels: new Map<number, string>(),
    recipes: new Map<number, string>(),
    supplements: new Map<number, string>(),
    instructions: new Map<number, string>(),
  };

  // --- Conteggi sorgente ---
  const counts: Record<string, number> = {};
  for (const table of [
    "clients", "measurements", "foods", "diet_plans", "meal_templates",
    "meal_options", "weekly_examples", "recipes", "recipe_ingredients",
    "dietary_instructions", "supplements", "client_supplements",
    "client_conditions",
  ]) {
    try {
      const row = sqlite.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as { c: number };
      counts[table] = row.c;
    } catch {
      counts[table] = 0;
    }
  }

  console.log("Conteggi sorgente SQLite:");
  for (const [t, c] of Object.entries(counts)) {
    console.log(`  ${t}: ${c}`);
  }
  console.log("---");

  if (dryRun) {
    console.log("Dry run completato. Nessun dato inserito.");
    sqlite.close();
    await prisma.$disconnect();
    return;
  }

  // --- 1. Alimenti ---
  // Cerchiamo prima gli alimenti già presenti (dal seed) per evitare duplicati
  const existingFoods = await prisma.food.findMany({
    where: { OR: [{ professionalId }, { professionalId: null }] },
  });
  const existingFoodNames = new Map(existingFoods.map((f) => [f.name.toLowerCase(), f.id]));

  const sqliteFoods = sqlite.prepare("SELECT * FROM foods").all() as Array<Record<string, unknown>>;
  console.log(`Migrando ${sqliteFoods.length} alimenti...`);

  for (const f of sqliteFoods) {
    const oldId = f.id as number;
    const name = f.name as string;

    // Se esiste già con lo stesso nome, usa quello
    const existingId = existingFoodNames.get(name.toLowerCase());
    if (existingId) {
      idMap.foods.set(oldId, existingId);
      continue;
    }

    const newId = createId();
    idMap.foods.set(oldId, newId);

    const cat = f.category as string | null;
    const mappedCat = cat ? FOOD_CATEGORY_MAP[cat.toUpperCase()] ?? null : null;

    await prisma.food.create({
      data: {
        id: newId,
        professionalId,
        name,
        category: mappedCat,
        kcalPer100g: toFloat(f.kcal_100g) ?? 0,
        fatG: toFloat(f.fat_g) ?? 0,
        satFatG: toFloat(f.sat_fat_g) ?? 0,
        carbG: toFloat(f.carb_g) ?? 0,
        sugarG: toFloat(f.sugar_g) ?? 0,
        proteinG: toFloat(f.protein_g) ?? 0,
        fiberG: toFloat(f.fiber_g) ?? 0,
        isFodmap: toBool(f.is_fodmap),
        isNickel: toBool(f.is_nickel),
        isGlutenFree: toBool(f.is_gluten_free),
        isLactoseFree: toBool(f.is_lactose_free),
        notes: (f.notes as string) || null,
      },
    });
  }
  console.log(`  → ${idMap.foods.size} alimenti mappati`);

  // --- 2. Pazienti ---
  const sqliteClients = sqlite.prepare("SELECT * FROM clients").all() as Array<Record<string, unknown>>;
  console.log(`Migrando ${sqliteClients.length} pazienti...`);

  for (const c of sqliteClients) {
    const oldId = c.id as number;
    const newId = createId();
    idMap.clients.set(oldId, newId);

    const gender = (c.gender as string | null);

    await prisma.patient.create({
      data: {
        id: newId,
        professionalId,
        name: c.name as string,
        birthDate: toDate(c.birth_date as string | null),
        heightCm: toFloat(c.height_cm),
        gender: gender === "M" ? Gender.M : gender === "F" ? Gender.F : null,
        email: (c.email as string) || null,
        phone: (c.phone as string) || null,
        notes: (c.notes as string) || null,
      },
    });
  }
  console.log(`  → ${idMap.clients.size} pazienti creati`);

  // --- 3. Visite / Misure ---
  const sqliteMeasurements = sqlite.prepare("SELECT * FROM measurements").all() as Array<Record<string, unknown>>;
  console.log(`Migrando ${sqliteMeasurements.length} visite...`);

  for (const m of sqliteMeasurements) {
    const oldId = m.id as number;
    const patientId = idMap.clients.get(m.client_id as number);
    if (!patientId) continue;

    const newId = createId();
    idMap.measurements.set(oldId, newId);

    await prisma.visit.create({
      data: {
        id: newId,
        patientId,
        date: toDate(m.date as string) ?? new Date(),
        weightKg: toFloat(m.weight_kg),
        plicChest: toFloat(m.plic_petto),
        plicTricep: toFloat(m.plic_tricipite),
        plicAxillary: toFloat(m.plic_ascella),
        plicSubscapular: toFloat(m.plic_scapola),
        plicSuprailiac: toFloat(m.plic_soprailiaca),
        plicAbdominal: toFloat(m.plic_addominale),
        plicThigh: toFloat(m.plic_coscia),
        circNeck: toFloat(m.circ_collo),
        circChest: toFloat(m.circ_torace),
        circArmRelaxed: toFloat(m.circ_braccio_rilassato),
        circArmFlexed: toFloat(m.circ_braccio_contratto),
        circWaist: toFloat(m.circ_vita),
        circLowerAbdomen: toFloat(m.circ_addome_basso),
        circHips: toFloat(m.circ_fianchi),
        circUpperThigh: toFloat(m.circ_coscia_alta),
        circMidThigh: toFloat(m.circ_coscia_media),
        circLowerThigh: toFloat(m.circ_coscia_bassa),
        circCalf: toFloat(m.circ_polpaccio),
        bmi: toFloat(m.bmi),
        bodyFatPct: toFloat(m.body_fat_pct),
        fatMassKg: toFloat(m.fat_mass_kg),
        leanMassKg: toFloat(m.lean_mass_kg),
        formulaUsed: (m.formula_used as string) || "f_media",
      },
    });
  }
  console.log(`  → ${idMap.measurements.size} visite create`);

  // --- 4. Activity Levels (mapping per diet_plans) ---
  const existingLevels = await prisma.activityLevel.findMany();
  const levelNameMap = new Map(existingLevels.map((l) => [l.name.toLowerCase(), l.id]));

  try {
    const sqliteLevels = sqlite.prepare("SELECT * FROM activity_levels").all() as Array<Record<string, unknown>>;
    for (const l of sqliteLevels) {
      const existingId = levelNameMap.get((l.name as string).toLowerCase());
      if (existingId) {
        idMap.activityLevels.set(l.id as number, existingId);
      }
    }
  } catch {
    // Table might not exist
  }

  // --- 5. Piani Dieta ---
  const sqlitePlans = sqlite.prepare("SELECT * FROM diet_plans").all() as Array<Record<string, unknown>>;
  console.log(`Migrando ${sqlitePlans.length} piani dieta...`);

  for (const p of sqlitePlans) {
    const oldId = p.id as number;
    const patientId = idMap.clients.get(p.client_id as number);
    if (!patientId) continue;

    const newId = createId();
    idMap.dietPlans.set(oldId, newId);

    const actLevelId = p.activity_level_id
      ? idMap.activityLevels.get(p.activity_level_id as number) ?? null
      : null;

    await prisma.mealPlan.create({
      data: {
        id: newId,
        patientId,
        name: (p.name as string) || null,
        date: toDate(p.date as string) ?? new Date(),
        activityLevelId: actLevelId,
        numVariants: (p.num_variants as number) ?? 1,
        totalKcalRest: toFloat(p.total_kcal_rest),
        totalKcalWorkout1: toFloat(p.total_kcal_workout1),
        totalKcalWorkout2: toFloat(p.total_kcal_workout2),
        proteinTargetMin: toFloat(p.protein_target_min),
        proteinTargetMax: toFloat(p.protein_target_max),
        workout1Name: (p.workout1_name as string) || null,
        workout1Kcal: toFloat(p.workout1_kcal),
        workout2Name: (p.workout2_name as string) || null,
        workout2Kcal: toFloat(p.workout2_kcal),
        deficitKcal: toFloat(p.deficit_kcal),
        pctBreakfast: toFloat(p.pct_colazione) ?? 0.17,
        pctLunch: toFloat(p.pct_pranzo) ?? 0.45,
        pctDinner: toFloat(p.pct_cena) ?? 0.25,
        pctSnack1: toFloat(p.pct_spuntino1) ?? 0.065,
        pctSnack2: toFloat(p.pct_spuntino2) ?? 0.065,
        pctSnack3: toFloat(p.pct_spuntino3) ?? 0.0,
        notes: (p.notes as string) || null,
      },
    });
  }
  console.log(`  → ${idMap.dietPlans.size} piani creati`);

  // --- 6. Meal Templates ---
  const sqliteTemplates = sqlite.prepare("SELECT * FROM meal_templates").all() as Array<Record<string, unknown>>;
  console.log(`Migrando ${sqliteTemplates.length} meal templates...`);

  for (const t of sqliteTemplates) {
    const oldId = t.id as number;
    const mealPlanId = idMap.dietPlans.get(t.diet_plan_id as number);
    if (!mealPlanId) continue;

    const newId = createId();
    idMap.mealTemplates.set(oldId, newId);

    const rawType = (t.meal_type as string).toUpperCase();
    const mealType = MEAL_TYPE_MAP[rawType];
    if (!mealType) {
      console.warn(`  Tipo pasto sconosciuto: ${rawType}, skip`);
      continue;
    }

    await prisma.mealTemplate.create({
      data: {
        id: newId,
        mealPlanId,
        mealType,
        sortOrder: (t.sort_order as number) ?? 0,
        kcalRest: toFloat(t.kcal_rest),
        kcalWorkout1: toFloat(t.kcal_workout1),
        kcalWorkout2: toFloat(t.kcal_workout2),
        notes: (t.notes as string) || null,
      },
    });
  }
  console.log(`  → ${idMap.mealTemplates.size} templates creati`);

  // --- 7. Meal Options ---
  const sqliteOptions = sqlite.prepare("SELECT * FROM meal_options").all() as Array<Record<string, unknown>>;
  console.log(`Migrando ${sqliteOptions.length} meal options...`);

  let optCount = 0;
  for (const o of sqliteOptions) {
    const mealTemplateId = idMap.mealTemplates.get(o.meal_template_id as number);
    if (!mealTemplateId) continue;

    const foodId = o.food_id ? idMap.foods.get(o.food_id as number) ?? null : null;

    await prisma.mealOption.create({
      data: {
        mealTemplateId,
        optionGroup: (o.option_group as string) || null,
        foodId,
        foodName: (o.food_name as string) || null,
        gramsRest: toFloat(o.grams_rest),
        gramsWorkout1: toFloat(o.grams_workout1),
        gramsWorkout2: toFloat(o.grams_workout2),
        isFixed: toBool(o.is_fixed),
        sortOrder: (o.sort_order as number) ?? 0,
        notes: (o.notes as string) || null,
      },
    });
    optCount++;
  }
  console.log(`  → ${optCount} options create`);

  // --- 8. Weekly Examples ---
  const sqliteWeekly = sqlite.prepare("SELECT * FROM weekly_examples").all() as Array<Record<string, unknown>>;
  console.log(`Migrando ${sqliteWeekly.length} weekly examples...`);

  let weekCount = 0;
  for (const w of sqliteWeekly) {
    const mealTemplateId = idMap.mealTemplates.get(w.meal_template_id as number);
    if (!mealTemplateId) continue;

    await prisma.weeklyExample.create({
      data: {
        mealTemplateId,
        dayOfWeek: w.day_of_week as number,
        carbFood: (w.carb_food as string) || null,
        vegetable: (w.vegetable as string) || null,
        proteinFood: (w.protein_food as string) || null,
      },
    });
    weekCount++;
  }
  console.log(`  → ${weekCount} weekly examples creati`);

  // --- 9. Ricette + Ingredienti ---
  let sqliteRecipes: Array<Record<string, unknown>> = [];
  try {
    sqliteRecipes = sqlite.prepare("SELECT * FROM recipes").all() as Array<Record<string, unknown>>;
  } catch { /* table might not exist */ }

  console.log(`Migrando ${sqliteRecipes.length} ricette...`);
  for (const r of sqliteRecipes) {
    const oldId = r.id as number;
    const newId = createId();
    idMap.recipes.set(oldId, newId);

    await prisma.recipe.create({
      data: {
        id: newId,
        professionalId,
        name: r.name as string,
        totalKcal: toFloat(r.total_kcal),
        kcalPerPortion: toFloat(r.kcal_per_portion),
        portions: toFloat(r.portions),
        notes: (r.notes as string) || null,
      },
    });
  }

  let sqliteRecipeIngs: Array<Record<string, unknown>> = [];
  try {
    sqliteRecipeIngs = sqlite.prepare("SELECT * FROM recipe_ingredients").all() as Array<Record<string, unknown>>;
  } catch { /* table might not exist */ }

  let ingCount = 0;
  for (const i of sqliteRecipeIngs) {
    const recipeId = idMap.recipes.get(i.recipe_id as number);
    if (!recipeId) continue;

    const foodId = i.food_id ? idMap.foods.get(i.food_id as number) ?? null : null;

    await prisma.recipeIngredient.create({
      data: {
        recipeId,
        foodId,
        foodName: (i.food_name as string) || null,
        grams: toFloat(i.grams),
        sortOrder: (i.sort_order as number) ?? 0,
      },
    });
    ingCount++;
  }
  console.log(`  → ${idMap.recipes.size} ricette, ${ingCount} ingredienti`);

  // --- 10. Istruzioni dietetiche ---
  let sqliteInstructions: Array<Record<string, unknown>> = [];
  try {
    sqliteInstructions = sqlite.prepare("SELECT * FROM dietary_instructions").all() as Array<Record<string, unknown>>;
  } catch { /* table might not exist */ }

  console.log(`Migrando ${sqliteInstructions.length} istruzioni...`);
  for (const i of sqliteInstructions) {
    await prisma.dietaryInstruction.create({
      data: {
        professionalId,
        category: i.category as string,
        title: (i.title as string) || null,
        content: (i.content as string) || null,
        sortOrder: (i.sort_order as number) ?? 0,
      },
    });
  }

  // --- 11. Integratori ---
  let sqliteSupplements: Array<Record<string, unknown>> = [];
  try {
    sqliteSupplements = sqlite.prepare("SELECT * FROM supplements").all() as Array<Record<string, unknown>>;
  } catch { /* table might not exist */ }

  console.log(`Migrando ${sqliteSupplements.length} integratori...`);
  for (const s of sqliteSupplements) {
    const oldId = s.id as number;
    const newId = createId();
    idMap.supplements.set(oldId, newId);

    await prisma.supplement.create({
      data: {
        id: newId,
        professionalId,
        name: s.name as string,
        description: (s.description as string) || null,
        defaultDosage: (s.default_dosage as string) || null,
        timing: (s.timing as string) || null,
      },
    });
  }

  // --- 12. Client Supplements ---
  let sqliteClientSupps: Array<Record<string, unknown>> = [];
  try {
    sqliteClientSupps = sqlite.prepare("SELECT * FROM client_supplements").all() as Array<Record<string, unknown>>;
  } catch { /* table might not exist */ }

  let csCount = 0;
  for (const cs of sqliteClientSupps) {
    const patientId = idMap.clients.get(cs.client_id as number);
    const supplementId = idMap.supplements.get(cs.supplement_id as number);
    if (!patientId || !supplementId) continue;

    await prisma.patientSupplement.create({
      data: {
        patientId,
        supplementId,
        dosage: (cs.dosage as string) || null,
        timing: (cs.timing as string) || null,
        notes: (cs.notes as string) || null,
      },
    });
    csCount++;
  }
  console.log(`  → ${idMap.supplements.size} integratori, ${csCount} assegnazioni`);

  // --- 13. Client Conditions ---
  let sqliteConditions: Array<Record<string, unknown>> = [];
  try {
    sqliteConditions = sqlite.prepare("SELECT * FROM client_conditions").all() as Array<Record<string, unknown>>;
  } catch { /* table might not exist */ }

  let condCount = 0;
  for (const cc of sqliteConditions) {
    const patientId = idMap.clients.get(cc.client_id as number);
    if (!patientId) continue;

    await prisma.patientCondition.create({
      data: {
        patientId,
        conditionName: cc.condition_name as string,
        notes: (cc.notes as string) || null,
      },
    });
    condCount++;
  }
  console.log(`  → ${condCount} condizioni create`);

  // --- Validazione conteggi ---
  console.log("\n--- Validazione conteggi ---");
  const pgCounts = {
    patients: await prisma.patient.count({ where: { professionalId } }),
    visits: await prisma.visit.count(),
    foods: await prisma.food.count(),
    mealPlans: await prisma.mealPlan.count(),
    mealTemplates: await prisma.mealTemplate.count(),
    mealOptions: await prisma.mealOption.count(),
    weeklyExamples: await prisma.weeklyExample.count(),
    recipes: await prisma.recipe.count({ where: { professionalId } }),
    instructions: await prisma.dietaryInstruction.count({ where: { professionalId } }),
    supplements: await prisma.supplement.count({ where: { professionalId } }),
  };

  for (const [table, count] of Object.entries(pgCounts)) {
    console.log(`  ${table}: ${count}`);
  }

  console.log("\nMigrazione completata!");

  sqlite.close();
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Errore durante la migrazione:", e);
  process.exit(1);
});
