import type { ReportData } from '../types';
import { buildDonutSvg, buildTrendSvg } from './charts';
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

export function buildMeasurements(data: ReportData): string {
  if (data.visits.length === 0) return '';

  const latest = data.visits[0];
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

  return `
    <section class="report-section">
      ${renderSectionHeader(
        'Composizione corporea',
        'Sintesi clinica e trend principali',
        'Le metriche piu recenti vengono presentate in forma sintetica, con dettaglio delle misure e storico visite.',
        summaryMeta
      )}
      <div class="metric-grid">${summaryCards}</div>
      <div class="chart-grid">
        ${
          latest.bodyFatPct != null
            ? `
              <article class="chart-card">
                <p class="card-title">Distribuzione massa grassa / massa magra</p>
                <div class="chart-wrap">${buildDonutSvg(latest.bodyFatPct)}</div>
              </article>
            `
            : ''
        }
        ${
          data.visits.length >= 2
            ? `
              <article class="chart-card">
                <p class="card-title">Andamento nel tempo</p>
                <div class="chart-wrap">${buildTrendSvg(data.visits)}</div>
              </article>
            `
            : `
              <article class="chart-card">
                <p class="card-title">Storico visite</p>
                <p class="muted-copy">Serve almeno una seconda visita per mostrare il trend grafico.</p>
              </article>
            `
        }
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
