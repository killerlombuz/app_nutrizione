"use client";

import Link, { useLinkStatus } from "next/link";
import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type PendingLinkTone = "button" | "text" | "panel" | "sidebar";

interface PendingLinkProps extends ComponentPropsWithoutRef<typeof Link> {
  tone?: PendingLinkTone;
  pendingLabel?: string;
}

function PendingLinkFeedback({
  tone,
  pendingLabel,
}: {
  tone: PendingLinkTone;
  pendingLabel: string;
}) {
  const { pending } = useLinkStatus();

  return (
    <>
      <span
        aria-hidden="true"
        data-tone={tone}
        className={cn("nav-feedback", pending && "is-pending")}
      >
        <span className="nav-feedback-sheen" />
        <span className="nav-feedback-bar" />
        <span className="nav-feedback-dot" />
      </span>
      <span aria-live="polite" role="status" className="sr-only">
        {pending ? pendingLabel : ""}
      </span>
    </>
  );
}

export const PendingLink = forwardRef<HTMLAnchorElement, PendingLinkProps>(
  function PendingLink(
    {
      className,
      children,
      tone = "text",
      pendingLabel = "Navigazione in corso",
      ...props
    },
    ref
  ) {
    return (
      <Link
        ref={ref}
        className={cn(
          "group/pending-link relative isolate transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-[var(--motion-duration-medium)] ease-[var(--motion-ease-standard)] active:translate-y-px",
          className
        )}
        {...props}
      >
        {children}
        <PendingLinkFeedback tone={tone} pendingLabel={pendingLabel} />
      </Link>
    );
  }
);

PendingLink.displayName = "PendingLink";
