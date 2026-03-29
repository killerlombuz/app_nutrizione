import { getCurrentPatient } from "@/lib/supabase/patient-auth";
import { prisma } from "@/lib/db";
import { MessageThread } from "@/components/portal/message-thread";
import { markMessagesRead } from "@/features/messages/actions";

export default async function PortalMessagesPage() {
  const patient = await getCurrentPatient();

  const messages = await prisma.message.findMany({
    where: { conversationId: patient.id },
    orderBy: { createdAt: "asc" },
  });

  // Segna i messaggi del professionista come letti
  await markMessagesRead(patient.id, "patient");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messaggi</h1>
        <p className="text-sm text-gray-500 mt-1">
          Conversazione con {patient.professional.title
            ? `${patient.professional.title} ${patient.professional.name}`
            : patient.professional.name}
        </p>
      </div>

      <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 min-h-[400px] flex flex-col">
        <MessageThread
          messages={messages}
          patientName={patient.name}
          professionalName={
            patient.professional.title
              ? `${patient.professional.title} ${patient.professional.name}`
              : patient.professional.name
          }
        />
      </div>
    </div>
  );
}
