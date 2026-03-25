import type { ReportData, ReportMeal, ReportMealOption, ReportMealPlan } from '../types';
import {
  MEAL_TYPE_LABELS,
  escHtml,
  fmtDate,
  fmtNum,
  fmtRange,
  renderDataTable,
  renderPill,
  renderSectionHeader,
} from './shared';

interface ScenarioColumn {
  key: 'rest' | 'workout1' | 'workout2';
  label: string;
  kcal: number | null;
}

function getScenarioColumns(plan: ReportMealPlan): ScenarioColumn[] {
  const columns: ScenarioColumn[] = [{ key: 'rest', label: 'Riposo', kcal: plan.totalKcalRest }];
  if (plan.numVariants >= 2) {
    columns.push({ key: 'workout1', label: plan.workout1Name || 'Allenamento 1', kcal: plan.totalKcalWorkout1 });
  }
  if (plan.numVariants >= 3) {
    columns.push({ key: 'workout2', label: plan.workout2Name || 'Allenamento 2', kcal: plan.totalKcalWorkout2 });
  }
  return columns;
}

function distributionForMeal(plan: ReportMealPlan, mealType: string): number {
  switch (mealType) {
    case 'COLAZIONE':
      return plan.pctBreakfast;
    case 'PRANZO':
      return plan.pctLunch;
    case 'CENA':
      return plan.pctDinner;
    case 'SPUNTINO_MATTINA':
      return plan.pctSnack1;
    case 'SPUNTINO_POMERIGGIO':
      return plan.pctSnack2;
    case 'SPUNTINO_SERA':
      return plan.pctSnack3;
    default:
      return 0;
  }
}

function isMainMeal(mealType: string): boolean {
  return mealType === 'PRANZO' || mealType === 'CENA';
}

function sortMealOptions(options: ReportMealOption[]): ReportMealOption[] {
  return [...options].sort((a, b) => a.sortOrder - b.sortOrder);
}

function renderScenarioCell(option: ReportMealOption, scenario: ScenarioColumn): string {
  const value =
    scenario.key === 'rest'
      ? option.gramsRest
      : scenario.key === 'workout1'
        ? option.gramsWorkout1
        : option.gramsWorkout2;

  return value != null ? `${fmtNum(value, 0)} g` : '-';
}

function renderOptionTable(
  title: string,
  subtitle: string,
  options: ReportMealOption[],
  scenarios: ScenarioColumn[]
): string {
  if (!options.length) return '';

  const rows = sortMealOptions(options).map((option) => [
    escHtml(option.foodName || '-'),
    ...scenarios.map((scenario) => renderScenarioCell(option, scenario)),
  ]);

  return `
    <article class="meal-panel">
      <div>
        <p class="meal-panel-title">${escHtml(title)}</p>
        <p class="meal-panel-copy">${escHtml(subtitle)}</p>
      </div>
      ${renderDataTable(['Alimento', ...scenarios.map((scenario) => scenario.label)], rows, true)}
    </article>
  `;
}

function renderSimpleMeal(meal: ReportMeal, plan: ReportMealPlan, scenarios: ScenarioColumn[]): string {
  const distribution = distributionForMeal(plan, meal.mealType);
  const options = sortMealOptions(meal.options);
  const items = options
    .map((option) => {
      const values = scenarios.map((scenario) => `${scenario.label}: ${renderScenarioCell(option, scenario)}`).join('  |  ');
      return `
        <li class="meal-bullet-item">
          <strong>${escHtml(option.foodName || '-')}</strong><br>
          <span class="muted-copy">${escHtml(values)}</span>
        </li>
      `;
    })
    .join('');

  return `
    <article class="meal-card meal-card--soft">
      <header class="meal-head">
        <div class="meal-head-copy">
          <p class="meal-label">${escHtml(MEAL_TYPE_LABELS[meal.mealType] || meal.mealType)}</p>
          <h3 class="meal-name">${escHtml(MEAL_TYPE_LABELS[meal.mealType] || meal.mealType)}</h3>
          <p class="meal-subtitle">
            ${meal.kcalRest != null ? `${fmtNum(meal.kcalRest, 0)} kcal in assetto base` : 'Scenario base non disponibile'}
          </p>
        </div>
        <div class="meal-meta">
          ${distribution > 0 ? renderPill(`${fmtNum(distribution, 0)}% quota piano`, 'primary') : ''}
          ${meal.kcalRest != null ? renderPill(`${fmtNum(meal.kcalRest, 0)} kcal`) : ''}
        </div>
      </header>
      <ul class="meal-bullet-list">${items}</ul>
      ${
        meal.notes
          ? `
            <div class="callout">
              <p class="callout-title">Nota pasto</p>
              <p class="callout-copy">${escHtml(meal.notes)}</p>
            </div>
          `
          : ''
      }
    </article>
  `;
}

function renderMainMeal(meal: ReportMeal, plan: ReportMealPlan, scenarios: ScenarioColumn[]): string {
  const fixed = meal.options.filter((option) => option.isFixed);
  const carbs = meal.options.filter((option) => !option.isFixed && option.optionGroup === 'CARBOIDRATI');
  const proteins = meal.options.filter((option) => !option.isFixed && option.optionGroup === 'PROTEINE');
  const otherGroups = meal.options.filter(
    (option) => !option.isFixed && option.optionGroup !== 'CARBOIDRATI' && option.optionGroup !== 'PROTEINE'
  );
  const distribution = distributionForMeal(plan, meal.mealType);
  const mealLabel = MEAL_TYPE_LABELS[meal.mealType] || meal.mealType;

  const fixedItems = fixed
    .map((option) => {
      const values = scenarios.map((scenario) => `${scenario.label}: ${renderScenarioCell(option, scenario)}`).join('  |  ');
      return `
        <li class="meal-fixed-item">
          <strong>${escHtml(option.foodName || '-')}</strong> - ${escHtml(values)}
        </li>
      `;
    })
    .join('');

  const groupedNames = [...new Set(otherGroups.map((option) => option.optionGroup || 'ALTRO'))];
  const groupedPanels = groupedNames
    .map((groupName) =>
      renderOptionTable(
        groupName,
        'Alternative aggiuntive',
        otherGroups.filter((option) => (option.optionGroup || 'ALTRO') === groupName),
        scenarios
      )
    )
    .join('');

  return `
    <article class="meal-card meal-card--main">
      <header class="meal-head">
        <div class="meal-head-copy">
          <p class="meal-label">Pasto principale</p>
          <h3 class="meal-name">${escHtml(mealLabel)}</h3>
          <p class="meal-subtitle">
            Tavola di lavoro con alternative, grammature e confronto immediato tra scenari.
          </p>
        </div>
        <div class="meal-meta">
          ${distribution > 0 ? renderPill(`${fmtNum(distribution, 0)}% quota piano`, 'primary') : ''}
          ${meal.kcalRest != null ? renderPill(`${fmtNum(meal.kcalRest, 0)} kcal base`) : ''}
          ${scenarios.length > 1 ? renderPill(`${scenarios.length} scenari`) : ''}
        </div>
      </header>
      ${
        fixedItems
          ? `
            <div class="callout">
              <p class="callout-title">Elementi fissi del pasto</p>
              <ul class="meal-fixed-list">${fixedItems}</ul>
            </div>
          `
          : ''
      }
      ${
        meal.notes
          ? `
            <div class="callout">
              <p class="callout-title">Indicazione operativa</p>
              <p class="callout-copy">${escHtml(meal.notes)}</p>
            </div>
          `
          : ''
      }
      <div class="meal-matrix">
        ${renderOptionTable('Carboidrati', 'Scelta base per la componente energetica del pasto.', carbs, scenarios)}
        ${renderOptionTable('Proteine', 'Opzioni proteiche equivalenti e intercambiabili.', proteins, scenarios)}
        ${groupedPanels}
      </div>
    </article>
  `;
}

function renderVariantCards(plan: ReportMealPlan): string {
  return getScenarioColumns(plan)
    .map((scenario) => {
      const kcal = scenario.kcal != null ? `${fmtNum(scenario.kcal, 0)} kcal` : 'Target non disponibile';
      return `
        <article class="variant-card">
          <p class="variant-label">${escHtml(scenario.label)}</p>
          <p class="variant-kcal">${escHtml(kcal)}</p>
          <p class="variant-meta">Scenario calorico della giornata.</p>
        </article>
      `;
    })
    .join('');
}

function renderDistribution(plan: ReportMealPlan): string {
  return ['COLAZIONE', 'SPUNTINO_MATTINA', 'PRANZO', 'SPUNTINO_POMERIGGIO', 'CENA', 'SPUNTINO_SERA']
    .map((mealType) => ({
      mealType,
      label: MEAL_TYPE_LABELS[mealType] || mealType,
      value: distributionForMeal(plan, mealType),
    }))
    .filter((item) => item.value > 0)
    .map((item) => {
      const width = Math.max(8, Math.min(100, item.value));
      return `
        <article class="distribution-item">
          <div class="distribution-top">
            <span>${escHtml(item.label)}</span>
            <strong>${fmtNum(item.value, 0)}%</strong>
          </div>
          <div class="distribution-bar"><div class="distribution-fill" style="width:${width}%"></div></div>
        </article>
      `;
    })
    .join('');
}

export function buildDietPlan(data: ReportData): string {
  if (!data.mealPlan) return '';

  const plan = data.mealPlan;
  const scenarios = getScenarioColumns(plan);
  const sortedMeals = [...plan.meals].sort((a, b) => a.sortOrder - b.sortOrder);
  const mealCards = sortedMeals
    .map((meal) => (isMainMeal(meal.mealType) ? renderMainMeal(meal, plan, scenarios) : renderSimpleMeal(meal, plan, scenarios)))
    .join('');

  const meta = [
    renderPill(fmtDate(plan.date)),
    plan.name ? renderPill(plan.name, 'primary') : '',
    plan.proteinTargetMin != null || plan.proteinTargetMax != null
      ? renderPill(`Proteine ${fmtRange(plan.proteinTargetMin, plan.proteinTargetMax, 'g')}`, 'accent')
      : '',
  ]
    .filter(Boolean)
    .join('');

  return `
    <section class="report-section">
      ${renderSectionHeader(
        'Piano alimentare',
        'Struttura del piano e tavole pasto',
        'La sezione guida del documento. Le tavole di pranzo e cena concentrano le equivalenze piu rilevanti per il cliente finale.',
        meta
      )}
      <section class="plan-hero">
        <article class="accent-panel hero-block">
          <div>
            <p class="panel-eyebrow">Schema attivo</p>
            <h3 class="hero-title">${escHtml(plan.name || 'Piano nutrizionale')}</h3>
            <p class="hero-copy">
              Piano del ${escHtml(fmtDate(plan.date))} con ${scenarios.length} scenario${scenarios.length > 1 ? 'i' : ''} calorico${scenarios.length > 1 ? 'i' : ''}.
            </p>
          </div>
          ${
            plan.notes
              ? `
                <div class="callout">
                  <p class="callout-title">Nota generale</p>
                  <p class="callout-copy">${escHtml(plan.notes)}</p>
                </div>
              `
              : ''
          }
          <div class="distribution-grid">${renderDistribution(plan)}</div>
        </article>
        <article class="panel hero-block">
          <div>
            <p class="panel-eyebrow">Scenari energia</p>
            <div class="variant-grid">${renderVariantCards(plan)}</div>
          </div>
        </article>
      </section>
      <div class="meal-stack">${mealCards}</div>
    </section>
  `;
}
