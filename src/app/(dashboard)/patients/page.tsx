import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Activity, Plus, UserRoundSearch, UsersRound } from "lucide-react";

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

  const activePlanCount = patients.filter((patient) => patient._count.mealPlans > 0).length;
  const totalVisits = patients.reduce((sum, patient) => sum + patient._count.visits, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clinica"
        title="Pazienti"
        description="Gestione anagrafica e cartelle cliniche. La vista recepisce il modello Stitch con piu' enfasi su ricerca, densita' dati e accesso rapido alle schede."
        action={
          <Button render={<Link href="/patients/new" />}>
            <Plus className="size-4" />
            Nuovo Paziente
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Totale pazienti"
          value={patients.length}
          hint="profili filtrati in questa vista"
          icon={UsersRound}
          tone="emerald"
        />
        <MetricCard
          label="Con piano attivo"
          value={activePlanCount}
          hint="pazienti con almeno un piano dieta"
          icon={Activity}
          tone="cobalt"
        />
        <MetricCard
          label="Visite registrate"
          value={totalVisits}
          hint="storico totale all'interno del filtro corrente"
          icon={UserRoundSearch}
          tone="amber"
        />
      </div>

      <Card className="bg-white/[0.78]">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle>Gestione anagrafica</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={!q ? "default" : "outline"}>Tutti</Badge>
              <Badge variant="outline">Uomini</Badge>
              <Badge variant="outline">Donne</Badge>
              <Badge variant="outline">Con piano attivo</Badge>
            </div>
            <form className="flex flex-col gap-2 sm:flex-row">
              <Input
                name="q"
                placeholder="Cerca paziente..."
                defaultValue={q ?? ""}
                className="max-w-xl"
              />
              <Button type="submit" variant="secondary">
                Cerca
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {patients.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {q ? "Nessun risultato." : "Nessun paziente registrato."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paziente</TableHead>
                  <TableHead>Sesso</TableHead>
                  <TableHead>Altezza</TableHead>
                  <TableHead className="text-center">Visite</TableHead>
                  <TableHead className="text-center">Piani</TableHead>
                  <TableHead className="text-right">Ultima azione</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <Link
                        href={`/patients/${patient.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        <span className="block">{patient.name}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {patient._count.mealPlans > 0 ? "piano presente" : "profilo base"}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      {patient.gender === "F"
                        ? "Donna"
                        : patient.gender === "M"
                          ? "Uomo"
                          : "-"}
                    </TableCell>
                    <TableCell>
                      {patient.heightCm ? `${patient.heightCm} cm` : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {patient._count.visits}
                    </TableCell>
                    <TableCell className="text-center">
                      {patient._count.mealPlans}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      Apri scheda
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
