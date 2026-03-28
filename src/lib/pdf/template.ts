/**
 * Genera HTML completo per report PDF nutrizionale.
 * Playwright converte questo HTML in PDF A4.
 */

import { buildCover } from './renderers/cover';
import { buildComparison } from './renderers/comparison';
import { buildDietPlan } from './renderers/diet';
import { buildInstructions } from './renderers/instructions';
import { buildMeasurements } from './renderers/measurements';
import { buildRecipes } from './renderers/recipes';
import { getStyles } from './renderers/shared';
import { buildSupplements } from './renderers/supplements';
import { buildWeeklyExample } from './renderers/weekly';
import type { ReportData, ReportSection } from './types';

export function buildReportHtml(data: ReportData, sections: ReportSection[]): string {
  const parts: string[] = [];

  if (sections.includes('cover')) parts.push(buildCover(data));
  if (sections.includes('measurements')) parts.push(buildMeasurements(data));
  if (sections.includes('comparison')) parts.push(buildComparison(data));
  if (sections.includes('diet')) parts.push(buildDietPlan(data));
  if (sections.includes('weekly')) parts.push(buildWeeklyExample(data));
  if (sections.includes('supplements')) parts.push(buildSupplements(data));
  if (sections.includes('instructions')) parts.push(buildInstructions(data));
  if (sections.includes('recipes')) parts.push(buildRecipes(data));

  const body = parts.filter((part) => part.trim() !== '').join('<div class="page-break"></div>');

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${getStyles()}</style>
</head>
<body>
  <main class="report-root">
    ${body}
  </main>
</body>
</html>`;
}
