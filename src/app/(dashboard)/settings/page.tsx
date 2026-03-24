import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";
import { updateProfile } from "@/features/settings/actions";
import { MetricCard } from "@/components/layout/metric-card";
import { PageHeader } from "@/components/layout/page-header";
import { BookOpenText, FileChartColumn, Settings, UsersRound } from "lucide-react";

export default async function SettingsPage() {
  const professionalId = await requireProfessionalId();

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
  });

  if (!professional) {
    return <p>Professionista non trovato.</p>;
  }

  const [patientCount, foodCount, recipeCount, planCount] = await Promise.all([
    prisma.patient.count({ where: { professionalId } }),
    prisma.food.count({
      where: { OR: [{ professionalId }, { professionalId: null }] },
    }),
    prisma.recipe.count({ where: { professionalId } }),
    prisma.mealPlan.count({
      where: { patient: { professionalId } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Impostazioni"
        description="Profilo professionista, dati account e preferenze operative. La vista viene riallineata alla composizione Stitch con card laterale e modulo principale."
      />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card className="bg-white/[0.78]">
            <CardHeader>
              <CardTitle>Profilo studio</CardTitle>
              <CardDescription>Identita visiva e dati pubblici del professionista.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex size-20 items-center justify-center rounded-[1.7rem] bg-[linear-gradient(135deg,#d9fff0,#8cf0c7)] font-heading text-2xl font-semibold text-primary">
                  {professional.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("")}
                </div>
                <div>
                  <p className="font-semibold">{professional.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {professional.title || "Biologo nutrizionista"}
                  </p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-right">{professional.email}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Telefono</span>
                  <span>{professional.phone || "-"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Attivo dal</span>
                  <span>{professional.createdAt.toLocaleDateString("it-IT")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <MetricCard
            label="Pazienti totali"
            value={patientCount}
            hint="cartelle gestite"
            icon={UsersRound}
            tone="emerald"
          />
          <MetricCard
            label="Ricette archiviate"
            value={recipeCount}
            hint="modelli e preparazioni"
            icon={BookOpenText}
            tone="cobalt"
          />
          <MetricCard
            label="Piani dieta"
            value={planCount}
            hint="schede alimentari create"
            icon={FileChartColumn}
            tone="amber"
          />
        </div>

        <Card className="bg-white/[0.78]">
          <CardHeader>
            <CardTitle>Profilo professionista</CardTitle>
            <CardDescription>Aggiorna dati e preferenze principali dello studio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <SettingsForm
              action={updateProfile}
              defaultValues={{
                name: professional.name,
                title: professional.title ?? "",
                phone: professional.phone ?? "",
                logoUrl: professional.logoUrl ?? "",
              }}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <MetricCard
                label="Alimenti disponibili"
                value={foodCount}
                hint="catalogo condiviso e personalizzato"
                icon={Settings}
                tone="violet"
              />
              <Card size="sm" className="bg-[var(--surface-low)] shadow-none">
                <CardHeader>
                  <CardTitle>Info account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{professional.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Registrato il</span>
                    <span>{professional.createdAt.toLocaleDateString("it-IT")}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
