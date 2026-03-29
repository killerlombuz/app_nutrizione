import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { requireProfessionalId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";

export default async function MessagesPage() {
  const professionalId = await requireProfessionalId();

  // Pazienti con portale abilitato
  const patients = await prisma.patient.findMany({
    where: { professionalId, portalEnabled: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      messages: {
        where: { senderType: "patient", isRead: false },
        select: { id: true },
      },
    },
  });

  // Per ogni paziente, ultimo messaggio
  const lastMessages = await prisma.message.findMany({
    where: { conversationId: { in: patients.map((p) => p.id) } },
    orderBy: { createdAt: "desc" },
    distinct: ["conversationId"],
    select: {
      conversationId: true,
      content: true,
      senderType: true,
      createdAt: true,
    },
  });

  const lastMessageMap = Object.fromEntries(
    lastMessages.map((m) => [m.conversationId, m])
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messaggi"
        description="Conversazioni con i pazienti abilitati al portale."
      />

      {patients.length === 0 ? (
        <Card className="bg-white/[0.78]">
          <CardContent className="py-12 text-center">
            <MessageSquare className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Nessun paziente ha ancora accesso al portale.
              <br />
              Abilita il portale dalla pagina paziente per iniziare a
              comunicare.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white/[0.78]">
          <CardHeader>
            <CardTitle>Conversazioni</CardTitle>
            <CardDescription>
              {patients.length} pazient{patients.length === 1 ? "e" : "i"} con
              portale attivo
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {patients.map((patient) => {
                const unread = patient.messages.length;
                const lastMsg = lastMessageMap[patient.id];
                return (
                  <Link
                    key={patient.id}
                    href={`/messages/${patient.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-semibold text-sm">
                      {patient.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">{patient.name}</p>
                        {lastMsg && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {lastMsg.createdAt.toLocaleDateString("it-IT")}
                          </span>
                        )}
                      </div>
                      {lastMsg ? (
                        <p className="text-sm text-muted-foreground truncate">
                          {lastMsg.senderType === "professional" ? "Tu: " : ""}
                          {lastMsg.content}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Nessun messaggio
                        </p>
                      )}
                    </div>
                    {unread > 0 && (
                      <Badge className="shrink-0 bg-red-500 hover:bg-red-500 text-white">
                        {unread}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
