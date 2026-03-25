import { PDF_COLORS } from '../colors';
import type { ReportVisit } from '../types';
import { fmtDate, fmtNum } from './shared';

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

export function buildTrendSvg(visits: ReportVisit[]): string {
  if (visits.length < 2) return '';

  const sorted = [...visits].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const width = 440;
  const height = 190;
  const pad = { top: 22, right: 34, bottom: 34, left: 34 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const weights = sorted.map((visit) => visit.weightKg).filter((value): value is number => value != null);
  if (weights.length < 2) return '';

  const fats = sorted.map((visit) => visit.bodyFatPct).filter((value): value is number => value != null);
  const wMin = Math.floor(Math.min(...weights) - 1.5);
  const wMax = Math.ceil(Math.max(...weights) + 1.5);
  const fMin = fats.length ? Math.floor(Math.min(...fats) - 1.5) : 0;
  const fMax = fats.length ? Math.ceil(Math.max(...fats) + 1.5) : 40;

  const scaleX = (index: number) => pad.left + (index / Math.max(sorted.length - 1, 1)) * plotW;
  const scaleW = (value: number) => pad.top + plotH - ((value - wMin) / Math.max(wMax - wMin, 1)) * plotH;
  const scaleF = (value: number) => pad.top + plotH - ((value - fMin) / Math.max(fMax - fMin, 1)) * plotH;

  let weightPath = '';
  let fatPath = '';
  let weightDots = '';
  let fatDots = '';
  let labels = '';

  sorted.forEach((visit, index) => {
    const x = scaleX(index);

    if (visit.weightKg != null) {
      const y = scaleW(visit.weightKg);
      weightPath += `${weightPath ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `;
      weightDots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.4" fill="${PDF_COLORS.primary}" />`;
    }

    if (visit.bodyFatPct != null) {
      const y = scaleF(visit.bodyFatPct);
      fatPath += `${fatPath ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `;
      fatDots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.1" fill="${PDF_COLORS.secondary}" />`;
    }

    labels += `
      <text x="${x.toFixed(1)}" y="${height - 10}" text-anchor="middle" font-size="8" fill="${PDF_COLORS.muted}">
        ${fmtDate(visit.date)}
      </text>
    `;
  });

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Trend visite">
      <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + plotH}" stroke="${PDF_COLORS.chartGrid}" stroke-width="1" />
      <line x1="${pad.left}" y1="${pad.top + plotH}" x2="${pad.left + plotW}" y2="${pad.top + plotH}" stroke="${PDF_COLORS.chartGrid}" stroke-width="1" />
      <text x="${pad.left - 6}" y="${pad.top + 3}" text-anchor="end" font-size="8" fill="${PDF_COLORS.primary}">${wMax} kg</text>
      <text x="${pad.left - 6}" y="${pad.top + plotH + 3}" text-anchor="end" font-size="8" fill="${PDF_COLORS.primary}">${wMin} kg</text>
      ${
        fats.length
          ? `
            <text x="${pad.left + plotW + 6}" y="${pad.top + 3}" text-anchor="start" font-size="8" fill="${PDF_COLORS.secondary}">${fMax}%</text>
            <text x="${pad.left + plotW + 6}" y="${pad.top + plotH + 3}" text-anchor="start" font-size="8" fill="${PDF_COLORS.secondary}">${fMin}%</text>
          `
          : ''
      }
      <path d="${weightPath}" fill="none" stroke="${PDF_COLORS.primary}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
      ${fatPath ? `<path d="${fatPath}" fill="none" stroke="${PDF_COLORS.secondary}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />` : ''}
      ${weightDots}
      ${fatDots}
      ${labels}
      <line x1="${pad.left}" y1="10" x2="${pad.left + 16}" y2="10" stroke="${PDF_COLORS.primary}" stroke-width="2.2" />
      <text x="${pad.left + 22}" y="13" font-size="8" fill="${PDF_COLORS.text}">Peso</text>
      ${
        fats.length
          ? `
            <line x1="${pad.left + 70}" y1="10" x2="${pad.left + 86}" y2="10" stroke="${PDF_COLORS.secondary}" stroke-width="2.2" />
            <text x="${pad.left + 92}" y="13" font-size="8" fill="${PDF_COLORS.text}">% FM</text>
          `
          : ''
      }
    </svg>
  `;
}
