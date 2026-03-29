import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MEAL_TYPE_LABELS } from "@/lib/constants";
import { getFoodEmoji } from "@/lib/food-emoji";

export default async function SharedMealPlanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const plan = await prisma.mealPlan.findUnique({
    where: { shareToken: token },
    include: {
      patient: {
        select: {
          name: true,
          professional: {
            select: { name: true, title: true, logoUrl: true },
          },
        },
      },
      mealTemplates: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  if (!plan) notFound();

  const { patient } = plan;
  const professional = patient.professional;
  const hasW1 = plan.numVariants >= 2;
  const hasW2 = plan.numVariants >= 3;

  const patientFirstName = patient.name.split(" ")[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="mx-auto max-w-2xl flex items-center gap-3">
          {professional.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={professional.logoUrl}
              alt={professional.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          )}
          <div>
            <p className="font-semibold text-gray-900">
              {professional.title
                ? `${professional.title} ${professional.name}`
                : professional.name}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        {/* Titolo piano */}
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {plan.name || "Piano Dieta"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {patientFirstName} &mdash;{" "}
            {plan.date.toLocaleDateString("it-IT")}
          </p>
        </div>

        {/* Scenari kcal */}
        {plan.totalKcalRest && (
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
            <div className="rounded-xl bg-white border border-gray-200 p-3 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Riposo
              </p>
              <p className="text-lg font-bold text-gray-900">
                {Math.round(plan.totalKcalRest)} kcal
              </p>
            </div>
            {hasW1 && plan.totalKcalWorkout1 && (
              <div className="rounded-xl bg-white border border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  {plan.workout1Name || "Allenamento 1"}
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {Math.round(plan.totalKcalWorkout1)} kcal
                </p>
              </div>
            )}
            {hasW2 && plan.totalKcalWorkout2 && (
              <div className="rounded-xl bg-white border border-gray-200 p-3 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  {plan.workout2Name || "Allenamento 2"}
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {Math.round(plan.totalKcalWorkout2)} kcal
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pasti */}
        {plan.mealTemplates.map((template) => (
          <div
            key={template.id}
            className="rounded-xl bg-white border border-gray-200 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {MEAL_TYPE_LABELS[template.mealType] || template.mealType}
              </h2>
              {template.kcalRest && (
                <span className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                  {Math.round(template.kcalRest)} kcal
                </span>
              )}
            </div>
            <div className="divide-y divide-gray-50">
              {template.options.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">
                  Nessun alimento configurato.
                </p>
              ) : (
                template.options.map((opt) => (
                  <div
                    key={opt.id}
                    className="px-4 py-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base">
                        {getFoodEmoji(opt.foodName ?? "")}
                      </span>
                      <span className="text-sm text-gray-800 truncate">
                        {opt.foodName}
                      </span>
                      {opt.isFixed && (
                        <span className="text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 shrink-0">
                          fisso
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-sm text-gray-600">
                      {opt.gramsRest && (
                        <span>
                          {Math.round(opt.gramsRest)}g
                          <span className="text-xs text-gray-400 ml-0.5">
                            rip.
                          </span>
                        </span>
                      )}
                      {hasW1 && opt.gramsWorkout1 && (
                        <span>
                          {Math.round(opt.gramsWorkout1)}g
                          <span className="text-xs text-gray-400 ml-0.5">
                            all.1
                          </span>
                        </span>
                      )}
                      {hasW2 && opt.gramsWorkout2 && (
                        <span>
                          {Math.round(opt.gramsWorkout2)}g
                          <span className="text-xs text-gray-400 ml-0.5">
                            all.2
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-xs text-gray-400">Piano creato con NutriPlan</p>
      </footer>
    </div>
  );
}
