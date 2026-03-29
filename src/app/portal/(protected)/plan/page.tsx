import { getCurrentPatient } from "@/lib/supabase/patient-auth";
import { prisma } from "@/lib/db";
import { MEAL_TYPE_LABELS } from "@/lib/constants";
import { getFoodEmoji } from "@/lib/food-emoji";

export default async function PortalPlanPage() {
  const patient = await getCurrentPatient();

  const plan = await prisma.mealPlan.findFirst({
    where: { patientId: patient.id },
    orderBy: { createdAt: "desc" },
    include: {
      mealTemplates: {
        orderBy: { sortOrder: "asc" },
        include: {
          options: {
            orderBy: { sortOrder: "asc" },
            include: { food: { select: { category: true } } },
          },
        },
      },
    },
  });

  if (!plan) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">
          Nessun piano dieta disponibile. Il tuo nutrizionista ti assegnerà
          presto un piano.
        </p>
      </div>
    );
  }

  const hasW1 = plan.numVariants >= 2;
  const hasW2 = plan.numVariants >= 3;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {plan.name || "Piano dieta"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {plan.date.toLocaleDateString("it-IT", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* Scenari kcal */}
      {plan.totalKcalRest && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          <div className="rounded-2xl bg-white border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Riposo
            </p>
            <p className="text-xl font-bold text-gray-900">
              {Math.round(plan.totalKcalRest)} kcal
            </p>
          </div>
          {hasW1 && plan.totalKcalWorkout1 && (
            <div className="rounded-2xl bg-white border border-gray-200 p-3 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {plan.workout1Name || "Allenamento 1"}
              </p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round(plan.totalKcalWorkout1)} kcal
              </p>
            </div>
          )}
          {hasW2 && plan.totalKcalWorkout2 && (
            <div className="rounded-2xl bg-white border border-gray-200 p-3 text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {plan.workout2Name || "Allenamento 2"}
              </p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round(plan.totalKcalWorkout2)} kcal
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pasti */}
      <div className="space-y-4">
        {plan.mealTemplates.map((template) => (
          <div
            key={template.id}
            className="rounded-2xl bg-white border border-gray-200 overflow-hidden"
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
                          <span className="text-xs text-gray-400 ml-0.5">rip.</span>
                        </span>
                      )}
                      {hasW1 && opt.gramsWorkout1 && (
                        <span>
                          {Math.round(opt.gramsWorkout1)}g
                          <span className="text-xs text-gray-400 ml-0.5">all.1</span>
                        </span>
                      )}
                      {hasW2 && opt.gramsWorkout2 && (
                        <span>
                          {Math.round(opt.gramsWorkout2)}g
                          <span className="text-xs text-gray-400 ml-0.5">all.2</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {template.notes && (
              <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-100">
                <p className="text-sm text-amber-700">{template.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {plan.notes && (
        <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
          <p className="text-sm font-medium text-blue-800 mb-1">Note del piano</p>
          <p className="text-sm text-blue-700">{plan.notes}</p>
        </div>
      )}
    </div>
  );
}
