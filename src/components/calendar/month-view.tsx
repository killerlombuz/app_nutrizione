"use client";

import { cn } from "@/lib/utils";
import type { AppointmentWithPatient } from "./types";
import { AppointmentBadge } from "./appointment-card";

interface MonthViewProps {
  year: number;
  month: number; // 0-indexed
  appointments: AppointmentWithPatient[];
  onDayClick: (date: Date) => void;
  onAppointmentClick: (appointment: AppointmentWithPatient) => void;
}

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

function getMonthDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Pad start (week starts on Sunday=0)
  const startPad = firstDay.getDay();
  // Pad end
  const endPad = 6 - lastDay.getDay();

  const days: Date[] = [];

  for (let i = startPad; i > 0; i--) {
    days.push(new Date(year, month, 1 - i));
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  for (let i = 1; i <= endPad; i++) {
    days.push(new Date(year, month + 1, i));
  }

  return days;
}

export function MonthView({ year, month, appointments, onDayClick, onAppointmentClick }: MonthViewProps) {
  const days = getMonthDays(year, month);

  function getAppointmentsForDay(day: Date) {
    return appointments
      .filter((a) => isSameDay(new Date(a.date), day))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/30">
        {DAY_LABELS.map((label) => (
          <div key={label} className="py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {label}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayAppts = getAppointmentsForDay(day);
          const isCurrentMonth = day.getMonth() === month;
          const today = isToday(day);
          const MAX_VISIBLE = 3;
          const overflow = dayAppts.length - MAX_VISIBLE;

          return (
            <div
              key={idx}
              className={cn(
                "min-h-[100px] border-b border-r border-border p-2 cursor-pointer transition-colors hover:bg-primary/[0.03]",
                !isCurrentMonth && "bg-muted/20",
                today && "bg-primary/5"
              )}
              onClick={() => onDayClick(day)}
            >
              <div
                className={cn(
                  "text-sm font-medium mb-1.5 flex items-center justify-center size-7 rounded-full",
                  today
                    ? "bg-primary text-primary-foreground"
                    : isCurrentMonth
                      ? "text-foreground"
                      : "text-muted-foreground/40"
                )}
              >
                {day.getDate()}
              </div>
              <div className="space-y-0.5">
                {dayAppts.slice(0, MAX_VISIBLE).map((appt) => (
                  <AppointmentBadge
                    key={appt.id}
                    appointment={appt}
                    onClick={(a) => {
                      onAppointmentClick(a);
                    }}
                  />
                ))}
                {overflow > 0 && (
                  <div className="text-[0.65rem] text-muted-foreground px-1 py-0.5">
                    +{overflow} altri
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
