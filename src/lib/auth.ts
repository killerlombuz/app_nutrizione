import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfessional = cache(async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const professional = await prisma.professional.findUnique({
    where: { authId: user.id },
  });

  if (!professional) redirect("/register");

  return professional;
});

export async function requireProfessionalId(): Promise<string> {
  const professional = await getCurrentProfessional();
  return professional.id;
}
