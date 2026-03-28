import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";

export async function GET(request: Request) {
  const professionalId = await requireProfessionalId();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const recipes = await prisma.recipe.findMany({
    where: {
      professionalId,
      name: {
        contains: q,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      kcalPerPortion: true,
    },
    orderBy: {
      name: "asc",
    },
    take: 5,
  });

  return NextResponse.json(recipes);
}
