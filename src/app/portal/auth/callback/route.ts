import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const origin = new URL(request.url).origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/portal/login?error=link_non_valido`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/portal/login?error=sessione_non_valida`);
  }

  const userEmail = data.user.email;
  const userId = data.user.id;

  // Prima prova per authId (login successivi)
  let patient = await prisma.patient.findFirst({
    where: { authId: userId, portalEnabled: true },
  });

  // Se non trovato per authId, cerca per email (primo login)
  if (!patient && userEmail) {
    patient = await prisma.patient.findFirst({
      where: { email: userEmail, portalEnabled: true },
    });

    if (patient) {
      await prisma.patient.update({
        where: { id: patient.id },
        data: { authId: userId },
      });
    }
  }

  if (!patient) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/portal/login?error=accesso_non_autorizzato`);
  }

  await prisma.patient.update({
    where: { id: patient.id },
    data: { lastPortalLogin: new Date() },
  });

  return NextResponse.redirect(`${origin}/portal/dashboard`);
}
