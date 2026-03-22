import { PatientForm } from "@/components/patients/patient-form";
import { createPatient } from "@/features/patients/actions";

export default function NewPatientPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Nuovo Paziente</h1>
      <PatientForm action={createPatient} submitLabel="Crea Paziente" />
    </div>
  );
}
