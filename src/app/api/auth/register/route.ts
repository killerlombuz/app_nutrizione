import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { name, email } = await request.json();

  const existing = await prisma.professional.findUnique({
    where: { authId: user.id },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const professional = await prisma.professional.create({
    data: {
      authId: user.id,
      name: name || user.user_metadata?.name || "Professionista",
      email: email || user.email || "",
    },
  });

  return NextResponse.json(professional, { status: 201 });
}
