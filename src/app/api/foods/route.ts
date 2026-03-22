import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";

export async function GET(request: Request) {
  const professionalId = await requireProfessionalId();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const foods = await prisma.food.findMany({
    where: {
      OR: [{ professionalId }, { professionalId: null }],
      name: { contains: q, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
      category: true,
      kcalPer100g: true,
      proteinG: true,
      carbG: true,
      fatG: true,
    },
    orderBy: { name: "asc" },
    take: 20,
  });

  return NextResponse.json(foods);
}
