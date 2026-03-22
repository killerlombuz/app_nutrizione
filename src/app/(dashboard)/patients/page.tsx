import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const professionalId = await requireProfessionalId();
  const { q } = await searchParams;

  const patients = await prisma.patient.findMany({
    where: {
      professionalId,
      ...(q
        ? {
            name: { contains: q, mode: "insensitive" },
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { visits: true, mealPlans: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pazienti</h1>
        <Button render={<Link href="/patients/new" />}>+ Nuovo Paziente</Button>
      </div>

      <Card>
        <CardHeader>
          <form className="flex gap-2">
            <Input
              name="q"
              placeholder="Cerca paziente..."
              defaultValue={q ?? ""}
              className="max-w-sm"
            />
            <Button type="submit" variant="secondary">
              Cerca
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {patients.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {q ? "Nessun risultato." : "Nessun paziente registrato."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Genere</TableHead>
                  <TableHead>Altezza</TableHead>
                  <TableHead className="text-center">Visite</TableHead>
                  <TableHead className="text-center">Piani</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient: typeof patients[number]) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <Link
                        href={`/patients/${patient.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {patient.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {patient.gender === "F"
                        ? "Donna"
                        : patient.gender === "M"
                          ? "Uomo"
                          : "—"}
                    </TableCell>
                    <TableCell>
                      {patient.heightCm ? `${patient.heightCm} cm` : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {patient._count.visits}
                    </TableCell>
                    <TableCell className="text-center">
                      {patient._count.mealPlans}
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
