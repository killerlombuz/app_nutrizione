'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ALL_SECTIONS, SECTION_LABELS } from '@/lib/pdf/types';
import type { ReportSection } from '@/lib/pdf/types';

interface ReportGeneratorProps {
  patientId: string;
  patientName: string;
  lastVisitDate: string | null;
  lastPlanName: string | null;
}

export function ReportGenerator({
  patientId,
  patientName,
  lastVisitDate,
  lastPlanName,
}: ReportGeneratorProps) {
  const [sections, setSections] = useState<Set<ReportSection>>(
    new Set(ALL_SECTIONS)
  );
  const [sectionNotes, setSectionNotes] = useState<Record<ReportSection, string>>(
    () =>
      ALL_SECTIONS.reduce(
        (acc, section) => {
          acc[section] = '';
          return acc;
        },
        {} as Record<ReportSection, string>
      )
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSection(section: ReportSection) {
    setSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }

  function selectAll() {
    setSections(new Set(ALL_SECTIONS));
  }

  function deselectAll() {
    setSections(new Set());
  }

  function updateSectionNote(section: ReportSection, value: string) {
    setSectionNotes((prev) => ({
      ...prev,
      [section]: value,
    }));
  }

  async function handleGenerate() {
    if (sections.size === 0) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (sections.size < ALL_SECTIONS.length) {
        params.set('sections', Array.from(sections).join(','));
      }

      const notesPayload = Array.from(sections).reduce<Record<string, string>>((acc, section) => {
        const note = sectionNotes[section].trim();
        if (note) {
          acc[section] = note;
        }
        return acc;
      }, {});
      if (Object.keys(notesPayload).length > 0) {
        params.set('notes', JSON.stringify(notesPayload));
      }

      const url = `/api/report/${patientId}${params.toString() ? `?${params}` : ''}`;
      const res = await fetch(url);

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Errore ${res.status}`);
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `report_${patientName.replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella generazione');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Report PDF</h1>
      <p className="text-muted-foreground">{patientName}</p>

      <Card>
        <CardHeader>
          <CardTitle>Genera Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ultima visita</span>
              <span>{lastVisitDate || 'Nessuna visita'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ultimo piano</span>
              <span>{lastPlanName || 'Nessun piano'}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sezioni da includere</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Tutte
                </button>
                <span className="text-xs text-muted-foreground">/</span>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Nessuna
                </button>
              </div>
            </div>
            <div className="grid gap-3">
              {ALL_SECTIONS.map((section) => (
                <div
                  key={section}
                  className="space-y-2 rounded-2xl border border-border/70 bg-muted/20 p-3"
                >
                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sections.has(section)}
                      onChange={() => toggleSection(section)}
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    {SECTION_LABELS[section]}
                  </label>
                  <textarea
                    value={sectionNotes[section]}
                    onChange={(event) => updateSectionNote(section, event.target.value)}
                    disabled={!sections.has(section)}
                    placeholder="Nota opzionale per questa sezione"
                    className="min-h-20 w-full rounded-2xl border border-input bg-white/[0.88] px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] outline-none transition-colors placeholder:text-muted-foreground/80 focus:border-primary/30 focus:ring-4 focus:ring-ring/50 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:text-muted-foreground"
                  />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            className="w-full"
            onClick={handleGenerate}
            disabled={loading || sections.size === 0}
          >
            {loading ? 'Generazione in corso...' : 'Genera PDF'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
