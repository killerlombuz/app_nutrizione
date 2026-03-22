/**
 * Calcoli sport: kcal per attività, BCAA.
 * Port esatto da Python: calculations/sport.py
 */

export interface BcaaResult {
  totalG: number;
  leucineG: number;
  isoleucineG: number;
  valineG: number;
}

export function calculateSportKcal(
  kcalPerHourPerKg: number,
  weightKg: number,
  durationMin: number
): number {
  return kcalPerHourPerKg * weightKg * (durationMin / 60.0);
}

export function calculateBcaaDose(
  weightKg: number,
  intensity: "low" | "moderate" | "high" = "moderate"
): BcaaResult {
  const dosePerKg =
    intensity === "high" ? 0.05 : intensity === "low" ? 0.03 : 0.04;

  const totalG = weightKg * dosePerKg;
  return {
    totalG: round(totalG, 1),
    leucineG: round(totalG * 0.5, 1),
    isoleucineG: round(totalG * 0.25, 1),
    valineG: round(totalG * 0.25, 1),
  };
}

/** Database sport dal file Excel */
export const SPORT_KCAL_TABLE: Record<string, number> = {
  PESISTICA: 3.17,
  PALESTRA: 6.35,
  "CYCLETTE bassa": 7.4,
  "CYCLETTE alta": 11.1,
  "CAMMINATA 5.5km/h": 4.23,
  "CORSA 8km/h": 8.46,
  "CORSA 10km/h": 11.24,
  "CORSA 12km/h": 13.15,
  "CORSA 14km/h": 14.76,
  "CORSA 16km/h": 16.9,
  NUOTO: 6.01,
  "BICI 20km/h": 4.0,
  "BICI 30km/h": 10.0,
  YOGA: 4.52,
  AEROBICA: 7.24,
  CALCIO: 9.87,
  BASKET: 8.59,
  PALLAVOLO: 5.29,
  TENNIS: 8.45,
};

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
