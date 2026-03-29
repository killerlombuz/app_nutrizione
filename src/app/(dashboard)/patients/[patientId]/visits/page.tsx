import { notFound } from "next/navigation";
import { Activity, ArrowRight, Scale } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/layout/metric-card";
import { PendingLink } from "@/components/navigation/pending-link";

export default async function PatientVisitsPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const professionalId = await requireProfessionalId();
  const { patientId } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
    include: {
      visits: { orderBy: { date: "desc" }, take: 50 },
    },
  });

  if (!patient) {
    notFound();
  }

  const latestVisit = patient.visits[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[1.9rem] bg-white/[0.72] px-6 py-6 shadow-[var(--shadow-soft)] ring-1 ring-black/5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-heading text-2xl font-semibold tracking-[-0.04em]">
            Visite
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Storico antropometrico ordinato per data, con accesso rapido a nuove
            rilevazioni e visite da aggiornare.
          </p>
        </div>
        <Button
          render={
            <PendingLink
              href={`/patients/${patientId}/visits/new`}
              tone="button"
              pendingLabel={`Apro una nuova visita per ${patient.name}`}
            />
          }
        >
          + Nuova Visita
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Totale visite"
          value={patient.visits.length}
          hint="record disponibili in cartella"
          icon={Activity}
          tone="emerald"
        />
        <MetricCard
          label="Peso piu recente"
          value={latestVisit?.weightKg ? `${latestVisit.weightKg} kg` : "-"}
          hint="ultimo dato registrato"
          icon={Scale}
          tone="amber"
        />
        <MetricCard
          label="BF piu recente"
          value={latestVisit?.bodyFatPct ? `${latestVisit.bodyFatPct}%` : "-"}
          hint="ultima composizione disponibile"
          icon={ArrowRight}
          tone="violet"
        />
      </div>

      <Card className="bg-white/[0.78]">
        <CardHeader>
          <CardTitle>Storico visite</CardTitle>
          <CardDescription>
            Ogni riga apre la visita in modifica, cosi puoi riprendere il lavoro
            senza tornare indietro nella panoramica.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {patient.visits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessuna visita registrata. Inizia con la prima rilevazione.
            </p>
          ) : (
            <div className="space-y-3">
              {patient.visits.map((visit) => (
                <PendingLink
                  key={visit.id}
                  href={`/patients/${patientId}/visits/${visit.id}/edit`}
                  tone="panel"
                  pendingLabel={`Apro la visita del ${visit.date.toLocaleDateString("it-IT")}`}
                  className="block rounded-[1.4rem] bg-[var(--surface-low)] px-4 py-4 hover:bg-white hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">
                        {visit.date.toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {visit.formulaUsed ? `Formula ${visit.formulaUsed}` : "Scheda visita"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span>{visit.weightKg ? `${visit.weightKg} kg` : "Peso -"}</span>
                      <span>{visit.bodyFatPct ? `${visit.bodyFatPct}% BF` : "BF -"}</span>
                      <span>{visit.bmi ? `BMI ${visit.bmi}` : "BMI -"}</span>
                      <span>{visit.leanMassKg ? `${visit.leanMassKg} kg MM` : "MM -"}</span>
                    </div>
                  </div>
                </PendingLink>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
