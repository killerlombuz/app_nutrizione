import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DeletePatientButton } from "@/components/patients/delete-patient-button";

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
      visits: { orderBy: { date: "desc" } },
      mealPlans: { orderBy: { createdAt: "desc" } },
      conditions: true,
    },
  });

  if (!patient) notFound();

  const age = patient.birthDate
    ? Math.floor(
        (Date.now() - patient.birthDate.getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{patient.name}</h1>
          <p className="text-muted-foreground">
            {patient.gender === "F" ? "Donna" : patient.gender === "M" ? "Uomo" : ""}
            {age !== null ? ` · ${age} anni` : ""}
            {patient.heightCm ? ` · ${patient.heightCm} cm` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href={`/patients/${patientId}/edit`} />}>Modifica</Button>
          <Button render={<Link href={`/patients/${patientId}/visits/new`} />}>+ Visita</Button>
          <Button variant="outline" render={<Link href={`/patients/${patientId}/meal-plans/new`} />}>
              + Piano Dieta
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>Anagrafica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {patient.birthDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data di nascita</span>
                <span>
                  {patient.birthDate.toLocaleDateString("it-IT")}
                </span>
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
                  {patient.conditions.map((c: typeof patient.conditions[number]) => (
                    <Badge key={c.id} variant="secondary">
                      {c.conditionName}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Ultima misura */}
        <Card>
          <CardHeader>
            <CardTitle>Ultima Visita</CardTitle>
          </CardHeader>
          <CardContent>
            {patient.visits.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessuna visita.</p>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data</span>
                  <span>
                    {patient.visits[0].date.toLocaleDateString("it-IT")}
                  </span>
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

      {/* Storico Visite */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Storico Visite</CardTitle>
          <Button size="sm" render={<Link href={`/patients/${patientId}/visits/new`} />}>+ Visita</Button>
        </CardHeader>
        <CardContent>
          {patient.visits.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuna visita.</p>
          ) : (
            <div className="space-y-2">
              {patient.visits.map((visit: typeof patient.visits[number]) => (
                <Link
                  key={visit.id}
                  href={`/patients/${patientId}/visits/${visit.id}/edit`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <span className="font-medium">
                    {visit.date.toLocaleDateString("it-IT")}
                  </span>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {visit.weightKg && <span>{visit.weightKg} kg</span>}
                    {visit.bodyFatPct && <span>{visit.bodyFatPct}% FM</span>}
                    {visit.leanMassKg && <span>{visit.leanMassKg} kg MM</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Piani Dieta */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Piani Dieta</CardTitle>
          <Button size="sm" render={<Link href={`/patients/${patientId}/meal-plans/new`} />}>
              + Piano
          </Button>
        </CardHeader>
        <CardContent>
          {patient.mealPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun piano.</p>
          ) : (
            <div className="space-y-2">
              {patient.mealPlans.map((plan: typeof patient.mealPlans[number]) => (
                <Link
                  key={plan.id}
                  href={`/patients/${patientId}/meal-plans/${plan.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <span className="font-medium">
                    {plan.name || "Piano senza nome"}
                  </span>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{plan.date.toLocaleDateString("it-IT")}</span>
                    {plan.totalKcalRest && (
                      <span>{Math.round(plan.totalKcalRest)} kcal</span>
                    )}
                  </div>
                </Link>
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
