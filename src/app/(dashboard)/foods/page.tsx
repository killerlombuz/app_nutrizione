import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alimenti ({foods.length})</h1>
        <Button render={<Link href="/foods/new" />}>+ Nuovo Alimento</Button>
      </div>

      <Card>
        <CardHeader>
          <form className="flex gap-2">
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
        <CardContent>
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
              {foods.map((food: typeof foods[number]) => (
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
                    {food.category?.replace(/_/g, " ") ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">{food.kcalPer100g}</TableCell>
                  <TableCell className="text-right">{food.proteinG}</TableCell>
                  <TableCell className="text-right">{food.carbG}</TableCell>
                  <TableCell className="text-right">{food.fatG}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
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
