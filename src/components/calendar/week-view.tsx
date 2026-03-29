"use client";

import { cn } from "@/lib/utils";
import type { AppointmentWithPatient } from "./types";
import { GRID_START_HOUR, GRID_END_HOUR, HOUR_HEIGHT_PX } from "./types";
import { AppointmentCard } from "./appointment-card";

const TOTAL_HOURS = GRID_END_HOUR - GRID_START_HOUR;
const GRID_TOTAL_PX = TOTAL_HOURS * HOUR_HEIGHT_PX;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function appointmentTopPx(startTime: string): number {
  const startMin = timeToMinutes(startTime);
  const gridStartMin = GRID_START_HOUR * 60;
  return ((startMin - gridStartMin) / 60) * HOUR_HEIGHT_PX;
}

function appointmentHeightPx(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return ((end - start) / 60) * HOUR_HEIGHT_PX;
}

interface WeekViewProps {
  days: Date[];
  appointments: AppointmentWithPatient[];
  onSlotClick: (date: string, time: string) => void;
  onAppointmentClick: (appointment: AppointmentWithPatient) => void;
}

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const MONTHS_IT = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];

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

export function WeekView({ days, appointments, onSlotClick, onAppointmentClick }: WeekViewProps) {
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => GRID_START_HOUR + i);

  function getAppointmentsForDay(day: Date) {
    return appointments.filter((a) => isSameDay(new Date(a.date), day));
  }

  function handleSlotClick(day: Date, hour: number) {
    const dateStr = day.toISOString().split("T")[0];
    const timeStr = `${String(hour).padStart(2, "0")}:00`;
    onSlotClick(dateStr, timeStr);
  }

  return (
    <div className="overflow-auto rounded-2xl border border-border bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 border-b border-border">
        <div className="grid" style={{ gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}>
          <div className="py-3" />
          {days.map((day) => {
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "py-3 px-2 text-center text-xs border-l border-border",
                  today && "bg-primary/5"
                )}
              >
                <div className="text-muted-foreground">{DAY_LABELS[day.getDay()]}</div>
                <div
                  className={cn(
                    "mt-0.5 font-semibold text-sm",
                    today
                      ? "flex items-center justify-center size-7 mx-auto rounded-full bg-primary text-primary-foreground"
                      : ""
                  )}
                >
                  {day.getDate()}
                </div>
                <div className="text-[0.62rem] text-muted-foreground/60">
                  {MONTHS_IT[day.getMonth()]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time grid */}
      <div
        className="grid"
        style={{ gridTemplateColumns: "56px repeat(7, minmax(0, 1fr))" }}
      >
        {/* Time labels */}
        <div>
          {hours.map((hour) => (
            <div
              key={hour}
              className="relative border-b border-border/50"
              style={{ height: HOUR_HEIGHT_PX }}
            >
              <span className="absolute -top-2.5 right-2 text-[0.62rem] text-muted-foreground/60">
                {String(hour).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map((day) => {
          const dayAppts = getAppointmentsForDay(day);
          const today = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "relative border-l border-border",
                today && "bg-primary/[0.02]"
              )}
              style={{ height: GRID_TOTAL_PX }}
            >
              {/* Hour slot lines */}
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute inset-x-0 border-b border-border/40 cursor-pointer hover:bg-primary/5 transition-colors"
                  style={{ top: (hour - GRID_START_HOUR) * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
                  onClick={() => handleSlotClick(day, hour)}
                  aria-label={`Nuovo appuntamento ${day.toLocaleDateString("it-IT")} alle ${hour}:00`}
                />
              ))}

              {/* Appointments */}
              {dayAppts.map((appt) => {
                const top = appointmentTopPx(appt.startTime);
                const height = Math.max(appointmentHeightPx(appt.startTime, appt.endTime), 24);
                if (top < 0 || top >= GRID_TOTAL_PX) return null;

                return (
                  <div
                    key={appt.id}
                    className="absolute inset-x-1 z-10 overflow-hidden"
                    style={{ top, height }}
                  >
                    <AppointmentCard
                      appointment={appt}
                      onClick={onAppointmentClick}
                      compact={height < 50}
                    />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
