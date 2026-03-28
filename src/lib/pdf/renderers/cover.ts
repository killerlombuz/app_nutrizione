import { PDF_COLORS } from '../colors';
import type { ReportData } from '../types';
import {
  escHtml,
  fmtDate,
  fmtMeasure,
  fmtNum,
  getAgeYears,
  renderMetricCard,
  renderPill,
} from './shared';

function renderSectionNote(note?: string | null): string {
  if (!note) return '';
  return `
    <div class="callout">
      <p class="callout-title">Nota sezione</p>
      <p class="callout-copy">${escHtml(note).replace(/\n/g, '<br>')}</p>
    </div>
  `;
}

function safeLogoUrl(url?: string | null): string | null {
  if (!url) return null;
  const value = url.trim();
  if (!value) return null;
  if (!/^(https?:\/\/|data:image\/|blob:|\/)/i.test(value)) return null;
  return escHtml(value);
}

export function buildCover(data: ReportData): string {
  const latestVisit = data.visits[0];
  const planDate = data.mealPlan?.date ?? latestVisit?.date ?? new Date();
  const logoUrl = safeLogoUrl(data.professional.logoUrl);
  const summaryCards = [
    renderMetricCard('Ultimo peso', fmtMeasure(latestVisit?.weightKg, 'kg')),
    renderMetricCard('BMI', fmtNum(latestVisit?.bmi), undefined, 'soft'),
    renderMetricCard('Massa grassa', fmtMeasure(latestVisit?.bodyFatPct, '%'), undefined, 'accent'),
    renderMetricCard('Piano attivo', data.mealPlan?.name || 'Piano nutrizionale', fmtDate(planDate)),
  ].join('');

  const patientMeta = [
    data.patient.birthDate ? getAgeYears(data.patient.birthDate) : null,
    data.patient.heightCm != null ? fmtMeasure(data.patient.heightCm, 'cm', 0) : null,
    data.patient.gender ? data.patient.gender : null,
  ]
    .filter(Boolean)
    .map((value) => renderPill(String(value)))
    .join('');

  const professionalMeta = [data.professional.title, data.professional.phone, data.professional.email]
    .filter(Boolean)
    .map((value) => `<li>${escHtml(String(value))}</li>`)
    .join('');

  return `
    <section class="report-section cover-page">
      <div class="cover-hero">
        <div class="hero-block">
          <div style="display:flex;align-items:center;gap:4mm;flex-wrap:wrap;">
            ${
              logoUrl
                ? `<img src="${logoUrl}" alt="${escHtml(data.professional.name)}" style="width:120px;max-height:60px;object-fit:contain;flex-shrink:0;" />`
                : ''
            }
            <div style="display:flex;flex-direction:column;gap:1mm;">
              <p class="cover-kicker">Studio professionale</p>
              <p style="font-size:16pt;font-weight:700;line-height:1.1;color:${PDF_COLORS.dark};">${escHtml(
                data.professional.name
              )}</p>
              ${data.professional.title ? `<p class="hero-copy">${escHtml(data.professional.title)}</p>` : ''}
            </div>
          </div>
          <p class="cover-kicker">NutriPlan report</p>
          <h1 class="cover-title">Piano nutrizionale personale</h1>
          <p class="cover-subtitle">
            Documento clinico e operativo costruito a partire dalle misure piu recenti,
            dai target del piano e dalle indicazioni alimentari dedicate al paziente.
          </p>
          ${renderSectionNote(data.sectionNotes.cover)}
        </div>
        <div class="cover-patient">
          <p class="cover-kicker">Paziente</p>
          <p class="cover-patient-name">${escHtml(data.patient.name)}</p>
          <div class="pill-row">
            ${patientMeta || renderPill('Scheda anagrafica essenziale')}
            ${renderPill(`Aggiornato ${fmtDate(planDate)}`, 'primary')}
          </div>
        </div>
      </div>
      <aside class="cover-sidebar">
        <section class="accent-panel">
          <p class="panel-eyebrow">Sintesi rapida</p>
          <div class="metric-grid metric-grid--2">${summaryCards}</div>
        </section>
        <section class="panel">
          <p class="panel-eyebrow">Professionista</p>
          <p class="hero-title" style="font-size:16pt">${escHtml(data.professional.name)}</p>
          <p class="hero-copy">
            ${data.professional.title ? escHtml(data.professional.title) : 'Nutrizione clinica e piani alimentari personalizzati'}
          </p>
          ${
            professionalMeta
              ? `<ul class="stack-list">${professionalMeta}</ul>`
              : `<p class="muted-copy">Contatti professionali non disponibili.</p>`
          }
        </section>
        <section class="soft-panel">
          <p class="panel-eyebrow">Contesto documento</p>
          <div class="pill-row">
            ${renderPill('PDF client-ready', 'primary')}
            ${renderPill(data.mealPlan ? 'Con piano alimentare' : 'Senza piano attivo')}
            ${renderPill(data.visits.length ? `${data.visits.length} visite archiviate` : 'Prima visita')}
          </div>
        </section>
      </aside>
    </section>
  `;
}
