import type { TimelineEvent } from "@/components/patients/patient-timeline";

export const PATIENT_NOTE_CATEGORY_LABELS: Record<string, string> = {
  clinica: "Clinica",
  comunicazione: "Comunicazione",
  "follow-up": "Follow-up",
  altro: "Altro",
};

interface TimelineVisit {
  id: string;
  date: Date;
  weightKg: number | null;
  bodyFatPct: number | null;
  bmi: number | null;
}

interface TimelineMealPlan {
  id: string;
  createdAt: Date;
  name: string | null;
  totalKcalRest: number | null;
  numVariants: number;
}

interface TimelineNote {
  id: string;
  createdAt: Date;
  category: string | null;
  content: string;
  isPinned: boolean;
}

interface TimelineSupplement {
  id: string;
  createdAt: Date;
  dosage: string | null;
  timing: string | null;
  supplement: {
    name: string;
    defaultDosage: string | null;
    timing: string | null;
  };
}

interface BuildPatientTimelineEventsInput {
  patientId: string;
  visits: TimelineVisit[];
  mealPlans: TimelineMealPlan[];
  patientNotes: TimelineNote[];
  supplements: TimelineSupplement[];
}

function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

export function buildPatientTimelineEvents({
  patientId,
  visits,
  mealPlans,
  patientNotes,
  supplements,
}: BuildPatientTimelineEventsInput): TimelineEvent[] {
  return [
    ...visits.map((visit) => ({
      id: visit.id,
      type: "visit" as const,
      date: visit.date,
      title: `Visita del ${visit.date.toLocaleDateString("it-IT")}`,
      summary:
        [
          visit.weightKg ? `Peso ${visit.weightKg} kg` : null,
          visit.bodyFatPct ? `BF ${visit.bodyFatPct}%` : null,
          visit.bmi ? `BMI ${visit.bmi}` : null,
        ]
          .filter(Boolean)
          .join(" - ") || "Nessuna misurazione registrata",
      link: `/patients/${patientId}/visits/${visit.id}/edit`,
    })),
    ...mealPlans.map((plan) => ({
      id: plan.id,
      type: "meal_plan" as const,
      date: plan.createdAt,
      title: plan.name || "Piano senza nome",
      summary:
        [
          plan.totalKcalRest ? `${Math.round(plan.totalKcalRest)} kcal` : null,
          plan.numVariants ? `${plan.numVariants} varianti` : null,
        ]
          .filter(Boolean)
          .join(", ") || "Piano dieta",
      link: `/patients/${patientId}/meal-plans/${plan.id}`,
    })),
    ...patientNotes.map((note) => ({
      id: note.id,
      type: "note" as const,
      date: note.createdAt,
      title: note.category
        ? PATIENT_NOTE_CATEGORY_LABELS[note.category] ?? note.category
        : "Nota",
      summary: truncateText(note.content, 200),
      isPinned: note.isPinned,
    })),
    ...supplements.map((supplement) => ({
      id: supplement.id,
      type: "supplement" as const,
      date: supplement.createdAt,
      title: `Aggiunto ${supplement.supplement.name}`,
      summary:
        [
          supplement.dosage || supplement.supplement.defaultDosage,
          supplement.timing || supplement.supplement.timing,
        ]
          .filter(Boolean)
          .join(" - ") || supplement.supplement.name,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function sortPatientNotes<T extends { isPinned: boolean; createdAt: Date }>(
  notes: T[]
) {
  return [...notes].sort((left, right) => {
    if (left.isPinned !== right.isPinned) {
      return Number(right.isPinned) - Number(left.isPinned);
    }

    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}
