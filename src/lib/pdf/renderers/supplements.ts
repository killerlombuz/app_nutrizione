import type { ReportData } from '../types';
import { escHtml, fmtMeasure, renderPill, renderSectionHeader } from './shared';

export function buildSupplements(data: ReportData): string {
  const hasSport = data.mealPlan && (data.mealPlan.workout1Name || data.mealPlan.workout2Name);
  const hasSupplements = data.supplements.length > 0;
  if (!hasSport && !hasSupplements) return '';

  const sportCards = [];
  if (data.mealPlan?.workout1Name) {
    sportCards.push(`
      <article class="info-card">
        <p class="card-title">${escHtml(data.mealPlan.workout1Name)}</p>
        <div class="pill-row">
          ${renderPill(fmtMeasure(data.mealPlan.workout1Kcal, 'kcal', 0), 'primary')}
        </div>
      </article>
    `);
  }
  if (data.mealPlan?.workout2Name) {
    sportCards.push(`
      <article class="info-card">
        <p class="card-title">${escHtml(data.mealPlan.workout2Name)}</p>
        <div class="pill-row">
          ${renderPill(fmtMeasure(data.mealPlan.workout2Kcal, 'kcal', 0), 'primary')}
        </div>
      </article>
    `);
  }

  const supplementCards = data.supplements
    .map(
      (supplement) => `
        <article class="info-card">
          <p class="card-title">${escHtml(supplement.name)}</p>
          <div class="pill-row">
            ${supplement.dosage ? renderPill(supplement.dosage, 'primary') : ''}
            ${supplement.timing ? renderPill(supplement.timing) : ''}
          </div>
          ${supplement.notes ? `<p class="muted-copy">${escHtml(supplement.notes)}</p>` : ''}
        </article>
      `
    )
    .join('');

  return `
    <section class="report-section">
      ${renderSectionHeader(
        'Integrazione e sport',
        'Routine di supporto e carichi di lavoro',
        'Le attivita e gli integratori vengono presentati in schede separate per una consultazione piu immediata.'
      )}
      <div class="stack-grid">
        ${sportCards.join('')}
        ${supplementCards}
      </div>
    </section>
  `;
}
