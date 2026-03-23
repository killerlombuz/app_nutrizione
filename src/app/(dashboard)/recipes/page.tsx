import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function RecipesPage() {
  const professionalId = await requireProfessionalId();

  const recipes = await prisma.recipe.findMany({
    where: { professionalId },
    include: {
      ingredients: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ricette ({recipes.length})</h1>
        <Button render={<Link href="/recipes/new" />}>+ Nuova Ricetta</Button>
      </div>

      <Card>
        <CardHeader />
        <CardContent>
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
                      <Link
                        href={`/recipes/${recipe.id}/edit`}
                        className="font-medium text-primary hover:underline"
                      >
                        {recipe.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {recipe.totalKcal ? Math.round(recipe.totalKcal) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {recipe.kcalPerPortion
                        ? Math.round(recipe.kcalPerPortion)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {recipe.portions ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {recipe.ingredients.length}
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
