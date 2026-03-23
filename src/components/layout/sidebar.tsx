"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/patients", label: "Pazienti", icon: "👥" },
  { href: "/foods", label: "Alimenti", icon: "🥗" },
  { href: "/recipes", label: "Ricette", icon: "📖" },
  { href: "/supplements", label: "Integratori", icon: "💊" },
  { href: "/instructions", label: "Istruzioni", icon: "📋" },
  { href: "/import", label: "Import Excel", icon: "📥" },
  { href: "/settings", label: "Impostazioni", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r bg-zinc-900 text-white">
      <div className="flex h-16 items-center gap-2 border-b border-zinc-700 px-6">
        <span className="text-xl">💚</span>
        <span className="text-lg font-semibold tracking-tight">NutriPlan</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
