import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/layout/metric-card";
import { PendingLink } from "@/components/navigation/pending-link";
import { BookOpenText, CookingPot, Filter, Image as ImageIcon, Plus } from "lucide-react";

function firstParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parseNumberParam(value?: string | string[]) {
  const raw = firstParam(value);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function isChecked(value?: string | string[]) {
  return Boolean(firstParam(value));
}

function recipeTags(recipe: {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isLactoseFree: boolean;
  isLowFodmap: boolean;
}) {
  return [
    recipe.isVegetarian ? { label: "VEG", title: "Vegetariana" } : null,
    recipe.isVegan ? { label: "VGN", title: "Vegana" } : null,
    recipe.isGlutenFree ? { label: "GF", title: "Senza glutine" } : null,
    recipe.isLactoseFree ? { label: "LF", title: "Senza lattosio" } : null,
    recipe.isLowFodmap ? { label: "FOD", title: "Low-FODMAP" } : null,
  ].filter(Boolean) as { label: string; title: string }[];
}

function difficultyLabel(difficulty?: string | null) {
  if (!difficulty) return "-";
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

function totalTime(recipe: { prepTimeMin: number | null; cookTimeMin: number | null }) {
  const values = [recipe.prepTimeMin, recipe.cookTimeMin].filter(
    (value): value is number => value != null
  );
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0);
}

export default async function RecipesPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string | string[];
    difficulty?: string | string[];
    prepMin?: string | string[];
    prepMax?: string | string[];
    vegetarian?: string | string[];
    vegan?: string | string[];
    glutenFree?: string | string[];
    lactoseFree?: string | string[];
    lowFodmap?: string | string[];
  }>;
}) {
  const professionalId = await requireProfessionalId();
  const params = await searchParams;

  const q = firstParam(params.q)?.trim() ?? "";
  const difficulty = firstParam(params.difficulty)?.trim() ?? "";
  const prepMin = parseNumberParam(params.prepMin);
  const prepMax = parseNumberParam(params.prepMax);
  const vegetarian = isChecked(params.vegetarian);
  const vegan = isChecked(params.vegan);
  const glutenFree = isChecked(params.glutenFree);
  const lactoseFree = isChecked(params.lactoseFree);
  const lowFodmap = isChecked(params.lowFodmap);

  const recipes = await prisma.recipe.findMany({
    where: {
      professionalId,
      ...(q
        ? {
            name: {
              contains: q,
              mode: "insensitive",
            },
          }
        : {}),
      ...(difficulty ? { difficulty } : {}),
      ...(prepMin != null || prepMax != null
        ? {
            prepTimeMin: {
              ...(prepMin != null ? { gte: prepMin } : {}),
              ...(prepMax != null ? { lte: prepMax } : {}),
            },
          }
        : {}),
      ...(vegetarian ? { isVegetarian: true } : {}),
      ...(vegan ? { isVegan: true } : {}),
      ...(glutenFree ? { isGlutenFree: true } : {}),
      ...(lactoseFree ? { isLactoseFree: true } : {}),
      ...(lowFodmap ? { isLowFodmap: true } : {}),
    },
    select: {
      id: true,
      name: true,
      totalKcal: true,
      kcalPerPortion: true,
      portions: true,
      imageUrl: true,
      prepTimeMin: true,
      cookTimeMin: true,
      difficulty: true,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: true,
      isLactoseFree: true,
      isLowFodmap: true,
      _count: { select: { ingredients: true } },
    },
    orderBy: { name: "asc" },
  });

  const totalIngredients = recipes.reduce(
    (sum, recipe) => sum + recipe._count.ingredients,
    0
  );

  const taggedRecipes = recipes.filter((recipe) => recipeTags(recipe).length > 0).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pianificazione"
        title="Ricette"
        description="Archivio ricette e combinazioni alimentari riusabili nella pratica clinica."
        action={
          <Button
            render={
              <PendingLink
                href="/recipes/new"
                tone="button"
                pendingLabel="Apro la creazione della ricetta"
              />
            }
          >
            <Plus className="size-4" />
            Nuova Ricetta
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Ricette archiviate"
          value={recipes.length}
          hint="template disponibili"
          icon={BookOpenText}
          tone="emerald"
        />
        <MetricCard
          label="Ingredienti totali"
          value={totalIngredients}
          hint="sommatoria dei componenti ricetta"
          icon={CookingPot}
          tone="amber"
        />
        <MetricCard
          label="Ricette etichettate"
          value={taggedRecipes}
          hint="con tag dietetici valorizzati"
          icon={Filter}
          tone="cobalt"
        />
      </div>

      <Card className="bg-white/[0.78]">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle>Filtri</CardTitle>
          <form className="mt-4 grid gap-3 lg:grid-cols-6">
            <Input
              name="q"
              placeholder="Cerca ricetta..."
              defaultValue={q}
              className="lg:col-span-2"
            />
            <Select name="difficulty" defaultValue={difficulty}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tutte le difficolta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tutte le difficolta</SelectItem>
                <SelectItem value="facile">Facile</SelectItem>
                <SelectItem value="media">Media</SelectItem>
                <SelectItem value="avanzata">Avanzata</SelectItem>
              </SelectContent>
            </Select>
            <Input
              name="prepMin"
              type="number"
              min="0"
              step="1"
              placeholder="Prep min"
              defaultValue={prepMin ?? ""}
            />
            <Input
              name="prepMax"
              type="number"
              min="0"
              step="1"
              placeholder="Prep max"
              defaultValue={prepMax ?? ""}
            />
            <Button type="submit" variant="secondary" className="lg:col-span-2">
              Filtra
            </Button>
            <div className="flex flex-wrap gap-3 lg:col-span-6">
              {[
                { name: "vegetarian", label: "Vegetariana", checked: vegetarian },
                { name: "vegan", label: "Vegana", checked: vegan },
                { name: "glutenFree", label: "Senza glutine", checked: glutenFree },
                { name: "lactoseFree", label: "Senza lattosio", checked: lactoseFree },
                { name: "lowFodmap", label: "Low-FODMAP", checked: lowFodmap },
              ].map((filter) => (
                <label key={filter.name} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name={filter.name}
                    defaultChecked={filter.checked}
                    className="size-4 rounded border-border text-primary focus-visible:ring-4 focus-visible:ring-ring/50"
                  />
                  <span className="text-sm text-muted-foreground">{filter.label}</span>
                </label>
              ))}
            </div>
          </form>
        </CardHeader>
        <CardContent className="pt-4">
          {recipes.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nessuna ricetta con questi filtri. Prova a rilassarli oppure crea la prima.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Immagine</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Kcal/porz.</TableHead>
                  <TableHead className="text-right">Tempo tot</TableHead>
                  <TableHead>Difficolta</TableHead>
                  <TableHead>Tag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.map((recipe) => {
                  const time = totalTime(recipe);
                  const tags = recipeTags(recipe);

                  return (
                    <TableRow key={recipe.id}>
                      <TableCell>
                        {recipe.imageUrl ? (
                          <div className="h-10 w-10 overflow-hidden rounded-xl border border-border/60 bg-muted">
                            <Image
                              src={recipe.imageUrl}
                              alt={recipe.name}
                              width={40}
                              height={40}
                              unoptimized
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-gradient-to-br from-emerald-100 via-white to-amber-100 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
                            <ImageIcon className="size-4" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <PendingLink
                          href={`/recipes/${recipe.id}/edit`}
                          tone="text"
                          pendingLabel={`Apro la modifica di ${recipe.name}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {recipe.name}
                        </PendingLink>
                      </TableCell>
                      <TableCell className="text-right">
                        {recipe.kcalPerPortion ? Math.round(recipe.kcalPerPortion) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {time ? `${time} min` : "-"}
                      </TableCell>
                      <TableCell>{difficultyLabel(recipe.difficulty)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tags.length > 0 ? (
                            tags.map((tag) => (
                              <Badge key={tag.label} variant="outline" title={tag.title}>
                                {tag.label}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
