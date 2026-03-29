import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

/**
 * Restituisce il paziente corrente autenticato nel portale.
 * Redirige a /portal/login se la sessione non è valida o non è un paziente.
 */
export const getCurrentPatient = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const patient = await prisma.patient.findFirst({
    where: { authId: user.id, portalEnabled: true },
    include: {
      professional: {
        select: { id: true, name: true, title: true, logoUrl: true },
      },
    },
  });

  if (!patient) redirect("/portal/login");

  return patient;
});
