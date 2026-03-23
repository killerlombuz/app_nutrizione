"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FOOD_CATEGORIES } from "@/lib/constants";

interface FoodFormProps {
  action: (formData: FormData) => Promise<{ error?: Record<string, string[]> } | void>;
  defaultValues?: Record<string, unknown>;
  submitLabel?: string;
}

export function FoodForm({
  action,
  defaultValues = {},
  submitLabel = "Salva",
}: FoodFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      return await action(formData);
    },
    null
  );

  const errors = (state as { error?: Record<string, string[]> })?.error;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {defaultValues.name ? "Modifica Alimento" : "Nuovo Alimento"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={(defaultValues.name as string) ?? ""}
                required
              />
              {errors?.name && (
                <p className="text-sm text-red-600">{errors.name[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                name="category"
                defaultValue={(defaultValues.category as string) ?? ""}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona..." />
                </SelectTrigger>
                <SelectContent>
                  {FOOD_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Valori nutrizionali per 100g */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Valori nutrizionali per 100g
            </h3>
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { name: "kcalPer100g", label: "Kcal" },
                { name: "proteinG", label: "Proteine (g)" },
                { name: "carbG", label: "Carboidrati (g)" },
                { name: "fatG", label: "Grassi (g)" },
                { name: "satFatG", label: "Grassi saturi (g)" },
                { name: "sugarG", label: "Zuccheri (g)" },
                { name: "fiberG", label: "Fibre (g)" },
              ].map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="number"
                    step="0.1"
                    defaultValue={(defaultValues[field.name] as number) ?? 0}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Flag allergie */}
          <div>
            <h3 className="mb-3 text-sm font-medium text-muted-foreground">
              Caratteristiche
            </h3>
            <div className="flex flex-wrap gap-6">
              {[
                { name: "isFodmap", label: "FODMAP" },
                { name: "isNickel", label: "Nichel" },
                { name: "isGlutenFree", label: "Senza glutine" },
                { name: "isLactoseFree", label: "Senza lattosio" },
              ].map((field) => (
                <label key={field.name} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name={field.name}
                    defaultChecked={defaultValues[field.name] as boolean}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={(defaultValues.notes as string) ?? ""}
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio..." : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
