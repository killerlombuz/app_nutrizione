"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PendingLink } from "@/components/navigation/pending-link";
import { Button } from "@/components/ui/button";
import { ChevronRight, CalendarDays } from "lucide-react";
import { APPOINTMENT_TYPE_LABELS, TYPE_COLORS } from "@/components/calendar/types";
import { cn } from "@/lib/utils";

export interface UpcomingAppointment {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  type: string | null;
  status: string;
  patient: { id: string; name: string } | null;
  title: string | null;
}

interface UpcomingAppointmentsWidgetProps {
  appointments: UpcomingAppointment[];
}

export function UpcomingAppointmentsWidget({ appointments }: UpcomingAppointmentsWidgetProps) {
  return (
    <Card className="bg-white/[0.78]">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Prossimi appuntamenti</CardTitle>
            <CardDescription>
              Appuntamenti programmati per i prossimi giorni.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            render={
              <PendingLink
                href="/calendar"
                tone="button"
                pendingLabel="Apro l'agenda"
              />
            }
          >
            Agenda
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {appointments.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/40">
              <CalendarDays className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nessun appuntamento in programma.{" "}
              <PendingLink
                href="/calendar"
                tone="text"
                pendingLabel="Apro l'agenda"
                className="font-medium text-primary underline"
              >
                Aggiungi il primo.
              </PendingLink>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {appointments.map((appt) => {
              const typeKey = (appt.type as keyof typeof TYPE_COLORS) ?? "default";
              const colorClass = TYPE_COLORS[typeKey] ?? TYPE_COLORS.default;
              const typeLabel = appt.type
                ? APPOINTMENT_TYPE_LABELS[appt.type as keyof typeof APPOINTMENT_TYPE_LABELS]
                : null;

              return (
                <PendingLink
                  key={appt.id}
                  href="/calendar"
                  tone="panel"
                  pendingLabel="Apro l'agenda"
                  className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.5rem] bg-[var(--surface-low)] px-4 py-3 transition-all duration-[var(--motion-duration-medium)] ease-[var(--motion-ease-standard)] hover:bg-white hover:shadow-[var(--shadow-soft)]"
                >
                  <div className={cn("flex flex-col items-center justify-center size-10 rounded-xl border text-[0.65rem] font-semibold", colorClass)}>
                    <span className="text-[0.9rem] font-bold leading-none">
                      {new Date(appt.date).getDate()}
                    </span>
                    <span className="uppercase tracking-wide opacity-70">
                      {new Date(appt.date).toLocaleDateString("it-IT", { month: "short" }).replace(".", "")}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-sm">
                      {appt.patient?.name ?? appt.title ?? "Appuntamento"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {appt.startTime} – {appt.endTime}
                      {typeLabel ? ` · ${typeLabel}` : ""}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-primary flex-shrink-0" />
                </PendingLink>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
