import type { ReportData } from '../types';
import { DAY_LABELS, MEAL_TYPE_LABELS, escHtml, renderPill, renderSectionHeader } from './shared';

function renderSectionNote(note?: string | null): string {
  if (!note) return '';
  return `
    <div class="callout">
      <p class="callout-title">Nota sezione</p>
      <p class="callout-copy">${escHtml(note).replace(/\n/g, '<br>')}</p>
    </div>
  `;
}

export function buildWeeklyExample(data: ReportData): string {
  if (!data.mealPlan) return '';

  const meals = data.mealPlan.meals.filter((meal) => meal.weeklyExamples.length > 0);
  if (!meals.length) return '';

  const cards = meals
    .map((meal) => {
      const days = DAY_LABELS.map((dayLabel, index) => {
        const example = meal.weeklyExamples.find((item) => item.dayOfWeek === index + 1);
        return `
          <article class="weekly-day">
            <p class="weekly-day-name">${dayLabel}</p>
            <div class="weekly-row">
              <p class="weekly-key">Carboidrati</p>
              <p class="weekly-value">${escHtml(example?.carbFood || '-')}</p>
            </div>
            <div class="weekly-row">
              <p class="weekly-key">Verdure</p>
              <p class="weekly-value">${escHtml(example?.vegetable || '-')}</p>
            </div>
            <div class="weekly-row">
              <p class="weekly-key">Proteine</p>
              <p class="weekly-value">${escHtml(example?.proteinFood || '-')}</p>
            </div>
          </article>
        `;
      }).join('');

      return `
        <article class="weekly-card">
          <header class="weekly-header">
            <div>
              <p class="card-title">${escHtml(MEAL_TYPE_LABELS[meal.mealType] || meal.mealType)}</p>
              <p class="muted-copy">Sette giornate di riferimento per velocizzare la scelta delle alternative.</p>
            </div>
            <div class="pill-row">
              ${meal.kcalRest != null ? renderPill(`${meal.kcalRest.toFixed(0)} kcal`, 'primary') : ''}
            </div>
          </header>
          <div class="weekly-grid">${days}</div>
        </article>
      `;
    })
    .join('');

  return `
    <section class="report-section">
      ${renderSectionHeader(
        'Esempio settimanale',
        'Ritmo settimanale dei pasti',
        'Vista rapida per orientare il cliente nelle rotazioni del piano.'
      )}
      ${renderSectionNote(data.sectionNotes.weekly)}
      <div class="weekly-shell">${cards}</div>
    </section>
  `;
}
