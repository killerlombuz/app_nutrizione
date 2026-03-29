"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import QRCode from "qrcode";
import { LinkIcon, RefreshCwIcon, Trash2Icon, CopyIcon, CheckIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { regenerateShareToken, revokeShareToken } from "@/features/meal-plans/actions";

interface ShareDialogProps {
  patientId: string;
  planId: string;
  shareToken: string | null;
}

export function ShareDialog({
  patientId,
  planId,
  shareToken: initialToken,
}: ShareDialogProps) {
  const [token, setToken] = useState(initialToken);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const shareUrl = token
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/shared/plan/${token}`
    : null;

  useEffect(() => {
    if (!shareUrl) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(shareUrl, { width: 200, margin: 2 }).then(setQrDataUrl);
  }, [shareUrl]);

  function handleCopy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleRegenerate() {
    startTransition(async () => {
      const newToken = await regenerateShareToken(patientId, planId);
      setToken(newToken ?? null);
    });
  }

  function handleRevoke() {
    startTransition(async () => {
      await revokeShareToken(patientId, planId);
      setToken(null);
    });
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline">
            <LinkIcon />
            Condividi
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Condividi Piano</DialogTitle>
        </DialogHeader>

        {token ? (
          <div className="space-y-4">
            {/* URL */}
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={shareUrl ?? ""}
                className="flex-1 min-w-0 rounded-xl border border-border/70 bg-muted/40 px-3 py-2 text-sm font-mono text-muted-foreground truncate outline-none"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                disabled={isPending}
                aria-label="Copia link"
              >
                {copied ? <CheckIcon className="text-green-600" /> : <CopyIcon />}
              </Button>
            </div>

            {/* QR code */}
            {qrDataUrl && (
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR code link piano dieta"
                  className="rounded-xl border border-border/50"
                  width={160}
                  height={160}
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isPending}
                className="flex-1"
              >
                <RefreshCwIcon />
                Rigenera link
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRevoke}
                disabled={isPending}
                className="flex-1"
              >
                <Trash2Icon />
                Revoca accesso
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-center py-2">
            <p className="text-sm text-muted-foreground">
              Il link condivisibile e&apos; stato revocato.
              <br />
              Genera un nuovo link per condividere il piano.
            </p>
            <Button
              onClick={handleRegenerate}
              disabled={isPending}
            >
              <LinkIcon />
              Genera link
            </Button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
