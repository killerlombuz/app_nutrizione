-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "FoodCategory" AS ENUM ('FRUTTA', 'FRUTTA_SECCA', 'FRUTTA_ESSICCATA', 'VERDURA', 'LEGUMI_E_PROTEINE_VEGETALI', 'UOVA_E_ALBUMI', 'LATTICINI_E_SOSTITUTI', 'CARNE', 'PESCE', 'CEREALI', 'CEREALI_ELABORATI', 'OLI_BURRO_E_CIOCCOLATA', 'JUNK_FOOD', 'ALCOLICI', 'ALTRO');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('COLAZIONE', 'SPUNTINO_MATTINA', 'PRANZO', 'SPUNTINO_POMERIGGIO', 'CENA', 'SPUNTINO_SERA');

-- CreateTable
CREATE TABLE "professionals" (
    "id" TEXT NOT NULL,
    "authId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3),
    "heightCm" DOUBLE PRECISION,
    "gender" "Gender",
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "weightKg" DOUBLE PRECISION,
    "plicChest" DOUBLE PRECISION,
    "plicTricep" DOUBLE PRECISION,
    "plicAxillary" DOUBLE PRECISION,
    "plicSubscapular" DOUBLE PRECISION,
    "plicSuprailiac" DOUBLE PRECISION,
    "plicAbdominal" DOUBLE PRECISION,
    "plicThigh" DOUBLE PRECISION,
    "circNeck" DOUBLE PRECISION,
    "circChest" DOUBLE PRECISION,
    "circArmRelaxed" DOUBLE PRECISION,
    "circArmFlexed" DOUBLE PRECISION,
    "circWaist" DOUBLE PRECISION,
    "circLowerAbdomen" DOUBLE PRECISION,
    "circHips" DOUBLE PRECISION,
    "circUpperThigh" DOUBLE PRECISION,
    "circMidThigh" DOUBLE PRECISION,
    "circLowerThigh" DOUBLE PRECISION,
    "circCalf" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "bodyFatPct" DOUBLE PRECISION,
    "fatMassKg" DOUBLE PRECISION,
    "leanMassKg" DOUBLE PRECISION,
    "formulaUsed" TEXT DEFAULT 'f_media',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foods" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT,
    "name" TEXT NOT NULL,
    "category" "FoodCategory",
    "kcalPer100g" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fatG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "satFatG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "carbG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sugarG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "proteinG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fiberG" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isFodmap" BOOLEAN NOT NULL DEFAULT false,
    "isNickel" BOOLEAN NOT NULL DEFAULT false,
    "isGlutenFree" BOOLEAN NOT NULL DEFAULT false,
    "isLactoseFree" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_plans" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activityLevelId" TEXT,
    "numVariants" INTEGER NOT NULL DEFAULT 1,
    "totalKcalRest" DOUBLE PRECISION,
    "totalKcalWorkout1" DOUBLE PRECISION,
    "totalKcalWorkout2" DOUBLE PRECISION,
    "proteinTargetMin" DOUBLE PRECISION,
    "proteinTargetMax" DOUBLE PRECISION,
    "workout1Name" TEXT,
    "workout1Kcal" DOUBLE PRECISION,
    "workout2Name" TEXT,
    "workout2Kcal" DOUBLE PRECISION,
    "deficitKcal" DOUBLE PRECISION DEFAULT 0,
    "pctBreakfast" DOUBLE PRECISION NOT NULL DEFAULT 0.17,
    "pctLunch" DOUBLE PRECISION NOT NULL DEFAULT 0.45,
    "pctDinner" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "pctSnack1" DOUBLE PRECISION NOT NULL DEFAULT 0.065,
    "pctSnack2" DOUBLE PRECISION NOT NULL DEFAULT 0.065,
    "pctSnack3" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_templates" (
    "id" TEXT NOT NULL,
    "mealPlanId" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "kcalRest" DOUBLE PRECISION,
    "kcalWorkout1" DOUBLE PRECISION,
    "kcalWorkout2" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "meal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_options" (
    "id" TEXT NOT NULL,
    "mealTemplateId" TEXT NOT NULL,
    "optionGroup" TEXT,
    "foodId" TEXT,
    "foodName" TEXT,
    "gramsRest" DOUBLE PRECISION,
    "gramsWorkout1" DOUBLE PRECISION,
    "gramsWorkout2" DOUBLE PRECISION,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "meal_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_examples" (
    "id" TEXT NOT NULL,
    "mealTemplateId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "carbFood" TEXT,
    "vegetable" TEXT,
    "proteinFood" TEXT,

    CONSTRAINT "weekly_examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_levels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bmrMultiplier" DOUBLE PRECISION NOT NULL,
    "fatGPerKgMin" DOUBLE PRECISION NOT NULL,
    "fatGPerKgMax" DOUBLE PRECISION NOT NULL,
    "carbGPerKgMin" DOUBLE PRECISION NOT NULL,
    "carbGPerKgMax" DOUBLE PRECISION NOT NULL,
    "proteinGPerKgMin" DOUBLE PRECISION NOT NULL,
    "proteinGPerKgMax" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "activity_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sport_activities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kcalPerHourPerKg" DOUBLE PRECISION NOT NULL,
    "defaultDurationMin" INTEGER NOT NULL DEFAULT 60,

    CONSTRAINT "sport_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "body_fat_reference" (
    "id" TEXT NOT NULL,
    "ageMin" INTEGER NOT NULL,
    "ageMax" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "category" TEXT NOT NULL,
    "fatPctMin" DOUBLE PRECISION NOT NULL,
    "fatPctMax" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "body_fat_reference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT,
    "name" TEXT NOT NULL,
    "totalKcal" DOUBLE PRECISION,
    "kcalPerPortion" DOUBLE PRECISION,
    "portions" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipe_ingredients" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "foodId" TEXT,
    "foodName" TEXT,
    "grams" DOUBLE PRECISION,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "recipe_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dietary_instructions" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "dietary_instructions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplements" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultDosage" TEXT,
    "timing" TEXT,

    CONSTRAINT "supplements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_supplements" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "supplementId" TEXT NOT NULL,
    "dosage" TEXT,
    "timing" TEXT,
    "notes" TEXT,

    CONSTRAINT "patient_supplements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_conditions" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "conditionName" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "patient_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professionals_authId_key" ON "professionals"("authId");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_email_key" ON "professionals"("email");

-- CreateIndex
CREATE INDEX "patients_professionalId_idx" ON "patients"("professionalId");

-- CreateIndex
CREATE INDEX "visits_patientId_idx" ON "visits"("patientId");

-- CreateIndex
CREATE INDEX "foods_category_idx" ON "foods"("category");

-- CreateIndex
CREATE UNIQUE INDEX "foods_professionalId_name_key" ON "foods"("professionalId", "name");

-- CreateIndex
CREATE INDEX "meal_plans_patientId_idx" ON "meal_plans"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_levels_name_key" ON "activity_levels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sport_activities_name_key" ON "sport_activities"("name");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foods" ADD CONSTRAINT "foods_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_plans" ADD CONSTRAINT "meal_plans_activityLevelId_fkey" FOREIGN KEY ("activityLevelId") REFERENCES "activity_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_templates" ADD CONSTRAINT "meal_templates_mealPlanId_fkey" FOREIGN KEY ("mealPlanId") REFERENCES "meal_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_options" ADD CONSTRAINT "meal_options_mealTemplateId_fkey" FOREIGN KEY ("mealTemplateId") REFERENCES "meal_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_options" ADD CONSTRAINT "meal_options_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_examples" ADD CONSTRAINT "weekly_examples_mealTemplateId_fkey" FOREIGN KEY ("mealTemplateId") REFERENCES "meal_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_foodId_fkey" FOREIGN KEY ("foodId") REFERENCES "foods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dietary_instructions" ADD CONSTRAINT "dietary_instructions_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplements" ADD CONSTRAINT "supplements_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_supplements" ADD CONSTRAINT "patient_supplements_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_supplements" ADD CONSTRAINT "patient_supplements_supplementId_fkey" FOREIGN KEY ("supplementId") REFERENCES "supplements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_conditions" ADD CONSTRAINT "patient_conditions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
