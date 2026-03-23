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

export default async function SupplementsPage() {
  const professionalId = await requireProfessionalId();

  const supplements = await prisma.supplement.findMany({
    where: { professionalId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Integratori ({supplements.length})
        </h1>
        <Button render={<Link href="/supplements/new" />}>
          + Nuovo Integratore
        </Button>
      </div>

      <Card>
        <CardHeader />
        <CardContent>
          {supplements.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Nessun integratore. Crea il primo!
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Dosaggio</TableHead>
                  <TableHead>Quando</TableHead>
                  <TableHead>Descrizione</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplements.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <Link
                        href={`/supplements/${s.id}/edit`}
                        className="font-medium text-primary hover:underline"
                      >
                        {s.name}
                      </Link>
                    </TableCell>
                    <TableCell>{s.defaultDosage ?? "—"}</TableCell>
                    <TableCell>{s.timing ?? "—"}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {s.description ?? "—"}
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
