-- Catch up the production schema with the current Prisma datamodel.
-- This migration is intentionally defensive because some environments
-- have been synchronized with `prisma db push` outside the versioned history.

ALTER TABLE "patients"
  ADD COLUMN IF NOT EXISTS "authId" TEXT,
  ADD COLUMN IF NOT EXISTS "invitedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "lastPortalLogin" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "portalEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "meal_plans"
  ADD COLUMN IF NOT EXISTS "shareToken" TEXT;

CREATE TABLE IF NOT EXISTS "meal_plan_templates" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dietType" TEXT,
    "pctBreakfast" DOUBLE PRECISION NOT NULL DEFAULT 0.17,
    "pctLunch" DOUBLE PRECISION NOT NULL DEFAULT 0.45,
    "pctDinner" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "pctSnack1" DOUBLE PRECISION NOT NULL DEFAULT 0.065,
    "pctSnack2" DOUBLE PRECISION NOT NULL DEFAULT 0.065,
    "pctSnack3" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_plan_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meal_plan_template_meals" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,

    CONSTRAINT "meal_plan_template_meals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "meal_plan_template_foods" (
    "id" TEXT NOT NULL,
    "templateMealId" TEXT NOT NULL,
    "foodCategory" "FoodCategory" NOT NULL,
    "portionType" TEXT NOT NULL,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "meal_plan_template_foods_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "patient_notes" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "appointments" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "patientId" TEXT,
    "title" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "type" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "working_hours" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "working_hours_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "food_diary" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mealType" "MealType" NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "food_diary_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "appointments_professionalId_date_idx"
  ON "appointments"("professionalId", "date");

CREATE INDEX IF NOT EXISTS "appointments_patientId_idx"
  ON "appointments"("patientId");

CREATE UNIQUE INDEX IF NOT EXISTS "meal_plans_shareToken_key"
  ON "meal_plans"("shareToken");

CREATE INDEX IF NOT EXISTS "meal_plan_templates_professionalId_idx"
  ON "meal_plan_templates"("professionalId");

CREATE INDEX IF NOT EXISTS "notifications_professionalId_isRead_createdAt_idx"
  ON "notifications"("professionalId", "isRead", "createdAt");

CREATE INDEX IF NOT EXISTS "patient_notes_patientId_createdAt_idx"
  ON "patient_notes"("patientId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "working_hours_professionalId_dayOfWeek_key"
  ON "working_hours"("professionalId", "dayOfWeek");

CREATE INDEX IF NOT EXISTS "food_diary_patientId_date_idx"
  ON "food_diary"("patientId", "date");

CREATE INDEX IF NOT EXISTS "messages_conversationId_createdAt_idx"
  ON "messages"("conversationId", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS "patients_authId_key"
  ON "patients"("authId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'meal_plan_templates_professionalId_fkey'
  ) THEN
    ALTER TABLE "meal_plan_templates"
      ADD CONSTRAINT "meal_plan_templates_professionalId_fkey"
      FOREIGN KEY ("professionalId")
      REFERENCES "professionals"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'meal_plan_template_meals_templateId_fkey'
  ) THEN
    ALTER TABLE "meal_plan_template_meals"
      ADD CONSTRAINT "meal_plan_template_meals_templateId_fkey"
      FOREIGN KEY ("templateId")
      REFERENCES "meal_plan_templates"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'meal_plan_template_foods_templateMealId_fkey'
  ) THEN
    ALTER TABLE "meal_plan_template_foods"
      ADD CONSTRAINT "meal_plan_template_foods_templateMealId_fkey"
      FOREIGN KEY ("templateMealId")
      REFERENCES "meal_plan_template_meals"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'notifications_professionalId_fkey'
  ) THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_professionalId_fkey"
      FOREIGN KEY ("professionalId")
      REFERENCES "professionals"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'patient_notes_patientId_fkey'
  ) THEN
    ALTER TABLE "patient_notes"
      ADD CONSTRAINT "patient_notes_patientId_fkey"
      FOREIGN KEY ("patientId")
      REFERENCES "patients"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_professionalId_fkey'
  ) THEN
    ALTER TABLE "appointments"
      ADD CONSTRAINT "appointments_professionalId_fkey"
      FOREIGN KEY ("professionalId")
      REFERENCES "professionals"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_patientId_fkey'
  ) THEN
    ALTER TABLE "appointments"
      ADD CONSTRAINT "appointments_patientId_fkey"
      FOREIGN KEY ("patientId")
      REFERENCES "patients"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'working_hours_professionalId_fkey'
  ) THEN
    ALTER TABLE "working_hours"
      ADD CONSTRAINT "working_hours_professionalId_fkey"
      FOREIGN KEY ("professionalId")
      REFERENCES "professionals"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'food_diary_patientId_fkey'
  ) THEN
    ALTER TABLE "food_diary"
      ADD CONSTRAINT "food_diary_patientId_fkey"
      FOREIGN KEY ("patientId")
      REFERENCES "patients"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_patientId_fkey'
  ) THEN
    ALTER TABLE "messages"
      ADD CONSTRAINT "messages_patientId_fkey"
      FOREIGN KEY ("patientId")
      REFERENCES "patients"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;
