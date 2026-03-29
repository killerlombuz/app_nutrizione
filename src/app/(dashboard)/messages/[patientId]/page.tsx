import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireProfessionalId } from "@/lib/auth";
import { getCurrentProfessional } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { markMessagesRead } from "@/features/messages/actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ProfessionalMessageThread } from "@/components/portal/professional-message-thread";
import { Button } from "@/components/ui/button";
import { PendingLink } from "@/components/navigation/pending-link";

export default async function PatientChatPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const [professionalId, professional] = await Promise.all([
    requireProfessionalId(),
    getCurrentProfessional(),
  ]);

  const patient = await prisma.patient.findFirst({
    where: { id: patientId, professionalId, portalEnabled: true },
    select: { id: true, name: true, email: true },
  });

  if (!patient) notFound();

  const messages = await prisma.message.findMany({
    where: { conversationId: patientId },
    orderBy: { createdAt: "asc" },
  });

  // Segna i messaggi del paziente come letti
  await markMessagesRead(patientId, "professional");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          render={
            <PendingLink
              href="/messages"
              tone="button"
              pendingLabel="Torno ai messaggi"
            />
          }
        >
          <ArrowLeft className="size-4" />
          Messaggi
        </Button>
      </div>

      <Card className="bg-white/[0.78]">
        <CardHeader>
          <CardTitle>
            <Link
              href={`/patients/${patientId}`}
              className="hover:underline"
            >
              {patient.name}
            </Link>
          </CardTitle>
          <CardDescription>{patient.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="min-h-[400px] flex flex-col">
            <ProfessionalMessageThread
              patientId={patientId}
              messages={messages}
              patientName={patient.name}
              professionalName={professional.name}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
