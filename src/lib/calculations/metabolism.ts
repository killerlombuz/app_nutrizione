/**
 * Calcoli metabolismo.
 * Port esatto da Python: calculations/metabolism.py
 */

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  Sedentarie: 1.2,
  "Poco Allenate": 1.375,
  Allenate: 1.55,
  "Molto Allenate": 1.725,
  "Allenate Intensamente": 1.9,
};

export interface MetabolismResult {
  bmr: number;
  activityMultiplier: number;
  tdee: number;
  sport1Kcal: number;
  sport2Kcal: number;
  kcalRest: number;
  kcalWorkout1: number;
  kcalWorkout2: number;
}

/** BMR Katch-McArdle: 21.6 × FFM(kg) + 370 */
export function bmrKatchMcArdle(leanMassKg: number): number {
  return 21.6 * leanMassKg + 370;
}

/** TDEE = BMR × moltiplicatore attività */
export function calculateTdee(bmr: number, activityMultiplier: number): number {
  return bmr * activityMultiplier;
}

/** Kcal bruciate per attività sportiva */
export function calculateSportKcal(
  kcalPerHourPerKg: number,
  weightKg: number,
  durationMin: number
): number {
  return kcalPerHourPerKg * weightKg * (durationMin / 60.0);
}

/** Trova il moltiplicatore per il livello di attività */
export function getActivityMultiplier(levelName: string): number {
  for (const [key, val] of Object.entries(ACTIVITY_MULTIPLIERS)) {
    if (key.toLowerCase().includes(levelName.toLowerCase()) ||
        levelName.toLowerCase().includes(key.toLowerCase())) {
      return val;
    }
  }
  return 1.2; // default sedentario
}

/** Calcolo metabolismo completo con 3 scenari (rest, workout1, workout2) */
export function calculateFullMetabolism(params: {
  leanMassKg: number;
  weightKg: number;
  activityLevel?: string;
  sport1KcalHrKg?: number;
  sport1Duration?: number;
  sport2KcalHrKg?: number;
  sport2Duration?: number;
  deficit?: number;
}): MetabolismResult {
  const {
    leanMassKg,
    weightKg,
    activityLevel = "Sedentarie",
    sport1KcalHrKg = 0,
    sport1Duration = 0,
    sport2KcalHrKg = 0,
    sport2Duration = 0,
    deficit = 0,
  } = params;

  const bmr = bmrKatchMcArdle(leanMassKg);
  const multiplier = getActivityMultiplier(activityLevel);
  const tdee = calculateTdee(bmr, multiplier);

  const sport1Kcal =
    sport1Duration > 0
      ? calculateSportKcal(sport1KcalHrKg, weightKg, sport1Duration)
      : 0;
  const sport2Kcal =
    sport2Duration > 0
      ? calculateSportKcal(sport2KcalHrKg, weightKg, sport2Duration)
      : 0;

  return {
    bmr: round(bmr, 2),
    activityMultiplier: multiplier,
    tdee: round(tdee, 2),
    sport1Kcal: round(sport1Kcal, 2),
    sport2Kcal: round(sport2Kcal, 2),
    kcalRest: round(tdee - deficit, 2),
    kcalWorkout1: round(tdee + sport1Kcal - deficit, 2),
    kcalWorkout2: round(tdee + sport1Kcal + sport2Kcal - deficit, 2),
  };
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
