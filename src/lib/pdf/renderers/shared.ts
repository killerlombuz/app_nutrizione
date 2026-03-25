import { MEAL_TYPE_LABELS as BASE_MEAL_TYPE_LABELS } from '@/lib/constants';
import { PDF_COLORS } from '../colors';

export const MEAL_TYPE_LABELS = BASE_MEAL_TYPE_LABELS;
export const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'] as const;

export function fmtDate(date: Date | null | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function fmtNum(value: number | null | undefined, decimals = 1): string {
  if (value == null || Number.isNaN(value)) return '-';
  return Number(value)
    .toFixed(decimals)
    .replace(/\.0+$/, '')
    .replace(/(\.\d*?)0+$/, '$1');
}

export function fmtMeasure(
  value: number | null | undefined,
  suffix: string,
  decimals = 1
): string {
  if (value == null || Number.isNaN(value)) return '-';
  return `${fmtNum(value, decimals)} ${suffix}`;
}

export function fmtRange(
  min: number | null | undefined,
  max: number | null | undefined,
  suffix: string,
  decimals = 0
): string {
  if (min == null && max == null) return '-';
  if (min == null) return fmtMeasure(max, suffix, decimals);
  if (max == null) return fmtMeasure(min, suffix, decimals);
  if (Math.abs(min - max) < 0.001) return fmtMeasure(min, suffix, decimals);
  return `${fmtNum(min, decimals)} - ${fmtNum(max, decimals)} ${suffix}`;
}

export function escHtml(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function getBmiClass(bmi: number): string {
  if (bmi < 18.5) return 'Sottopeso';
  if (bmi < 25) return 'Normopeso';
  if (bmi < 30) return 'Sovrappeso';
  return 'Obesita';
}

export function getAgeYears(date: Date | null | undefined): string {
  if (!date) return '-';
  const birth = new Date(date);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age >= 0 ? `${age} anni` : '-';
}

export function renderMetricCard(
  label: string,
  value: string,
  hint?: string,
  tone: 'default' | 'soft' | 'accent' = 'default'
): string {
  return `
    <article class="metric-card metric-card--${tone}">
      <p class="metric-label">${escHtml(label)}</p>
      <p class="metric-value">${escHtml(value)}</p>
      ${hint ? `<p class="metric-hint">${escHtml(hint)}</p>` : ''}
    </article>
  `;
}

export function renderPill(label: string, tone: 'default' | 'primary' | 'accent' = 'default'): string {
  return `<span class="pill pill--${tone}">${escHtml(label)}</span>`;
}

export function renderSectionHeader(
  eyebrow: string,
  title: string,
  description?: string,
  meta?: string
): string {
  return `
    <header class="section-head">
      <div class="section-head-copy">
        <p class="section-eyebrow">${escHtml(eyebrow)}</p>
        <h2 class="section-title">${escHtml(title)}</h2>
        ${description ? `<p class="section-description">${escHtml(description)}</p>` : ''}
      </div>
      ${meta ? `<div class="section-meta">${meta}</div>` : ''}
    </header>
  `;
}

export function renderDataTable(headers: string[], rows: string[][], compact = false): string {
  const headerHtml = headers.map((header) => `<th>${escHtml(header)}</th>`).join('');
  const bodyHtml = rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell, index) => `<td${index === 0 ? ' class="table-cell--left"' : ''}>${cell}</td>`)
          .join('')}</tr>`
    )
    .join('');

  return `
    <table class="data-table${compact ? ' data-table--compact' : ''}">
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${bodyHtml}</tbody>
    </table>
  `;
}

export function getStyles(): string {
  return `
    @page {
      size: A4;
      margin: 18mm 16mm 20mm;
    }

    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      line-height: 1.45;
      color: ${PDF_COLORS.text};
      background: ${PDF_COLORS.white};
      -webkit-font-smoothing: antialiased;
    }

    h1, h2, h3, h4, p, ul, ol, dl { margin: 0; }

    .report-root { display: flex; flex-direction: column; gap: 0; }
    .page-break { page-break-after: always; break-after: page; }
    .report-section { display: flex; flex-direction: column; gap: 6mm; }

    .cover-page {
      min-height: 252mm;
      display: grid;
      grid-template-columns: minmax(0, 1.65fr) minmax(70mm, 0.95fr);
      gap: 8mm;
      align-items: stretch;
    }

    .cover-hero {
      min-height: 100%;
      border-radius: 10mm;
      padding: 12mm;
      background:
        radial-gradient(circle at top left, rgba(11, 122, 85, 0.18), transparent 28%),
        linear-gradient(155deg, ${PDF_COLORS.panel}, ${PDF_COLORS.light});
      border: 1px solid ${PDF_COLORS.border};
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 8mm;
    }

    .cover-sidebar { display: flex; flex-direction: column; gap: 4mm; }

    .cover-kicker,
    .section-eyebrow,
    .metric-label,
    .table-caption,
    .meal-label,
    .panel-eyebrow {
      font-size: 7pt;
      font-weight: 700;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: ${PDF_COLORS.muted};
    }

    .cover-title {
      max-width: 120mm;
      font-size: 30pt;
      line-height: 1.02;
      letter-spacing: -0.04em;
      color: ${PDF_COLORS.dark};
    }

    .cover-subtitle {
      max-width: 95mm;
      font-size: 11pt;
      line-height: 1.55;
      color: ${PDF_COLORS.muted};
    }

    .cover-patient {
      padding-top: 6mm;
      border-top: 1px solid ${PDF_COLORS.border};
      display: flex;
      flex-direction: column;
      gap: 2mm;
    }

    .cover-patient-name {
      font-size: 19pt;
      line-height: 1.1;
      color: ${PDF_COLORS.dark};
    }

    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 8mm;
      padding-bottom: 4mm;
      border-bottom: 1px solid ${PDF_COLORS.border};
    }

    .section-head-copy {
      display: flex;
      flex-direction: column;
      gap: 1.6mm;
      min-width: 0;
    }

    .section-title {
      font-size: 22pt;
      line-height: 1.05;
      letter-spacing: -0.04em;
      color: ${PDF_COLORS.dark};
    }

    .section-description {
      max-width: 120mm;
      font-size: 9pt;
      color: ${PDF_COLORS.muted};
    }

    .section-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 2mm;
      justify-content: flex-end;
    }

    .panel,
    .soft-panel,
    .accent-panel,
    .meal-card,
    .chart-card,
    .detail-card,
    .info-card,
    .recipe-card,
    .instruction-card,
    .weekly-card,
    .meal-panel {
      border-radius: 6mm;
      border: 1px solid ${PDF_COLORS.border};
      background: ${PDF_COLORS.panel};
      padding: 5mm;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .soft-panel,
    .metric-card--soft,
    .meal-card--soft,
    .weekly-card { background: ${PDF_COLORS.light}; }

    .accent-panel,
    .metric-card--accent {
      background: ${PDF_COLORS.primarySoft};
      border-color: rgba(11, 122, 85, 0.18);
    }

    .metric-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 3mm;
    }

    .metric-grid--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .metric-card {
      border-radius: 5mm;
      border: 1px solid ${PDF_COLORS.border};
      background: ${PDF_COLORS.white};
      padding: 4mm;
      min-height: 27mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 2mm;
    }

    .metric-value {
      font-size: 16pt;
      line-height: 1.05;
      letter-spacing: -0.03em;
      color: ${PDF_COLORS.dark};
      font-weight: 700;
    }

    .metric-hint,
    .muted-copy {
      font-size: 8pt;
      color: ${PDF_COLORS.muted};
    }

    .pill-row,
    .recipe-metrics { display: flex; flex-wrap: wrap; gap: 2mm; }

    .pill {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      padding: 1.1mm 2.5mm;
      font-size: 7.5pt;
      font-weight: 700;
      color: ${PDF_COLORS.text};
      background: ${PDF_COLORS.surface};
      border: 1px solid ${PDF_COLORS.border};
    }

    .pill--primary {
      color: ${PDF_COLORS.primaryDeep};
      background: ${PDF_COLORS.primarySoft};
      border-color: rgba(11, 122, 85, 0.12);
    }

    .pill--accent {
      color: ${PDF_COLORS.accent};
      background: ${PDF_COLORS.accentSoft};
      border-color: rgba(200, 139, 58, 0.14);
    }

    .plan-hero,
    .chart-grid,
    .detail-grid,
    .stack-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 4mm;
    }

    .hero-block { display: flex; flex-direction: column; gap: 4mm; }
    .hero-title {
      font-size: 18pt;
      line-height: 1.08;
      color: ${PDF_COLORS.dark};
      letter-spacing: -0.03em;
    }

    .hero-copy,
    .callout-copy,
    .meal-subtitle { font-size: 8.5pt; color: ${PDF_COLORS.muted}; }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      border-spacing: 0;
      border-radius: 4mm;
      table-layout: fixed;
      overflow: hidden;
    }

    .data-table th,
    .data-table td {
      padding: 3mm 2.5mm;
      border-bottom: 1px solid ${PDF_COLORS.border};
      vertical-align: top;
      font-size: 8pt;
      text-align: left;
    }

    .data-table th {
      background: ${PDF_COLORS.tableHeader};
      color: ${PDF_COLORS.muted};
      font-size: 7.2pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .data-table tbody tr:nth-child(even) td { background: ${PDF_COLORS.tableAlt}; }

    .data-table--compact th,
    .data-table--compact td {
      padding: 2.3mm 2.1mm;
      font-size: 7.4pt;
    }

    .table-cell--left { text-align: left; }

    .callout {
      border-radius: 5mm;
      padding: 4mm;
      background: ${PDF_COLORS.surface};
      border: 1px solid ${PDF_COLORS.border};
      display: flex;
      flex-direction: column;
      gap: 2mm;
    }

    .callout-title,
    .variant-label,
    .weekly-key,
    .weekly-day-name,
    .meal-panel-title {
      font-size: 7pt;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: ${PDF_COLORS.primaryDeep};
    }

    .variant-grid,
    .distribution-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 3mm;
    }

    .variant-card,
    .distribution-item,
    .weekly-day {
      border-radius: 4mm;
      border: 1px solid ${PDF_COLORS.border};
      background: ${PDF_COLORS.white};
      padding: 3mm;
    }

    .variant-kcal {
      font-size: 16pt;
      line-height: 1.05;
      font-weight: 700;
      color: ${PDF_COLORS.dark};
    }

    .distribution-top,
    .weekly-row { display: flex; flex-direction: column; gap: 0.8mm; }

    .distribution-bar {
      width: 100%;
      height: 2.6mm;
      border-radius: 999px;
      background: ${PDF_COLORS.surface};
      overflow: hidden;
    }

    .distribution-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, ${PDF_COLORS.primary}, ${PDF_COLORS.secondary});
    }

    .meal-stack,
    .cover-sidebar,
    .meal-card,
    .chart-card,
    .detail-card,
    .info-card,
    .recipe-card,
    .instruction-card,
    .weekly-card {
      display: flex;
      flex-direction: column;
      gap: 4mm;
    }

    .meal-card--main {
      padding: 5.5mm;
      background:
        linear-gradient(180deg, rgba(11, 122, 85, 0.04), rgba(255, 255, 255, 0)),
        ${PDF_COLORS.panel};
    }

    .meal-head {
      display: flex;
      justify-content: space-between;
      gap: 4mm;
      align-items: flex-start;
    }

    .meal-head-copy { display: flex; flex-direction: column; gap: 1.5mm; min-width: 0; }

    .meal-name,
    .card-title {
      font-size: 14pt;
      line-height: 1.05;
      color: ${PDF_COLORS.dark};
      letter-spacing: -0.03em;
      font-weight: 700;
    }

    .meal-meta { display: flex; flex-wrap: wrap; gap: 2mm; justify-content: flex-end; }

    .meal-fixed-list,
    .meal-bullet-list,
    .stack-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 2mm;
    }

    .meal-fixed-item,
    .meal-bullet-item,
    .stack-list li {
      position: relative;
      padding-left: 4mm;
      font-size: 8.5pt;
      color: ${PDF_COLORS.text};
    }

    .meal-fixed-item::before,
    .meal-bullet-item::before,
    .stack-list li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0.62em;
      width: 1.6mm;
      height: 1.6mm;
      border-radius: 999px;
      background: ${PDF_COLORS.primary};
    }

    .meal-matrix {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 4mm;
    }

    .meal-panel {
      padding: 4.2mm;
      display: flex;
      flex-direction: column;
      gap: 3mm;
      background: ${PDF_COLORS.white};
    }

    .meal-panel-copy,
    .variant-meta { font-size: 8pt; color: ${PDF_COLORS.muted}; }

    .chart-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 54mm;
    }

    .weekly-shell {
      display: grid;
      grid-template-columns: 1fr;
      gap: 4mm;
    }

    .weekly-header {
      display: flex;
      justify-content: space-between;
      gap: 3mm;
      align-items: center;
    }

    .weekly-grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 2mm;
    }

    .weekly-day {
      min-height: 40mm;
      display: flex;
      flex-direction: column;
      gap: 2mm;
    }

    .weekly-day-name {
      padding-bottom: 1.5mm;
      border-bottom: 1px solid ${PDF_COLORS.border};
    }
  `;
}
