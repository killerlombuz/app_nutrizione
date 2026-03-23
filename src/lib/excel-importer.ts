/**
 * Importatore Excel del foglio nutrizionista.
 * Port da Python: diet_manager/importers/excel_importer.py
 *
 * Gestisce l'importazione di:
 * - Database alimenti (foglio MB, cols 31-38, rows 3-308)
 * - Dati cliente e misure (foglio Misure)
 * - Ricette (foglio Ricette_opz partic.)
 * - Indicazioni dietetiche (foglio Diete indicazioni extra)
 */

import * as XLSX from "xlsx";
import { PrismaClient, FoodCategory, Gender } from "../generated/prisma/client";

const FOOD_CATEGORY_MAP: Record<string, FoodCategory> = {
  FRUTTA: "FRUTTA",
  "FRUTTA SECCA": "FRUTTA_SECCA",
  "FRUTTA ESSICCATA": "FRUTTA_ESSICCATA",
  VERDURA: "VERDURA",
  "LEGUMI E PROTEINE VEGETALI": "LEGUMI_E_PROTEINE_VEGETALI",
  "UOVA E ALBUMI": "UOVA_E_ALBUMI",
  "LATTICINI E SOSTITUTI": "LATTICINI_E_SOSTITUTI",
  CARNE: "CARNE",
  PESCE: "PESCE",
  CEREALI: "CEREALI",
  "CEREALI ELABORATI": "CEREALI_ELABORATI",
  "OLI, BURRO E CIOCCOLATA": "OLI_BURRO_E_CIOCCOLATA",
  "JUNK FOOD": "JUNK_FOOD",
  ALCOLICI: "ALCOLICI",
  ALTRO: "ALTRO",
};

const CATEGORY_RANGES: [number, number, string][] = [
  [3, 41, "FRUTTA"],
  [42, 52, "FRUTTA SECCA"],
  [54, 61, "FRUTTA ESSICCATA"],
  [63, 93, "VERDURA"],
  [94, 116, "LEGUMI E PROTEINE VEGETALI"],
  [117, 119, "UOVA E ALBUMI"],
  [120, 160, "LATTICINI E SOSTITUTI"],
  [161, 185, "CARNE"],
  [186, 210, "PESCE"],
  [211, 232, "CEREALI"],
  [233, 273, "CEREALI ELABORATI"],
  [274, 286, "OLI, BURRO E CIOCCOLATA"],
  [287, 297, "JUNK FOOD"],
  [298, 308, "ALCOLICI"],
];

function safeFloat(v: unknown, def: number | null = 0): number | null {
  if (v == null || v === "") return def;
  const n = Number(v);
  return isNaN(n) ? def : n;
}

function safeStr(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

function cell(ws: XLSX.WorkSheet, row: number, col: number): unknown {
  const addr = XLSX.utils.encode_cell({ r: row - 1, c: col - 1 });
  const c = ws[addr];
  return c ? c.v : null;
}

export interface ImportResult {
  foods: number;
  patients: number;
  measurements: number;
  recipes: number;
  instructions: number;
  errors: string[];
}

export async function importExcel(
  buffer: Buffer,
  professionalId: string,
  prisma: PrismaClient,
): Promise<ImportResult> {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const result: ImportResult = {
    foods: 0,
    patients: 0,
    measurements: 0,
    recipes: 0,
    instructions: 0,
    errors: [],
  };

  // --- 1. Import Foods from MB sheet ---
  if (wb.SheetNames.includes("MB")) {
    const ws = wb.Sheets["MB"];

    // Existing food names for dedup
    const existing = await prisma.food.findMany({
      where: { OR: [{ professionalId }, { professionalId: null }] },
      select: { name: true },
    });
    const existingNames = new Set(existing.map((f) => f.name.toLowerCase()));

    for (let row = 3; row <= 310; row++) {
      const name = safeStr(cell(ws, row, 31));
      if (!name) continue;

      const kcal = safeFloat(cell(ws, row, 32)) ?? 0;
      const fat = safeFloat(cell(ws, row, 33)) ?? 0;
      const satFat = safeFloat(cell(ws, row, 34)) ?? 0;
      const carb = safeFloat(cell(ws, row, 35)) ?? 0;
      const sugar = safeFloat(cell(ws, row, 36)) ?? 0;
      const protein = safeFloat(cell(ws, row, 37)) ?? 0;
      const fiber = safeFloat(cell(ws, row, 38)) ?? 0;

      if (kcal === 0 && fat === 0 && carb === 0 && protein === 0) continue;
      if (existingNames.has(name.toLowerCase())) continue;

      let category: FoodCategory | null = "ALTRO";
      for (const [rmin, rmax, cat] of CATEGORY_RANGES) {
        if (row >= rmin && row <= rmax) {
          category = FOOD_CATEGORY_MAP[cat] ?? "ALTRO";
          break;
        }
      }

      try {
        await prisma.food.create({
          data: {
            professionalId,
            name,
            category,
            kcalPer100g: kcal,
            fatG: fat,
            satFatG: satFat,
            carbG: carb,
            sugarG: sugar,
            proteinG: protein,
            fiberG: fiber,
          },
        });
        existingNames.add(name.toLowerCase());
        result.foods++;
      } catch (e) {
        result.errors.push(`Alimento "${name}": ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // --- 2. Import client and measurements from Misure sheet ---
  if (wb.SheetNames.includes("Misure")) {
    const ws = wb.Sheets["Misure"];

    const clientName = safeStr(cell(ws, 1, 9));
    const heightCm = safeFloat(cell(ws, 2, 9));
    const birthDateRaw = cell(ws, 3, 9);

    let gender: Gender | null = null;
    if (wb.SheetNames.includes("R_M")) {
      const wsRm = wb.Sheets["R_M"];
      const genderStr = safeStr(cell(wsRm, 13, 2)).toUpperCase();
      if (genderStr.includes("DONNA")) gender = "F";
      else if (genderStr.includes("UOMO")) gender = "M";
    }

    let birthDate: Date | null = null;
    if (birthDateRaw instanceof Date) {
      birthDate = birthDateRaw;
    } else if (birthDateRaw) {
      const d = new Date(String(birthDateRaw));
      if (!isNaN(d.getTime())) birthDate = d;
    }

    if (clientName) {
      try {
        const patient = await prisma.patient.create({
          data: {
            professionalId,
            name: clientName,
            birthDate,
            heightCm,
            gender,
          },
        });
        result.patients++;

        // Import measurements
        const plicCols = [6, 9, 12, 15, 18, 21, 24];
        const circCols = [28, 31, 34, 37, 40, 43, 46, 49, 52, 55, 58];

        for (let row = 7; row <= 50; row++) {
          const dateVal = cell(ws, row, 1);
          const weightVal = cell(ws, row, 2);
          if (dateVal == null || weightVal == null) break;

          let date: Date;
          if (dateVal instanceof Date) {
            date = dateVal;
          } else {
            const d = new Date(String(dateVal));
            if (isNaN(d.getTime())) continue;
            date = d;
          }

          const plics = plicCols.map((c) => safeFloat(cell(ws, row, c), null));
          const circs = circCols.map((c) => safeFloat(cell(ws, row, c), null));

          await prisma.visit.create({
            data: {
              patientId: patient.id,
              date,
              weightKg: safeFloat(weightVal),
              plicChest: plics[0],
              plicTricep: plics[1],
              plicAxillary: plics[2],
              plicSubscapular: plics[3],
              plicSuprailiac: plics[4],
              plicAbdominal: plics[5],
              plicThigh: plics[6],
              circNeck: circs[0],
              circChest: circs[1],
              circArmRelaxed: circs[2],
              circArmFlexed: circs[3],
              circWaist: circs[4],
              circLowerAbdomen: circs[5],
              circHips: circs[6],
              circUpperThigh: circs[7],
              circMidThigh: circs[8],
              circLowerThigh: circs[9],
              circCalf: circs[10],
            },
          });
          result.measurements++;
        }
      } catch (e) {
        result.errors.push(`Paziente: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // --- 3. Import recipes from Ricette_opz partic. ---
  if (wb.SheetNames.includes("Ricette_opz partic.")) {
    const ws = wb.Sheets["Ricette_opz partic."];
    const recipeStarts = [4, 14, 24, 34, 44, 54, 64, 74, 84, 94, 104, 114, 124];

    for (const startRow of recipeStarts) {
      const name = safeStr(cell(ws, startRow, 10));
      if (!name) continue;

      let totalKcal: number | null = null;
      let kcalPerPortion: number | null = null;
      const ingredients: { foodName: string; grams: number | null }[] = [];

      for (let r = startRow + 1; r < startRow + 10; r++) {
        const cellName = safeStr(cell(ws, r, 10));
        if (!cellName) continue;

        if (cellName.toUpperCase() === "TOTALE") {
          totalKcal = safeFloat(cell(ws, r, 12));
        } else if (cellName.toUpperCase().includes("PORZIONE") || cellName.toUpperCase().includes("PER ")) {
          kcalPerPortion = safeFloat(cell(ws, r, 13));
        } else {
          const grams = safeFloat(cell(ws, r, 11));
          if (grams && grams > 0) {
            ingredients.push({ foodName: cellName, grams });
          }
        }
      }

      try {
        await prisma.recipe.create({
          data: {
            professionalId,
            name,
            totalKcal,
            kcalPerPortion,
            ingredients: {
              create: ingredients.map((ing, i) => ({
                foodName: ing.foodName,
                grams: ing.grams,
                sortOrder: i,
              })),
            },
          },
        });
        result.recipes++;
      } catch (e) {
        result.errors.push(`Ricetta "${name}": ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  // --- 4. Import dietary instructions ---
  if (wb.SheetNames.includes("Diete indicazioni extra")) {
    const ws = wb.Sheets["Diete indicazioni extra"];
    const sections: [string, number, number][] = [
      ["GESTIONE SGARRO", 1, 21],
      ["IBS - INTESTINO IRRITABILE", 24, 37],
      ["FODMAP", 38, 53],
      ["EMERGENZE DOLCI", 64, 70],
    ];

    let sortOrder = 0;
    for (const [category, start, end] of sections) {
      const lines: string[] = [];
      for (let row = start; row <= end; row++) {
        const val = safeStr(cell(ws, row, 1));
        if (val) lines.push(val);
      }

      if (lines.length > 0) {
        try {
          await prisma.dietaryInstruction.create({
            data: {
              professionalId,
              category,
              title: category,
              content: lines.join("\n"),
              sortOrder,
            },
          });
          result.instructions++;
          sortOrder++;
        } catch (e) {
          result.errors.push(`Istruzione "${category}": ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }
  }

  return result;
}
