"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { VariantProps } from "class-variance-authority";
import { LogOut } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  className?: string;
  size?: VariantProps<typeof buttonVariants>["size"];
  showLabel?: boolean;
}

export function LogoutButton({
  className,
  size = "sm",
  showLabel = true,
}: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size={size}
      className={cn(className)}
      onClick={handleLogout}
      aria-label="Esci"
    >
      <LogOut className="size-4" />
      {showLabel ? <span>Esci</span> : <span className="sr-only">Esci</span>}
    </Button>
  );
}
