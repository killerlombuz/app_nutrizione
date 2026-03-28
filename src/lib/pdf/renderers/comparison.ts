import type { ReportData, ReportVisit } from '../types';
import { escHtml, fmtDate, fmtNum, renderDataTable, renderPill, renderSectionHeader } from './shared';
import { PDF_COLORS } from '../colors';

type ComparisonField = {
  label: string;
  key: keyof Pick<
    ReportVisit,
    'weightKg' | 'bmi' | 'bodyFatPct' | 'fatMassKg' | 'leanMassKg' | 'circWaist' | 'circHips'
  >;
  decimals: number;
  suffix: string;
  lowerIsBetter: boolean;
};

const COMPARISON_FIELDS: ComparisonField[] = [
  { label: 'Peso', key: 'weightKg', decimals: 1, suffix: 'kg', lowerIsBetter: true },
  { label: 'BMI', key: 'bmi', decimals: 1, suffix: '', lowerIsBetter: true },
  { label: 'BF%', key: 'bodyFatPct', decimals: 1, suffix: '%', lowerIsBetter: true },
  { label: 'Massa grassa', key: 'fatMassKg', decimals: 1, suffix: 'kg', lowerIsBetter: true },
  { label: 'Massa magra', key: 'leanMassKg', decimals: 1, suffix: 'kg', lowerIsBetter: false },
  { label: 'Vita', key: 'circWaist', decimals: 1, suffix: 'cm', lowerIsBetter: true },
  { label: 'Fianchi', key: 'circHips', decimals: 1, suffix: 'cm', lowerIsBetter: true },
];

function formatValue(value: number | null, decimals: number, suffix: string): string {
  if (value == null) return '-';
  return suffix ? `${fmtNum(value, decimals)} ${suffix}` : fmtNum(value, decimals);
}

function formatDelta(
  delta: number | null,
  decimals: number,
  suffix: string,
  lowerIsBetter: boolean
): string {
  if (delta == null) return '-';

  const sign = delta > 0 ? '+' : '';
  const label = `${sign}${fmtNum(delta, decimals)}${suffix ? ` ${suffix}` : ''}`;
  const color = delta === 0
    ? PDF_COLORS.muted
    : lowerIsBetter
      ? delta < 0
        ? PDF_COLORS.success
        : PDF_COLORS.danger
      : delta > 0
        ? PDF_COLORS.success
        : PDF_COLORS.danger;

  return `<span style="font-weight:700;color:${color};">${escHtml(label)}</span>`;
}

function renderSectionNote(note?: string | null): string {
  if (!note) return '';
  return `
    <div class="callout">
      <p class="callout-title">Nota sezione</p>
      <p class="callout-copy">${escHtml(note).replace(/\n/g, '<br>')}</p>
    </div>
  `;
}

export function buildComparison(data: ReportData): string {
  if (data.visits.length < 2) return '';

  const sorted = [...data.visits].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const rows = COMPARISON_FIELDS.map((field) => {
    const start = first[field.key];
    const end = last[field.key];
    const delta = start != null && end != null ? end - start : null;

    return [
      escHtml(field.label),
      escHtml(formatValue(start, field.decimals, field.suffix)),
      escHtml(formatValue(end, field.decimals, field.suffix)),
      formatDelta(delta, field.decimals, field.suffix, field.lowerIsBetter),
    ];
  });

  const meta = [
    renderPill(fmtDate(first.date)),
    renderPill(fmtDate(last.date), 'primary'),
    renderPill(`${sorted.length} visite`, 'accent'),
  ].join('');

  return `
    <section class="report-section">
      ${renderSectionHeader(
        'Confronto visite',
        'Prima e ultima visita a colpo d occhio',
        'Sintesi utile per leggere i progressi lungo l intero percorso, con delta evidenziati in modo immediato.',
        meta
      )}
      ${renderSectionNote(data.sectionNotes.comparison)}
      ${renderDataTable(['Misura', 'Prima visita', 'Ultima visita', 'Delta'], rows, true)}
    </section>
  `;
}
