import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import type { MealType, FoodCategory } from "../src/generated/prisma/enums";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Activity Levels
  const activityLevels = [
    {
      name: "Sedentarie",
      bmrMultiplier: 1.2,
      fatGPerKgMin: 0.8, fatGPerKgMax: 1.0,
      carbGPerKgMin: 2.0, carbGPerKgMax: 3.0,
      proteinGPerKgMin: 1.2, proteinGPerKgMax: 1.5,
    },
    {
      name: "Poco Allenate",
      bmrMultiplier: 1.375,
      fatGPerKgMin: 0.8, fatGPerKgMax: 1.0,
      carbGPerKgMin: 2.5, carbGPerKgMax: 3.5,
      proteinGPerKgMin: 1.4, proteinGPerKgMax: 1.8,
    },
    {
      name: "Allenate",
      bmrMultiplier: 1.55,
      fatGPerKgMin: 0.8, fatGPerKgMax: 1.0,
      carbGPerKgMin: 3.0, carbGPerKgMax: 5.0,
      proteinGPerKgMin: 1.6, proteinGPerKgMax: 2.0,
    },
    {
      name: "Molto Allenate",
      bmrMultiplier: 1.725,
      fatGPerKgMin: 0.8, fatGPerKgMax: 1.2,
      carbGPerKgMin: 4.0, carbGPerKgMax: 7.0,
      proteinGPerKgMin: 1.8, proteinGPerKgMax: 2.2,
    },
    {
      name: "Allenate Intensamente",
      bmrMultiplier: 1.9,
      fatGPerKgMin: 0.8, fatGPerKgMax: 1.2,
      carbGPerKgMin: 5.0, carbGPerKgMax: 8.0,
      proteinGPerKgMin: 2.0, proteinGPerKgMax: 2.5,
    },
  ];

  for (const level of activityLevels) {
    await prisma.activityLevel.upsert({
      where: { name: level.name },
      update: level,
      create: level,
    });
  }
  console.log(`Seeded ${activityLevels.length} activity levels`);

  // Sport Activities
  const sportActivities = [
    { name: "PESISTICA", kcalPerHourPerKg: 3.17, defaultDurationMin: 60 },
    { name: "PALESTRA", kcalPerHourPerKg: 6.35, defaultDurationMin: 60 },
    { name: "CYCLETTE bassa", kcalPerHourPerKg: 7.4, defaultDurationMin: 45 },
    { name: "CYCLETTE alta", kcalPerHourPerKg: 11.1, defaultDurationMin: 45 },
    { name: "CAMMINATA 5.5km/h", kcalPerHourPerKg: 4.23, defaultDurationMin: 60 },
    { name: "CORSA 8km/h", kcalPerHourPerKg: 8.46, defaultDurationMin: 45 },
    { name: "CORSA 10km/h", kcalPerHourPerKg: 11.24, defaultDurationMin: 45 },
    { name: "CORSA 12km/h", kcalPerHourPerKg: 13.15, defaultDurationMin: 40 },
    { name: "CORSA 14km/h", kcalPerHourPerKg: 14.76, defaultDurationMin: 35 },
    { name: "CORSA 16km/h", kcalPerHourPerKg: 16.9, defaultDurationMin: 30 },
    { name: "NUOTO", kcalPerHourPerKg: 6.01, defaultDurationMin: 60 },
    { name: "BICI 20km/h", kcalPerHourPerKg: 4.0, defaultDurationMin: 60 },
    { name: "BICI 30km/h", kcalPerHourPerKg: 10.0, defaultDurationMin: 60 },
    { name: "YOGA", kcalPerHourPerKg: 4.52, defaultDurationMin: 60 },
    { name: "AEROBICA", kcalPerHourPerKg: 7.24, defaultDurationMin: 60 },
    { name: "CALCIO", kcalPerHourPerKg: 9.87, defaultDurationMin: 90 },
    { name: "BASKET", kcalPerHourPerKg: 8.59, defaultDurationMin: 60 },
    { name: "PALLAVOLO", kcalPerHourPerKg: 5.29, defaultDurationMin: 90 },
    { name: "TENNIS", kcalPerHourPerKg: 8.45, defaultDurationMin: 60 },
  ];

  for (const sport of sportActivities) {
    await prisma.sportActivity.upsert({
      where: { name: sport.name },
      update: sport,
      create: sport,
    });
  }
  console.log(`Seeded ${sportActivities.length} sport activities`);

  // Meal Plan Templates di sistema
  const systemTemplates = [
    {
      name: "Mediterranea",
      description: "Distribuzione classica mediterranea con cereali, pesce e verdure abbondanti.",
      dietType: "mediterranea",
      pctBreakfast: 0.17, pctLunch: 0.45, pctDinner: 0.25,
      pctSnack1: 0.065, pctSnack2: 0.065, pctSnack3: 0.0,
      meals: [
        { mealType: "COLAZIONE", foods: [
          { foodCategory: "CEREALI", portionType: "carbs_source", sortOrder: 0 },
          { foodCategory: "LATTICINI_E_SOSTITUTI", portionType: "protein_source", sortOrder: 1 },
        ]},
        { mealType: "SPUNTINO_MATTINA", foods: [
          { foodCategory: "FRUTTA", portionType: "main", sortOrder: 0 },
        ]},
        { mealType: "PRANZO", foods: [
          { foodCategory: "CEREALI", portionType: "carbs_source", sortOrder: 0 },
          { foodCategory: "PESCE", portionType: "protein_source", sortOrder: 1 },
        ]},
        { mealType: "SPUNTINO_POMERIGGIO", foods: [
          { foodCategory: "FRUTTA", portionType: "main", sortOrder: 0 },
        ]},
        { mealType: "CENA", foods: [
          { foodCategory: "CEREALI", portionType: "carbs_source", sortOrder: 0 },
          { foodCategory: "CARNE", portionType: "protein_source", sortOrder: 1 },
        ]},
      ],
    },
    {
      name: "Low-carb",
      description: "Riduzione dei carboidrati, enfasi su proteine e grassi buoni.",
      dietType: "low-carb",
      pctBreakfast: 0.20, pctLunch: 0.40, pctDinner: 0.30,
      pctSnack1: 0.05, pctSnack2: 0.05, pctSnack3: 0.0,
      meals: [
        { mealType: "COLAZIONE", foods: [
          { foodCategory: "UOVA_E_ALBUMI", portionType: "protein_source", sortOrder: 0 },
          { foodCategory: "FRUTTA", portionType: "main", sortOrder: 1 },
        ]},
        { mealType: "SPUNTINO_MATTINA", foods: [
          { foodCategory: "FRUTTA_SECCA", portionType: "fat_source", sortOrder: 0 },
        ]},
        { mealType: "PRANZO", foods: [
          { foodCategory: "CARNE", portionType: "protein_source", sortOrder: 0 },
          { foodCategory: "VERDURA", portionType: "vegetable", sortOrder: 1 },
        ]},
        { mealType: "SPUNTINO_POMERIGGIO", foods: [
          { foodCategory: "LATTICINI_E_SOSTITUTI", portionType: "protein_source", sortOrder: 0 },
        ]},
        { mealType: "CENA", foods: [
          { foodCategory: "PESCE", portionType: "protein_source", sortOrder: 0 },
          { foodCategory: "VERDURA", portionType: "vegetable", sortOrder: 1 },
        ]},
      ],
    },
    {
      name: "Iperproteica",
      description: "Elevato apporto proteico su tutti i pasti, indicata per sport di forza.",
      dietType: "iperproteica",
      pctBreakfast: 0.17, pctLunch: 0.40, pctDinner: 0.30,
      pctSnack1: 0.065, pctSnack2: 0.065, pctSnack3: 0.0,
      meals: [
        { mealType: "COLAZIONE", foods: [
          { foodCategory: "UOVA_E_ALBUMI", portionType: "protein_source", sortOrder: 0 },
          { foodCategory: "CEREALI", portionType: "carbs_source", sortOrder: 1 },
        ]},
        { mealType: "SPUNTINO_MATTINA", foods: [
          { foodCategory: "LATTICINI_E_SOSTITUTI", portionType: "protein_source", sortOrder: 0 },
        ]},
        { mealType: "PRANZO", foods: [
          { foodCategory: "CEREALI", portionType: "carbs_source", sortOrder: 0 },
          { foodCategory: "CARNE", portionType: "protein_source", sortOrder: 1 },
        ]},
        { mealType: "SPUNTINO_POMERIGGIO", foods: [
          { foodCategory: "LATTICINI_E_SOSTITUTI", portionType: "protein_source", sortOrder: 0 },
          { foodCategory: "FRUTTA_SECCA", portionType: "fat_source", sortOrder: 1 },
        ]},
        { mealType: "CENA", foods: [
          { foodCategory: "CEREALI", portionType: "carbs_source", sortOrder: 0 },
          { foodCategory: "PESCE", portionType: "protein_source", sortOrder: 1 },
        ]},
      ],
    },
    {
      name: "Vegetariana",
      description: "Legumi come principale fonte proteica, senza carne e pesce.",
      dietType: "vegetariana",
      pctBreakfast: 0.17, pctLunch: 0.45, pctDinner: 0.25,
      pctSnack1: 0.065, pctSnack2: 0.065, pctSnack3: 0.0,
      meals: [
        { mealType: "COLAZIONE", foods: [
          { foodCategory: "CEREALI", portionType: "carbs_source", sortOrder: 0 },
          { foodCategory: "LATTICINI_E_SOSTITUTI", portionType: "protein_source", sortOrder: 1 },
        ]},
        { mealType: "SPUNTINO_MATTINA", foods: [
          { foodCategory: "FRUTTA", portionType: "main", sortOrder: 0 },
        ]},
        { mealType: "PRANZO", foods: [
          { foodCategory: "CEREALI", portionType: "carbs_source", sortOrder: 0 },
          { foodCategory: "LEGUMI_E_PROTEINE_VEGETALI", portionType: "protein_source", sortOrder: 1 },
        ]},
        { mealType: "SPUNTINO_POMERIGGIO", foods: [
          { foodCategory: "FRUTTA_SECCA", portionType: "fat_source", sortOrder: 0 },
        ]},
        { mealType: "CENA", foods: [
          { foodCategory: "LEGUMI_E_PROTEINE_VEGETALI", portionType: "protein_source", sortOrder: 0 },
          { foodCategory: "CEREALI_ELABORATI", portionType: "carbs_source", sortOrder: 1 },
        ]},
      ],
    },
  ];

  await prisma.mealPlanTemplate.deleteMany({ where: { professionalId: null } });
  for (const tpl of systemTemplates) {
    await prisma.mealPlanTemplate.create({
      data: {
        name: tpl.name,
        description: tpl.description,
        dietType: tpl.dietType,
        pctBreakfast: tpl.pctBreakfast,
        pctLunch: tpl.pctLunch,
        pctDinner: tpl.pctDinner,
        pctSnack1: tpl.pctSnack1,
        pctSnack2: tpl.pctSnack2,
        pctSnack3: tpl.pctSnack3,
        meals: {
          create: tpl.meals.map((meal) => ({
            mealType: meal.mealType as MealType,
            foods: {
              create: meal.foods.map((f) => ({
                foodCategory: f.foodCategory as FoodCategory,
                portionType: f.portionType,
                isFixed: f.isFixed ?? false,
                sortOrder: f.sortOrder,
              })),
            },
          })),
        },
      },
    });
  }
  console.log(`Seeded ${systemTemplates.length} system meal plan templates`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
