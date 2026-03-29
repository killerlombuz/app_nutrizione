"use client";

import { useTransition, useState } from "react";
import { Globe, GlobeLock } from "lucide-react";
import { togglePatientPortal } from "@/features/patients/portal-actions";
import { Button } from "@/components/ui/button";

export function PortalInviteButton({
  patientId,
  portalEnabled,
  hasEmail,
}: {
  patientId: string;
  portalEnabled: boolean;
  hasEmail: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleToggle() {
    setError("");
    startTransition(async () => {
      const result = await togglePatientPortal(patientId, !portalEnabled);
      if (result.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <Button
        variant={portalEnabled ? "outline" : "default"}
        size="sm"
        onClick={handleToggle}
        disabled={isPending || (!portalEnabled && !hasEmail)}
        className="gap-2"
      >
        {portalEnabled ? (
          <>
            <GlobeLock className="size-4" />
            Disabilita portale
          </>
        ) : (
          <>
            <Globe className="size-4" />
            Abilita portale
          </>
        )}
      </Button>
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
      {!hasEmail && !portalEnabled && (
        <p className="text-xs text-muted-foreground">
          Aggiungi un&apos;email al paziente per abilitare il portale.
        </p>
      )}
    </div>
  );
}
