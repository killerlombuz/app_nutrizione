import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DeletePatientButton } from "@/components/patients/delete-patient-button";
import { PatientGoalsCard } from "@/components/patients/patient-goals-card";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { TrendLineChart } from "@/components/layout/charts";
import { PendingLink } from "@/components/navigation/pending-link";
import { updatePatientGoals } from "@/features/patients/actions";
import {
  Activity,
  ArrowRight,
  CalendarPlus2,
  ClipboardPenLine,
  Scale,
  Sparkles,
} from "lucide-react";

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const professionalId = await requireProfessionalId();
  const { patientId } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
    include: {
      visits: { orderBy: { date: "desc" }, take: 20 },
      mealPlans: { orderBy: { createdAt: "desc" }, take: 10 },
      conditions: true,
      supplements: { include: { supplement: true } },
    },
  });

  if (!patient) notFound();

  const firstVisit = await prisma.visit.findFirst({
    where: { patientId },
    orderBy: { date: "asc" },
    select: {
      weightKg: true,
      bodyFatPct: true,
    },
  });

  const now = new Date();
  const age = patient.birthDate
    ? Math.floor(
        (now.getTime() - patient.birthDate.getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  const latestVisit = patient.visits[0] ?? null;
  const chartData = patient.visits
    .slice(0, 6)
    .reverse()
    .map((visit) => ({
      label: visit.date
        .toLocaleDateString("it-IT", { month: "short" })
        .replace(".", "")
        .toUpperCase(),
      primary: visit.weightKg ? Number(visit.weightKg) : null,
      secondary: visit.bodyFatPct ? Number(visit.bodyFatPct) : null,
    }));

  const updateGoalsAction = updatePatientGoals.bind(null, patientId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Scheda paziente"
        title={patient.name}
        description={[
          patient.gender === "F" ? "Donna" : patient.gender === "M" ? "Uomo" : null,
          age !== null ? `${age} anni` : null,
          patient.heightCm ? `${patient.heightCm} cm` : null,
        ]
          .filter(Boolean)
          .join(" - ")}
        action={
          <>
            <Button
              variant="outline"
              render={
                <PendingLink
                  href={`/patients/${patientId}/edit`}
                  tone="button"
                  pendingLabel={`Apro la modifica di ${patient.name}`}
                />
              }
            >
              <ClipboardPenLine className="size-4" />
              Modifica
            </Button>
            <Button
              render={
                <PendingLink
                  href={`/patients/${patientId}/visits/new`}
                  tone="button"
                  pendingLabel={`Apro una nuova visita per ${patient.name}`}
                />
              }
            >
              <CalendarPlus2 className="size-4" />
              Nuova Visita
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          label="Visite registrate"
          value={patient.visits.length}
          hint="storico clinico disponibile"
          icon={Activity}
          tone="emerald"
        />
        <MetricCard
          label="Piani dieta"
          value={patient.mealPlans.length}
          hint="piani generati e archiviati"
          icon={Sparkles}
          tone="cobalt"
        />
        <MetricCard
          label="Peso attuale"
          value={latestVisit?.weightKg ? `${latestVisit.weightKg} kg` : "-"}
          hint="ultima misurazione disponibile"
          icon={Scale}
          tone="amber"
        />
        <MetricCard
          label="Massa grassa"
          value={latestVisit?.bodyFatPct ? `${latestVisit.bodyFatPct}%` : "-"}
          hint="dato dall'ultima visita"
          icon={ArrowRight}
          tone="violet"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_340px]">
        <Card className="bg-white/[0.78]">
          <CardHeader>
            <CardTitle>Andamento peso e composizione</CardTitle>
            <CardDescription>
              Trend sintetico delle ultime misurazioni utili presenti in cartella.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length >= 2 ? (
              <TrendLineChart data={chartData} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Servono almeno due visite con misure per costruire il grafico.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <PatientGoalsCard
            patientName={patient.name}
            targetWeightKg={patient.targetWeightKg}
            targetBodyFatPct={patient.targetBodyFatPct}
            targetNotes={patient.targetNotes}
            firstVisit={firstVisit}
            latestVisit={latestVisit}
            action={updateGoalsAction}
          />

          <Card className="bg-white/[0.78]">
            <CardHeader>
              <CardTitle>Anagrafica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {patient.birthDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data di nascita</span>
                  <span>{patient.birthDate.toLocaleDateString("it-IT")}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Telefono</span>
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.notes && (
                <>
                  <Separator />
                  <p className="text-muted-foreground">{patient.notes}</p>
                </>
              )}
              {patient.conditions.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-1">
                    {patient.conditions.map((c) => (
                      <Badge key={c.id} variant="secondary">
                        {c.conditionName}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/[0.78]">
            <CardHeader>
              <CardTitle>Ultima visita</CardTitle>
            </CardHeader>
            <CardContent>
              {patient.visits.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nessuna visita.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data</span>
                    <span>{patient.visits[0].date.toLocaleDateString("it-IT")}</span>
                  </div>
                  {patient.visits[0].weightKg && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peso</span>
                      <span>{patient.visits[0].weightKg} kg</span>
                    </div>
                  )}
                  {patient.visits[0].bmi && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BMI</span>
                      <span>{patient.visits[0].bmi}</span>
                    </div>
                  )}
                  {patient.visits[0].bodyFatPct && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">% Massa Grassa</span>
                      <span>{patient.visits[0].bodyFatPct}%</span>
                    </div>
                  )}
                  {patient.visits[0].leanMassKg && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Massa Magra</span>
                      <span>{patient.visits[0].leanMassKg} kg</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="bg-white/[0.78]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Storico Visite</CardTitle>
          <Button
            size="sm"
            render={
              <PendingLink
                href={`/patients/${patientId}/visits/new`}
                tone="button"
                pendingLabel={`Apro una nuova visita per ${patient.name}`}
              />
            }
          >
            + Visita
          </Button>
        </CardHeader>
        <CardContent className="pt-2">
          {patient.visits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna visita.</p>
          ) : (
            <div className="space-y-2">
              {patient.visits.map((visit) => (
                <PendingLink
                  key={visit.id}
                  href={`/patients/${patientId}/visits/${visit.id}/edit`}
                  tone="panel"
                  pendingLabel={`Apro la visita del ${visit.date.toLocaleDateString("it-IT")}`}
                  className="flex items-center justify-between rounded-[1.4rem] bg-[var(--surface-low)] px-4 py-4 transition-all duration-[var(--motion-duration-medium)] ease-[var(--motion-ease-standard)] hover:bg-white hover:shadow-[var(--shadow-soft)]"
                >
                  <span className="font-medium">
                    {visit.date.toLocaleDateString("it-IT")}
                  </span>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {visit.weightKg && <span>{visit.weightKg} kg</span>}
                    {visit.bodyFatPct && <span>{visit.bodyFatPct}% FM</span>}
                    {visit.leanMassKg && <span>{visit.leanMassKg} kg MM</span>}
                  </div>
                </PendingLink>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/[0.78]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Piani Dieta</CardTitle>
          <Button
            size="sm"
            render={
              <PendingLink
                href={`/patients/${patientId}/meal-plans/new`}
                tone="button"
                pendingLabel={`Apro un nuovo piano per ${patient.name}`}
              />
            }
          >
            + Piano
          </Button>
        </CardHeader>
        <CardContent>
          {patient.mealPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun piano.</p>
          ) : (
            <div className="space-y-2">
              {patient.mealPlans.map((plan) => (
                <PendingLink
                  key={plan.id}
                  href={`/patients/${patientId}/meal-plans/${plan.id}`}
                  tone="panel"
                  pendingLabel={`Apro il piano ${plan.name || "senza nome"}`}
                  className="flex items-center justify-between rounded-[1.4rem] bg-[var(--surface-low)] px-4 py-4 transition-all duration-[var(--motion-duration-medium)] ease-[var(--motion-ease-standard)] hover:bg-white hover:shadow-[var(--shadow-soft)]"
                >
                  <span className="font-medium">{plan.name || "Piano senza nome"}</span>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{plan.date.toLocaleDateString("it-IT")}</span>
                    {plan.totalKcalRest && <span>{Math.round(plan.totalKcalRest)} kcal</span>}
                  </div>
                </PendingLink>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/[0.78]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Integratori</CardTitle>
        </CardHeader>
        <CardContent>
          {patient.supplements.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun integratore assegnato.</p>
          ) : (
            <div className="space-y-2">
              {patient.supplements.map((ps) => (
                <div
                  key={ps.id}
                  className="flex items-center justify-between rounded-[1.4rem] bg-[var(--surface-low)] px-4 py-4"
                >
                  <div>
                    <span className="font-medium">{ps.supplement.name}</span>
                    {(ps.dosage || ps.supplement.defaultDosage) && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        {ps.dosage || ps.supplement.defaultDosage}
                      </span>
                    )}
                    {(ps.timing || ps.supplement.timing) && (
                      <span className="ml-2 text-sm text-muted-foreground">
                        - {ps.timing || ps.supplement.timing}
                      </span>
                    )}
                  </div>
                  {ps.notes && (
                    <span className="text-xs text-muted-foreground">{ps.notes}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <DeletePatientButton patientId={patientId} patientName={patient.name} />
      </div>
    </div>
  );
}
