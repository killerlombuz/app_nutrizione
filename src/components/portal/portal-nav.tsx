"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, MessageSquare, NotebookPen, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/portal/dashboard", label: "Home", icon: Home },
  { href: "/portal/plan", label: "Piano", icon: CalendarDays },
  { href: "/portal/progress", label: "Progressi", icon: TrendingUp },
  { href: "/portal/diary", label: "Diario", icon: NotebookPen },
  { href: "/portal/messages", label: "Messaggi", icon: MessageSquare },
] as const;

export function PortalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 flex-wrap">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-emerald-600 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
