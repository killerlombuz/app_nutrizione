import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { calculateFullMetabolism } from "@/lib/calculations/metabolism";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const professionalId = await requireProfessionalId();
  const { patientId } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
  });
  if (!patient) {
    return NextResponse.json({ error: "Paziente non trovato" }, { status: 404 });
  }

  const measurement = await prisma.visit.findFirst({
    where: { patientId },
    orderBy: { date: "desc" },
  });

  if (!measurement?.leanMassKg) {
    return NextResponse.json(
      { error: "Nessuna misura con massa magra disponibile" },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(request.url);
  const activityLevelId = searchParams.get("activity_level_id");
  const sport1Id = searchParams.get("sport1_id");
  const sport1Duration = parseFloat(searchParams.get("sport1_duration") ?? "0");
  const sport2Id = searchParams.get("sport2_id");
  const sport2Duration = parseFloat(searchParams.get("sport2_duration") ?? "0");
  const deficit = parseFloat(searchParams.get("deficit") ?? "0");

  // Get activity level name
  let activityLevel = "Sedentarie";
  if (activityLevelId) {
    const level = await prisma.activityLevel.findUnique({
      where: { id: activityLevelId },
    });
    if (level) activityLevel = level.name;
  }

  // Get sport kcal/hr/kg
  let sport1KcalHrKg = 0;
  let sport2KcalHrKg = 0;
  if (sport1Id) {
    const sport = await prisma.sportActivity.findUnique({ where: { id: sport1Id } });
    if (sport) sport1KcalHrKg = sport.kcalPerHourPerKg;
  }
  if (sport2Id) {
    const sport = await prisma.sportActivity.findUnique({ where: { id: sport2Id } });
    if (sport) sport2KcalHrKg = sport.kcalPerHourPerKg;
  }

  const result = calculateFullMetabolism({
    leanMassKg: measurement.leanMassKg,
    weightKg: measurement.weightKg ?? 0,
    activityLevel,
    sport1KcalHrKg,
    sport1Duration,
    sport2KcalHrKg,
    sport2Duration,
    deficit,
  });

  return NextResponse.json(result);
}
