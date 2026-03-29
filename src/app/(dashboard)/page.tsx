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
import { FollowUpWidget, type PatientFollowUp } from "@/components/dashboard/follow-up-widget";
import { ExpiringPlansWidget, type ExpiringPlan } from "@/components/dashboard/expiring-plans-widget";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { UpcomingAppointmentsWidget, type UpcomingAppointment } from "@/components/dashboard/upcoming-appointments-widget";
import {
  Activity,
  CalendarClock,
  ChevronRight,
  FileChartColumn,
  Timer,
  UsersRound,
} from "lucide-react";

export default async function DashboardPage() {
  const professionalId = await requireProfessionalId();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const oneHundredTwentyDaysAgo = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const [
    totalPatients,
    activePatientsNow,
    activePatientsLastPeriod,
    visitsThisMonth,
    visitsLastMonth,
    activeMealPlans,
    recentPatients,
    recentVisits,
    allPatients,
    followUpPatients,
    expiringPlans,
    oldestExpiringPlan,
    upcomingAppointments,
  ] = await Promise.all([
    prisma.patient.count({ where: { professionalId } }),

    // Pazienti attivi: almeno una visita negli ultimi 60 giorni
    prisma.patient.count({
      where: {
        professionalId,
        visits: { some: { date: { gte: sixtyDaysAgo } } },
      },
    }),

    // Pazienti attivi nel periodo precedente (61-120 giorni fa)
    prisma.patient.count({
      where: {
        professionalId,
        visits: { some: { date: { gte: oneHundredTwentyDaysAgo, lt: sixtyDaysAgo } } },
      },
    }),

    // Visite questo mese
    prisma.visit.count({
      where: {
        patient: { professionalId },
        date: { gte: startOfThisMonth },
      },
    }),

    // Visite mese scorso
    prisma.visit.count({
      where: {
        patient: { professionalId },
        date: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    }),

    // Piani attivi (creati negli ultimi 30 giorni)
    prisma.mealPlan.count({
      where: {
        patient: { professionalId },
        date: { gte: thirtyDaysAgo },
      },
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

    // Tutti i pazienti per quick actions
    prisma.patient.findMany({
      where: { professionalId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),

    // Pazienti da ricontattare (ultima visita > 30 giorni fa o nessuna visita)
    prisma.$queryRaw<PatientFollowUp[]>`
      SELECT p.id, p.name, MAX(v.date) AS "lastVisit"
      FROM patients p
      LEFT JOIN visits v ON v."patientId" = p.id
      WHERE p."professionalId" = ${professionalId}
      GROUP BY p.id, p.name
      HAVING MAX(v.date) < ${thirtyDaysAgo}
         OR MAX(v.date) IS NULL
      ORDER BY "lastVisit" ASC NULLS FIRST
      LIMIT 5
    `,

    // Piani in scadenza (creati > 30 giorni fa, nessun piano più recente per lo stesso paziente)
    prisma.$queryRaw<ExpiringPlan[]>`
      SELECT mp.id, mp.name, mp.date, p.id AS "patientId", p.name AS "patientName"
      FROM meal_plans mp
      JOIN patients p ON p.id = mp."patientId"
      WHERE p."professionalId" = ${professionalId}
      AND mp.date < ${thirtyDaysAgo}
      AND NOT EXISTS (
        SELECT 1 FROM meal_plans mp2
        WHERE mp2."patientId" = mp."patientId" AND mp2.date > mp.date
      )
      ORDER BY mp.date ASC
      LIMIT 5
    `,

    // Piano più vecchio senza rinnovo (per KPI "Prossima scadenza")
    prisma.$queryRaw<Array<{ date: Date }>>`
      SELECT mp.date
      FROM meal_plans mp
      JOIN patients p ON p.id = mp."patientId"
      WHERE p."professionalId" = ${professionalId}
      AND mp.date < ${thirtyDaysAgo}
      AND NOT EXISTS (
        SELECT 1 FROM meal_plans mp2
        WHERE mp2."patientId" = mp."patientId" AND mp2.date > mp.date
      )
      ORDER BY mp.date ASC
      LIMIT 1
    `,

    // Prossimi appuntamenti
    prisma.appointment.findMany({
      where: {
        professionalId,
        date: { gte: now },
        status: { not: "cancelled" },
      },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 5,
    }) as Promise<UpcomingAppointment[]>,
  ]);

  // Calcolo trend
  const activePatientsTrend =
    activePatientsLastPeriod === 0
      ? undefined
      : Math.round(((activePatientsNow - activePatientsLastPeriod) / activePatientsLastPeriod) * 100);

  const visitsTrend =
    visitsLastMonth === 0
      ? undefined
      : Math.round(((visitsThisMonth - visitsLastMonth) / visitsLastMonth) * 100);

  // Giorni dal piano più datato senza rinnovo
  const oldestPlanDaysAgo =
    oldestExpiringPlan.length > 0
      ? Math.floor((now.getTime() - new Date(oldestExpiringPlan[0].date).getTime()) / (1000 * 60 * 60 * 24))
      : null;

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
    if (bucket) bucket.value += 1;
  });

  const stats = [
    {
      label: "Pazienti attivi",
      value: `${activePatientsNow} / ${totalPatients}`,
      hint: "con visita negli ultimi 60 giorni",
      icon: UsersRound,
      tone: "emerald" as const,
      trend: activePatientsTrend,
    },
    {
      label: "Visite questo mese",
      value: visitsThisMonth.toLocaleString("it-IT"),
      hint: "follow-up e check-up nel mese corrente",
      icon: Activity,
      tone: "cobalt" as const,
      trend: visitsTrend,
    },
    {
      label: "Piani attivi",
      value: activeMealPlans.toLocaleString("it-IT"),
      hint: "schede alimentari create negli ultimi 30 giorni",
      icon: FileChartColumn,
      tone: "amber" as const,
    },
    {
      label: "Prossima scadenza",
      value: oldestPlanDaysAgo !== null ? `${oldestPlanDaysAgo} gg` : "A posto",
      hint: oldestPlanDaysAgo !== null
        ? "giorni dal piano più datato senza rinnovo"
        : "nessun piano richiede rinnovo",
      icon: Timer,
      tone: "violet" as const,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Panoramica clinica"
        title="Buongiorno, dottore."
        description="Centro operativo: pazienti, visite e piani dieta con widget azionabili e azioni rapide."
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

      <QuickActions patients={allPatients} />

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

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <FollowUpWidget patients={followUpPatients} />
        <ExpiringPlansWidget plans={expiringPlans} />
        <UpcomingAppointmentsWidget appointments={upcomingAppointments} />
      </div>
    </div>
  );
}
