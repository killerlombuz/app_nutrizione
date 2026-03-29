import { notFound } from "next/navigation";
import {
  Activity,
  ArrowRight,
  ClipboardList,
  FileText,
  Globe,
  MessageSquare,
  Pill,
  Scale,
  Sparkles,
  StickyNote,
} from "lucide-react";
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
import { TrendLineChart } from "@/components/layout/charts";
import { PendingLink } from "@/components/navigation/pending-link";
import { updatePatientGoals } from "@/features/patients/actions";
import { PATIENT_NOTE_CATEGORY_LABELS } from "@/features/patients/timeline";
import { PortalInviteButton } from "@/components/patients/portal-invite-button";

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
      visits: { orderBy: { date: "desc" }, take: 6 },
      mealPlans: { orderBy: { createdAt: "desc" }, take: 2 },
      conditions: true,
      supplements: {
        include: { supplement: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
      patientNotes: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: {
        select: {
          visits: true,
          mealPlans: true,
          patientNotes: true,
        },
      },
    },
  });

  if (!patient) {
    notFound();
  }

  const firstVisit = await prisma.visit.findFirst({
    where: { patientId },
    orderBy: { date: "asc" },
    select: {
      weightKg: true,
      bodyFatPct: true,
    },
  });

  const latestVisit = patient.visits[0] ?? null;
  const latestPlan = patient.mealPlans[0] ?? null;
  const latestNote = patient.patientNotes[0] ?? null;
  const updateGoalsAction = updatePatientGoals.bind(null, patientId);

  const chartData = patient.visits
    .slice()
    .reverse()
    .map((visit) => ({
      label: visit.date
        .toLocaleDateString("it-IT", { month: "short" })
        .replace(".", "")
        .toUpperCase(),
      primary: visit.weightKg ? Number(visit.weightKg) : null,
      secondary: visit.bodyFatPct ? Number(visit.bodyFatPct) : null,
    }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          label="Visite registrate"
          value={patient._count.visits}
          hint="storico clinico disponibile"
          icon={Activity}
          tone="emerald"
        />
        <MetricCard
          label="Piani dieta"
          value={patient._count.mealPlans}
          hint="piani attivi e archiviati"
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

        <PatientGoalsCard
          patientName={patient.name}
          targetWeightKg={patient.targetWeightKg}
          targetBodyFatPct={patient.targetBodyFatPct}
          targetNotes={patient.targetNotes}
          firstVisit={firstVisit}
          latestVisit={latestVisit}
          action={updateGoalsAction}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.95fr)]">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/[0.78]">
            <CardHeader>
              <CardTitle>Profilo clinico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {patient.birthDate && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Data di nascita</span>
                  <span>{patient.birthDate.toLocaleDateString("it-IT")}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-right">{patient.email}</span>
                </div>
              )}
              {patient.phone && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Telefono</span>
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.conditions.length > 0 && (
                <>
                  <Separator />
                  <div className="flex flex-wrap gap-1">
                    {patient.conditions.map((condition) => (
                      <Badge key={condition.id} variant="secondary">
                        {condition.conditionName}
                      </Badge>
                    ))}
                  </div>
                </>
              )}
              {patient.notes && (
                <>
                  <Separator />
                  <p className="text-muted-foreground">{patient.notes}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/[0.78]">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Ultima visita</CardTitle>
                <CardDescription>
                  Riepilogo dell&apos;ultimo rilevamento registrato.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                render={
                  <PendingLink
                    href={`/patients/${patientId}/visits`}
                    tone="button"
                    pendingLabel={`Apro le visite di ${patient.name}`}
                  />
                }
              >
                Tutte
              </Button>
            </CardHeader>
            <CardContent>
              {latestVisit ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Data</span>
                    <span>{latestVisit.date.toLocaleDateString("it-IT")}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Peso</span>
                    <span>{latestVisit.weightKg ? `${latestVisit.weightKg} kg` : "-"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">BMI</span>
                    <span>{latestVisit.bmi ?? "-"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Massa grassa</span>
                    <span>
                      {latestVisit.bodyFatPct ? `${latestVisit.bodyFatPct}%` : "-"}
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    variant="outline"
                    render={
                      <PendingLink
                        href={`/patients/${patientId}/visits/${latestVisit.id}/edit`}
                        tone="button"
                        pendingLabel={`Apro la visita del ${latestVisit.date.toLocaleDateString("it-IT")}`}
                      />
                    }
                  >
                    Apri visita
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Nessuna visita registrata per questo paziente.
                  </p>
                  <Button
                    className="w-full"
                    render={
                      <PendingLink
                        href={`/patients/${patientId}/visits/new`}
                        tone="button"
                        pendingLabel={`Apro una nuova visita per ${patient.name}`}
                      />
                    }
                  >
                    Registra visita
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/[0.78]">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Ultimo piano</CardTitle>
                <CardDescription>
                  Accesso rapido all&apos;ultima versione condivisa o in lavorazione.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                render={
                  <PendingLink
                    href={`/patients/${patientId}/meal-plans`}
                    tone="button"
                    pendingLabel={`Apro i piani di ${patient.name}`}
                  />
                }
              >
                Tutti
              </Button>
            </CardHeader>
            <CardContent>
              {latestPlan ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Nome</span>
                    <span className="text-right">{latestPlan.name || "Piano senza nome"}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Data</span>
                    <span>{latestPlan.date.toLocaleDateString("it-IT")}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Calorie riposo</span>
                    <span>
                      {latestPlan.totalKcalRest
                        ? `${Math.round(latestPlan.totalKcalRest)} kcal`
                        : "-"}
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    variant="outline"
                    render={
                      <PendingLink
                        href={`/patients/${patientId}/meal-plans/${latestPlan.id}`}
                        tone="button"
                        pendingLabel={`Apro il piano ${latestPlan.name || "senza nome"}`}
                      />
                    }
                  >
                    Apri piano
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Nessun piano dieta creato finora.
                  </p>
                  <Button
                    className="w-full"
                    render={
                      <PendingLink
                        href={`/patients/${patientId}/meal-plans/new`}
                        tone="button"
                        pendingLabel={`Apro un nuovo piano per ${patient.name}`}
                      />
                    }
                  >
                    Crea piano
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/[0.78]">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Ultima nota</CardTitle>
                <CardDescription>
                  Punto di continuita per follow-up e comunicazioni cliniche.
                </CardDescription>
              </div>
              <Button
                size="sm"
                variant="outline"
                render={
                  <PendingLink
                    href={`/patients/${patientId}/notes`}
                    tone="button"
                    pendingLabel={`Apro le note di ${patient.name}`}
                  />
                }
              >
                Note
              </Button>
            </CardHeader>
            <CardContent>
              {latestNote ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {latestNote.category && (
                      <Badge variant="secondary" className="text-[10px]">
                        {PATIENT_NOTE_CATEGORY_LABELS[latestNote.category] ??
                          latestNote.category}
                      </Badge>
                    )}
                    {latestNote.isPinned && (
                      <Badge
                        variant="secondary"
                        className="bg-violet-100 text-[10px] text-violet-700"
                      >
                        In evidenza
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground/70">
                      {latestNote.createdAt.toLocaleDateString("it-IT")}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {latestNote.content}
                  </p>
                  <Button
                    className="w-full"
                    variant="outline"
                    render={
                      <PendingLink
                        href={`/patients/${patientId}/timeline`}
                        tone="button"
                        pendingLabel={`Apro la timeline di ${patient.name}`}
                      />
                    }
                  >
                    Apri timeline
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Nessuna nota disponibile. Usa la sezione dedicata per fissare il
                    prossimo follow-up.
                  </p>
                  <Button
                    className="w-full"
                    variant="outline"
                    render={
                      <PendingLink
                        href={`/patients/${patientId}/notes`}
                        tone="button"
                        pendingLabel={`Apro le note di ${patient.name}`}
                      />
                    }
                  >
                    Aggiungi nota
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white/[0.78]">
          <CardHeader>
            <CardTitle>Continua il lavoro</CardTitle>
            <CardDescription>
              Le aree principali del paziente sono ora separate per task, cosi non
              devi piu cercare tutto in una pagina unica.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <PendingLink
              href={`/patients/${patientId}/visits`}
              tone="panel"
              pendingLabel={`Apro le visite di ${patient.name}`}
              className="block rounded-[1.4rem] bg-[var(--surface-low)] px-4 py-4 hover:bg-white hover:shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <Activity className="size-4" />
                  </span>
                  <div>
                    <p className="font-medium">Visite</p>
                    <p className="text-sm text-muted-foreground">
                      Storico misure, confronto rapido e accesso alle visite da
                      aggiornare.
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {patient._count.visits}
                </span>
              </div>
            </PendingLink>

            <PendingLink
              href={`/patients/${patientId}/meal-plans`}
              tone="panel"
              pendingLabel={`Apro i piani di ${patient.name}`}
              className="block rounded-[1.4rem] bg-[var(--surface-low)] px-4 py-4 hover:bg-white hover:shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                    <ClipboardList className="size-4" />
                  </span>
                  <div>
                    <p className="font-medium">Piani dieta</p>
                    <p className="text-sm text-muted-foreground">
                      Apri, duplica o rigenera i piani senza passare dalla panoramica.
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {patient._count.mealPlans}
                </span>
              </div>
            </PendingLink>

            <PendingLink
              href={`/patients/${patientId}/timeline`}
              tone="panel"
              pendingLabel={`Apro la timeline di ${patient.name}`}
              className="block rounded-[1.4rem] bg-[var(--surface-low)] px-4 py-4 hover:bg-white hover:shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-center gap-3">
                <span className="mt-0.5 flex size-9 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <p className="font-medium">Timeline clinica</p>
                  <p className="text-sm text-muted-foreground">
                    Visite, piani, note e integratori in una cronologia orientata al
                    contesto.
                  </p>
                </div>
              </div>
            </PendingLink>

            <PendingLink
              href={`/patients/${patientId}/notes`}
              tone="panel"
              pendingLabel={`Apro le note di ${patient.name}`}
              className="block rounded-[1.4rem] bg-[var(--surface-low)] px-4 py-4 hover:bg-white hover:shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-9 items-center justify-center rounded-2xl bg-slate-200 text-slate-700">
                    <StickyNote className="size-4" />
                  </span>
                  <div>
                    <p className="font-medium">Note e follow-up</p>
                    <p className="text-sm text-muted-foreground">
                      Mantieni in alto le note evidenziate e separa il lavoro rapido
                      dalla cronologia completa.
                    </p>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {patient._count.patientNotes}
                </span>
              </div>
            </PendingLink>

            <PendingLink
              href={`/patients/${patientId}/report`}
              tone="panel"
              pendingLabel={`Apro il report di ${patient.name}`}
              className="block rounded-[1.4rem] bg-[var(--surface-low)] px-4 py-4 hover:bg-white hover:shadow-[var(--shadow-soft)]"
            >
              <div className="flex items-center gap-3">
                <span className="mt-0.5 flex size-9 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                  <FileText className="size-4" />
                </span>
                <div>
                  <p className="font-medium">Report PDF</p>
                  <p className="text-sm text-muted-foreground">
                    Genera una consegna pulita partendo da visita e piano piu recenti.
                  </p>
                </div>
              </div>
            </PendingLink>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/[0.78]">
        <CardHeader>
          <CardTitle>Integratori assegnati</CardTitle>
          <CardDescription>
            Riferimento rapido delle assegnazioni attive presenti in cartella.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {patient.supplements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessun integratore assegnato.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {patient.supplements.map((patientSupplement) => (
                <div
                  key={patientSupplement.id}
                  className="rounded-[1.4rem] bg-[var(--surface-low)] px-4 py-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-9 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                      <Pill className="size-4" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium">{patientSupplement.supplement.name}</p>
                      {(patientSupplement.dosage ||
                        patientSupplement.supplement.defaultDosage) && (
                        <p className="text-sm text-muted-foreground">
                          {patientSupplement.dosage ||
                            patientSupplement.supplement.defaultDosage}
                        </p>
                      )}
                      {(patientSupplement.timing ||
                        patientSupplement.supplement.timing) && (
                        <p className="text-sm text-muted-foreground">
                          {patientSupplement.timing ||
                            patientSupplement.supplement.timing}
                        </p>
                      )}
                      {patientSupplement.notes && (
                        <p className="text-sm text-muted-foreground">
                          {patientSupplement.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portale paziente */}
      <Card className="bg-white/[0.78]">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="size-5 text-muted-foreground" />
            <CardTitle>Portale paziente</CardTitle>
          </div>
          <CardDescription>
            Il paziente può accedere al portale per consultare il piano, tenere un
            diario alimentare e messaggiare con te.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-start gap-6">
            <div className="space-y-1">
              <p className="text-sm font-medium">Stato</p>
              <Badge
                variant={patient.portalEnabled ? "default" : "secondary"}
                className={patient.portalEnabled ? "bg-emerald-600" : ""}
              >
                {patient.portalEnabled ? "Attivo" : "Non abilitato"}
              </Badge>
            </div>
            {patient.invitedAt && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Abilitato il</p>
                <p className="text-sm text-muted-foreground">
                  {patient.invitedAt.toLocaleDateString("it-IT")}
                </p>
              </div>
            )}
            {patient.lastPortalLogin && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Ultimo accesso</p>
                <p className="text-sm text-muted-foreground">
                  {patient.lastPortalLogin.toLocaleDateString("it-IT")}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PortalInviteButton
              patientId={patientId}
              portalEnabled={patient.portalEnabled}
              hasEmail={!!patient.email}
            />
            {patient.portalEnabled && (
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                render={
                  <PendingLink
                    href={`/messages/${patientId}`}
                    tone="button"
                    pendingLabel={`Apro i messaggi di ${patient.name}`}
                  />
                }
              >
                <MessageSquare className="size-4" />
                Messaggi
              </Button>
            )}
          </div>

          {patient.portalEnabled && patient.email && (
            <div className="rounded-xl bg-muted/50 p-3 text-sm">
              <p className="text-muted-foreground">
                Il paziente può accedere al portale su{" "}
                <code className="text-foreground font-mono text-xs bg-muted px-1 py-0.5 rounded">
                  /portal/login
                </code>{" "}
                usando l&apos;email{" "}
                <span className="font-medium text-foreground">{patient.email}</span>.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <DeletePatientButton patientId={patientId} patientName={patient.name} />
      </div>
    </div>
  );
}
