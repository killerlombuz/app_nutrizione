export const FOOD_CATEGORIES = [
  { value: "FRUTTA", label: "Frutta" },
  { value: "FRUTTA_SECCA", label: "Frutta secca" },
  { value: "FRUTTA_ESSICCATA", label: "Frutta essiccata" },
  { value: "VERDURA", label: "Verdura" },
  { value: "LEGUMI_E_PROTEINE_VEGETALI", label: "Legumi e proteine vegetali" },
  { value: "UOVA_E_ALBUMI", label: "Uova e albumi" },
  { value: "LATTICINI_E_SOSTITUTI", label: "Latticini e sostituti" },
  { value: "CARNE", label: "Carne" },
  { value: "PESCE", label: "Pesce" },
  { value: "CEREALI", label: "Cereali" },
  { value: "CEREALI_ELABORATI", label: "Cereali elaborati" },
  { value: "OLI_BURRO_E_CIOCCOLATA", label: "Oli, burro e cioccolata" },
  { value: "JUNK_FOOD", label: "Junk food" },
  { value: "ALCOLICI", label: "Alcolici" },
  { value: "ALTRO", label: "Altro" },
] as const;

export const MEAL_TYPE_LABELS: Record<string, string> = {
  COLAZIONE: "Colazione",
  SPUNTINO_MATTINA: "Spuntino mattina",
  PRANZO: "Pranzo",
  SPUNTINO_POMERIGGIO: "Spuntino pomeriggio",
  CENA: "Cena",
  SPUNTINO_SERA: "Spuntino sera",
};

export const MEAL_TYPE_ORDER = [
  "COLAZIONE",
  "SPUNTINO_MATTINA",
  "PRANZO",
  "SPUNTINO_POMERIGGIO",
  "CENA",
  "SPUNTINO_SERA",
] as const;
