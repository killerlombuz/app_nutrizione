import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PendingLink } from "@/components/navigation/pending-link";
import { CalendarX2, ChevronRight } from "lucide-react";

export interface ExpiringPlan {
  id: string;
  name: string | null;
  date: Date;
  patientId: string;
  patientName: string;
}

interface ExpiringPlansWidgetProps {
  plans: ExpiringPlan[];
}

function daysAgo(date: Date): string {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  return `creato ${days} giorni fa`;
}

export function ExpiringPlansWidget({ plans }: ExpiringPlansWidgetProps) {
  if (plans.length === 0) {
    return (
      <Card className="bg-white/[0.78]">
        <CardHeader>
          <CardTitle>Piani in scadenza</CardTitle>
          <CardDescription>Tutti i piani sono aggiornati.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white/[0.78]">
      <CardHeader className="border-b border-border/40 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Piani in scadenza</CardTitle>
            <CardDescription>Piani attivi da oltre 30 giorni senza rinnovo.</CardDescription>
          </div>
          <CalendarX2 className="size-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="space-y-1">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="flex items-center justify-between gap-2 rounded-xl px-2 py-2 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{plan.patientName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {plan.name ?? "Piano dieta"} · {daysAgo(plan.date)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="xs"
                render={
                  <PendingLink
                    href={`/patients/${plan.patientId}/meal-plans/new`}
                    tone="button"
                    pendingLabel={`Nuovo piano per ${plan.patientName}`}
                  />
                }
              >
                Rinnova
                <ChevronRight className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
