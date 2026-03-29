"use client";

import { cn } from "@/lib/utils";
import type { AppointmentWithPatient } from "./types";
import { APPOINTMENT_TYPE_LABELS, APPOINTMENT_STATUS_LABELS, TYPE_COLORS } from "./types";

interface AppointmentCardProps {
  appointment: AppointmentWithPatient;
  onClick: (appointment: AppointmentWithPatient) => void;
  compact?: boolean;
}

export function AppointmentCard({ appointment, onClick, compact = false }: AppointmentCardProps) {
  const typeKey = (appointment.type as keyof typeof TYPE_COLORS) ?? "default";
  const colorClass = TYPE_COLORS[typeKey] ?? TYPE_COLORS.default;
  const isCancelled = appointment.status === "cancelled";

  return (
    <button
      type="button"
      onClick={() => onClick(appointment)}
      className={cn(
        "w-full rounded-xl border px-2.5 py-1.5 text-left text-xs transition-all hover:opacity-90 hover:shadow-sm",
        colorClass,
        isCancelled && "opacity-50 line-through"
      )}
    >
      <div className="font-semibold truncate">
        {appointment.startTime} – {appointment.endTime}
      </div>
      {!compact && (
        <>
          <div className="truncate text-[0.7rem] mt-0.5">
            {appointment.patient?.name ??
              appointment.title ??
              APPOINTMENT_TYPE_LABELS[appointment.type as keyof typeof APPOINTMENT_TYPE_LABELS] ??
              "Appuntamento"}
          </div>
          {appointment.type && (
            <div className="text-[0.65rem] opacity-70 mt-0.5">
              {APPOINTMENT_TYPE_LABELS[appointment.type as keyof typeof APPOINTMENT_TYPE_LABELS]}
            </div>
          )}
        </>
      )}
    </button>
  );
}

interface AppointmentBadgeProps {
  appointment: AppointmentWithPatient;
  onClick: (appointment: AppointmentWithPatient) => void;
}

export function AppointmentBadge({ appointment, onClick }: AppointmentBadgeProps) {
  const typeKey = (appointment.type as keyof typeof TYPE_COLORS) ?? "default";
  const colorClass = TYPE_COLORS[typeKey] ?? TYPE_COLORS.default;

  return (
    <button
      type="button"
      onClick={() => onClick(appointment)}
      className={cn(
        "w-full rounded-lg border px-2 py-1 text-left text-[0.65rem] leading-snug truncate transition-all hover:opacity-90",
        colorClass
      )}
    >
      <span className="font-medium">{appointment.startTime}</span>{" "}
      {appointment.patient?.name ?? appointment.title ?? APPOINTMENT_STATUS_LABELS[appointment.status as keyof typeof APPOINTMENT_STATUS_LABELS]}
    </button>
  );
}
