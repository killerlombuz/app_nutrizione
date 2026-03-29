"use client";

import { usePathname } from "next/navigation";
import {
  BookOpenText,
  CalendarDays,
  ChevronRight,
  Database,
  FileSpreadsheet,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Pill,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PendingLink } from "@/components/navigation/pending-link";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/layout/logout-button";

interface ProfessionalSummary {
  name: string;
  title?: string | null;
  email: string;
}

const navGroups = [
  {
    label: "Dashboard",
    items: [
      { href: "/", label: "Centro operativo", icon: LayoutDashboard },
    ],
  },
  {
    label: "Pazienti",
    items: [
      { href: "/patients", label: "Cartelle cliniche", icon: Users },
      { href: "/calendar", label: "Agenda", icon: CalendarDays },
    ],
  },
  {
    label: "Libreria clinica",
    items: [
      { href: "/foods", label: "Alimenti", icon: Database },
      { href: "/recipes", label: "Ricette", icon: BookOpenText },
      { href: "/supplements", label: "Integratori", icon: Pill },
      { href: "/instructions", label: "Istruzioni", icon: Stethoscope },
    ],
  },
  {
    label: "Strumenti",
    items: [{ href: "/import", label: "Import Excel", icon: FileSpreadsheet }],
  },
  {
    label: "Impostazioni",
    items: [{ href: "/settings", label: "Profilo e workspace", icon: Settings }],
  },
] as const;

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function SidebarNavItem({
  href,
  label,
  icon: Icon,
  isActive,
  closeOnNavigate = false,
}: {
  href: string;
  label: string;
  icon: (typeof navGroups)[number]["items"][number]["icon"];
  isActive: boolean;
  closeOnNavigate?: boolean;
}) {
  const link = (
    <PendingLink
      href={href}
      tone="sidebar"
      pendingLabel={`Apro ${label}`}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-[var(--motion-duration-medium)] ease-[var(--motion-ease-standard)]",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "text-sidebar-foreground/70 hover:bg-white/[0.06] hover:text-sidebar-foreground"
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-xl transition-colors duration-[var(--motion-duration-medium)]",
          isActive ? "bg-white/10" : "bg-white/5"
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="flex-1">{label}</span>
      {isActive ? <ChevronRight className="size-4 opacity-70" /> : null}
    </PendingLink>
  );

  if (!closeOnNavigate) {
    return link;
  }

  return <SheetClose render={link} />;
}

function SidebarContent({
  professional,
  closeOnNavigate = false,
}: {
  professional: ProfessionalSummary;
  closeOnNavigate?: boolean;
}) {
  const pathname = usePathname();
  const settingsLink = (
    <PendingLink
      href="/settings"
      tone="sidebar"
      pendingLabel="Apro le impostazioni"
      className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-white/[0.08] hover:text-sidebar-foreground"
    >
      <Settings className="size-4" />
      Impostazioni
    </PendingLink>
  );

  return (
    <div className="flex h-full flex-col rounded-[2rem] bg-sidebar px-4 py-5 text-sidebar-foreground shadow-[0_26px_55px_rgba(0,0,0,0.28)]">
      <div className="border-b border-sidebar-border px-2 pb-5">
        <PendingLink href="/" tone="sidebar" pendingLabel="Apro la dashboard" className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#10b981,#0b7a55)] shadow-[0_10px_25px_rgba(16,185,129,0.24)]">
            <FlaskConical className="size-5 text-white" />
          </span>
          <div>
            <p className="font-heading text-lg font-semibold tracking-[-0.03em]">
              NutriPlan
            </p>
            <p className="text-[0.62rem] uppercase tracking-[0.24em] text-sidebar-foreground/55">
              Clinical Atelier
            </p>
          </div>
        </PendingLink>
      </div>

      <nav className="flex-1 space-y-7 overflow-y-auto px-2 py-6">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-2">
            <p className="px-3 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-sidebar-foreground/45">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

                return (
                  <SidebarNavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    icon={item.icon}
                    isActive={isActive}
                    closeOnNavigate={closeOnNavigate}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border pt-5">
        <div className="rounded-[1.65rem] bg-white/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-white/10 font-semibold">
              {getInitials(professional.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{professional.name}</p>
              <p className="truncate text-xs text-sidebar-foreground/55">
                {professional.title || "Area professionale"}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="mt-4 border-white/10 bg-white/5 text-sidebar-foreground/80"
          >
            Workspace Clinico
          </Badge>
          <div className="mt-4 flex items-center gap-2 lg:hidden">
            {closeOnNavigate ? <SheetClose render={settingsLink} /> : settingsLink}
            <LogoutButton className="flex-1 border-white/10 bg-white/5 text-sidebar-foreground hover:bg-white/[0.08] hover:text-sidebar-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ professional }: { professional: ProfessionalSummary }) {
  return (
    <aside className="hidden h-screen lg:block">
      <div className="sticky top-0 h-screen p-4 pr-0">
        <div className="h-full w-[280px]">
          <SidebarContent professional={professional} />
        </div>
      </div>
    </aside>
  );
}

export function MobileSidebar({ professional }: { professional: ProfessionalSummary }) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            className="lg:hidden"
            aria-label="Apri menu"
          />
        }
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[88vw] max-w-none border-r-0 bg-transparent p-3 shadow-none sm:max-w-none"
        showCloseButton={false}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navigazione</SheetTitle>
        </SheetHeader>
        <SidebarContent professional={professional} closeOnNavigate />
      </SheetContent>
    </Sheet>
  );
}
