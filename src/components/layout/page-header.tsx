import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-[2rem] bg-white/[0.7] px-6 py-6 shadow-[var(--shadow-soft)] ring-1 ring-black/5 backdrop-blur-sm lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[0.95rem]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-3">{action}</div> : null}
    </section>
  );
}
