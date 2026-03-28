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

  const patients = await prisma.patient.findMany({
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
      visits: {
        select: {
          date: true,
        },
        orderBy: {
          date: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      name: "asc",
    },
    take: 5,
  });

  return NextResponse.json(
    patients.map((patient) => ({
      id: patient.id,
      name: patient.name,
      lastVisitDate: patient.visits[0]?.date ?? null,
    }))
  );
}
