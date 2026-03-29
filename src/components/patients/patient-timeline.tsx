import { cn } from "@/lib/utils";
import { PendingLink } from "@/components/navigation/pending-link";
import { NoteActions } from "@/components/patients/note-actions";
import { Stethoscope, Utensils, StickyNote, Pill, Pin } from "lucide-react";

export interface TimelineEvent {
  id: string;
  type: "visit" | "meal_plan" | "note" | "supplement";
  date: Date;
  title: string;
  summary: string;
  link?: string;
  isPinned?: boolean;
}

const TYPE_CONFIG = {
  visit: {
    icon: Stethoscope,
    iconColor: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  meal_plan: {
    icon: Utensils,
    iconColor: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  note: {
    icon: StickyNote,
    iconColor: "bg-violet-100 text-violet-700",
    dot: "bg-violet-500",
  },
  supplement: {
    icon: Pill,
    iconColor: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
  },
} as const;

function formatDate(date: Date): string {
  return date.toLocaleDateString("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function TimelineItem({
  event,
  patientId,
}: {
  event: TimelineEvent;
  patientId: string;
}) {
  const config = TYPE_CONFIG[event.type];
  const Icon = config.icon;

  return (
    <div className="relative mb-5 ml-10">
      <div
        className={cn(
          "absolute -left-[2.125rem] top-3.5 size-3 rounded-full border-2 border-background",
          config.dot
        )}
      />
      <div className="rounded-[1.4rem] bg-[var(--surface-low)] px-4 py-4 transition-all duration-[var(--motion-duration-medium)] ease-[var(--motion-ease-standard)] hover:bg-white hover:shadow-[var(--shadow-soft)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
                config.iconColor
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium">{event.title}</span>
                {event.isPinned && (
                  <Pin className="size-3 text-violet-500" />
                )}
              </div>
              <p className="mt-0.5 line-clamp-3 text-sm text-muted-foreground">
                {event.summary}
              </p>
              <span className="mt-1 block text-xs text-muted-foreground/70">
                {formatDate(event.date)}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {event.type === "note" && (
              <NoteActions
                noteId={event.id}
                patientId={patientId}
                isPinned={event.isPinned ?? false}
              />
            )}
            {event.link && (
              <PendingLink
                href={event.link}
                tone="panel"
                pendingLabel="Apro i dettagli..."
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Dettagli
              </PendingLink>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PatientTimeline({
  events,
  patientId,
}: {
  events: TimelineEvent[];
  patientId: string;
}) {
  const pinned = events.filter((e) => e.type === "note" && e.isPinned);
  const rest = events.filter((e) => !(e.type === "note" && e.isPinned));

  if (events.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nessun evento nella timeline. Aggiungi una visita, un piano dieta o una nota.
      </p>
    );
  }

  return (
    <div>
      {pinned.length > 0 && (
        <>
          <div className="mb-3 flex items-center gap-2">
            <Pin className="size-3.5 text-muted-foreground" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Note in evidenza
            </span>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-0 h-full w-0.5 bg-border" />
            {pinned.map((event) => (
              <TimelineItem key={event.id} event={event} patientId={patientId} />
            ))}
          </div>
          {rest.length > 0 && (
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 border-t border-dashed border-border" />
              <span className="text-xs text-muted-foreground">Cronologia</span>
              <div className="h-px flex-1 border-t border-dashed border-border" />
            </div>
          )}
        </>
      )}

      {rest.length > 0 && (
        <div className="relative">
          <div className="absolute left-4 top-0 h-full w-0.5 bg-border" />
          {rest.map((event) => (
            <TimelineItem key={event.id} event={event} patientId={patientId} />
          ))}
        </div>
      )}
    </div>
  );
}
