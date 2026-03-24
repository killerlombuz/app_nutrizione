import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
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
import { FOOD_CATEGORIES } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/layout/metric-card";
import { Apple, Filter, Plus, Wheat } from "lucide-react";

export default async function FoodsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const professionalId = await requireProfessionalId();
  const { q, category } = await searchParams;

  const foods = await prisma.food.findMany({
    where: {
      OR: [{ professionalId }, { professionalId: null }],
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(category ? { category: category as never } : {}),
    },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    take: 100,
  });

  const flaggedCount = foods.filter(
    (food) => food.isFodmap || food.isNickel || food.isGlutenFree || food.isLactoseFree
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Database"
        title="Database alimenti"
        description="Catalogo consultabile con filtri di categoria e marcatori nutrizionali. La vista si allinea alla direzione Stitch, con focus su scansione rapida e leggibilita'."
        action={
          <Button render={<Link href="/foods/new" />}>
            <Plus className="size-4" />
            Nuovo Alimento
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Alimenti visibili"
          value={foods.length}
          hint="risultati del filtro corrente"
          icon={Apple}
          tone="emerald"
        />
        <MetricCard
          label="Con marcatori"
          value={flaggedCount}
          hint="elementi con indicatori FODMAP o allergeni"
          icon={Wheat}
          tone="amber"
        />
        <MetricCard
          label="Filtro attivo"
          value={category ? "1" : "0"}
          hint={category ? category.replace(/_/g, " ") : "nessuna categoria selezionata"}
          icon={Filter}
          tone="cobalt"
        />
      </div>

      <Card className="bg-white/[0.78]">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle>Catalogo alimenti</CardTitle>
          <form className="mt-4 flex flex-col gap-2 lg:flex-row">
            <Input
              name="q"
              placeholder="Cerca alimento..."
              defaultValue={q ?? ""}
              className="max-w-sm"
            />
            <Select name="category" defaultValue={category ?? ""}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tutte le categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tutte</SelectItem>
                {FOOD_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary">
              Filtra
            </Button>
          </form>
        </CardHeader>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Kcal</TableHead>
                <TableHead className="text-right">P</TableHead>
                <TableHead className="text-right">C</TableHead>
                <TableHead className="text-right">G</TableHead>
                <TableHead>Flag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foods.map((food) => (
                <TableRow key={food.id}>
                  <TableCell>
                    <Link
                      href={`/foods/${food.id}/edit`}
                      className="font-medium text-primary hover:underline"
                    >
                      {food.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {food.category?.replace(/_/g, " ") ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">{food.kcalPer100g}</TableCell>
                  <TableCell className="text-right">{food.proteinG}</TableCell>
                  <TableCell className="text-right">{food.carbG}</TableCell>
                  <TableCell className="text-right">{food.fatG}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {food.isFodmap && <Badge variant="outline">FOD</Badge>}
                      {food.isNickel && <Badge variant="outline">Ni</Badge>}
                      {food.isGlutenFree && <Badge variant="outline">GF</Badge>}
                      {food.isLactoseFree && <Badge variant="outline">LF</Badge>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
