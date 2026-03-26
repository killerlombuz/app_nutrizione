import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/layout/metric-card";
import { SparkBarChart } from "@/components/layout/charts";
import { PendingLink } from "@/components/navigation/pending-link";
import {
  Activity,
  Apple,
  CalendarClock,
  ChevronRight,
  FileChartColumn,
  UsersRound,
} from "lucide-react";

export default async function DashboardPage() {
  const professionalId = await requireProfessionalId();

  const [
    patientCount,
    foodCount,
    visitCount,
    mealPlanCount,
    recentPatients,
    recentVisits,
  ] = await Promise.all([
    prisma.patient.count({ where: { professionalId } }),
    prisma.food.count({
      where: {
        OR: [{ professionalId }, { professionalId: null }],
      },
    }),
    prisma.visit.count({
      where: { patient: { professionalId } },
    }),
    prisma.mealPlan.count({
      where: { patient: { professionalId } },
    }),
    prisma.patient.findMany({
      where: { professionalId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        visits: { orderBy: { date: "desc" }, take: 1 },
      },
    }),
    prisma.visit.findMany({
      where: { patient: { professionalId } },
      orderBy: { date: "desc" },
      take: 24,
      select: { date: true },
    }),
  ]);

  const visitBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - index));

    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date
        .toLocaleDateString("it-IT", { month: "short" })
        .replace(".", "")
        .toUpperCase(),
      value: 0,
    };
  });

  recentVisits.forEach((visit) => {
    const bucketKey = `${visit.date.getFullYear()}-${visit.date.getMonth()}`;
    const bucket = visitBuckets.find((entry) => entry.key === bucketKey);

    if (bucket) {
      bucket.value += 1;
    }
  });

  const stats = [
    {
      label: "Totale pazienti",
      value: patientCount.toLocaleString("it-IT"),
      hint: "anagrafiche attive nel workspace",
      icon: UsersRound,
      tone: "emerald" as const,
    },
    {
      label: "Visite registrate",
      value: visitCount.toLocaleString("it-IT"),
      hint: "follow-up e check-up in archivio",
      icon: Activity,
      tone: "cobalt" as const,
    },
    {
      label: "Piani dieta",
      value: mealPlanCount.toLocaleString("it-IT"),
      hint: "schede alimentari archiviate",
      icon: FileChartColumn,
      tone: "amber" as const,
    },
    {
      label: "Alimenti in database",
      value: foodCount.toLocaleString("it-IT"),
      hint: "catalogo base e personalizzato",
      icon: Apple,
      tone: "violet" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Panoramica clinica"
        title="Buongiorno, dottore."
        description="Una vista rapida su pazienti, visite e materiali clinici. Questa prima tranche recepisce la direzione Stitch su gerarchia visiva, superfici e densita' informativa."
        action={
          <>
            <Button
              variant="outline"
              render={
                <PendingLink
                  href="/patients/new"
                  tone="button"
                  pendingLabel="Apro la creazione del paziente"
                />
              }
            >
              Nuovo Paziente
            </Button>
            <Button
              render={
                <PendingLink
                  href="/patients"
                  tone="button"
                  pendingLabel="Apro la clinica"
                />
              }
            >
              Apri Clinica
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
        <Card className="bg-white/[0.78]">
          <CardHeader className="border-b border-border/40 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Pazienti recenti</CardTitle>
                <CardDescription>
                  Cartelle aggiornate di recente con accesso diretto alle viste cliniche.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                render={
                  <PendingLink
                    href="/patients"
                    tone="button"
                    pendingLabel="Apro tutti i pazienti"
                  />
                }
              >
                Vedi tutti
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {recentPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nessun paziente registrato.{" "}
                  <PendingLink
                    href="/patients/new"
                    tone="text"
                    pendingLabel="Apro la creazione del primo paziente"
                    className="font-medium text-primary underline"
                  >
                    Aggiungi il primo.
                  </PendingLink>
                </p>
              ) : (
                <div className="space-y-3">
                  {recentPatients.map((patient) => (
                    <PendingLink
                    key={patient.id}
                    href={`/patients/${patient.id}`}
                      tone="panel"
                      pendingLabel={`Apro la scheda di ${patient.name}`}
                      className="grid gap-3 rounded-[1.5rem] bg-[var(--surface-low)] px-4 py-4 transition-all duration-[var(--motion-duration-medium)] ease-[var(--motion-ease-standard)] hover:bg-white hover:shadow-[var(--shadow-soft)] sm:grid-cols-[minmax(0,1.2fr)_120px_140px]"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {patient.gender === "F"
                            ? "Donna"
                            : patient.gender === "M"
                              ? "Uomo"
                              : "Profilo"}
                          {patient.heightCm ? ` - ${patient.heightCm} cm` : ""}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {patient.visits[0]
                          ? new Date(patient.visits[0].date).toLocaleDateString("it-IT")
                          : "Nessuna visita"}
                      </div>
                      <div className="flex items-center justify-between gap-3 text-sm sm:justify-end">
                        <span className="text-muted-foreground">Apri scheda</span>
                        <ChevronRight className="size-4 text-primary" />
                      </div>
                    </PendingLink>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-white/[0.72]">
            <CardHeader>
              <CardTitle>Andamento visite</CardTitle>
              <CardDescription>Ultimi sei mesi di attivita clinica registrata.</CardDescription>
            </CardHeader>
            <CardContent>
              <SparkBarChart data={visitBuckets} />
            </CardContent>
          </Card>

          <MetricCard
            label="Agenda operativa"
            value={recentPatients.length}
            hint="pazienti hanno avuto attivita' recente nella clinica"
            icon={CalendarClock}
            tone="ink"
          />
        </div>
      </div>
    </div>
  );
}
