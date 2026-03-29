"use client";

import { cn } from "@/lib/utils";
import type { AppointmentWithPatient } from "./types";
import {
  GRID_START_HOUR,
  GRID_END_HOUR,
  HOUR_HEIGHT_PX,
  APPOINTMENT_TYPE_LABELS,
  APPOINTMENT_STATUS_LABELS,
  TYPE_COLORS,
  STATUS_COLORS,
} from "./types";

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

interface DayViewProps {
  date: Date;
  appointments: AppointmentWithPatient[];
  onSlotClick: (date: string, time: string) => void;
  onAppointmentClick: (appointment: AppointmentWithPatient) => void;
}

const MONTHS_IT = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function DayView({ date, appointments, onSlotClick, onAppointmentClick }: DayViewProps) {
  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => GRID_START_HOUR + i);
  const today = isToday(date);

  const dayAppts = appointments
    .filter((a) => {
      const d = new Date(a.date);
      return (
        d.getFullYear() === date.getFullYear() &&
        d.getMonth() === date.getMonth() &&
        d.getDate() === date.getDate()
      );
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  function handleSlotClick(hour: number) {
    const dateStr = date.toISOString().split("T")[0];
    const timeStr = `${String(hour).padStart(2, "0")}:00`;
    onSlotClick(dateStr, timeStr);
  }

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden">
      {/* Day header */}
      <div
        className={cn(
          "sticky top-0 z-10 border-b border-border px-4 py-3 bg-white/95",
          today && "bg-primary/5"
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex flex-col items-center justify-center size-12 rounded-2xl font-heading",
              today ? "bg-primary text-primary-foreground" : "bg-muted/40"
            )}
          >
            <span className="text-xl font-bold leading-none">{date.getDate()}</span>
            <span className="text-[0.6rem] uppercase tracking-wide">{MONTHS_IT[date.getMonth()].slice(0, 3)}</span>
          </div>
          <div>
            <p className="font-semibold">{date.toLocaleDateString("it-IT", { weekday: "long" })}</p>
            <p className="text-sm text-muted-foreground">
              {dayAppts.length === 0
                ? "Nessun appuntamento"
                : `${dayAppts.length} appuntament${dayAppts.length === 1 ? "o" : "i"}`}
            </p>
          </div>
        </div>
      </div>

      {/* Time grid */}
      <div className="grid" style={{ gridTemplateColumns: "56px minmax(0, 1fr)" }}>
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

        {/* Day column */}
        <div
          className="relative border-l border-border"
          style={{ height: GRID_TOTAL_PX }}
        >
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute inset-x-0 border-b border-border/40 cursor-pointer hover:bg-primary/5 transition-colors"
              style={{ top: (hour - GRID_START_HOUR) * HOUR_HEIGHT_PX, height: HOUR_HEIGHT_PX }}
              onClick={() => handleSlotClick(hour)}
              aria-label={`Nuovo appuntamento alle ${hour}:00`}
            />
          ))}

          {dayAppts.map((appt) => {
            const top = appointmentTopPx(appt.startTime);
            const height = Math.max(appointmentHeightPx(appt.startTime, appt.endTime), 28);
            if (top < 0 || top >= GRID_TOTAL_PX) return null;

            const typeKey = (appt.type as keyof typeof TYPE_COLORS) ?? "default";
            const colorClass = TYPE_COLORS[typeKey] ?? TYPE_COLORS.default;
            const statusLabel = APPOINTMENT_STATUS_LABELS[appt.status as keyof typeof APPOINTMENT_STATUS_LABELS];
            const statusColor = STATUS_COLORS[appt.status as keyof typeof STATUS_COLORS] ?? "";

            return (
              <div
                key={appt.id}
                className="absolute left-2 right-2 z-10"
                style={{ top, height }}
              >
                <button
                  type="button"
                  onClick={() => onAppointmentClick(appt)}
                  className={cn(
                    "w-full h-full rounded-xl border px-3 py-1.5 text-left text-xs overflow-hidden transition-all hover:opacity-90 hover:shadow-sm",
                    colorClass,
                    appt.status === "cancelled" && "opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{appt.startTime} – {appt.endTime}</span>
                    <span className={cn("text-[0.62rem] rounded-full px-1.5 py-0.5 font-medium", statusColor)}>
                      {statusLabel}
                    </span>
                  </div>
                  {height >= 48 && (
                    <div className="mt-1 truncate font-medium">
                      {appt.patient?.name ?? appt.title ?? "Appuntamento"}
                    </div>
                  )}
                  {height >= 64 && appt.type && (
                    <div className="text-[0.65rem] opacity-70">
                      {APPOINTMENT_TYPE_LABELS[appt.type as keyof typeof APPOINTMENT_TYPE_LABELS]}
                    </div>
                  )}
                  {height >= 80 && appt.notes && (
                    <div className="text-[0.65rem] opacity-60 mt-0.5 truncate">{appt.notes}</div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
