import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { CommandPalette } from "@/components/layout/command-palette";
import { getCurrentProfessional } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const professional = await getCurrentProfessional();

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1720px]">
        <Sidebar
          professional={{
            name: professional.name,
            title: professional.title,
            email: professional.email,
          }}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            professional={{
              name: professional.name,
              title: professional.title,
              email: professional.email,
            }}
          />
          <CommandPalette />
          <main className="flex-1 px-4 pb-8 pt-5 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
