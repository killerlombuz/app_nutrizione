import { NextResponse } from 'next/server';
import { requireProfessionalId } from '@/lib/auth';
import { loadReportData } from '@/lib/pdf/data-loader';
import { generatePdf } from '@/lib/pdf/generator';
import type { ReportSection } from '@/lib/pdf/types';
import { ALL_SECTIONS } from '@/lib/pdf/types';

function parseSectionNotes(value: string | null): Partial<Record<ReportSection, string>> {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return Object.entries(parsed).reduce<Partial<Record<ReportSection, string>>>((acc, [key, note]) => {
      if (typeof note === 'string' && note.trim() && ALL_SECTIONS.includes(key as ReportSection)) {
        acc[key as ReportSection] = note.trim();
      }
      return acc;
    }, {});
  } catch {
    return {};
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const professionalId = await requireProfessionalId();
  const { patientId } = await params;

  // Parse sections from query params
  const { searchParams } = new URL(request.url);
  const sectionsParam = searchParams.get('sections');
  const sectionNotes = parseSectionNotes(searchParams.get('notes'));
  const sections: ReportSection[] = sectionsParam
    ? (sectionsParam.split(',').filter((s) => ALL_SECTIONS.includes(s as ReportSection)) as ReportSection[])
    : ALL_SECTIONS;

  try {
    const data = await loadReportData(patientId, professionalId, sections, sectionNotes);
    const pdf = await generatePdf(data, sections);

    const filename = `report_${data.patient.name.replace(/\s+/g, '_')}.pdf`;

    return new Response(Buffer.from(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Errore generazione PDF:', error);
    const message = error instanceof Error ? error.message : 'Errore nella generazione del report PDF';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
