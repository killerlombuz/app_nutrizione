import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: "emerald" | "cobalt" | "amber" | "violet" | "ink";
  className?: string;
}

const toneClasses: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  emerald:
    "bg-[linear-gradient(135deg,rgba(16,185,129,0.16),rgba(255,255,255,0.92))] text-emerald-950",
  cobalt:
    "bg-[linear-gradient(135deg,rgba(59,130,246,0.14),rgba(255,255,255,0.92))] text-slate-950",
  amber:
    "bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(255,255,255,0.92))] text-amber-950",
  violet:
    "bg-[linear-gradient(135deg,rgba(139,92,246,0.16),rgba(255,255,255,0.92))] text-violet-950",
  ink: "bg-[linear-gradient(135deg,rgba(25,28,30,0.92),rgba(44,49,51,0.96))] text-white",
};

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "emerald",
  className,
}: MetricCardProps) {
  return (
    <article
      className={cn(
        "rounded-[1.75rem] px-5 py-5 shadow-[var(--shadow-soft)] ring-1 ring-black/5",
        toneClasses[tone],
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-current/65">
            {label}
          </p>
          <p className="font-heading text-3xl font-semibold tracking-[-0.04em]">
            {value}
          </p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-2xl bg-white/[0.7] text-current shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
          <Icon className="size-[18px]" />
        </span>
      </div>
      {hint ? <p className="mt-4 text-sm text-current/70">{hint}</p> : null}
    </article>
  );
}
