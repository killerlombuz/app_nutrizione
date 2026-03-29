export type AppointmentType = "prima_visita" | "controllo" | "consegna_piano" | "altro";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no_show";
export type CalendarView = "week" | "month" | "day";

export interface AppointmentWithPatient {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  title: string | null;
  type: string | null;
  status: string;
  notes: string | null;
  patient: { id: string; name: string } | null;
}

export interface PatientOption {
  id: string;
  name: string;
}

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  prima_visita: "Prima visita",
  controllo: "Controllo",
  consegna_piano: "Consegna piano",
  altro: "Altro",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Programmato",
  completed: "Completato",
  cancelled: "Cancellato",
  no_show: "Non presentato",
};

export const TYPE_COLORS: Record<AppointmentType | "default", string> = {
  prima_visita: "bg-emerald-100 text-emerald-800 border-emerald-200",
  controllo: "bg-blue-100 text-blue-800 border-blue-200",
  consegna_piano: "bg-amber-100 text-amber-800 border-amber-200",
  altro: "bg-violet-100 text-violet-800 border-violet-200",
  default: "bg-slate-100 text-slate-800 border-slate-200",
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
  no_show: "bg-amber-50 text-amber-700",
};

// Griglia oraria: 07:00 - 20:00
export const GRID_START_HOUR = 7;
export const GRID_END_HOUR = 20;
export const HOUR_HEIGHT_PX = 64;
