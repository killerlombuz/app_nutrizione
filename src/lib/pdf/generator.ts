/**
 * Generatore PDF con Playwright.
 * Converte HTML template in PDF A4.
 */

import { chromium } from 'playwright';
import { buildReportHtml } from './template';
import type { ReportData, ReportSection } from './types';

export async function generatePdf(
  data: ReportData,
  sections: ReportSection[]
): Promise<Uint8Array> {
  const html = buildReportHtml(data, sections);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle' });

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width:100%;font-size:7pt;color:#808080;padding:0 2cm;display:flex;justify-content:space-between">
          <span>${data.professional.name}</span>
          <span>Pagina <span class="pageNumber"></span></span>
          <span>${data.professional.phone || data.professional.email}</span>
        </div>
      `,
    });

    return new Uint8Array(pdf);
  } finally {
    await browser.close();
  }
}
