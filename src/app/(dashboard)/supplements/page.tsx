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
import { Pill, Plus, TimerReset } from "lucide-react";

export default async function SupplementsPage() {
  const professionalId = await requireProfessionalId();

  const supplements = await prisma.supplement.findMany({
    where: { professionalId },
    orderBy: { name: "asc" },
  });

  const withTiming = supplements.filter((item) => item.timing).length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pianificazione"
        title="Integratori"
        description="Libreria di supplementi da riutilizzare nelle schede paziente e nei protocolli."
        action={
          <Button
            render={
              <PendingLink
                href="/supplements/new"
                tone="button"
                pendingLabel="Apro la creazione dell'integratore"
              />
            }
          >
            <Plus className="size-4" />
            Nuovo Integratore
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          label="Integratori"
          value={supplements.length}
          hint="elementi disponibili in libreria"
          icon={Pill}
          tone="emerald"
        />
        <MetricCard
          label="Con timing definito"
          value={withTiming}
          hint="slot con momento di assunzione gia' valorizzato"
          icon={TimerReset}
          tone="cobalt"
        />
      </div>

      <Card className="bg-white/[0.78]">
        <CardHeader>
          <CardTitle>Libreria integratori</CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
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
                      <PendingLink
                        href={`/supplements/${s.id}/edit`}
                        tone="text"
                        pendingLabel={`Apro la modifica di ${s.name}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {s.name}
                      </PendingLink>
                    </TableCell>
                    <TableCell>{s.defaultDosage ?? "-"}</TableCell>
                    <TableCell>{s.timing ?? "-"}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                      {s.description ?? "-"}
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
