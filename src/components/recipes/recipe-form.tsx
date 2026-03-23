"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

interface RecipeFormProps {
  action: (data: {
    name: string;
    portions: number | null;
    notes: string;
    ingredients: Ingredient[];
  }) => Promise<{ error?: Record<string, string[]> } | void>;
  defaultValues?: {
    name?: string;
    portions?: number | null;
    notes?: string;
    ingredients?: Ingredient[];
  };
  submitLabel?: string;
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
      name: formData.get("name") as string,
      portions: formData.get("portions") ? Number(formData.get("portions")) : null,
      notes: (formData.get("notes") as string) || "",
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
        <CardTitle>
          {defaultValues.name ? "Modifica Ricetta" : "Nuova Ricetta"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome ricetta *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={defaultValues.name ?? ""}
                required
              />
              {errors?.name && (
                <p className="text-sm text-red-600">{errors.name[0]}</p>
              )}
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
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={defaultValues.notes ?? ""}
            />
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
