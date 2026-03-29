import { prisma } from "@/lib/db";

const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 ore

async function notificationExists(
  professionalId: string,
  type: string,
  link: string
): Promise<boolean> {
  const since = new Date(Date.now() - DEDUP_WINDOW_MS);
  const existing = await prisma.notification.findFirst({
    where: {
      professionalId,
      type,
      link,
      createdAt: { gte: since },
    },
    select: { id: true },
  });
  return existing !== null;
}

export async function generateNotifications(
  professionalId: string
): Promise<void> {
  const now = new Date();
  const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const days7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Notifica di benvenuto (professionale senza pazienti)
  const patientCount = await prisma.patient.count({ where: { professionalId } });
  if (patientCount === 0) {
    const link = "/patients/new";
    const exists = await notificationExists(professionalId, "welcome", link);
    if (!exists) {
      await prisma.notification.create({
        data: {
          professionalId,
          type: "welcome",
          title: "Benvenuto su NutriPlan",
          message: "Inizia aggiungendo il tuo primo paziente",
          link,
        },
      });
    }
    return; // se non ha pazienti, le altre check non sono rilevanti
  }

  // 2. Pazienti senza visita da 30+ giorni
  const patientsNoVisit30 = await prisma.patient.findMany({
    where: {
      professionalId,
      visits: {
        none: { date: { gte: days30Ago } },
        some: {}, // ha almeno una visita (non è un paziente nuovo)
      },
    },
    select: { id: true, name: true, visits: { orderBy: { date: "desc" }, take: 1, select: { date: true } } },
  });

  for (const patient of patientsNoVisit30) {
    const lastVisit = patient.visits[0]?.date;
    if (!lastVisit) continue;
    const daysAgo = Math.floor((now.getTime() - lastVisit.getTime()) / (24 * 60 * 60 * 1000));
    const link = `/patients/${patient.id}`;
    const exists = await notificationExists(professionalId, "follow_up", link);
    if (!exists) {
      await prisma.notification.create({
        data: {
          professionalId,
          type: "follow_up",
          title: `Ricontattare ${patient.name}`,
          message: `Ultima visita ${daysAgo} giorni fa`,
          link,
        },
      });
    }
  }

  // 3. Piani dieta creati da 30+ giorni senza rinnovo
  const expiredPlans = await prisma.mealPlan.findMany({
    where: {
      patient: { professionalId },
      date: { lte: days30Ago },
    },
    select: {
      id: true,
      name: true,
      date: true,
      patient: { select: { id: true, name: true } },
    },
    orderBy: { date: "desc" },
    distinct: ["patientId"],
  });

  for (const plan of expiredPlans) {
    const link = `/patients/${plan.patient.id}/meal-plans/new`;
    const exists = await notificationExists(professionalId, "plan_expired", link);
    if (!exists) {
      const daysAgo = Math.floor(
        (now.getTime() - plan.date.getTime()) / (24 * 60 * 60 * 1000)
      );
      const planName = plan.name ?? "senza nome";
      await prisma.notification.create({
        data: {
          professionalId,
          type: "plan_expired",
          title: "Piano da rinnovare",
          message: `${plan.patient.name}: piano "${planName}" ha ${daysAgo} giorni`,
          link,
        },
      });
    }
  }

  // 4. Pazienti creati 7+ giorni fa senza nessuna visita
  const patientsNoVisitEver = await prisma.patient.findMany({
    where: {
      professionalId,
      createdAt: { lte: days7Ago },
      visits: { none: {} },
    },
    select: { id: true, name: true, createdAt: true },
  });

  for (const patient of patientsNoVisitEver) {
    const link = `/patients/${patient.id}/visits/new`;
    const exists = await notificationExists(professionalId, "no_visit", link);
    if (!exists) {
      const daysAgo = Math.floor(
        (now.getTime() - patient.createdAt.getTime()) / (24 * 60 * 60 * 1000)
      );
      await prisma.notification.create({
        data: {
          professionalId,
          type: "no_visit",
          title: "Paziente senza visite",
          message: `${patient.name} registrato ${daysAgo} giorni fa, nessuna visita`,
          link,
        },
      });
    }
  }
}
