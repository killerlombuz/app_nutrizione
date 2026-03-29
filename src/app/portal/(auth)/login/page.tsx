import { Suspense } from "react";
import { PortalLoginForm } from "@/components/portal/portal-login-form";

export default function PortalLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Suspense>
        <PortalLoginForm />
      </Suspense>
    </div>
  );
}
