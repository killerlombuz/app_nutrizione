"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ALL_SECTIONS, SECTION_LABELS, type ReportSection } from "@/lib/pdf/types";
import { FileDown, Loader2 } from "lucide-react";

interface ReportConfigProps {
  patientId: string;
  patientName: string;
  hasVisit: boolean;
  hasMealPlan: boolean;
  lastVisitDate: string | null;
  lastPlanName: string | null;
}

export function ReportConfig({
  patientId,
  patientName,
  hasVisit,
  hasMealPlan,
  lastVisitDate,
  lastPlanName,
}: ReportConfigProps) {
  const [selected, setSelected] = useState<Set<ReportSection>>(
    new Set(ALL_SECTIONS)
  );
  const [loading, setLoading] = useState(false);

  function toggle(section: ReportSection) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }

  async function handleDownload() {
    if (selected.size === 0) return;
    setLoading(true);
    try {
      const sections = Array.from(selected).join(",");
      const url = `/api/report/${patientId}?sections=${sections}`;
      const response = await fetch(url);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        alert(err.error || "Errore nella generazione del PDF");
        return;
      }
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `report_${patientName.replace(/\s+/g, "_")}.pdf`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      alert("Errore di rete nella generazione del PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Genera Report PDF</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Riepilogo dati */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ultima visita</span>
            <span>{lastVisitDate ?? "Nessuna visita"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ultimo piano</span>
            <span>{lastPlanName ?? "Nessun piano"}</span>
          </div>
        </div>

        {/* Sezioni */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Sezioni da includere</p>
          <div className="grid grid-cols-2 gap-2">
            {ALL_SECTIONS.map((section) => {
              const isChecked = selected.has(section);
              const isDisabled =
                (section === "measurements" && !hasVisit) ||
                (section === "diet" && !hasMealPlan) ||
                (section === "weekly" && !hasMealPlan);
              return (
                <Label
                  key={section}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                    isDisabled
                      ? "cursor-not-allowed opacity-40"
                      : isChecked
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked && !isDisabled}
                    disabled={isDisabled}
                    onChange={() => !isDisabled && toggle(section)}
                    className="accent-primary"
                  />
                  {SECTION_LABELS[section]}
                </Label>
              );
            })}
          </div>
        </div>

        <Button
          onClick={handleDownload}
          disabled={loading || selected.size === 0}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generazione in corso…
            </>
          ) : (
            <>
              <FileDown className="mr-2 h-4 w-4" />
              Scarica PDF
            </>
          )}
        </Button>

        {!hasVisit && !hasMealPlan && (
          <p className="text-center text-xs text-muted-foreground">
            Aggiungi almeno una visita o un piano alimentare per arricchire il report.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
