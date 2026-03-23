import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const professionalId = await requireProfessionalId();

  const [patientCount, foodCount, visitCount, mealPlanCount, recentPatients] =
    await Promise.all([
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
    ]);

  const stats = [
    { label: "Pazienti", value: patientCount, icon: "👥" },
    { label: "Alimenti", value: foodCount, icon: "🥗" },
    { label: "Visite", value: visitCount, icon: "📋" },
    { label: "Piani Dieta", value: mealPlanCount, icon: "📄" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button render={<Link href="/patients/new" />}>+ Nuovo Paziente</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <span className="text-xl">{stat.icon}</span>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pazienti Recenti</CardTitle>
        </CardHeader>
        <CardContent>
          {recentPatients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessun paziente registrato.{" "}
              <Link href="/patients/new" className="underline">
                Aggiungi il primo
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-3">
              {recentPatients.map((patient: typeof recentPatients[number]) => (
                <Link
                  key={patient.id}
                  href={`/patients/${patient.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.gender === "F" ? "Donna" : patient.gender === "M" ? "Uomo" : ""}
                      {patient.heightCm ? ` · ${patient.heightCm} cm` : ""}
                    </p>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    {patient.visits[0]
                      ? `Ultima visita: ${new Date(patient.visits[0].date).toLocaleDateString("it-IT")}`
                      : "Nessuna visita"}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
