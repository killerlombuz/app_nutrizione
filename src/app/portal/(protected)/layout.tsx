import { getCurrentPatient } from "@/lib/supabase/patient-auth";
import { PortalNav } from "@/components/portal/portal-nav";
import { PortalLogoutButton } from "@/components/portal/portal-logout-button";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const patient = await getCurrentPatient();
  const professional = patient.professional;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="mx-auto max-w-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {professional.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={professional.logoUrl}
                alt={professional.name}
                className="size-8 rounded-full object-cover"
              />
            ) : (
              <div className="size-8 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                {professional.name[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-xs text-gray-500">Il tuo nutrizionista</p>
              <p className="text-sm font-semibold text-gray-900 leading-none">
                {professional.title
                  ? `${professional.title} ${professional.name}`
                  : professional.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-600">{patient.name}</span>
            <PortalLogoutButton />
          </div>
        </div>
        <div className="mx-auto max-w-3xl mt-3">
          <PortalNav />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>

      <footer className="mx-auto max-w-3xl px-4 py-8 text-center">
        <p className="text-xs text-gray-400">Powered by NutriPlan</p>
      </footer>
    </div>
  );
}
