import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PendingLink } from "@/components/navigation/pending-link";
import { ChevronRight, UserCheck } from "lucide-react";

export interface PatientFollowUp {
  id: string;
  name: string;
  lastVisit: Date | null;
}

interface FollowUpWidgetProps {
  patients: PatientFollowUp[];
}

function daysSince(date: Date | null): string {
  if (!date) return "Nessuna visita";
  const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "oggi";
  if (days === 1) return "ieri";
  return `${days} giorni fa`;
}

export function FollowUpWidget({ patients }: FollowUpWidgetProps) {
  if (patients.length === 0) {
    return (
      <Card className="bg-white/[0.78]">
        <CardHeader>
          <CardTitle>Pazienti da ricontattare</CardTitle>
          <CardDescription>Tutti i pazienti sono stati visitati di recente.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white/[0.78]">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Pazienti da ricontattare</CardTitle>
            <CardDescription>Ultima visita oltre 30 giorni fa.</CardDescription>
          </div>
          <UserCheck className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="space-y-1">
          {patients.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{daysSince(p.lastVisit)}</p>
              </div>
              <Button
                variant="ghost"
                size="xs"
                render={
                  <PendingLink
                    href={`/patients/${p.id}/visits/new`}
                    tone="button"
                    pendingLabel={`Nuova visita per ${p.name}`}
                  />
                }
              >
                Visita
                <ChevronRight className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
