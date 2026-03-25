/**
 * Generatore PDF con Playwright.
 * Converte HTML template in PDF A4.
 */

import { chromium, type Browser } from 'playwright';
import { buildReportHtml } from './template';
import type { ReportData, ReportSection } from './types';

// Singleton browser: evita il cold-start di Chromium ad ogni richiesta PDF.
let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.isConnected()) {
    return _browser;
  }
  try {
    _browser = await chromium.launch({ headless: true });
    return _browser;
  } catch (error) {
    throw new Error(
      `Impossibile avviare il browser per la generazione PDF: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function generatePdf(
  data: ReportData,
  sections: ReportSection[]
): Promise<Uint8Array> {
  const html = buildReportHtml(data, sections);

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
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
    await page.close();
  }
}
