import Link from "next/link";
import { Bell, Search, Settings2 } from "lucide-react";
import { LogoutButton } from "./logout-button";
import { MobileSidebar } from "./sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  professional: {
    name: string;
    title?: string | null;
    email: string;
  };
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export async function Header({ professional }: HeaderProps) {
  const today = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <MobileSidebar professional={professional} />

        <div className="hidden min-w-0 flex-1 items-center lg:flex">
          <form action="/patients" className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Cerca paziente..."
              className="pl-10"
            />
          </form>
        </div>

        <div className="min-w-0 flex-1 lg:hidden">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {today}
          </p>
          <p className="truncate font-heading text-lg font-semibold tracking-[-0.03em]">
            {professional.name}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon-sm" className="hidden sm:inline-flex">
            <Bell className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href="/settings" aria-label="Apri impostazioni" />}
            className="hidden sm:inline-flex"
          >
            <Settings2 className="size-4" />
          </Button>
          <div className="hidden items-center gap-3 rounded-[1.4rem] bg-white/[0.7] px-3 py-2 shadow-[var(--shadow-soft)] ring-1 ring-black/5 sm:flex">
            <div className="text-right">
              <p className="text-sm font-semibold">{professional.name}</p>
              <p className="max-w-[16rem] truncate text-xs text-muted-foreground">
                {professional.email}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0b7a55,#10b981)] font-semibold text-white">
              {getInitials(professional.name)}
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
