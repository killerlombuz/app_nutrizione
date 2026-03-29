import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { MetricCard } from "@/components/layout/metric-card";
import { PendingLink } from "@/components/navigation/pending-link";
import {
  Activity,
  CalendarClock,
  ChevronRight,
  FileChartColumn,
  FilterX,
  Plus,
  UsersRound,
} from "lucide-react";

const FOLLOW_UP_DAYS = 30;

type PatientsSearchParams = {
  q?: string;
  gender?: "M" | "F";
  plan?: "with";
  status?: "follow-up";
};

function buildPatientsHref({
  q,
  gender,
  plan,
  status,
}: PatientsSearchParams) {
  const params = new URLSearchParams();

  if (q) params.set("q", q);
  if (gender) params.set("gender", gender);
  if (plan) params.set("plan", plan);
  if (status) params.set("status", status);

  const query = params.toString();
  return query ? `/patients?${query}` : "/patients";
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Nessuna registrazione";
  }

  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<PatientsSearchParams>;
}) {
  const professionalId = await requireProfessionalId();
  const { q, gender, plan, status } = await searchParams;
  const thirtyDaysAgo = new Date(Date.now() - FOLLOW_UP_DAYS * 24 * 60 * 60 * 1000);
  const hasScopedFilters = Boolean(gender || plan || status);

  const patients = await prisma.patient.findMany({
    where: {
      professionalId,
      ...(gender ? { gender } : {}),
      ...(plan === "with" ? { mealPlans: { some: {} } } : {}),
      ...(status === "follow-up"
        ? {
            visits: {
              none: { date: { gte: thirtyDaysAgo } },
            },
          }
        : {}),
      ...(q
        ? {
            name: { contains: q, mode: "insensitive" },
          }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    include: {
      _count: { select: { visits: true, mealPlans: true } },
      visits: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true },
      },
      mealPlans: {
        orderBy: { date: "desc" },
        take: 1,
        select: { date: true, name: true },
      },
    },
  });

  const rows = patients.map((patient) => {
    const lastVisit = patient.visits[0]?.date ?? null;
    const lastPlan = patient.mealPlans[0] ?? null;
    const hasPlan = patient._count.mealPlans > 0;
    const isNoVisit = lastVisit === null;
    const isFollowUp = isNoVisit || lastVisit < thirtyDaysAgo;

    return {
      ...patient,
      lastVisit,
      lastPlan,
      hasPlan,
      isNoVisit,
      isFollowUp,
    };
  });

  const followUpCount = rows.filter((patient) => patient.isFollowUp).length;
  const noVisitCount = rows.filter((patient) => patient.isNoVisit).length;
  const withPlanCount = rows.filter((patient) => patient.hasPlan).length;
  const allFiltersHref = buildPatientsHref({ q });
  const clearAllHref = buildPatientsHref({});

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clinica"
        title="Pazienti"
        description="Vista operativa per cercare, filtrare e aprire rapidamente le cartelle cliniche con segnali utili al follow-up."
        action={
          <Button
            render={
              <PendingLink
                href="/patients/new"
                tone="button"
                pendingLabel="Apro la creazione del paziente"
              />
            }
          >
            <Plus className="size-4" />
            Nuovo Paziente
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Profili nel filtro"
          value={rows.length}
          hint="profili disponibili in questa vista"
          icon={UsersRound}
          tone="emerald"
        />
        <MetricCard
          label="Da ricontattare"
          value={followUpCount}
          hint={`nessuna visita utile negli ultimi ${FOLLOW_UP_DAYS} giorni`}
          icon={CalendarClock}
          tone="cobalt"
        />
        <MetricCard
          label="Con piano"
          value={withPlanCount}
          hint="pazienti con almeno un piano dieta archiviato"
          icon={FileChartColumn}
          tone="amber"
        />
        <MetricCard
          label="Senza visite"
          value={noVisitCount}
          hint="profili registrati ma non ancora visitati"
          icon={Activity}
          tone="violet"
        />
      </div>

      <Card className="bg-white/[0.78]">
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-col gap-4">
            <div>
              <CardTitle>Gestione anagrafica</CardTitle>
              <CardDescription className="mt-2">
                Filtra per profilo, piano e follow-up mantenendo una CTA chiara verso
                la scheda paziente.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                render={
                  <PendingLink
                    href={allFiltersHref}
                    tone="text"
                    pendingLabel="Aggiorno i filtri pazienti"
                  />
                }
                variant={!hasScopedFilters ? "default" : "outline"}
              >
                Tutti
              </Badge>
              <Badge
                render={
                  <PendingLink
                    href={buildPatientsHref({
                      q,
                      gender: gender === "M" ? undefined : "M",
                      plan,
                      status,
                    })}
                    tone="text"
                    pendingLabel="Filtro i pazienti uomini"
                  />
                }
                variant={gender === "M" ? "default" : "outline"}
              >
                Uomini
              </Badge>
              <Badge
                render={
                  <PendingLink
                    href={buildPatientsHref({
                      q,
                      gender: gender === "F" ? undefined : "F",
                      plan,
                      status,
                    })}
                    tone="text"
                    pendingLabel="Filtro le pazienti donne"
                  />
                }
                variant={gender === "F" ? "default" : "outline"}
              >
                Donne
              </Badge>
              <Badge
                render={
                  <PendingLink
                    href={buildPatientsHref({
                      q,
                      gender,
                      plan: plan === "with" ? undefined : "with",
                      status,
                    })}
                    tone="text"
                    pendingLabel="Filtro i pazienti con piano"
                  />
                }
                variant={plan === "with" ? "default" : "outline"}
              >
                Con piano
              </Badge>
              <Badge
                render={
                  <PendingLink
                    href={buildPatientsHref({
                      q,
                      gender,
                      plan,
                      status: status === "follow-up" ? undefined : "follow-up",
                    })}
                    tone="text"
                    pendingLabel="Filtro i pazienti da ricontattare"
                  />
                }
                variant={status === "follow-up" ? "default" : "outline"}
              >
                Da ricontattare
              </Badge>
              {(q || hasScopedFilters) && (
                <Button
                  variant="ghost"
                  size="sm"
                  render={
                    <PendingLink
                      href={clearAllHref}
                      tone="button"
                      pendingLabel="Rimuovo tutti i filtri pazienti"
                    />
                  }
                >
                  <FilterX className="size-4" />
                  Pulisci tutto
                </Button>
              )}
            </div>
            <form className="flex flex-col gap-2 sm:flex-row">
              {gender ? <input type="hidden" name="gender" value={gender} /> : null}
              {plan ? <input type="hidden" name="plan" value={plan} /> : null}
              {status ? <input type="hidden" name="status" value={status} /> : null}
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
          {rows.length === 0 ? (
            <div className="space-y-3 py-8 text-center">
              <p className="text-muted-foreground">
                {q || hasScopedFilters
                  ? "Nessun paziente corrisponde ai filtri correnti."
                  : "Nessun paziente registrato."}
              </p>
              {(q || hasScopedFilters) && (
                <PendingLink
                  href={clearAllHref}
                  tone="text"
                  pendingLabel="Rimuovo i filtri pazienti"
                  className="font-medium text-primary underline"
                >
                  Rimuovi filtri e ricerca
                </PendingLink>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((patient) => {
                const identity = [
                  patient.gender === "F"
                    ? "Donna"
                    : patient.gender === "M"
                      ? "Uomo"
                      : "Profilo",
                  patient.heightCm ? `${patient.heightCm} cm` : null,
                  `${patient._count.visits} visite`,
                ]
                  .filter(Boolean)
                  .join(" - ");

                const statusBadge = patient.isNoVisit
                  ? {
                      label: "Senza visite",
                      className: "border-rose-200 bg-rose-50 text-rose-700",
                      description: "Da avviare",
                    }
                  : patient.isFollowUp
                    ? {
                        label: "Da ricontattare",
                        className: "border-amber-200 bg-amber-50 text-amber-800",
                        description: `Ultima visita ${formatDate(patient.lastVisit)}`,
                      }
                    : {
                        label: "Attivo",
                        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
                        description: `Ultima visita ${formatDate(patient.lastVisit)}`,
                      };

                const planBadge = patient.hasPlan
                  ? {
                      label:
                        patient.lastPlan && patient.lastPlan.date >= thirtyDaysAgo
                          ? "Piano recente"
                          : "Piano archiviato",
                      className:
                        patient.lastPlan && patient.lastPlan.date >= thirtyDaysAgo
                          ? "border-cyan-200 bg-cyan-50 text-cyan-700"
                          : "border-slate-200 bg-slate-50 text-slate-700",
                    }
                  : {
                      label: "Profilo base",
                      className: "border-border bg-white text-muted-foreground",
                    };

                return (
                  <PendingLink
                    key={patient.id}
                    href={`/patients/${patient.id}`}
                    tone="panel"
                    pendingLabel={`Apro la scheda di ${patient.name}`}
                    className="grid gap-4 rounded-[1.65rem] bg-[var(--surface-low)] px-4 py-4 transition-all duration-[var(--motion-duration-medium)] ease-[var(--motion-ease-standard)] hover:bg-white hover:shadow-[var(--shadow-soft)] xl:grid-cols-[minmax(0,1.35fr)_170px_170px_180px_120px]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold">{patient.name}</p>
                        <Badge variant="outline" className={planBadge.className}>
                          {planBadge.label}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{identity}</p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Ultima visita
                      </p>
                      <p className="font-medium">{formatDate(patient.lastVisit)}</p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Ultimo piano
                      </p>
                      <p className="font-medium">
                        {patient.lastPlan ? formatDate(patient.lastPlan.date) : "Nessun piano"}
                      </p>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Stato
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={statusBadge.className}>
                          {statusBadge.label}
                        </Badge>
                        <span className="text-muted-foreground">
                          {statusBadge.description}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm xl:justify-end">
                      <span className="text-muted-foreground">Apri scheda</span>
                      <ChevronRight className="size-4 text-primary" />
                    </div>
                  </PendingLink>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
