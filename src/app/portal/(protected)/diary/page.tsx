import { getCurrentPatient } from "@/lib/supabase/patient-auth";
import { prisma } from "@/lib/db";
import { DiaryEntryForm } from "@/components/portal/diary-entry-form";
import { DeleteDiaryEntryButton } from "@/components/portal/delete-diary-entry-button";

const MEAL_TYPE_LABELS: Record<string, string> = {
  COLAZIONE: "Colazione",
  SPUNTINO_MATTINA: "Spuntino mattina",
  PRANZO: "Pranzo",
  SPUNTINO_POMERIGGIO: "Spuntino pomeriggio",
  CENA: "Cena",
  SPUNTINO_SERA: "Spuntino sera",
};

export default async function PortalDiaryPage() {
  const patient = await getCurrentPatient();

  const entries = await prisma.foodDiary.findMany({
    where: { patientId: patient.id },
    orderBy: { date: "desc" },
    take: 50,
  });

  // Raggruppa per data
  const grouped = entries.reduce<Record<string, typeof entries>>(
    (acc, entry) => {
      const key = entry.date.toLocaleDateString("it-IT");
      if (!acc[key]) acc[key] = [];
      acc[key].push(entry);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Diario alimentare</h1>
        <p className="text-sm text-gray-500 mt-1">
          Registra cosa mangi giorno per giorno.
        </p>
      </div>

      <DiaryEntryForm />

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>Il diario è vuoto. Inizia a registrare i tuoi pasti!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, dayEntries]) => (
            <div key={date}>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {date}
              </h2>
              <div className="space-y-2">
                {dayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-2xl bg-white border border-gray-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="inline-block text-xs font-medium text-emerald-700 bg-emerald-50 rounded-full px-2 py-0.5 mb-2">
                          {MEAL_TYPE_LABELS[entry.mealType] ?? entry.mealType}
                        </span>
                        <p className="text-sm text-gray-900">{entry.description}</p>
                        {entry.notes && (
                          <p className="text-xs text-gray-500 mt-1 italic">
                            {entry.notes}
                          </p>
                        )}
                      </div>
                      <DeleteDiaryEntryButton entryId={entry.id} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
