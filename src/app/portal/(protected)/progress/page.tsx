import { getCurrentPatient } from "@/lib/supabase/patient-auth";
import { prisma } from "@/lib/db";

export default async function PortalProgressPage() {
  const patient = await getCurrentPatient();

  const visits = await prisma.visit.findMany({
    where: { patientId: patient.id },
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      weightKg: true,
      bodyFatPct: true,
      fatMassKg: true,
      leanMassKg: true,
      bmi: true,
      circWaist: true,
      circHips: true,
    },
    take: 20,
  });

  if (visits.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">
          Nessuna visita registrata. I tuoi dati appariranno qui dopo la prima visita.
        </p>
      </div>
    );
  }

  const latestVisit = visits[visits.length - 1];
  const firstVisit = visits[0];

  const weightDelta =
    latestVisit.weightKg && firstVisit.weightKg
      ? (latestVisit.weightKg - firstVisit.weightKg).toFixed(1)
      : null;

  const bfDelta =
    latestVisit.bodyFatPct && firstVisit.bodyFatPct
      ? (latestVisit.bodyFatPct - firstVisit.bodyFatPct).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">I tuoi progressi</h1>
        <p className="text-sm text-gray-500 mt-1">
          {visits.length} visit{visits.length === 1 ? "a" : "e"} registrat
          {visits.length === 1 ? "a" : "e"}
        </p>
      </div>

      {/* Sommario delta */}
      {visits.length >= 2 && (
        <div className="grid grid-cols-2 gap-3">
          {weightDelta !== null && (
            <div className="rounded-2xl bg-white border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Variazione peso
              </p>
              <p
                className={`text-2xl font-bold ${
                  Number(weightDelta) < 0
                    ? "text-emerald-600"
                    : Number(weightDelta) > 0
                    ? "text-red-500"
                    : "text-gray-900"
                }`}
              >
                {Number(weightDelta) > 0 ? "+" : ""}
                {weightDelta} kg
              </p>
              <p className="text-xs text-gray-400 mt-0.5">dall&apos;inizio</p>
            </div>
          )}
          {bfDelta !== null && (
            <div className="rounded-2xl bg-white border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Variazione MG
              </p>
              <p
                className={`text-2xl font-bold ${
                  Number(bfDelta) < 0
                    ? "text-emerald-600"
                    : Number(bfDelta) > 0
                    ? "text-red-500"
                    : "text-gray-900"
                }`}
              >
                {Number(bfDelta) > 0 ? "+" : ""}
                {bfDelta}%
              </p>
              <p className="text-xs text-gray-400 mt-0.5">dall&apos;inizio</p>
            </div>
          )}
        </div>
      )}

      {/* Tabella visite */}
      <div className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Storico misurazioni</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-gray-500">Data</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">Peso</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500">MG%</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500 hidden sm:table-cell">BMI</th>
                <th className="text-right px-4 py-2.5 font-medium text-gray-500 hidden sm:table-cell">Vita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...visits].reverse().map((visit) => (
                <tr key={visit.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 text-gray-700">
                    {visit.date.toLocaleDateString("it-IT")}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-900 font-medium">
                    {visit.weightKg ? `${visit.weightKg} kg` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-700">
                    {visit.bodyFatPct ? `${visit.bodyFatPct}%` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-700 hidden sm:table-cell">
                    {visit.bmi ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-700 hidden sm:table-cell">
                    {visit.circWaist ? `${visit.circWaist} cm` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
