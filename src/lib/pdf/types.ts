/**
 * Tipi dati per generazione report PDF.
 */

export interface ReportData {
  professional: {
    name: string;
    title: string | null;
    email: string;
    phone: string | null;
  };
  patient: {
    name: string;
    birthDate: Date | null;
    gender: 'M' | 'F' | null;
    heightCm: number | null;
  };
  visits: ReportVisit[];
  mealPlan: ReportMealPlan | null;
  supplements: ReportSupplement[];
  instructions: ReportInstruction[];
  recipes: ReportRecipe[];
}

export interface ReportVisit {
  date: Date;
  weightKg: number | null;
  bmi: number | null;
  bodyFatPct: number | null;
  fatMassKg: number | null;
  leanMassKg: number | null;
  formulaUsed: string | null;
  // Plicometria
  plicChest: number | null;
  plicTricep: number | null;
  plicAxillary: number | null;
  plicSubscapular: number | null;
  plicSuprailiac: number | null;
  plicAbdominal: number | null;
  plicThigh: number | null;
  // Circonferenze
  circNeck: number | null;
  circChest: number | null;
  circArmRelaxed: number | null;
  circArmFlexed: number | null;
  circWaist: number | null;
  circLowerAbdomen: number | null;
  circHips: number | null;
  circUpperThigh: number | null;
  circMidThigh: number | null;
  circLowerThigh: number | null;
  circCalf: number | null;
}

export interface ReportMealPlan {
  name: string | null;
  date: Date;
  numVariants: number;
  totalKcalRest: number | null;
  totalKcalWorkout1: number | null;
  totalKcalWorkout2: number | null;
  workout1Name: string | null;
  workout1Kcal: number | null;
  workout2Name: string | null;
  workout2Kcal: number | null;
  pctBreakfast: number;
  pctLunch: number;
  pctDinner: number;
  pctSnack1: number;
  pctSnack2: number;
  pctSnack3: number;
  meals: ReportMeal[];
}

export interface ReportMeal {
  mealType: string;
  sortOrder: number;
  kcalRest: number | null;
  kcalWorkout1: number | null;
  kcalWorkout2: number | null;
  options: ReportMealOption[];
  weeklyExamples: ReportWeeklyExample[];
}

export interface ReportMealOption {
  optionGroup: string | null;
  foodName: string | null;
  gramsRest: number | null;
  gramsWorkout1: number | null;
  gramsWorkout2: number | null;
  isFixed: boolean;
  sortOrder: number;
}

export interface ReportWeeklyExample {
  dayOfWeek: number;
  carbFood: string | null;
  vegetable: string | null;
  proteinFood: string | null;
}

export interface ReportSupplement {
  name: string;
  dosage: string | null;
  timing: string | null;
  notes: string | null;
}

export interface ReportInstruction {
  category: string;
  title: string | null;
  content: string | null;
  sortOrder: number;
}

export interface ReportRecipe {
  name: string;
  totalKcal: number | null;
  kcalPerPortion: number | null;
  portions: number | null;
  ingredients: { foodName: string | null; grams: number | null }[];
}

export type ReportSection =
  | 'cover'
  | 'measurements'
  | 'diet'
  | 'weekly'
  | 'supplements'
  | 'instructions'
  | 'recipes';

export const ALL_SECTIONS: ReportSection[] = [
  'cover',
  'measurements',
  'diet',
  'weekly',
  'supplements',
  'instructions',
  'recipes',
];

export const SECTION_LABELS: Record<ReportSection, string> = {
  cover: 'Copertina',
  measurements: 'Composizione Corporea',
  diet: 'Piano Alimentare',
  weekly: 'Esempio Settimanale',
  supplements: 'Integrazione e Sport',
  instructions: 'Indicazioni Speciali',
  recipes: 'Ricette',
};
