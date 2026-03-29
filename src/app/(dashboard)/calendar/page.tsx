import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { CalendarShell } from "@/components/calendar/calendar-shell";
import type { CalendarView } from "@/components/calendar/types";

function parseView(v: string | undefined): CalendarView {
  if (v === "month" || v === "day") return v;
  return "week";
}

function parseDate(d: string | undefined): Date {
  if (!d) return new Date();
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function getDateRange(view: CalendarView, date: Date): { start: Date; end: Date } {
  if (view === "week") {
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    return { start: weekStart, end: weekEnd };
  }
  if (view === "month") {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return { start, end };
  }
  // day
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

interface CalendarPageProps {
  searchParams: Promise<{ view?: string; date?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const professionalId = await requireProfessionalId();
  const params = await searchParams;

  const view = parseView(params.view);
  const currentDate = parseDate(params.date);
  const { start, end } = getDateRange(view, currentDate);

  const [appointments, patients] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        professionalId,
        date: { gte: start, lt: end },
      },
      include: {
        patient: { select: { id: true, name: true } },
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.patient.findMany({
      where: { professionalId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clinica"
        title="Agenda"
        description="Gestisci appuntamenti, visite e follow-up con il calendario integrato."
      />

      <CalendarShell
        appointments={appointments}
        patients={patients}
        initialView={view}
        initialDate={currentDate}
      />
    </div>
  );
}
