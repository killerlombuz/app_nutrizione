import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireProfessionalId } from "@/lib/auth";
import { PatientForm } from "@/components/patients/patient-form";
import { updatePatient } from "@/features/patients/actions";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const professionalId = await requireProfessionalId();
  const { patientId } = await params;

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId },
  });

  if (!patient) notFound();

  const boundAction = updatePatient.bind(null, patientId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-2xl font-semibold tracking-[-0.04em]">
          Modifica paziente
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          Aggiorna anagrafica, contatti e note permanenti senza uscire dal contesto
          del paziente.
        </p>
      </div>
      <PatientForm
        action={boundAction}
        submitLabel="Aggiorna"
        defaultValues={{
          name: patient.name,
          birthDate: patient.birthDate
            ? patient.birthDate.toISOString().split("T")[0]
            : undefined,
          heightCm: patient.heightCm,
          gender: patient.gender,
          email: patient.email,
          phone: patient.phone,
          notes: patient.notes,
        }}
      />
    </div>
  );
}
