/**
 * Genera HTML completo per report PDF nutrizionale.
 * Playwright converte questo HTML in PDF A4.
 */

import { PDF_COLORS } from './colors';
import type { ReportData, ReportMeal, ReportSection, ReportVisit } from './types';

const MEAL_TYPE_LABELS: Record<string, string> = {
  COLAZIONE: 'Colazione',
  SPUNTINO_MATTINA: 'Spuntino Mattina',
  PRANZO: 'Pranzo',
  SPUNTINO_POMERIGGIO: 'Spuntino Pomeriggio',
  CENA: 'Cena',
  SPUNTINO_SERA: 'Spuntino Sera',
};

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function fmtDate(d: Date): string {
  return new Date(d).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function fmtNum(n: number | null | undefined, decimals = 1): string {
  if (n == null) return '—';
  return n.toFixed(decimals);
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getBmiClass(bmi: number): string {
  if (bmi < 18.5) return 'Sottopeso';
  if (bmi < 25) return 'Normopeso';
  if (bmi < 30) return 'Sovrappeso';
  return 'Obeso';
}

// --- CSS ---

function getStyles(): string {
  return `
    @page {
      size: A4;
      margin: 2cm;
      @bottom-center {
        content: counter(page);
        font-size: 7pt;
        color: ${PDF_COLORS.muted};
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 9pt;
      line-height: 1.4;
      color: ${PDF_COLORS.text};
    }
    h1 { font-size: 28pt; color: ${PDF_COLORS.dark}; margin-bottom: 8px; }
    h2 { font-size: 18pt; color: ${PDF_COLORS.primary}; margin: 12px 0 8px; }
    h3 { font-size: 13pt; color: ${PDF_COLORS.dark}; margin: 8px 0 4px; }
    h4 { font-size: 10pt; color: ${PDF_COLORS.primary}; margin: 6px 0 3px; }

    .page-break { page-break-after: always; }

    /* Copertina */
    .cover { display: flex; flex-direction: column; justify-content: center; min-height: 85vh; }
    .cover-subtitle { font-size: 14pt; color: ${PDF_COLORS.muted}; margin-bottom: 6px; }
    .cover-line { height: 3px; background: ${PDF_COLORS.primary}; width: 80px; margin: 16px 0; }
    .cover-client { font-size: 16pt; color: ${PDF_COLORS.dark}; margin: 24px 0; }
    .cover-date { font-size: 11pt; color: ${PDF_COLORS.muted}; }
    .cover-summary {
      margin-top: 32px;
      background: ${PDF_COLORS.light};
      border-left: 4px solid ${PDF_COLORS.primary};
      padding: 16px 20px;
      display: inline-block;
    }
    .cover-summary dt { font-size: 8pt; color: ${PDF_COLORS.muted}; text-transform: uppercase; }
    .cover-summary dd { font-size: 14pt; font-weight: bold; color: ${PDF_COLORS.dark}; margin-bottom: 8px; }

    /* Tabelle */
    table { border-collapse: collapse; width: 100%; margin: 6px 0 12px; }
    th, td { padding: 4px 6px; border: 0.5px solid ${PDF_COLORS.border}; font-size: 8pt; }
    th {
      background: ${PDF_COLORS.tableHeader};
      color: white;
      font-weight: bold;
      text-align: center;
    }
    td { text-align: center; }
    td:first-child { text-align: left; }
    tr:nth-child(even) td { background: ${PDF_COLORS.tableAlt}; }

    /* Pasti */
    .meal-title {
      font-size: 14pt;
      font-weight: bold;
      color: ${PDF_COLORS.secondary};
      margin: 10px 0 4px;
    }
    .meal-kcal { font-size: 9pt; color: ${PDF_COLORS.muted}; margin-left: 8px; }
    .meal-list { list-style: none; padding-left: 12px; margin: 4px 0 8px; }
    .meal-list li::before { content: '•'; color: ${PDF_COLORS.primary}; margin-right: 6px; }
    .meal-list li { font-size: 9pt; margin-bottom: 2px; }
    .food-grams { font-weight: bold; }
    .food-fixed { font-weight: bold; color: ${PDF_COLORS.primary}; }

    /* Due colonne pranzo/cena */
    .meal-cols { display: flex; gap: 12px; margin: 6px 0 10px; }
    .meal-cols > div { flex: 1; }
    .meal-cols table td:first-child { text-align: left; }

    /* Settimanale */
    .weekly-table th, .weekly-table td { font-size: 7pt; padding: 3px 4px; }
    .weekly-table td { text-align: center; }

    /* Istruzioni */
    .instruction-content { font-size: 9pt; white-space: pre-line; margin-bottom: 8px; }

    /* Grafici SVG */
    .chart-container { text-align: center; margin: 12px 0; }
    .donut-label { font-size: 9pt; font-weight: bold; }

    /* Footer */
    .footer-line {
      border-top: 0.5px solid ${PDF_COLORS.primary};
      padding-top: 4px;
      margin-top: 16px;
      font-size: 7pt;
      color: ${PDF_COLORS.muted};
      display: flex;
      justify-content: space-between;
    }
  `;
}

// --- SVG Charts ---

function buildDonutSvg(fatPct: number): string {
  const leanPct = 100 - fatPct;
  const r = 60;
  const cx = 80;
  const cy = 80;
  const strokeWidth = 30;

  // Fat arc
  const fatAngle = (fatPct / 100) * 360;
  const fatRad = (fatAngle * Math.PI) / 180;
  const fatX = cx + r * Math.sin(fatRad);
  const fatY = cy - r * Math.cos(fatRad);
  const fatLargeArc = fatAngle > 180 ? 1 : 0;

  // Lean starts where fat ends
  const leanX = cx; // back to top
  const leanY = cy - r;

  return `
    <svg width="160" height="190" viewBox="0 0 160 190">
      <!-- Lean mass arc (full circle background) -->
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
        stroke="${PDF_COLORS.primary}" stroke-width="${strokeWidth}" />
      <!-- Fat mass arc (overlay) -->
      ${fatPct > 0 && fatPct < 100 ? `
        <path d="M ${cx} ${cy - r}
                 A ${r} ${r} 0 ${fatLargeArc} 1 ${fatX.toFixed(1)} ${fatY.toFixed(1)}"
          fill="none" stroke="${PDF_COLORS.accent}" stroke-width="${strokeWidth}" />
      ` : ''}
      <!-- Center text -->
      <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="11" font-weight="bold" fill="${PDF_COLORS.dark}">${fatPct.toFixed(1)}%</text>
      <text x="${cx}" y="${cy + 10}" text-anchor="middle" font-size="7" fill="${PDF_COLORS.muted}">Massa Grassa</text>
      <!-- Legend -->
      <rect x="20" y="170" width="10" height="10" rx="2" fill="${PDF_COLORS.accent}" />
      <text x="34" y="179" font-size="7" fill="${PDF_COLORS.text}">FM ${fatPct.toFixed(1)}%</text>
      <rect x="90" y="170" width="10" height="10" rx="2" fill="${PDF_COLORS.primary}" />
      <text x="104" y="179" font-size="7" fill="${PDF_COLORS.text}">LBM ${leanPct.toFixed(1)}%</text>
    </svg>
  `;
}

function buildTrendSvg(visits: ReportVisit[]): string {
  if (visits.length < 2) return '';

  const sorted = [...visits].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const w = 400;
  const h = 160;
  const pad = { top: 20, right: 50, bottom: 30, left: 50 };
  const plotW = w - pad.left - pad.right;
  const plotH = h - pad.top - pad.bottom;

  const weights = sorted.map((v) => v.weightKg).filter((v): v is number => v != null);
  const fats = sorted.map((v) => v.bodyFatPct).filter((v): v is number => v != null);

  if (weights.length < 2) return '';

  const wMin = Math.floor(Math.min(...weights) - 2);
  const wMax = Math.ceil(Math.max(...weights) + 2);
  const fMin = fats.length ? Math.floor(Math.min(...fats) - 2) : 0;
  const fMax = fats.length ? Math.ceil(Math.max(...fats) + 2) : 40;

  const scaleX = (i: number) => pad.left + (i / (sorted.length - 1)) * plotW;
  const scaleW = (v: number) => pad.top + plotH - ((v - wMin) / (wMax - wMin)) * plotH;
  const scaleF = (v: number) => pad.top + plotH - ((v - fMin) / (fMax - fMin)) * plotH;

  let weightPath = '';
  let fatPath = '';
  let weightDots = '';
  let fatDots = '';
  let labels = '';

  sorted.forEach((v, i) => {
    const x = scaleX(i);
    if (v.weightKg != null) {
      const y = scaleW(v.weightKg);
      weightPath += (i === 0 ? 'M' : 'L') + `${x.toFixed(1)},${y.toFixed(1)} `;
      weightDots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${PDF_COLORS.primary}" />`;
    }
    if (v.bodyFatPct != null) {
      const y = scaleF(v.bodyFatPct);
      fatPath += (fatPath === '' ? 'M' : 'L') + `${x.toFixed(1)},${y.toFixed(1)} `;
      fatDots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${PDF_COLORS.secondary}" />`;
    }
    labels += `<text x="${x.toFixed(1)}" y="${h - 5}" text-anchor="middle" font-size="6" fill="${PDF_COLORS.muted}">${fmtDate(v.date)}</text>`;
  });

  return `
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <!-- Grid -->
      <line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + plotH}" stroke="${PDF_COLORS.border}" stroke-width="0.5" />
      <line x1="${pad.left}" y1="${pad.top + plotH}" x2="${pad.left + plotW}" y2="${pad.top + plotH}" stroke="${PDF_COLORS.border}" stroke-width="0.5" />
      <!-- Y axis labels (Weight) -->
      <text x="${pad.left - 5}" y="${pad.top + 3}" text-anchor="end" font-size="6" fill="${PDF_COLORS.primary}">${wMax} kg</text>
      <text x="${pad.left - 5}" y="${pad.top + plotH + 3}" text-anchor="end" font-size="6" fill="${PDF_COLORS.primary}">${wMin} kg</text>
      <!-- Y axis labels (Fat %) -->
      ${fats.length ? `
        <text x="${pad.left + plotW + 5}" y="${pad.top + 3}" text-anchor="start" font-size="6" fill="${PDF_COLORS.secondary}">${fMax}%</text>
        <text x="${pad.left + plotW + 5}" y="${pad.top + plotH + 3}" text-anchor="start" font-size="6" fill="${PDF_COLORS.secondary}">${fMin}%</text>
      ` : ''}
      <!-- Lines -->
      <path d="${weightPath}" fill="none" stroke="${PDF_COLORS.primary}" stroke-width="2" />
      ${fatPath ? `<path d="${fatPath}" fill="none" stroke="${PDF_COLORS.secondary}" stroke-width="2" stroke-dasharray="4,2" />` : ''}
      ${weightDots}
      ${fatDots}
      ${labels}
      <!-- Legend -->
      <line x1="${pad.left}" y1="8" x2="${pad.left + 15}" y2="8" stroke="${PDF_COLORS.primary}" stroke-width="2" />
      <text x="${pad.left + 18}" y="11" font-size="6" fill="${PDF_COLORS.text}">Peso (kg)</text>
      ${fats.length ? `
        <line x1="${pad.left + 70}" y1="8" x2="${pad.left + 85}" y2="8" stroke="${PDF_COLORS.secondary}" stroke-width="2" stroke-dasharray="4,2" />
        <text x="${pad.left + 88}" y="11" font-size="6" fill="${PDF_COLORS.text}">%FM</text>
      ` : ''}
    </svg>
  `;
}

// --- Sections ---

function buildCover(data: ReportData): string {
  const latest = data.visits[0];
  return `
    <div class="cover">
      <p class="cover-subtitle">${escHtml(data.professional.name)}${data.professional.title ? ` — ${escHtml(data.professional.title)}` : ''}</p>
      <div class="cover-line"></div>
      <h1>Piano Nutrizionale<br>Personalizzato</h1>
      <p class="cover-client">${escHtml(data.patient.name)}</p>
      <p class="cover-date">${data.mealPlan ? fmtDate(data.mealPlan.date) : fmtDate(new Date())}</p>
      ${latest ? `
        <div class="cover-summary">
          <dl>
            <dt>Peso attuale</dt>
            <dd>${fmtNum(latest.weightKg)} kg</dd>
            <dt>Massa grassa</dt>
            <dd>${fmtNum(latest.bodyFatPct)}%</dd>
            ${data.mealPlan?.totalKcalRest ? `
              <dt>Kcal giornaliere</dt>
              <dd>${Math.round(data.mealPlan.totalKcalRest)} kcal</dd>
            ` : ''}
          </dl>
        </div>
      ` : ''}
    </div>
  `;
}

function buildMeasurements(data: ReportData): string {
  if (data.visits.length === 0) return '';
  const latest = data.visits[0];
  const age = data.patient.birthDate
    ? Math.floor((Date.now() - new Date(data.patient.birthDate).getTime()) / (365.25 * 86400000))
    : null;

  let html = '<h2>Composizione Corporea</h2>';

  // Summary table
  html += `
    <h3>Ultima Visita — ${fmtDate(latest.date)}</h3>
    <table>
      <thead><tr>
        <th>Peso (kg)</th><th>BMI</th><th>%FM</th><th>Massa Grassa (kg)</th><th>Massa Magra (kg)</th>
      </tr></thead>
      <tbody><tr>
        <td>${fmtNum(latest.weightKg)}</td>
        <td>${fmtNum(latest.bmi)}${latest.bmi ? ` <small>(${getBmiClass(latest.bmi)})</small>` : ''}</td>
        <td>${fmtNum(latest.bodyFatPct)}</td>
        <td>${fmtNum(latest.fatMassKg)}</td>
        <td>${fmtNum(latest.leanMassKg)}</td>
      </tr></tbody>
    </table>
  `;

  // Donut chart
  if (latest.bodyFatPct != null) {
    html += `<div class="chart-container">${buildDonutSvg(latest.bodyFatPct)}</div>`;
  }

  // Plicometria
  const plics = [
    ['Petto', latest.plicChest],
    ['Tricipite', latest.plicTricep],
    ['Ascella', latest.plicAxillary],
    ['Scapola', latest.plicSubscapular],
    ['Soprailiaca', latest.plicSuprailiac],
    ['Addominale', latest.plicAbdominal],
    ['Coscia', latest.plicThigh],
  ] as const;

  if (plics.some(([, v]) => v != null)) {
    html += '<h3>Plicometria (mm)</h3><table><thead><tr>';
    plics.forEach(([label]) => { html += `<th>${label}</th>`; });
    html += '</tr></thead><tbody><tr>';
    plics.forEach(([, val]) => { html += `<td>${fmtNum(val)}</td>`; });
    html += '</tr></tbody></table>';
  }

  // Circonferenze
  const circs = [
    ['Collo', latest.circNeck],
    ['Torace', latest.circChest],
    ['Braccio ril.', latest.circArmRelaxed],
    ['Braccio contr.', latest.circArmFlexed],
    ['Vita', latest.circWaist],
    ['Add. basso', latest.circLowerAbdomen],
    ['Fianchi', latest.circHips],
    ['Coscia alta', latest.circUpperThigh],
    ['Coscia media', latest.circMidThigh],
    ['Coscia bassa', latest.circLowerThigh],
    ['Polpaccio', latest.circCalf],
  ] as const;

  if (circs.some(([, v]) => v != null)) {
    html += '<h3>Circonferenze (cm)</h3><table><thead><tr>';
    circs.forEach(([label]) => { html += `<th>${label}</th>`; });
    html += '</tr></thead><tbody><tr>';
    circs.forEach(([, val]) => { html += `<td>${fmtNum(val)}</td>`; });
    html += '</tr></tbody></table>';
  }

  // Trend chart
  if (data.visits.length >= 2) {
    const trendSvg = buildTrendSvg(data.visits);
    if (trendSvg) {
      html += `<h3>Andamento nel Tempo</h3><div class="chart-container">${trendSvg}</div>`;
    }
  }

  // Riepilogo visite
  if (data.visits.length > 1) {
    html += '<h3>Riepilogo Visite</h3><table><thead><tr>';
    html += '<th>Data</th><th>Peso</th><th>%FM</th><th>FM (kg)</th><th>LBM (kg)</th><th>Vita (cm)</th><th>BMI</th>';
    html += '</tr></thead><tbody>';
    for (const v of data.visits) {
      html += `<tr>
        <td>${fmtDate(v.date)}</td>
        <td>${fmtNum(v.weightKg)}</td>
        <td>${fmtNum(v.bodyFatPct)}</td>
        <td>${fmtNum(v.fatMassKg)}</td>
        <td>${fmtNum(v.leanMassKg)}</td>
        <td>${fmtNum(v.circWaist)}</td>
        <td>${fmtNum(v.bmi)}</td>
      </tr>`;
    }
    html += '</tbody></table>';
  }

  return html;
}

function isMainMeal(mealType: string): boolean {
  return mealType === 'PRANZO' || mealType === 'CENA';
}

function buildMealSimple(meal: ReportMeal, numVariants: number): string {
  const label = MEAL_TYPE_LABELS[meal.mealType] || meal.mealType;
  let html = `<div class="meal-title">${escHtml(label)}<span class="meal-kcal">${fmtNum(meal.kcalRest, 0)} kcal</span></div>`;
  html += '<ul class="meal-list">';
  for (const opt of meal.options) {
    const name = opt.foodName || '—';
    const grams = fmtNum(opt.gramsRest, 0);
    const cls = opt.isFixed ? 'food-fixed' : 'food-grams';
    let gramsText = `<span class="${cls}">${grams}g</span>`;
    if (numVariants >= 2 && opt.gramsWorkout1 != null) {
      gramsText += ` / ${fmtNum(opt.gramsWorkout1, 0)}g`;
    }
    if (numVariants >= 3 && opt.gramsWorkout2 != null) {
      gramsText += ` / ${fmtNum(opt.gramsWorkout2, 0)}g`;
    }
    html += `<li>${gramsText} ${escHtml(name)}</li>`;
  }
  html += '</ul>';
  return html;
}

function buildMealTable(meal: ReportMeal, numVariants: number): string {
  const label = MEAL_TYPE_LABELS[meal.mealType] || meal.mealType;
  let html = `<div class="meal-title">${escHtml(label)}<span class="meal-kcal">${fmtNum(meal.kcalRest, 0)} kcal</span></div>`;

  // Fixed items first
  const fixed = meal.options.filter((o) => o.isFixed);
  if (fixed.length > 0) {
    for (const f of fixed) {
      html += `<p style="font-size:9pt;margin:2px 0"><span class="food-fixed">${fmtNum(f.gramsRest, 0)}g</span> ${escHtml(f.foodName || '')}</p>`;
    }
  }

  // Split carbs / proteins by optionGroup
  const carbOpts = meal.options.filter((o) => !o.isFixed && o.optionGroup === 'CARBOIDRATI');
  const protOpts = meal.options.filter((o) => !o.isFixed && o.optionGroup === 'PROTEINE');
  const otherOpts = meal.options.filter((o) => !o.isFixed && o.optionGroup !== 'CARBOIDRATI' && o.optionGroup !== 'PROTEINE');

  html += '<div class="meal-cols">';

  // Carboidrati column
  if (carbOpts.length > 0) {
    html += '<div><h4>Carboidrati</h4><table><thead><tr><th>Alimento</th><th>Riposo</th>';
    if (numVariants >= 2) html += '<th>All. 1</th>';
    if (numVariants >= 3) html += '<th>All. 2</th>';
    html += '</tr></thead><tbody>';
    for (const o of carbOpts) {
      html += `<tr><td>${escHtml(o.foodName || '')}</td><td>${fmtNum(o.gramsRest, 0)}g</td>`;
      if (numVariants >= 2) html += `<td>${fmtNum(o.gramsWorkout1, 0)}g</td>`;
      if (numVariants >= 3) html += `<td>${fmtNum(o.gramsWorkout2, 0)}g</td>`;
      html += '</tr>';
    }
    html += '</tbody></table></div>';
  }

  // Proteine column
  if (protOpts.length > 0) {
    html += '<div><h4>Proteine</h4><table><thead><tr><th>Alimento</th><th>Riposo</th>';
    if (numVariants >= 2) html += '<th>All. 1</th>';
    if (numVariants >= 3) html += '<th>All. 2</th>';
    html += '</tr></thead><tbody>';
    for (const o of protOpts) {
      html += `<tr><td>${escHtml(o.foodName || '')}</td><td>${fmtNum(o.gramsRest, 0)}g</td>`;
      if (numVariants >= 2) html += `<td>${fmtNum(o.gramsWorkout1, 0)}g</td>`;
      if (numVariants >= 3) html += `<td>${fmtNum(o.gramsWorkout2, 0)}g</td>`;
      html += '</tr>';
    }
    html += '</tbody></table></div>';
  }

  html += '</div>';

  // Other options (if any)
  if (otherOpts.length > 0) {
    html += '<ul class="meal-list">';
    for (const o of otherOpts) {
      html += `<li><span class="food-grams">${fmtNum(o.gramsRest, 0)}g</span> ${escHtml(o.foodName || '')}</li>`;
    }
    html += '</ul>';
  }

  return html;
}

function buildDietPlan(data: ReportData): string {
  if (!data.mealPlan) return '';
  const plan = data.mealPlan;

  let html = '<h2>Piano Alimentare</h2>';

  // Summary
  html += `<table><thead><tr><th>Variante</th><th>Kcal Totali</th></tr></thead><tbody>`;
  html += `<tr><td>Riposo</td><td>${fmtNum(plan.totalKcalRest, 0)} kcal</td></tr>`;
  if (plan.numVariants >= 2 && plan.totalKcalWorkout1) {
    html += `<tr><td>${escHtml(plan.workout1Name || 'Allenamento 1')}</td><td>${fmtNum(plan.totalKcalWorkout1, 0)} kcal</td></tr>`;
  }
  if (plan.numVariants >= 3 && plan.totalKcalWorkout2) {
    html += `<tr><td>${escHtml(plan.workout2Name || 'Allenamento 2')}</td><td>${fmtNum(plan.totalKcalWorkout2, 0)} kcal</td></tr>`;
  }
  html += '</tbody></table>';

  // Meals
  const sorted = [...plan.meals].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const meal of sorted) {
    if (isMainMeal(meal.mealType)) {
      html += buildMealTable(meal, plan.numVariants);
    } else {
      html += buildMealSimple(meal, plan.numVariants);
    }
  }

  return html;
}

function buildWeeklyExample(data: ReportData): string {
  if (!data.mealPlan) return '';
  const meals = data.mealPlan.meals.filter((m) => m.weeklyExamples.length > 0);
  if (meals.length === 0) return '';

  let html = '<h2>Esempio Settimanale</h2>';

  for (const meal of meals) {
    const label = MEAL_TYPE_LABELS[meal.mealType] || meal.mealType;
    html += `<h3>${escHtml(label)}</h3>`;
    html += '<table class="weekly-table"><thead><tr><th></th>';
    for (const day of DAY_LABELS) html += `<th>${day}</th>`;
    html += '</tr></thead><tbody>';

    // Rows: Carboidrati, Verdure, Proteine
    for (const row of ['carbFood', 'vegetable', 'proteinFood'] as const) {
      const rowLabel = row === 'carbFood' ? 'Carboidrati' : row === 'vegetable' ? 'Verdure' : 'Proteine';
      html += `<tr><td><strong>${rowLabel}</strong></td>`;
      for (let d = 1; d <= 7; d++) {
        const ex = meal.weeklyExamples.find((e) => e.dayOfWeek === d);
        html += `<td>${escHtml(ex?.[row] || '—')}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
  }

  return html;
}

function buildSupplements(data: ReportData): string {
  const hasSport = data.mealPlan && (data.mealPlan.workout1Name || data.mealPlan.workout2Name);
  const hasSupps = data.supplements.length > 0;
  if (!hasSport && !hasSupps) return '';

  let html = '<h2>Integrazione e Sport</h2>';

  // Sport activities
  if (data.mealPlan && (data.mealPlan.workout1Name || data.mealPlan.workout2Name)) {
    html += '<h3>Attività Sportive</h3><table><thead><tr><th>Attività</th><th>Kcal</th></tr></thead><tbody>';
    if (data.mealPlan.workout1Name) {
      html += `<tr><td>${escHtml(data.mealPlan.workout1Name)}</td><td>${fmtNum(data.mealPlan.workout1Kcal, 0)}</td></tr>`;
    }
    if (data.mealPlan.workout2Name) {
      html += `<tr><td>${escHtml(data.mealPlan.workout2Name)}</td><td>${fmtNum(data.mealPlan.workout2Kcal, 0)}</td></tr>`;
    }
    html += '</tbody></table>';
  }

  // Supplements
  if (hasSupps) {
    html += '<h3>Integratori</h3><ul class="meal-list">';
    for (const s of data.supplements) {
      let text = `<strong>${escHtml(s.name)}</strong>`;
      if (s.dosage) text += ` — ${escHtml(s.dosage)}`;
      if (s.timing) text += ` (${escHtml(s.timing)})`;
      if (s.notes) text += ` <em>${escHtml(s.notes)}</em>`;
      html += `<li>${text}</li>`;
    }
    html += '</ul>';
  }

  return html;
}

function buildInstructions(data: ReportData): string {
  if (data.instructions.length === 0) return '';

  let html = '<h2>Indicazioni Speciali</h2>';
  const sorted = [...data.instructions].sort((a, b) => a.sortOrder - b.sortOrder);
  for (const instr of sorted) {
    html += `<h3>${escHtml(instr.title || instr.category)}</h3>`;
    if (instr.content) {
      html += `<div class="instruction-content">${escHtml(instr.content)}</div>`;
    }
  }
  return html;
}

function buildRecipes(data: ReportData): string {
  if (data.recipes.length === 0) return '';

  let html = '<h2>Ricette</h2>';
  for (const recipe of data.recipes) {
    html += `<h3>${escHtml(recipe.name)}</h3>`;
    const info: string[] = [];
    if (recipe.totalKcal) info.push(`Tot: ${Math.round(recipe.totalKcal)} kcal`);
    if (recipe.kcalPerPortion) info.push(`Per porzione: ${Math.round(recipe.kcalPerPortion)} kcal`);
    if (info.length) html += `<p style="font-size:8pt;color:${PDF_COLORS.muted};margin-bottom:4px">${info.join(' — ')}</p>`;

    if (recipe.ingredients.length > 0) {
      html += '<table><thead><tr><th>Ingrediente</th><th>Quantità</th></tr></thead><tbody>';
      for (const ing of recipe.ingredients) {
        html += `<tr><td>${escHtml(ing.foodName || '')}</td><td>${ing.grams ? `${fmtNum(ing.grams, 0)}g` : '—'}</td></tr>`;
      }
      html += '</tbody></table>';
    }
  }
  return html;
}

// --- Main template ---

export function buildReportHtml(data: ReportData, sections: ReportSection[]): string {
  const parts: string[] = [];

  if (sections.includes('cover')) parts.push(buildCover(data));
  if (sections.includes('measurements')) parts.push(buildMeasurements(data));
  if (sections.includes('diet')) parts.push(buildDietPlan(data));
  if (sections.includes('weekly')) parts.push(buildWeeklyExample(data));
  if (sections.includes('supplements')) parts.push(buildSupplements(data));
  if (sections.includes('instructions')) parts.push(buildInstructions(data));
  if (sections.includes('recipes')) parts.push(buildRecipes(data));

  // Filter empty and join with page breaks
  const nonEmpty = parts.filter((p) => p.trim() !== '');
  const body = nonEmpty.join('<div class="page-break"></div>');

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <style>${getStyles()}</style>
</head>
<body>
  ${body}
</body>
</html>`;
}
