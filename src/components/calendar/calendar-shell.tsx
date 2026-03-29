"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WeekView } from "./week-view";
import { MonthView } from "./month-view";
import { DayView } from "./day-view";
import { AppointmentDialog } from "./appointment-dialog";
import type { AppointmentWithPatient, CalendarView, PatientOption } from "./types";
import { ChevronLeft, ChevronRight, CalendarDays, LayoutGrid, List, Plus } from "lucide-react";

const MONTHS_IT = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

interface CalendarShellProps {
  appointments: AppointmentWithPatient[];
  patients: PatientOption[];
  initialView: CalendarView;
  initialDate: Date;
}

export function CalendarShell({
  appointments,
  patients,
  initialView,
  initialDate,
}: CalendarShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [view, setView] = useState<CalendarView>(initialView);
  const [currentDate, setCurrentDate] = useState<Date>(initialDate);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithPatient | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>("");
  const [defaultStartTime, setDefaultStartTime] = useState<string>("");

  function navigate(direction: "prev" | "next") {
    const next = new Date(currentDate);
    if (view === "week") {
      next.setDate(next.getDate() + (direction === "next" ? 7 : -7));
    } else if (view === "month") {
      next.setMonth(next.getMonth() + (direction === "next" ? 1 : -1));
    } else {
      next.setDate(next.getDate() + (direction === "next" ? 1 : -1));
    }
    setCurrentDate(next);
    pushUrl(view, next);
  }

  function goToday() {
    const now = new Date();
    setCurrentDate(now);
    pushUrl(view, now);
  }

  function switchView(newView: CalendarView) {
    setView(newView);
    pushUrl(newView, currentDate);
  }

  function pushUrl(v: CalendarView, date: Date) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", v);
    params.set("date", date.toISOString().split("T")[0]);
    router.push(`/calendar?${params.toString()}`);
  }

  function handleSlotClick(dateStr: string, time: string) {
    setSelectedAppointment(null);
    setDefaultDate(dateStr);
    setDefaultStartTime(time);
    setDialogOpen(true);
  }

  function handleAppointmentClick(appointment: AppointmentWithPatient) {
    setSelectedAppointment(appointment);
    setDefaultDate("");
    setDefaultStartTime("");
    setDialogOpen(true);
  }

  function handleNewAppointment() {
    setSelectedAppointment(null);
    setDefaultDate(currentDate.toISOString().split("T")[0]);
    setDefaultStartTime("09:00");
    setDialogOpen(true);
  }

  function handleDialogClose() {
    setDialogOpen(false);
    setSelectedAppointment(null);
    router.refresh();
  }

  function handleDayClick(date: Date) {
    setCurrentDate(date);
    setView("day");
    pushUrl("day", date);
  }

  // Title label
  let titleLabel = "";
  if (view === "week") {
    const weekStart = getWeekStart(currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    titleLabel = `${weekStart.getDate()} – ${weekEnd.getDate()} ${MONTHS_IT[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;
  } else if (view === "month") {
    titleLabel = `${MONTHS_IT[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  } else {
    titleLabel = currentDate.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }

  const weekStart = getWeekStart(currentDate);
  const weekDays = getWeekDays(weekStart);

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" onClick={() => navigate("prev")}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Oggi
          </Button>
          <Button variant="outline" size="icon-sm" onClick={() => navigate("next")}>
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <span className="font-semibold text-sm flex-1 min-w-40 capitalize">{titleLabel}</span>

        <div className="flex items-center gap-1 rounded-xl border border-input bg-white/80 p-1">
          <Button
            variant={view === "month" ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => switchView("month")}
            title="Vista mensile"
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={view === "week" ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => switchView("week")}
            title="Vista settimanale"
          >
            <CalendarDays className="size-4" />
          </Button>
          <Button
            variant={view === "day" ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => switchView("day")}
            title="Vista giornaliera"
          >
            <List className="size-4" />
          </Button>
        </div>

        <Button size="sm" onClick={handleNewAppointment}>
          <Plus className="size-4" />
          Nuovo
        </Button>
      </div>

      {/* Calendar view */}
      {view === "week" && (
        <WeekView
          days={weekDays}
          appointments={appointments}
          onSlotClick={handleSlotClick}
          onAppointmentClick={handleAppointmentClick}
        />
      )}

      {view === "month" && (
        <MonthView
          year={currentDate.getFullYear()}
          month={currentDate.getMonth()}
          appointments={appointments}
          onDayClick={handleDayClick}
          onAppointmentClick={handleAppointmentClick}
        />
      )}

      {view === "day" && (
        <DayView
          date={currentDate}
          appointments={appointments}
          onSlotClick={handleSlotClick}
          onAppointmentClick={handleAppointmentClick}
        />
      )}

      <AppointmentDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        appointment={selectedAppointment}
        defaultDate={defaultDate}
        defaultStartTime={defaultStartTime}
        patients={patients}
      />
    </>
  );
}
