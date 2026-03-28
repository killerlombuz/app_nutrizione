import { PDF_COLORS } from '../colors';
import type { ReportMacroTargets, ReportMealPlan, ReportVisit } from '../types';
import { MEAL_TYPE_LABELS, fmtNum } from './shared';

type TrendPoint = {
  date: Date;
  value: number;
};

function shortDate(date: Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(date));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildTrendChartSvg(
  points: TrendPoint[],
  options: {
    title: string;
    unit: string;
    color: string;
    decimals?: number;
    targetValue?: number | null;
    targetLabel?: string;
  }
): string {
  if (points.length < 2) return '';

  const width = 520;
  const height = 220;
  const pad = { top: 28, right: 28, bottom: 42, left: 46 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const decimals = options.decimals ?? 1;
  const values = points.map((point) => point.value);
  const seriesValues = options.targetValue != null ? [...values, options.targetValue] : values;
  const minValue = Math.min(...seriesValues);
  const maxValue = Math.max(...seriesValues);
  const span = Math.max(maxValue - minValue, 1);
  const padding = span * 0.18;
  const yMin = Math.floor((minValue - padding) * 10) / 10;
  const yMax = Math.ceil((maxValue + padding) * 10) / 10;
  const ySpan = Math.max(yMax - yMin, 1);

  const xAt = (index: number) => pad.left + (index / Math.max(points.length - 1, 1)) * plotW;
  const yAt = (value: number) => pad.top + plotH - ((value - yMin) / ySpan) * plotH;

  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${xAt(index).toFixed(1)},${yAt(point.value).toFixed(1)}`)
    .join(' ');

  const gridLines = [0, 1, 2, 3, 4]
    .map((step) => {
      const value = yMax - (step / 4) * (yMax - yMin);
      const y = yAt(value);
      const labelY = y + 3;
      return `
        <line x1="${pad.left}" y1="${y.toFixed(1)}" x2="${pad.left + plotW}" y2="${y.toFixed(1)}" stroke="${PDF_COLORS.chartGrid}" stroke-width="1" />
        <text x="${pad.left - 8}" y="${labelY.toFixed(1)}" text-anchor="end" font-size="8" fill="${PDF_COLORS.muted}">
          ${fmtNum(value, decimals)} ${options.unit}
        </text>
      `;
    })
    .join('');

  const dots = points
    .map((point, index) => {
      const x = xAt(index);
      const y = yAt(point.value);
      return `
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="${options.color}" stroke="${PDF_COLORS.white}" stroke-width="1.5" />
        <text x="${x.toFixed(1)}" y="${(y - 7).toFixed(1)}" text-anchor="middle" font-size="7.2" fill="${PDF_COLORS.dark}">
          ${fmtNum(point.value, decimals)}${options.unit ? ` ${options.unit}` : ''}
        </text>
      `;
    })
    .join('');

  const dateLabels = points
    .map((point, index) => {
      const x = xAt(index);
      return `
        <text x="${x.toFixed(1)}" y="${height - 12}" text-anchor="middle" font-size="7.5" fill="${PDF_COLORS.muted}">
          ${shortDate(point.date)}
        </text>
      `;
    })
    .join('');

  const targetLine =
    options.targetValue != null
      ? `
        <line
          x1="${pad.left}"
          y1="${yAt(options.targetValue).toFixed(1)}"
          x2="${pad.left + plotW}"
          y2="${yAt(options.targetValue).toFixed(1)}"
          stroke="${PDF_COLORS.warning}"
          stroke-width="1.4"
          stroke-dasharray="4 4"
        />
        <text x="${pad.left + plotW}" y="${(yAt(options.targetValue) - 4).toFixed(1)}" text-anchor="end" font-size="8" fill="${PDF_COLORS.warning}">
          ${options.targetLabel || 'Target'} ${fmtNum(options.targetValue, decimals)} ${options.unit}
        </text>
      `
      : '';

  const latest = points[points.length - 1];

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${options.title}">
      <rect x="0" y="0" width="${width}" height="${height}" rx="18" fill="${PDF_COLORS.white}" />
      <text x="${pad.left}" y="16" font-size="9" font-weight="700" fill="${PDF_COLORS.primaryDeep}">${options.title}</text>
      <text x="${width - pad.right}" y="16" text-anchor="end" font-size="8" fill="${PDF_COLORS.muted}">
        Ultimo ${fmtNum(latest.value, decimals)} ${options.unit}
      </text>
      ${gridLines}
      ${targetLine}
      <path d="${path}" fill="none" stroke="${options.color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />
      ${dots}
      ${dateLabels}
    </svg>
  `;
}

function selectTrendPoints(visits: ReportVisit[], key: 'weightKg' | 'bodyFatPct'): TrendPoint[] {
  return visits
    .slice()
    .reverse()
    .filter((visit) => visit[key] != null)
    .map((visit) => ({ date: visit.date, value: visit[key] as number }))
    .slice(-10);
}

function renderLegendLabel(label: string, value: string, color: string, x: number, y: number): string {
  return `
    <g>
      <rect x="${x}" y="${y}" width="10" height="10" rx="5" fill="${color}" />
      <text x="${x + 14}" y="${y + 9}" font-size="8.2" fill="${PDF_COLORS.text}">${label}: ${value}</text>
    </g>
  `;
}

export function buildDonutSvg(fatPct: number): string {
  const leanPct = Math.max(0, 100 - fatPct);
  const radius = 58;
  const cx = 82;
  const cy = 82;
  const circumference = 2 * Math.PI * radius;
  const fatLength = (Math.max(0, Math.min(fatPct, 100)) / 100) * circumference;

  return `
    <svg width="180" height="180" viewBox="0 0 180 180" role="img" aria-label="Massa grassa">
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${PDF_COLORS.surface}" stroke-width="18" />
      <circle
        cx="${cx}"
        cy="${cy}"
        r="${radius}"
        fill="none"
        stroke="${PDF_COLORS.primary}"
        stroke-width="18"
        stroke-linecap="round"
        stroke-dasharray="${fatLength} ${circumference}"
        transform="rotate(-90 ${cx} ${cy})"
      />
      <circle cx="${cx}" cy="${cy}" r="${radius - 26}" fill="${PDF_COLORS.white}" />
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="22" font-weight="700" fill="${PDF_COLORS.dark}">
        ${fmtNum(fatPct)}%
      </text>
      <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="9" letter-spacing="1.4" fill="${PDF_COLORS.muted}">
        MASSA GRASSA
      </text>
      <rect x="24" y="154" width="11" height="11" rx="5.5" fill="${PDF_COLORS.primary}" />
      <text x="42" y="163" font-size="9" fill="${PDF_COLORS.text}">FM ${fmtNum(fatPct)}%</text>
      <rect x="102" y="154" width="11" height="11" rx="5.5" fill="${PDF_COLORS.surface}" stroke="${PDF_COLORS.border}" />
      <text x="120" y="163" font-size="9" fill="${PDF_COLORS.text}">LBM ${fmtNum(leanPct)}%</text>
    </svg>
  `;
}

export function buildWeightTrendSvg(visits: ReportVisit[]): string {
  return buildTrendChartSvg(selectTrendPoints(visits, 'weightKg'), {
    title: 'Trend peso ultime 10 visite',
    unit: 'kg',
    color: PDF_COLORS.primary,
    decimals: 1,
  });
}

export function buildBodyFatTrendSvg(visits: ReportVisit[]): string {
  return buildTrendChartSvg(selectTrendPoints(visits, 'bodyFatPct'), {
    title: 'Trend body fat ultime 10 visite',
    unit: '%',
    color: PDF_COLORS.secondary,
    decimals: 1,
  });
}

export function buildCompositionDonutSvg(latest: ReportVisit, previous?: ReportVisit | null): string {
  const fatMass = latest.fatMassKg ?? (latest.weightKg != null && latest.bodyFatPct != null ? (latest.weightKg * latest.bodyFatPct) / 100 : null);
  const leanMass = latest.leanMassKg ?? (latest.weightKg != null && fatMass != null ? latest.weightKg - fatMass : null);

  if (latest.bodyFatPct == null || fatMass == null || leanMass == null) {
    return '';
  }

  const total = Math.max(fatMass + leanMass, 1);
  const fatPct = (fatMass / total) * 100;
  const leanPct = 100 - fatPct;
  const radius = 58;
  const cx = 90;
  const cy = 84;
  const circumference = 2 * Math.PI * radius;
  const fatLength = (fatPct / 100) * circumference;
  const leanLength = circumference - fatLength;
  const fatDelta = previous?.fatMassKg != null ? fatMass - previous.fatMassKg : null;
  const leanDelta = previous?.leanMassKg != null ? leanMass - previous.leanMassKg : null;
  const bfDelta = previous?.bodyFatPct != null ? latest.bodyFatPct - previous.bodyFatPct : null;

  return `
    <svg width="240" height="210" viewBox="0 0 240 210" role="img" aria-label="Composizione corporea">
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${PDF_COLORS.surface}" stroke-width="18" />
      <circle
        cx="${cx}"
        cy="${cy}"
        r="${radius}"
        fill="none"
        stroke="${PDF_COLORS.primary}"
        stroke-width="18"
        stroke-linecap="round"
        stroke-dasharray="${fatLength} ${circumference}"
        transform="rotate(-90 ${cx} ${cy})"
      />
      <circle
        cx="${cx}"
        cy="${cy}"
        r="${radius}"
        fill="none"
        stroke="${PDF_COLORS.white}"
        stroke-width="18"
        stroke-dasharray="${leanLength} ${circumference}"
        stroke-dashoffset="${-fatLength}"
        transform="rotate(-90 ${cx} ${cy})"
      />
      <circle cx="${cx}" cy="${cy}" r="${radius - 28}" fill="${PDF_COLORS.white}" />
      <text x="${cx}" y="${cy - 10}" text-anchor="middle" font-size="22" font-weight="700" fill="${PDF_COLORS.dark}">
        ${fmtNum(latest.bodyFatPct, 1)}%
      </text>
      <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="8.5" letter-spacing="1.2" fill="${PDF_COLORS.muted}">
        BODY FAT
      </text>
      <text x="${cx}" y="${cy + 24}" text-anchor="middle" font-size="8.2" fill="${PDF_COLORS.text}">
        ${fmtNum(fatMass, 1)} kg FM
      </text>
      ${renderLegendLabel('FM', `${fmtNum(fatMass, 1)} kg (${fmtNum(fatPct, 0)}%)`, PDF_COLORS.primary, 18, 154)}
      ${renderLegendLabel('LBM', `${fmtNum(leanMass, 1)} kg (${fmtNum(leanPct, 0)}%)`, PDF_COLORS.surface, 18, 170)}
      <text x="120" y="154" text-anchor="middle" font-size="8.1" fill="${PDF_COLORS.muted}">
        ${bfDelta != null ? `Delta BF ${bfDelta > 0 ? '+' : ''}${fmtNum(bfDelta, 1)} pp` : 'Nessun delta disponibile'}
      </text>
      <text x="120" y="170" text-anchor="middle" font-size="8.1" fill="${PDF_COLORS.muted}">
        ${fatDelta != null ? `Delta FM ${fatDelta > 0 ? '+' : ''}${fmtNum(fatDelta, 1)} kg` : ''}
        ${fatDelta != null && leanDelta != null ? ' / ' : ''}
        ${leanDelta != null ? `Delta LBM ${leanDelta > 0 ? '+' : ''}${fmtNum(leanDelta, 1)} kg` : ''}
      </text>
    </svg>
  `;
}

export function buildMacroDonutSvg(targets: ReportMacroTargets): string {
  const segments = [
    { kcal: targets.carbKcal, color: PDF_COLORS.secondary },
    { kcal: targets.proteinKcal, color: PDF_COLORS.accent },
    { kcal: targets.fatKcal, color: PDF_COLORS.primary },
  ];
  const total = Math.max(targets.totalKcal, 1);
  const radius = 58;
  const cx = 90;
  const cy = 86;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs = segments
    .map((segment) => {
      const length = (segment.kcal / total) * circumference;
      const safeLength = clamp(length, 0, circumference);
      const arc = `
        <circle
          cx="${cx}"
          cy="${cy}"
          r="${radius}"
          fill="none"
          stroke="${segment.color}"
          stroke-width="18"
          stroke-linecap="round"
          stroke-dasharray="${safeLength} ${circumference}"
          stroke-dashoffset="${-offset}"
          transform="rotate(-90 ${cx} ${cy})"
        />
      `;
      offset += safeLength;
      return arc;
    })
    .join('');

  return `
    <svg width="240" height="210" viewBox="0 0 240 210" role="img" aria-label="Distribuzione macronutrienti">
      <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${PDF_COLORS.surface}" stroke-width="18" />
      ${arcs}
      <circle cx="${cx}" cy="${cy}" r="${radius - 28}" fill="${PDF_COLORS.white}" />
      <text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="20" font-weight="700" fill="${PDF_COLORS.dark}">
        ${fmtNum(targets.totalKcal, 0)}
      </text>
      <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="8.5" letter-spacing="1.2" fill="${PDF_COLORS.muted}">
        KCAL TARGET
      </text>
      <text x="${cx}" y="${cy + 24}" text-anchor="middle" font-size="8.2" fill="${PDF_COLORS.text}">
        Distribuzione energetica
      </text>
      ${renderLegendLabel('Carb', `${fmtNum(targets.carbG, 0)} g / ${fmtNum(targets.carbKcal, 0)} kcal`, PDF_COLORS.secondary, 16, 154)}
      ${renderLegendLabel('Prot', `${fmtNum(targets.proteinG, 0)} g / ${fmtNum(targets.proteinKcal, 0)} kcal`, PDF_COLORS.accent, 16, 170)}
      ${renderLegendLabel('Fat', `${fmtNum(targets.fatG, 0)} g / ${fmtNum(targets.fatKcal, 0)} kcal`, PDF_COLORS.primary, 126, 154)}
      <text x="126" y="170" font-size="8.1" fill="${PDF_COLORS.muted}">
        Fibre ${fmtNum(targets.fiberG, 0)} g / Sat fat max ${fmtNum(targets.satFatMaxG, 0)} g
      </text>
    </svg>
  `;
}

export function buildMealDistributionSvg(plan: ReportMealPlan): string {
  const rows = [
    { label: MEAL_TYPE_LABELS['COLAZIONE'] || 'Colazione', value: plan.pctBreakfast, color: PDF_COLORS.primary },
    { label: MEAL_TYPE_LABELS['SPUNTINO_MATTINA'] || 'Spuntino mattina', value: plan.pctSnack1, color: PDF_COLORS.secondary },
    { label: MEAL_TYPE_LABELS['PRANZO'] || 'Pranzo', value: plan.pctLunch, color: PDF_COLORS.accent },
    { label: MEAL_TYPE_LABELS['SPUNTINO_POMERIGGIO'] || 'Spuntino pomeriggio', value: plan.pctSnack2, color: PDF_COLORS.success },
    { label: MEAL_TYPE_LABELS['CENA'] || 'Cena', value: plan.pctDinner, color: PDF_COLORS.primaryDeep },
    { label: MEAL_TYPE_LABELS['SPUNTINO_SERA'] || 'Spuntino sera', value: plan.pctSnack3, color: PDF_COLORS.warning },
  ].filter((row) => row.value > 0);

  if (!rows.length) {
    return `
      <svg width="240" height="120" viewBox="0 0 240 120" role="img" aria-label="Distribuzione pasti">
        <rect x="0" y="0" width="240" height="120" rx="18" fill="${PDF_COLORS.white}" />
        <text x="120" y="60" text-anchor="middle" font-size="9" fill="${PDF_COLORS.muted}">
          Nessuna distribuzione pasti disponibile
        </text>
      </svg>
    `;
  }

  const height = 36 + rows.length * 24;
  const width = 460;
  const barX = 150;
  const barW = 250;

  const bars = rows
    .map((row, index) => {
      const y = 28 + index * 24;
      const fillWidth = Math.max(6, (row.value / 100) * barW);
      return `
        <text x="12" y="${y + 9}" font-size="8.1" fill="${PDF_COLORS.text}">${row.label}</text>
        <rect x="${barX}" y="${y}" width="${barW}" height="10" rx="5" fill="${PDF_COLORS.surface}" />
        <rect x="${barX}" y="${y}" width="${fillWidth.toFixed(1)}" height="10" rx="5" fill="${row.color}" />
        <text x="${barX + barW + 12}" y="${y + 9}" font-size="8.1" fill="${PDF_COLORS.muted}">${fmtNum(row.value, 0)}%</text>
      `;
    })
    .join('');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Distribuzione pasti">
      <rect x="0" y="0" width="${width}" height="${height}" rx="18" fill="${PDF_COLORS.white}" />
      <text x="12" y="16" font-size="9" font-weight="700" fill="${PDF_COLORS.primaryDeep}">Quota energetica per pasto</text>
      ${bars}
    </svg>
  `;
}

export function buildTrendSvg(visits: ReportVisit[]): string {
  return buildWeightTrendSvg(visits);
}
