import type { ReportData } from '../types';
import { escHtml, renderPill, renderSectionHeader } from './shared';

function renderSectionNote(note?: string | null): string {
  if (!note) return '';
  return `
    <div class="callout">
      <p class="callout-title">Nota sezione</p>
      <p class="callout-copy">${escHtml(note).replace(/\n/g, '<br>')}</p>
    </div>
  `;
}

export function buildInstructions(data: ReportData): string {
  if (!data.instructions.length) return '';

  const cards = [...data.instructions]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(
      (instruction) => `
        <article class="instruction-card">
          <div class="pill-row">
            ${renderPill(instruction.category, 'accent')}
            ${instruction.title ? renderPill(instruction.title) : ''}
          </div>
          ${instruction.title ? `<p class="card-title">${escHtml(instruction.title)}</p>` : ''}
          <p class="callout-copy">${escHtml(instruction.content || '-')}</p>
        </article>
      `
    )
    .join('');

  return `
    <section class="report-section">
      ${renderSectionHeader(
        'Indicazioni speciali',
        'Istruzioni operative e note comportamentali',
        'Ogni blocco raccoglie indicazioni pratiche da tenere a portata di mano nella gestione quotidiana del piano.'
      )}
      ${renderSectionNote(data.sectionNotes.instructions)}
      <div class="meal-stack">${cards}</div>
    </section>
  `;
}
