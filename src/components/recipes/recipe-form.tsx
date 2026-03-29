"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { RecipeFormValues } from "@/validations/recipe";

interface Ingredient {
  foodId: string;
  foodName: string;
  grams: number | null;
}

interface SearchResult {
  id: string;
  name: string;
  kcalPer100g: number;
}

interface RecipeDefaults {
  name?: string;
  portions?: number | null;
  notes?: string;
  imageUrl?: string | null;
  prepTimeMin?: number | null;
  cookTimeMin?: number | null;
  difficulty?: RecipeFormValues["difficulty"];
  instructions?: string;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isLactoseFree?: boolean;
  isLowFodmap?: boolean;
  ingredients?: Ingredient[];
}

export interface RecipeFormProps {
  action: (
    data: RecipeFormValues
  ) => Promise<{ error?: Record<string, string[]> } | void>;
  defaultValues?: RecipeDefaults;
  submitLabel?: string;
}

function toNumberOrNull(value: FormDataEntryValue | null) {
  if (value == null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function checkboxValue(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

export function RecipeForm({
  action,
  defaultValues = {},
  submitLabel = "Salva",
}: RecipeFormProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    defaultValues.ingredients?.length
      ? defaultValues.ingredients
      : [{ foodId: "", foodName: "", grams: null }]
  );
  const [searchResults, setSearchResults] = useState<Record<number, SearchResult[]>>({});
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | null>(null);

  const searchFood = useCallback(async (query: string, index: number) => {
    if (query.length < 2) {
      setSearchResults((prev) => ({ ...prev, [index]: [] }));
      return;
    }

    const res = await fetch(`/api/foods?q=${encodeURIComponent(query)}&limit=5`);
    if (res.ok) {
      const data = await res.json();
      setSearchResults((prev) => ({ ...prev, [index]: data }));
    }
  }, []);

  function selectFood(index: number, food: SearchResult) {
    setIngredients((prev) =>
      prev.map((ing, i) =>
        i === index ? { ...ing, foodId: food.id, foodName: food.name } : ing
      )
    );
    setSearchResults((prev) => ({ ...prev, [index]: [] }));
  }

  function updateIngredient(index: number, field: keyof Ingredient, value: string | number | null) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { foodId: "", foodName: "", grams: null }]);
  }

  function removeIngredient(index: number) {
    if (ingredients.length <= 1) return;
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setErrors(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const result = await action({
      name: String(formData.get("name") ?? ""),
      portions: toNumberOrNull(formData.get("portions")),
      notes: String(formData.get("notes") ?? ""),
      imageUrl: (() => {
        const value = String(formData.get("imageUrl") ?? "").trim();
        return value ? value : undefined;
      })(),
      prepTimeMin: toNumberOrNull(formData.get("prepTimeMin")),
      cookTimeMin: toNumberOrNull(formData.get("cookTimeMin")),
      difficulty: (() => {
        const value = String(formData.get("difficulty") ?? "").trim();
        return value === "" ? undefined : (value as RecipeFormValues["difficulty"]);
      })(),
      instructions: String(formData.get("instructions") ?? ""),
      isVegetarian: checkboxValue(formData, "isVegetarian"),
      isVegan: checkboxValue(formData, "isVegan"),
      isGlutenFree: checkboxValue(formData, "isGlutenFree"),
      isLactoseFree: checkboxValue(formData, "isLactoseFree"),
      isLowFodmap: checkboxValue(formData, "isLowFodmap"),
      ingredients: ingredients.filter((i) => i.foodName.trim() !== ""),
    });

    if (result && "error" in result) {
      setErrors(result.error ?? null);
    }
    setPending(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{defaultValues.name ? "Modifica Ricetta" : "Nuova Ricetta"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome ricetta *</Label>
              <Input id="name" name="name" defaultValue={defaultValues.name ?? ""} required />
              {errors?.name && <p className="text-sm text-red-600">{errors.name[0]}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="portions">Porzioni</Label>
              <Input
                id="portions"
                name="portions"
                type="number"
                step="0.5"
                min="0"
                defaultValue={defaultValues.portions ?? ""}
              />
              {errors?.portions && (
                <p className="text-sm text-red-600">{errors.portions[0]}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-[1.6rem] border border-border/60 bg-white/[0.45] p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Dettagli</Label>
                <p className="text-sm text-muted-foreground">
                  Immagine, tempi e livello di complessita della ricetta.
                </p>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="imageUrl">Immagine o URL</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  placeholder="https://example.com/ricetta.jpg"
                  defaultValue={defaultValues.imageUrl ?? ""}
                />
                {errors?.imageUrl && (
                  <p className="text-sm text-red-600">{errors.imageUrl[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="prepTimeMin">Tempo preparazione (min)</Label>
                <Input
                  id="prepTimeMin"
                  name="prepTimeMin"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={defaultValues.prepTimeMin ?? ""}
                />
                {errors?.prepTimeMin && (
                  <p className="text-sm text-red-600">{errors.prepTimeMin[0]}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cookTimeMin">Tempo cottura (min)</Label>
                <Input
                  id="cookTimeMin"
                  name="cookTimeMin"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={defaultValues.cookTimeMin ?? ""}
                />
                {errors?.cookTimeMin && (
                  <p className="text-sm text-red-600">{errors.cookTimeMin[0]}</p>
                )}
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="difficulty">Difficolta</Label>
                <Select name="difficulty" defaultValue={defaultValues.difficulty ?? ""}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleziona difficolta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nessuna</SelectItem>
                    <SelectItem value="facile">Facile</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="avanzata">Avanzata</SelectItem>
                  </SelectContent>
                </Select>
                {errors?.difficulty && (
                  <p className="text-sm text-red-600">{errors.difficulty[0]}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Ingredienti *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                + Aggiungi
              </Button>
            </div>

            {ingredients.map((ing, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="relative flex-1">
                  <Input
                    placeholder="Cerca alimento..."
                    value={ing.foodName}
                    onChange={(e) => {
                      updateIngredient(index, "foodName", e.target.value);
                      searchFood(e.target.value, index);
                    }}
                  />
                  {searchResults[index]?.length > 0 && (
                    <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-background shadow-md">
                      {searchResults[index].map((food) => (
                        <li key={food.id}>
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => selectFood(index, food)}
                          >
                            {food.name}{" "}
                            <span className="text-muted-foreground">
                              ({food.kcalPer100g} kcal)
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <Input
                  className="w-24"
                  placeholder="Grammi"
                  type="number"
                  step="1"
                  min="0"
                  value={ing.grams ?? ""}
                  onChange={(e) =>
                    updateIngredient(
                      index,
                      "grams",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeIngredient(index)}
                  disabled={ingredients.length <= 1}
                  className="text-destructive"
                >
                  X
                </Button>
              </div>
            ))}
            {errors?.ingredients && (
              <p className="text-sm text-red-600">{errors.ingredients[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Istruzioni</Label>
            <Textarea
              id="instructions"
              name="instructions"
              rows={6}
              placeholder={"1. Lavare le verdure\n2. Tagliare a cubetti...\n3. Cuocere per 10 minuti"}
              defaultValue={defaultValues.instructions ?? ""}
            />
            {errors?.instructions && (
              <p className="text-sm text-red-600">{errors.instructions[0]}</p>
            )}
          </div>

          <div className="space-y-3 rounded-[1.6rem] border border-border/60 bg-white/[0.45] p-4">
            <div>
              <Label className="text-sm font-medium">Tag dietetici</Label>
              <p className="text-sm text-muted-foreground">
                Marca i profili nutrizionali principali della ricetta.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "isVegetarian", label: "Vegetariana" },
                { name: "isVegan", label: "Vegana" },
                { name: "isGlutenFree", label: "Senza glutine" },
                { name: "isLactoseFree", label: "Senza lattosio" },
                { name: "isLowFodmap", label: "Low-FODMAP" },
              ].map((tag) => (
                <label key={tag.name} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    name={tag.name}
                    defaultChecked={Boolean(
                      defaultValues[tag.name as keyof RecipeDefaults]
                    )}
                    className="size-4 rounded border-border text-primary focus-visible:ring-4 focus-visible:ring-ring/50"
                  />
                  <span className="text-sm font-medium text-foreground">{tag.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={defaultValues.notes ?? ""} />
            {errors?.notes && <p className="text-sm text-red-600">{errors.notes[0]}</p>}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Salvataggio..." : submitLabel}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
