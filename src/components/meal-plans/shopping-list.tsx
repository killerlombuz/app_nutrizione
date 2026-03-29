"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckIcon, CopyIcon, PrinterIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MEAL_TYPE_LABELS } from "@/lib/constants";
import {
  generateShoppingList,
  getShoppingCategoryLabel,
  getShoppingScenarioLabel,
  shoppingListToText,
  type ShoppingListMealTemplate,
  type ShoppingScenario,
} from "@/lib/calculations/shopping-list";

interface ShoppingListProps {
  planName: string | null;
  mealTemplates: ShoppingListMealTemplate[];
  numVariants: number;
  workout1Name?: string | null;
  workout2Name?: string | null;
  defaultDaysCount?: number;
}

export function ShoppingList({
  planName,
  mealTemplates,
  numVariants,
  workout1Name,
  workout2Name,
  defaultDaysCount = 7,
}: ShoppingListProps) {
  const [scenario, setScenario] = useState<ShoppingScenario>("rest");
  const [daysCount, setDaysCount] = useState(defaultDaysCount);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeout = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const shoppingList = useMemo(
    () =>
      generateShoppingList(
        mealTemplates,
        scenario,
        daysCount,
        planName?.trim() || "Piano Dieta"
      ),
    [daysCount, mealTemplates, planName, scenario]
  );

  const scenarioLabel = getShoppingScenarioLabel(scenario, workout1Name, workout2Name);
  const groupedItems = shoppingList.items.reduce<
    Array<{ category: string; items: typeof shoppingList.items }>
  >((groups, item) => {
    const category = getShoppingCategoryLabel(item.category);
    const existing = groups.find((group) => group.category === category);

    if (existing) {
      existing.items.push(item);
      return groups;
    }

    groups.push({ category, items: [item] });
    return groups;
  }, []);

  function handleDaysCountChange(value: string) {
    if (!value) {
      setDaysCount(1);
      return;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return;
    }

    setDaysCount(Math.max(1, Math.round(parsed)));
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(
      shoppingListToText(shoppingList, { workout1Name, workout2Name })
    );
    setCopied(true);
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      return;
    }

    const sections = groupedItems
      .map(
        (group) => `
          <section>
            <h2>${group.category}</h2>
            <ul>
              ${group.items
                .map((item) => {
                  const breakdown = item.perMealGrams
                    .map((entry) => {
                      const label = MEAL_TYPE_LABELS[entry.mealType] || entry.mealType;
                      return `${label}: ${Math.round(entry.grams)} g/die`;
                    })
                    .join(" | ");

                  return `<li><strong>${item.foodName}</strong> - ${Math.round(
                    item.totalGrams
                  )} g totali (${breakdown})</li>`;
                })
                .join("")}
            </ul>
          </section>
        `
      )
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html lang="it">
        <head>
          <title>Lista della spesa - ${shoppingList.planName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #111827; }
            h1 { margin-bottom: 4px; }
            p { margin: 0 0 12px; color: #4b5563; }
            section { margin-top: 20px; }
            h2 { margin: 0 0 8px; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: #047857; }
            ul { margin: 0; padding-left: 18px; }
            li { margin-bottom: 8px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <h1>Lista della spesa</h1>
          <p>${shoppingList.planName} - ${scenarioLabel} - ${shoppingList.daysCount} giorni</p>
          ${sections || "<p>Nessun alimento presente per questo scenario.</p>"}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-semibold">Lista della spesa</h2>
        <p className="text-sm text-muted-foreground">
          Aggregazione automatica degli alimenti del piano per scenario e numero di giorni.
        </p>
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-border/60 bg-white/[0.72] p-4 md:grid-cols-[minmax(0,1fr)_120px_auto]">
        <div className="space-y-2">
          <Label htmlFor="shopping-scenario">Scenario</Label>
          <Select
            name="shopping-scenario"
            value={scenario}
            onValueChange={(value) => setScenario(value as ShoppingScenario)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rest">Riposo</SelectItem>
              {numVariants >= 2 && (
                <SelectItem value="workout1">
                  {workout1Name || "Allenamento 1"}
                </SelectItem>
              )}
              {numVariants >= 3 && (
                <SelectItem value="workout2">
                  {workout2Name || "Allenamento 2"}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shopping-days">Giorni</Label>
          <Input
            id="shopping-days"
            type="number"
            min="1"
            step="1"
            value={daysCount}
            onChange={(event) => handleDaysCountChange(event.target.value)}
          />
        </div>

        <div className="flex items-end gap-2">
          <Button type="button" variant="outline" onClick={handleCopy}>
            {copied ? <CheckIcon className="size-4 text-emerald-600" /> : <CopyIcon className="size-4" />}
            {copied ? "Copiata" : "Copia lista"}
          </Button>
          <Button type="button" variant="outline" onClick={handlePrint}>
            <PrinterIcon className="size-4" />
            Stampa
          </Button>
        </div>
      </div>

      {shoppingList.items.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
          Nessun alimento disponibile per lo scenario selezionato.
        </div>
      ) : (
        <div className="space-y-5">
          {groupedItems.map((group) => (
            <section
              key={group.category}
              className="rounded-[1.5rem] border border-border/60 bg-white/[0.72] p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
                  {group.category}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {group.items.length} aliment{group.items.length === 1 ? "o" : "i"}
                </span>
              </div>

              <div className="space-y-3">
                {group.items.map((item, index) => (
                  <div key={`${group.category}-${item.foodId ?? item.foodName}`}>
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{item.foodName}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.perMealGrams
                            .map((entry) => {
                              const mealLabel = MEAL_TYPE_LABELS[entry.mealType] || entry.mealType;
                              return `${mealLabel}: ${Math.round(entry.grams)} g/die`;
                            })
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-foreground">
                          {Math.round(item.totalGrams)} g
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(item.dailyGrams)} g/die
                        </p>
                      </div>
                    </div>
                    {index < group.items.length - 1 && <Separator className="mt-3" />}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
