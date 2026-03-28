/**
 * Generatore PDF con Playwright.
 * Converte HTML template in PDF A4.
 */

import { existsSync } from 'fs';
import chromiumBinary from '@sparticuz/chromium-min';
import { chromium, type Browser } from 'playwright-core';
import { buildReportHtml } from './template';
import type { ReportData, ReportSection } from './types';

// URL del binario Chromium per ambienti serverless (Vercel).
const CHROMIUM_PACK_URL =
  'https://github.com/Sparticuz/chromium/releases/download/v143.0.4/chromium-v143.0.4-pack.x64.tar';

// Singleton browser: evita il cold-start di Chromium ad ogni richiesta PDF.
let _browser: Browser | null = null;

const LOCAL_BROWSER_CANDIDATES = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter((candidate): candidate is string => Boolean(candidate));

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function safeImageUrl(url?: string | null): string | null {
  if (!url) return null;
  const value = url.trim();
  if (!value) return null;
  if (!/^(https?:\/\/|data:image\/|blob:|\/)/i.test(value)) return null;
  return escapeHtml(value);
}

function findLocalBrowserExecutable(): string | null {
  for (const candidate of LOCAL_BROWSER_CANDIDATES) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function launchLocalBrowser(executablePath: string): Promise<Browser> {
  console.log('[PDF] Using local Chromium executable:', executablePath);
  return chromium.launch({
    executablePath,
    headless: true,
    args: ['--disable-dev-shm-usage'],
  });
}

async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.isConnected()) {
    return _browser;
  }

  try {
    const localExecutable = findLocalBrowserExecutable();

    if (!process.env.VERCEL && localExecutable) {
      _browser = await launchLocalBrowser(localExecutable);
      return _browser;
    }

    const execPath = await chromiumBinary.executablePath(CHROMIUM_PACK_URL);
    console.log('[PDF] Chromium executable path:', execPath);
    _browser = await chromium.launch({
      args: chromiumBinary.args,
      executablePath: execPath,
      headless: true,
    });
    return _browser;
  } catch (error) {
    console.error('[PDF] Browser launch failed:', error);
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
  const professionalName = escapeHtml(data.professional.name);
  const contact = escapeHtml(data.professional.phone || data.professional.email);
  const logoUrl = safeImageUrl(data.professional.logoUrl);
  const today = new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

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
        <div style="width:100%;padding:0 16mm;font-size:7.2pt;color:#66756D;display:flex;align-items:center;justify-content:space-between;gap:12px;border-top:1px solid #D7DFDA;">
          <div style="display:flex;align-items:center;gap:8px;min-width:0;">
            ${
              logoUrl
                ? `<img src="${logoUrl}" alt="${professionalName}" style="height:30px;width:auto;object-fit:contain;flex-shrink:0;" />`
                : ''
            }
            <div style="display:flex;flex-direction:column;line-height:1.2;min-width:0;">
              <span style="font-weight:700;color:#15201B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${professionalName}</span>
              <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${contact}</span>
            </div>
          </div>
          <div style="text-align:right;white-space:nowrap;">
            <div>${today}</div>
            <div>Pagina <span class="pageNumber"></span> / <span class="totalPages"></span></div>
          </div>
        </div>
      `,
    });

    return new Uint8Array(pdf);
  } finally {
    await page.close();
  }
}
