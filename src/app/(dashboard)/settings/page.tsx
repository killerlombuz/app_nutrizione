import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsForm } from "@/components/settings/settings-form";
import { updateProfile } from "@/features/settings/actions";

export default async function SettingsPage() {
  const professionalId = await requireProfessionalId();

  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
  });

  if (!professional) {
    return <p>Professionista non trovato.</p>;
  }

  // Stats
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
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Impostazioni</h1>

      <Card>
        <CardHeader>
          <CardTitle>Profilo Professionista</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsForm
            action={updateProfile}
            defaultValues={{
              name: professional.name,
              title: professional.title ?? "",
              phone: professional.phone ?? "",
              logoUrl: professional.logoUrl ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Info Account</CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle>Statistiche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            <div>
              <p className="text-2xl font-bold">{patientCount}</p>
              <p className="text-xs text-muted-foreground">Pazienti</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{foodCount}</p>
              <p className="text-xs text-muted-foreground">Alimenti</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{recipeCount}</p>
              <p className="text-xs text-muted-foreground">Ricette</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{planCount}</p>
              <p className="text-xs text-muted-foreground">Piani Dieta</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
