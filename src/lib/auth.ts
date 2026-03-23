import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentProfessional() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const professional = await prisma.professional.findUnique({
    where: { authId: user.id },
  });

  if (!professional) redirect("/register");

  return professional;
}

export async function requireProfessionalId(): Promise<string> {
  const professional = await getCurrentProfessional();
  return professional.id;
}
