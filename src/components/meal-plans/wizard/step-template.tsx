"use client";

import { Check, ChevronRight, LayoutGrid, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MealPlanTemplateData } from "@/features/meal-plan-templates/actions";
import { deleteTemplate } from "@/features/meal-plan-templates/actions";
import { useTransition } from "react";

const DIET_TYPE_LABELS: Record<string, string> = {
  mediterranea: "Mediterranea",
  "low-carb": "Low-carb",
  iperproteica: "Iperproteica",
  vegetariana: "Vegetariana",
  vegana: "Vegana",
};

const DIET_TYPE_COLORS: Record<string, string> = {
  mediterranea: "bg-sky-100 text-sky-800",
  "low-carb": "bg-amber-100 text-amber-800",
  iperproteica: "bg-rose-100 text-rose-800",
  vegetariana: "bg-emerald-100 text-emerald-800",
  vegana: "bg-green-100 text-green-800",
};

interface StepTemplateProps {
  templates: MealPlanTemplateData[];
  selectedId: string | null;
  onSelect: (template: MealPlanTemplateData | null) => void;
}

export function StepTemplate({ templates, selectedId, onSelect }: StepTemplateProps) {
  const [isPending, startTransition] = useTransition();
  const systemTemplates = templates.filter((t) => t.professionalId === null);
  const myTemplates = templates.filter((t) => t.professionalId !== null);

  function handleDelete(templateId: string) {
    startTransition(async () => {
      await deleteTemplate(templateId);
    });
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/[0.78]">
        <CardHeader>
          <CardTitle>Parti da zero o usa un template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Opzione base */}
          <button
            type="button"
            onClick={() => onSelect(null)}
            className={[
              "w-full rounded-[1.5rem] border px-5 py-5 text-left transition-all duration-200",
              selectedId === null
                ? "border-primary/30 bg-[var(--surface-low)] shadow-[var(--shadow-soft)] ring-1 ring-primary/10"
                : "border-transparent hover:bg-[var(--surface-low)]",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10">
                  <LayoutGrid className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-heading text-lg font-semibold">Parti da zero</p>
                  <p className="text-sm text-muted-foreground">
                    Configura manualmente distribuzione e alimenti.
                  </p>
                </div>
              </div>
              {selectedId === null && <Check className="size-5 text-primary shrink-0" />}
            </div>
          </button>

          {/* Template di sistema */}
          <div className="space-y-3">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Template predefiniti
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {systemTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  isSelected={selectedId === template.id}
                  onSelect={() => onSelect(template)}
                />
              ))}
            </div>
          </div>

          {/* I miei template */}
          {myTemplates.length > 0 && (
            <div className="space-y-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                I miei template
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {myTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    isSelected={selectedId === template.id}
                    onSelect={() => onSelect(template)}
                    onDelete={() => handleDelete(template.id)}
                    isDeletePending={isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedId && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-5 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
          <Check className="size-4 shrink-0" />
          Template selezionato. La distribuzione % verrà pre-compilata. Puoi modificarla liberamente al passo successivo.
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={() => onSelect(selectedId !== undefined ? (templates.find((t) => t.id === selectedId) ?? null) : null)}>
          Continua
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: MealPlanTemplateData;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  isDeletePending?: boolean;
}

function TemplateCard({ template, isSelected, onSelect, onDelete, isDeletePending }: TemplateCardProps) {
  const colorClass =
    template.dietType ? (DIET_TYPE_COLORS[template.dietType] ?? "bg-slate-100 text-slate-700") : "bg-slate-100 text-slate-700";
  const dietLabel =
    template.dietType ? (DIET_TYPE_LABELS[template.dietType] ?? template.dietType) : null;

  return (
    <div
      className={[
        "group relative rounded-[1.5rem] border px-5 py-5 transition-all duration-200 cursor-pointer",
        isSelected
          ? "border-primary/30 bg-[var(--surface-low)] shadow-[var(--shadow-soft)] ring-1 ring-primary/10"
          : "border-transparent hover:bg-[var(--surface-low)]",
      ].join(" ")}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-heading text-base font-semibold">{template.name}</p>
            {dietLabel && (
              <span className={`rounded-full px-2.5 py-0.5 text-[0.68rem] font-semibold ${colorClass}`}>
                {dietLabel}
              </span>
            )}
          </div>
          {template.description && (
            <p className="text-sm leading-5 text-muted-foreground line-clamp-2">
              {template.description}
            </p>
          )}
          <div className="flex flex-wrap gap-1 pt-1">
            <Badge variant="outline" className="text-[0.65rem]">
              C {Math.round(template.pctBreakfast * 100)}%
            </Badge>
            <Badge variant="outline" className="text-[0.65rem]">
              P {Math.round(template.pctLunch * 100)}%
            </Badge>
            <Badge variant="outline" className="text-[0.65rem]">
              D {Math.round(template.pctDinner * 100)}%
            </Badge>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isSelected && <Check className="size-5 text-primary" />}
          {onDelete && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              disabled={isDeletePending}
            >
              <Trash2 className="size-4 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
