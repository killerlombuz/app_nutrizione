import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { BookOpenText, CookingPot, Plus } from "lucide-react";

export default async function RecipesPage() {
  const professionalId = await requireProfessionalId();

  const recipes = await prisma.recipe.findMany({
    where: { professionalId },
    select: {
      id: true,
      name: true,
      totalKcal: true,
      kcalPerPortion: true,
      portions: true,
      _count: { select: { ingredients: true } },
    },
    orderBy: { name: "asc" },
  });

  const totalIngredients = recipes.reduce(
    (sum, recipe) => sum + recipe._count.ingredients,
    0
  );

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

      <div className="grid gap-4 md:grid-cols-2">
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
      </div>

      <Card className="bg-white/[0.78]">
        <CardHeader>
          <CardTitle>Archivio ricette</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          {recipes.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nessuna ricetta. Crea la prima!
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Kcal tot</TableHead>
                  <TableHead className="text-right">Kcal/porz.</TableHead>
                  <TableHead className="text-right">Porzioni</TableHead>
                  <TableHead className="text-right">Ingredienti</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.map((recipe) => (
                  <TableRow key={recipe.id}>
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
                      {recipe.totalKcal ? Math.round(recipe.totalKcal) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {recipe.kcalPerPortion
                        ? Math.round(recipe.kcalPerPortion)
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {recipe.portions ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {recipe._count.ingredients}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
