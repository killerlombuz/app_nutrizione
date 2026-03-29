"use client";

import { usePathname } from "next/navigation";
import { PendingLink } from "@/components/navigation/pending-link";
import { cn } from "@/lib/utils";

type PatientSection = "overview" | "visits" | "meal-plans" | "timeline" | "notes" | "report";

interface PatientShellNavProps {
  patientId: string;
}

const SECTION_ITEMS: Array<{
  section: PatientSection;
  label: string;
  href: (patientId: string) => string;
  isActive: (pathname: string, basePath: string) => boolean;
}> = [
  {
    section: "overview",
    label: "Panoramica",
    href: (patientId) => `/patients/${patientId}`,
    isActive: (pathname, basePath) =>
      pathname === basePath || pathname === `${basePath}/edit`,
  },
  {
    section: "visits",
    label: "Visite",
    href: (patientId) => `/patients/${patientId}/visits`,
    isActive: (pathname, basePath) => pathname.startsWith(`${basePath}/visits`),
  },
  {
    section: "meal-plans",
    label: "Piani",
    href: (patientId) => `/patients/${patientId}/meal-plans`,
    isActive: (pathname, basePath) => pathname.startsWith(`${basePath}/meal-plans`),
  },
  {
    section: "timeline",
    label: "Timeline",
    href: (patientId) => `/patients/${patientId}/timeline`,
    isActive: (pathname, basePath) => pathname.startsWith(`${basePath}/timeline`),
  },
  {
    section: "notes",
    label: "Note",
    href: (patientId) => `/patients/${patientId}/notes`,
    isActive: (pathname, basePath) => pathname.startsWith(`${basePath}/notes`),
  },
  {
    section: "report",
    label: "Report",
    href: (patientId) => `/patients/${patientId}/report`,
    isActive: (pathname, basePath) => pathname.startsWith(`${basePath}/report`),
  },
];

export function PatientShellNav({ patientId }: PatientShellNavProps) {
  const pathname = usePathname();
  const basePath = `/patients/${patientId}`;

  return (
    <nav className="sticky top-4 z-20 overflow-x-auto rounded-[1.7rem] bg-white/[0.76] p-2 shadow-[var(--shadow-soft)] ring-1 ring-black/5 backdrop-blur-sm">
      <div className="flex min-w-max items-center gap-2">
        {SECTION_ITEMS.map((item) => {
          const href = item.href(patientId);
          const isActive = item.isActive(pathname, basePath);

          return (
            <PendingLink
              key={item.section}
              href={href}
              tone="button"
              aria-current={isActive ? "page" : undefined}
              pendingLabel={`Apro la sezione ${item.label.toLowerCase()}`}
              className={cn(
                "inline-flex items-center rounded-[1.2rem] px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-foreground text-background shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {item.label}
            </PendingLink>
          );
        })}
      </div>
    </nav>
  );
}
