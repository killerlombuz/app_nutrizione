import Link from "next/link";
import {
  CalendarDays,
  MessageSquare,
  NotebookPen,
  Scale,
  TrendingUp,
} from "lucide-react";
import { getCurrentPatient } from "@/lib/supabase/patient-auth";
import { prisma } from "@/lib/db";

export default async function PortalDashboardPage() {
  const patient = await getCurrentPatient();

  const [latestVisit, latestPlan, unreadMessages, nextAppointment] =
    await Promise.all([
      prisma.visit.findFirst({
        where: { patientId: patient.id },
        orderBy: { date: "desc" },
        select: { weightKg: true, bodyFatPct: true, date: true },
      }),
      prisma.mealPlan.findFirst({
        where: { patientId: patient.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, date: true, shareToken: true },
      }),
      prisma.message.count({
        where: {
          conversationId: patient.id,
          senderType: "professional",
          isRead: false,
        },
      }),
      prisma.appointment.findFirst({
        where: {
          patientId: patient.id,
          date: { gte: new Date() },
          status: "scheduled",
        },
        orderBy: { date: "asc" },
        select: { date: true, startTime: true, endTime: true, type: true },
      }),
    ]);

  const firstName = patient.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ciao, {firstName}! 👋</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Ecco un riepilogo della tua situazione.
        </p>
      </div>

      {/* Prossimo appuntamento */}
      {nextAppointment && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600">
              <CalendarDays className="size-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                Prossimo appuntamento
              </p>
              <p className="text-sm font-medium text-gray-900">
                {nextAppointment.date.toLocaleDateString("it-IT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                — {nextAppointment.startTime}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metriche */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Scale className="size-4 text-amber-500" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Peso
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {latestVisit?.weightKg ? `${latestVisit.weightKg} kg` : "—"}
          </p>
          {latestVisit?.date && (
            <p className="text-xs text-gray-400 mt-0.5">
              {latestVisit.date.toLocaleDateString("it-IT")}
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="size-4 text-violet-500" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Massa grassa
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {latestVisit?.bodyFatPct ? `${latestVisit.bodyFatPct}%` : "—"}
          </p>
          {latestVisit?.date && (
            <p className="text-xs text-gray-400 mt-0.5">
              {latestVisit.date.toLocaleDateString("it-IT")}
            </p>
          )}
        </div>
      </div>

      {/* Piano attivo */}
      <div className="rounded-2xl bg-white border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Piano dieta attivo</h2>
        {latestPlan ? (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">
                {latestPlan.name || "Piano senza nome"}
              </p>
              <p className="text-sm text-gray-500">
                {latestPlan.date.toLocaleDateString("it-IT")}
              </p>
            </div>
            <Link
              href="/portal/plan"
              className="shrink-0 rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              Vedi piano
            </Link>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Nessun piano dieta disponibile. Il tuo nutrizionista ti assegnerà presto un piano.
          </p>
        )}
      </div>

      {/* Link rapidi */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/portal/diary"
          className="rounded-2xl bg-white border border-gray-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all"
        >
          <NotebookPen className="size-5 text-emerald-600 mb-2" />
          <p className="font-medium text-gray-900">Diario alimentare</p>
          <p className="text-xs text-gray-500 mt-0.5">Registra i tuoi pasti</p>
        </Link>

        <Link
          href="/portal/messages"
          className="rounded-2xl bg-white border border-gray-200 p-4 hover:border-emerald-300 hover:shadow-sm transition-all relative"
        >
          {unreadMessages > 0 && (
            <span className="absolute top-3 right-3 size-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
              {unreadMessages}
            </span>
          )}
          <MessageSquare className="size-5 text-blue-500 mb-2" />
          <p className="font-medium text-gray-900">Messaggi</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {unreadMessages > 0
              ? `${unreadMessages} non lett${unreadMessages === 1 ? "o" : "i"}`
              : "Comunica con il tuo nutrizionista"}
          </p>
        </Link>
      </div>

      {/* Obiettivi */}
      {(patient.targetWeightKg || patient.targetBodyFatPct) && (
        <div className="rounded-2xl bg-white border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">I tuoi obiettivi</h2>
          <div className="space-y-3">
            {patient.targetWeightKg && latestVisit?.weightKg && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Peso obiettivo</span>
                  <span className="font-medium">{patient.targetWeightKg} kg</span>
                </div>
                {(() => {
                  const current = latestVisit.weightKg!;
                  const target = patient.targetWeightKg!;
                  // Peso iniziale non disponibile qui, mostriamo solo il delta
                  const diff = Math.abs(current - target);
                  const pct = Math.min(
                    100,
                    diff === 0 ? 100 : Math.max(0, 100 - (diff / target) * 100)
                  );
                  return (
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  );
                })()}
              </div>
            )}
            {patient.targetBodyFatPct && latestVisit?.bodyFatPct && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Massa grassa obiettivo</span>
                  <span className="font-medium">{patient.targetBodyFatPct}%</span>
                </div>
                {(() => {
                  const current = latestVisit.bodyFatPct!;
                  const target = patient.targetBodyFatPct!;
                  const diff = Math.abs(current - target);
                  const pct = Math.min(
                    100,
                    diff === 0 ? 100 : Math.max(0, 100 - (diff / target) * 100)
                  );
                  return (
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  );
                })()}
              </div>
            )}
            {patient.targetNotes && (
              <p className="text-sm text-gray-500 italic">{patient.targetNotes}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
