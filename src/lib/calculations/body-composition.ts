/**
 * Calcoli composizione corporea.
 * Port esatto da Python: calculations/body_composition.py
 *
 * COSTANTI CRITICHE (da CLAUDE.md):
 * - JP3 donna: costante 1.10994921 (NON 1.0994921)
 * - Siri donna JP3: coefficiente 501 (NON 495)
 * - JP7: stessa formula M/F, costante 1.112
 */

export type Gender = "M" | "F";

// --- Costanti ---
const JP3_FEMALE_INTERCEPT = 1.10994921;
const JP3_MALE_INTERCEPT = 1.10938;
const JP7_INTERCEPT = 1.112;
const SIRI_COEFFICIENT_FEMALE_JP3 = 501;
const SIRI_COEFFICIENT_STANDARD = 495;

export interface BodyCompositionResult {
  bmi: number;
  densityJp3: number;
  densityJp7: number;
  bodyFatJp3: number;
  bodyFatJp7: number;
  bodyFatPct: number;
  fatMassKg: number;
  leanMassKg: number;
}

/**
 * Jackson-Pollock 3 siti.
 * Uomo: petto + addome + coscia
 * Donna: tricipite + soprailiaca + coscia
 */
export function jacksonPollock3Density(
  gender: Gender,
  age: number,
  plicChest: number,
  plicAbdominal: number,
  plicThigh: number,
  plicTricep?: number,
  plicSuprailiac?: number
): number {
  if (gender === "M") {
    const s = plicChest + plicAbdominal + plicThigh;
    return (
      JP3_MALE_INTERCEPT -
      0.0008267 * s +
      0.0000016 * s ** 2 -
      0.0002574 * age
    );
  } else {
    const s = (plicTricep ?? 0) + (plicSuprailiac ?? 0) + plicThigh;
    return (
      JP3_FEMALE_INTERCEPT -
      0.0009929 * s +
      0.0000023 * s ** 2 -
      0.0001392 * age
    );
  }
}

/**
 * Jackson-Pollock 7 siti (formula identica uomo/donna).
 */
export function jacksonPollock7Density(
  _gender: Gender,
  age: number,
  plicChest: number,
  plicTricep: number,
  plicAxillary: number,
  plicSubscapular: number,
  plicSuprailiac: number,
  plicAbdominal: number,
  plicThigh: number
): number {
  const s =
    plicChest +
    plicTricep +
    plicAxillary +
    plicSubscapular +
    plicSuprailiac +
    plicAbdominal +
    plicThigh;

  return (
    JP7_INTERCEPT -
    0.00043499 * s +
    0.00000055 * s ** 2 -
    0.00028826 * age
  );
}

/**
 * Formula di Siri: %FM = (coeff / densità) - 450
 * Standard: coeff=495 (uomini e donne JP7)
 * Variante donna JP3: coeff=501
 */
export function siriBodyFat(
  density: number,
  coefficient: number = SIRI_COEFFICIENT_STANDARD
): number {
  if (density <= 0) return 0;
  return coefficient / density - 450.0;
}

/**
 * BMI = peso(kg) / altezza(m)²
 */
export function calculateBmi(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100.0;
  return weightKg / heightM ** 2;
}

/**
 * Calcola età dalla data di nascita e data misura.
 * Replica: int((mdate - birth).days / 365.25)
 */
export function calculateAge(birthDate: Date, measurementDate: Date): number {
  const diffMs = measurementDate.getTime() - birthDate.getTime();
  return Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000));
}

/**
 * Calcolo composizione corporea completa.
 * Port esatto di calculate_body_composition() da Python.
 */
export function calculateBodyComposition(params: {
  gender: Gender;
  age: number;
  weightKg: number;
  heightCm: number;
  plicChest: number;
  plicTricep: number;
  plicAxillary: number;
  plicSubscapular: number;
  plicSuprailiac: number;
  plicAbdominal: number;
  plicThigh: number;
  formula?: string;
}): BodyCompositionResult {
  const {
    gender,
    age,
    weightKg,
    heightCm,
    plicChest,
    plicTricep,
    plicAxillary,
    plicSubscapular,
    plicSuprailiac,
    plicAbdominal,
    plicThigh,
    formula = "f_media",
  } = params;

  const bmi = calculateBmi(weightKg, heightCm);

  const d3 = jacksonPollock3Density(
    gender,
    age,
    plicChest,
    plicAbdominal,
    plicThigh,
    plicTricep,
    plicSuprailiac
  );

  const d7 = jacksonPollock7Density(
    gender,
    age,
    plicChest,
    plicTricep,
    plicAxillary,
    plicSubscapular,
    plicSuprailiac,
    plicAbdominal,
    plicThigh
  );

  // Coefficienti Siri corretti per genere
  let bf3: number;
  let bf7: number;
  if (gender === "M") {
    bf3 = siriBodyFat(d3, SIRI_COEFFICIENT_STANDARD); // 495
    bf7 = siriBodyFat(d7, SIRI_COEFFICIENT_STANDARD); // 495
  } else {
    bf3 = siriBodyFat(d3, SIRI_COEFFICIENT_FEMALE_JP3); // 501
    bf7 = siriBodyFat(d7, SIRI_COEFFICIENT_STANDARD); // 495
  }

  // Formula selezionata
  let bodyFatPct: number;
  if (["jp3", "m3", "f3"].includes(formula)) {
    bodyFatPct = bf3;
  } else if (["jp7", "m7", "f7"].includes(formula)) {
    bodyFatPct = bf7;
  } else {
    bodyFatPct = (bf3 + bf7) / 2.0;
  }

  const fatMassKg = weightKg * (bodyFatPct / 100.0);
  const leanMassKg = weightKg - fatMassKg;

  return {
    bmi: round(bmi, 2),
    densityJp3: round(d3, 6),
    densityJp7: round(d7, 6),
    bodyFatJp3: round(bf3, 2),
    bodyFatJp7: round(bf7, 2),
    bodyFatPct: round(bodyFatPct, 2),
    fatMassKg: round(fatMassKg, 2),
    leanMassKg: round(leanMassKg, 2),
  };
}

export function classifyBmi(bmi: number): string {
  if (bmi < 18.5) return "Sottopeso/Atleti";
  if (bmi < 25) return "Normale";
  if (bmi < 30) return "Sovrappeso";
  if (bmi < 35) return "Obesità I";
  if (bmi < 40) return "Obesità II";
  return "Obesità III";
}

export function classifyBodyFat(
  bodyFatPct: number,
  gender: Gender
): string {
  if (gender === "F") {
    if (bodyFatPct < 14) return "Essenziale/Sottopeso";
    if (bodyFatPct < 18) return "Forma super atletica";
    if (bodyFatPct < 22) return "Forma atletica";
    if (bodyFatPct < 28) return "Forma buona";
    if (bodyFatPct < 33) return "Forma accettabile";
    if (bodyFatPct < 38) return "Sovrappeso";
    return "Obesità";
  } else {
    if (bodyFatPct < 6) return "Essenziale/Sottopeso";
    if (bodyFatPct < 10) return "Forma super atletica";
    if (bodyFatPct < 14) return "Forma atletica";
    if (bodyFatPct < 18) return "Forma buona";
    if (bodyFatPct < 22) return "Forma accettabile";
    if (bodyFatPct < 28) return "Sovrappeso";
    return "Obesità";
  }
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
