import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import type { FoodCategory } from "@/generated/prisma/enums";

export async function GET(request: Request) {
  const professionalId = await requireProfessionalId();
  const { searchParams } = new URL(request.url);

  const category = searchParams.get("category") as FoodCategory | null;
  const targetKcal = Number(searchParams.get("targetKcal") ?? "0");
  const patientId = searchParams.get("patientId") ?? "";

  if (!category || targetKcal <= 0) {
    return NextResponse.json([]);
  }

  // Leggi le condizioni del paziente per filtrare allergeni
  const conditions = patientId
    ? await prisma.patientCondition.findMany({ where: { patientId } })
    : [];

  const conditionNames = conditions.map((c) => c.conditionName.toLowerCase());
  const excludeFodmap = conditionNames.some((n) => n.includes("fodmap"));
  const excludeNickel = conditionNames.some((n) => n.includes("nichel") || n.includes("nickel"));
  const requireGlutenFree = conditionNames.some(
    (n) => n.includes("celiac") || n.includes("glutin") || n.includes("celiach")
  );
  const requireLactoseFree = conditionNames.some(
    (n) => n.includes("lattos") || n.includes("lactose")
  );

  const foods = await prisma.food.findMany({
    where: {
      OR: [{ professionalId }, { professionalId: null }],
      category,
      kcalPer100g: { gt: 0 },
      ...(excludeFodmap ? { isFodmap: false } : {}),
      ...(excludeNickel ? { isNickel: false } : {}),
      ...(requireGlutenFree ? { isGlutenFree: true } : {}),
      ...(requireLactoseFree ? { isLactoseFree: true } : {}),
    },
    select: {
      id: true,
      name: true,
      category: true,
      kcalPer100g: true,
    },
    orderBy: { name: "asc" },
    take: 5,
  });

  const results = foods.map((food) => ({
    id: food.id,
    name: food.name,
    category: food.category,
    kcalPer100g: food.kcalPer100g,
    grams: food.kcalPer100g > 0 ? Math.round((targetKcal / food.kcalPer100g) * 100) : 0,
  }));

  return NextResponse.json(results);
}
