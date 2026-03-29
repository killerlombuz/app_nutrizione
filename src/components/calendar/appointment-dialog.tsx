"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createAppointment, updateAppointment, deleteAppointment } from "@/features/appointments/actions";
import type { AppointmentWithPatient, PatientOption } from "./types";
import { APPOINTMENT_TYPE_LABELS, APPOINTMENT_STATUS_LABELS } from "./types";
import { Trash2 } from "lucide-react";

interface AppointmentDialogProps {
  open: boolean;
  onClose: () => void;
  appointment?: AppointmentWithPatient | null;
  defaultDate?: string;
  defaultStartTime?: string;
  patients: PatientOption[];
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function AppointmentDialog({
  open,
  onClose,
  appointment,
  defaultDate,
  defaultStartTime,
  patients,
}: AppointmentDialogProps) {
  const isEdit = !!appointment;
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [patientQuery, setPatientQuery] = useState(appointment?.patient?.name ?? "");
  const [selectedPatientId, setSelectedPatientId] = useState(appointment?.patient?.id ?? "");
  const [showPatientList, setShowPatientList] = useState(false);

  const filteredPatients = patientQuery.length >= 1
    ? patients.filter((p) => p.name.toLowerCase().includes(patientQuery.toLowerCase()))
    : patients.slice(0, 8);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (selectedPatientId) {
      formData.set("patientId", selectedPatientId);
    } else {
      formData.delete("patientId");
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateAppointment(appointment.id, formData)
        : await createAppointment(formData);

      if (result?.error) {
        setErrors(result.error as Record<string, string[]>);
        return;
      }

      setErrors({});
      onClose();
    });
  }

  function handleDelete() {
    if (!appointment) return;
    startTransition(async () => {
      await deleteAppointment(appointment.id);
      onClose();
    });
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setErrors({});
      onClose();
    }
  }

  const initialDate = appointment
    ? formatDateForInput(new Date(appointment.date))
    : (defaultDate ?? "");
  const initialStart = appointment?.startTime ?? defaultStartTime ?? "09:00";
  const initialEnd = appointment?.endTime ?? "09:30";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifica appuntamento" : "Nuovo appuntamento"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="appt-date">Data *</Label>
              <Input
                id="appt-date"
                type="date"
                name="date"
                defaultValue={initialDate}
                required
              />
              {errors.date && <p className="text-xs text-red-600">{errors.date[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="appt-start">Inizio *</Label>
              <Input
                id="appt-start"
                type="time"
                name="startTime"
                defaultValue={initialStart}
                required
              />
              {errors.startTime && <p className="text-xs text-red-600">{errors.startTime[0]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="appt-end">Fine *</Label>
              <Input
                id="appt-end"
                type="time"
                name="endTime"
                defaultValue={initialEnd}
                required
              />
              {errors.endTime && <p className="text-xs text-red-600">{errors.endTime[0]}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="appt-patient">Paziente</Label>
            <div className="relative">
              <Input
                id="appt-patient"
                placeholder="Cerca paziente..."
                value={patientQuery}
                onChange={(e) => {
                  setPatientQuery(e.target.value);
                  setSelectedPatientId("");
                  setShowPatientList(true);
                }}
                onFocus={() => setShowPatientList(true)}
                onBlur={() => setTimeout(() => setShowPatientList(false), 150)}
                autoComplete="off"
              />
              {showPatientList && filteredPatients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 rounded-xl border border-input bg-white shadow-lg max-h-48 overflow-y-auto">
                  {filteredPatients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={() => {
                        setSelectedPatientId(p.id);
                        setPatientQuery(p.name);
                        setShowPatientList(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-muted/70"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appt-type">Tipo</Label>
              <select
                id="appt-type"
                name="type"
                defaultValue={appointment?.type ?? ""}
                className="h-11 w-full rounded-2xl border border-input bg-white/[0.88] px-4 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] outline-none focus-visible:border-primary/30 focus-visible:ring-4 focus-visible:ring-ring/50"
              >
                <option value="">— Seleziona —</option>
                {Object.entries(APPOINTMENT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {isEdit && (
              <div className="space-y-2">
                <Label htmlFor="appt-status">Stato</Label>
                <select
                  id="appt-status"
                  name="status"
                  defaultValue={appointment.status}
                  className="h-11 w-full rounded-2xl border border-input bg-white/[0.88] px-4 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] outline-none focus-visible:border-primary/30 focus-visible:ring-4 focus-visible:ring-ring/50"
                >
                  {Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="appt-notes">Note</Label>
            <Textarea
              id="appt-notes"
              name="notes"
              defaultValue={appointment?.notes ?? ""}
              placeholder="Note sull'appuntamento..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            {isEdit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 mr-auto"
                onClick={handleDelete}
                disabled={isPending}
              >
                <Trash2 className="size-4" />
                Elimina
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Annulla
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio..." : isEdit ? "Aggiorna" : "Crea"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
