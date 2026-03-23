import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ foodId: string }> }
) {
  const professionalId = await requireProfessionalId();
  const { foodId } = await params;

  const food = await prisma.food.findFirst({
    where: {
      id: foodId,
      OR: [{ professionalId }, { professionalId: null }],
    },
  });

  if (!food) {
    return NextResponse.json({ error: "Alimento non trovato" }, { status: 404 });
  }

  return NextResponse.json(food);
}
