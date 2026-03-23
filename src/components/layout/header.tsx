import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-6">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {user?.email}
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}
