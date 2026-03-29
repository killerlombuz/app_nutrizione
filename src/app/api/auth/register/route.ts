import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const accessToken = request.headers
      .get("authorization")
      ?.replace(/^Bearer\s+/i, "");
    const {
      data: { user },
      error: userError,
    } = accessToken
      ? await supabase.auth.getUser(accessToken)
      : await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "Sessione non valida. Accedi di nuovo per completare il profilo professionale.",
        },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
      email?: string;
    };
    const name =
      body.name?.trim() || user.user_metadata?.name || "Professionista";
    const email = body.email?.trim() || user.email;

    if (!email) {
      return NextResponse.json(
        { error: "Email account non disponibile." },
        { status: 400 }
      );
    }

    const existing = await prisma.professional.findUnique({
      where: { authId: user.id },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const existingByEmail = await prisma.professional.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      return NextResponse.json(
        {
          error:
            "Esiste gia un profilo professionale associato a questa email.",
        },
        { status: 409 }
      );
    }

    const professional = await prisma.professional.create({
      data: {
        authId: user.id,
        name,
        email,
      },
    });

    return NextResponse.json(professional, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error: "Esiste gia un profilo professionale con questi dati.",
        },
        { status: 409 }
      );
    }

    console.error("Failed to create professional profile", error);

    return NextResponse.json(
      {
        error:
          "Impossibile creare il profilo professionale in questo momento.",
      },
      { status: 500 }
    );
  }
}
