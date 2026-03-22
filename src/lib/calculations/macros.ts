/**
 * Distribuzione macronutrienti.
 * Port esatto da Python: calculations/macros.py
 */

type MacroRange = { fat: [number, number]; carb: [number, number]; protein: [number, number] };

const MACRO_RANGES: Record<string, MacroRange> = {
  Sedentarie: { fat: [0.8, 1.0], carb: [2.0, 3.0], protein: [1.2, 1.5] },
  "Poco Allenate": { fat: [0.8, 1.0], carb: [2.5, 3.5], protein: [1.4, 1.8] },
  Allenate: { fat: [0.8, 1.0], carb: [3.0, 5.0], protein: [1.6, 2.0] },
  "Molto Allenate": { fat: [0.8, 1.2], carb: [4.0, 7.0], protein: [1.8, 2.2] },
  "Allenate Intensamente": { fat: [0.8, 1.2], carb: [5.0, 8.0], protein: [2.0, 2.5] },
};

const FIBER_TARGET_G = 30;
const SUGAR_PCT_MAX = 0.10;

export interface MacroRangesResult {
  fatMinG: number;
  fatMaxG: number;
  carbMinG: number;
  carbMaxG: number;
  proteinMinG: number;
  proteinMaxG: number;
  fiberG: number;
}

export interface MacroTargetsResult {
  totalKcal: number;
  fatG: number;
  fatKcal: number;
  satFatMaxG: number;
  carbG: number;
  carbKcal: number;
  sugarMaxG: number;
  proteinG: number;
  proteinKcal: number;
  fiberG: number;
}

function findRange(activityLevel: string): MacroRange {
  for (const [key, vals] of Object.entries(MACRO_RANGES)) {
    if (key.toLowerCase().includes(activityLevel.toLowerCase()) ||
        activityLevel.toLowerCase().includes(key.toLowerCase())) {
      return vals;
    }
  }
  return MACRO_RANGES["Sedentarie"];
}

export function getMacroRanges(activityLevel: string, weightKg: number): MacroRangesResult {
  const ranges = findRange(activityLevel);

  return {
    fatMinG: round(ranges.fat[0] * weightKg, 1),
    fatMaxG: round(ranges.fat[1] * weightKg, 1),
    carbMinG: round(ranges.carb[0] * weightKg, 1),
    carbMaxG: round(ranges.carb[1] * weightKg, 1),
    proteinMinG: round(ranges.protein[0] * weightKg, 1),
    proteinMaxG: round(ranges.protein[1] * weightKg, 1),
    fiberG: FIBER_TARGET_G,
  };
}

export function calculateMacroTargets(
  totalKcal: number,
  weightKg: number,
  activityLevel: string = "Sedentarie"
): MacroTargetsResult {
  const ranges = getMacroRanges(activityLevel, weightKg);

  const fatG = (ranges.fatMinG + ranges.fatMaxG) / 2;
  const proteinG = (ranges.proteinMinG + ranges.proteinMaxG) / 2;

  const fatKcal = fatG * 9;
  const proteinKcal = proteinG * 4;
  const carbKcal = totalKcal - fatKcal - proteinKcal;
  const carbG = Math.max(0, carbKcal / 4);
  const sugarMaxG = (totalKcal * SUGAR_PCT_MAX) / 4;

  return {
    totalKcal: round(totalKcal, 1),
    fatG: round(fatG, 1),
    fatKcal: round(fatKcal, 1),
    satFatMaxG: round(fatG * 0.33, 1),
    carbG: round(carbG, 1),
    carbKcal: round(carbKcal, 1),
    sugarMaxG: round(sugarMaxG, 1),
    proteinG: round(proteinG, 1),
    proteinKcal: round(proteinKcal, 1),
    fiberG: FIBER_TARGET_G,
  };
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
