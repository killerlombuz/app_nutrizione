import type { ReportData } from '../types';
import { escHtml, fmtMeasure, renderDataTable, renderPill, renderSectionHeader } from './shared';

export function buildRecipes(data: ReportData): string {
  if (!data.recipes.length) return '';

  const cards = data.recipes
    .map((recipe) => {
      const ingredientRows = recipe.ingredients.map((ingredient) => [
        escHtml(ingredient.foodName || '-'),
        ingredient.grams != null ? `${ingredient.grams.toFixed(0)} g` : '-',
      ]);

      return `
        <article class="recipe-card">
          <header class="meal-head">
            <div class="meal-head-copy">
              <p class="meal-label">Ricetta</p>
              <h3 class="meal-name">${escHtml(recipe.name)}</h3>
            </div>
            <div class="recipe-metrics">
              ${recipe.totalKcal != null ? renderPill(fmtMeasure(recipe.totalKcal, 'kcal', 0), 'primary') : ''}
              ${recipe.kcalPerPortion != null ? renderPill(`Per porzione ${fmtMeasure(recipe.kcalPerPortion, 'kcal', 0)}`) : ''}
              ${recipe.portions != null ? renderPill(`${recipe.portions.toFixed(0)} porzioni`, 'accent') : ''}
            </div>
          </header>
          ${
            ingredientRows.length
              ? renderDataTable(['Ingrediente', 'Quantita'], ingredientRows, true)
              : '<p class="muted-copy">Ingredienti non disponibili.</p>'
          }
        </article>
      `;
    })
    .join('');

  return `
    <section class="report-section">
      ${renderSectionHeader(
        'Ricette',
        'Preparazioni di supporto al piano',
        'Le ricette vengono presentate in schede compatte, con focus sulle quantita e sull apporto energetico.'
      )}
      <div class="meal-stack">${cards}</div>
    </section>
  `;
}
