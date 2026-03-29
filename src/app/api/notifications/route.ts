import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { generateNotifications } from "@/lib/notifications/generate";

export async function GET() {
  const professionalId = await requireProfessionalId();

  await generateNotifications(professionalId);

  const notifications = await prisma.notification.findMany({
    where: { professionalId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
}

const patchSchema = z.union([
  z.object({ ids: z.array(z.string()) }),
  z.object({ all: z.literal(true) }),
]);

export async function PATCH(request: Request) {
  const professionalId = await requireProfessionalId();
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Payload non valido" }, { status: 400 });
  }

  if ("all" in parsed.data) {
    await prisma.notification.updateMany({
      where: { professionalId, isRead: false },
      data: { isRead: true },
    });
  } else {
    await prisma.notification.updateMany({
      where: {
        id: { in: parsed.data.ids },
        professionalId,
      },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ ok: true });
}
