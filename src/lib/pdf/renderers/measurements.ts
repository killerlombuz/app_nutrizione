import type { ReportData } from '../types';
import {
  buildBodyFatTrendSvg,
  buildCompositionDonutSvg,
  buildWeightTrendSvg,
} from './charts';
import {
  fmtDate,
  fmtMeasure,
  fmtNum,
  getBmiClass,
  renderDataTable,
  renderMetricCard,
  renderPill,
  renderSectionHeader,
} from './shared';

function renderSectionNote(note?: string | null): string {
  if (!note) return '';
  return `
    <div class="callout">
      <p class="callout-title">Nota sezione</p>
      <p class="callout-copy">${note.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\n/g, '<br>')}</p>
    </div>
  `;
}

export function buildMeasurements(data: ReportData): string {
  if (data.visits.length === 0) return '';

  const latest = data.visits[0];
  const previous = data.visits[1] ?? null;
  const summaryMeta = [
    renderPill(fmtDate(latest.date)),
    latest.formulaUsed ? renderPill(latest.formulaUsed, 'primary') : '',
  ]
    .filter(Boolean)
    .join('');

  const summaryCards = [
    renderMetricCard('Peso', fmtMeasure(latest.weightKg, 'kg')),
    renderMetricCard('BMI', fmtNum(latest.bmi), latest.bmi != null ? getBmiClass(latest.bmi) : undefined),
    renderMetricCard('Massa grassa', fmtMeasure(latest.bodyFatPct, '%'), undefined, 'accent'),
    renderMetricCard('Massa magra', fmtMeasure(latest.leanMassKg, 'kg')),
  ].join('');

  const plicRows = [
    ['Petto', fmtNum(latest.plicChest)],
    ['Tricipite', fmtNum(latest.plicTricep)],
    ['Ascella', fmtNum(latest.plicAxillary)],
    ['Scapola', fmtNum(latest.plicSubscapular)],
    ['Soprailiaca', fmtNum(latest.plicSuprailiac)],
    ['Addominale', fmtNum(latest.plicAbdominal)],
    ['Coscia', fmtNum(latest.plicThigh)],
  ].filter(([, value]) => value !== '-');

  const circRows = [
    ['Collo', fmtNum(latest.circNeck)],
    ['Torace', fmtNum(latest.circChest)],
    ['Braccio rilassato', fmtNum(latest.circArmRelaxed)],
    ['Braccio contratto', fmtNum(latest.circArmFlexed)],
    ['Vita', fmtNum(latest.circWaist)],
    ['Addome basso', fmtNum(latest.circLowerAbdomen)],
    ['Fianchi', fmtNum(latest.circHips)],
    ['Coscia alta', fmtNum(latest.circUpperThigh)],
    ['Coscia media', fmtNum(latest.circMidThigh)],
    ['Coscia bassa', fmtNum(latest.circLowerThigh)],
    ['Polpaccio', fmtNum(latest.circCalf)],
  ].filter(([, value]) => value !== '-');

  const visitsRows = data.visits.map((visit) => [
    fmtDate(visit.date),
    fmtNum(visit.weightKg),
    fmtNum(visit.bodyFatPct),
    fmtNum(visit.fatMassKg),
    fmtNum(visit.leanMassKg),
    fmtNum(visit.circWaist),
    fmtNum(visit.bmi),
  ]);

  const weightTrendSvg = buildWeightTrendSvg(data.visits);
  const bodyFatTrendSvg = buildBodyFatTrendSvg(data.visits);
  const compositionSvg = buildCompositionDonutSvg(latest, previous);

  return `
    <section class="report-section">
      ${renderSectionHeader(
        'Composizione corporea',
        'Sintesi clinica e trend principali',
        'Le metriche piu recenti vengono presentate in forma sintetica, con dettaglio delle misure e storico visite.',
        summaryMeta
      )}
      ${renderSectionNote(data.sectionNotes.measurements)}
      <div class="metric-grid">${summaryCards}</div>
      <div class="chart-grid">
        <article class="chart-card">
          <p class="card-title">Trend peso</p>
          ${
            weightTrendSvg
              ? `<div class="chart-wrap">${weightTrendSvg}</div>`
              : '<p class="muted-copy">Servono almeno due misurazioni del peso per costruire il trend.</p>'
          }
        </article>
        <article class="chart-card">
          <p class="card-title">Trend BF%</p>
          ${
            bodyFatTrendSvg
              ? `<div class="chart-wrap">${bodyFatTrendSvg}</div>`
              : '<p class="muted-copy">Servono almeno due misurazioni di body fat per costruire il trend.</p>'
          }
        </article>
        <article class="chart-card">
          <p class="card-title">Composizione corporea</p>
          ${
            compositionSvg
              ? `<div class="chart-wrap">${compositionSvg}</div>`
              : '<p class="muted-copy">Servono valori di massa grassa e massa magra per mostrare il grafico.</p>'
          }
        </article>
      </div>
      <div class="detail-grid">
        ${
          plicRows.length
            ? `
              <article class="detail-card">
                <p class="card-title">Plicometria</p>
                ${renderDataTable(['Distretto', 'Valore (mm)'], plicRows, true)}
              </article>
            `
            : ''
        }
        ${
          circRows.length
            ? `
              <article class="detail-card">
                <p class="card-title">Circonferenze</p>
                ${renderDataTable(['Distretto', 'Valore (cm)'], circRows, true)}
              </article>
            `
            : ''
        }
      </div>
      ${
        visitsRows.length > 1
          ? `
            <article class="detail-card">
              <p class="card-title">Storico visite</p>
              ${renderDataTable(['Data', 'Peso', '% FM', 'FM kg', 'LBM kg', 'Vita', 'BMI'], visitsRows, true)}
            </article>
          `
          : ''
      }
    </section>
  `;
}
