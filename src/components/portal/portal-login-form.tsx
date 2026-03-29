"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { FlaskConical, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  link_non_valido: "Il link non è valido. Richiedine uno nuovo.",
  sessione_non_valida: "Sessione non valida. Riprova.",
  accesso_non_autorizzato:
    "Accesso non autorizzato. Contatta il tuo nutrizionista.",
};

export function PortalLoginForm() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(urlError ? ERROR_MESSAGES[urlError] ?? urlError : "");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // NOTA: aggiungere l'URL dell'app in "Redirect URLs" nelle impostazioni Supabase
        emailRedirectTo: `${window.location.origin}/portal/auth/callback`,
        shouldCreateUser: true,
      },
    });

    if (otpError) {
      setError("Impossibile inviare il link. Riprova tra qualche istante.");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg mb-4">
          <FlaskConical className="size-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Portale Paziente</h1>
        <p className="text-sm text-gray-500 mt-1">NutriPlan</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {sent ? (
          <div className="text-center space-y-4">
            <div className="inline-flex size-12 items-center justify-center rounded-full bg-emerald-100">
              <Mail className="size-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Controlla la tua email</p>
              <p className="text-sm text-gray-500 mt-1">
                Abbiamo inviato un link di accesso a{" "}
                <span className="font-medium text-gray-700">{email}</span>.
                Clicca il link per accedere al portale.
              </p>
            </div>
            <button
              onClick={() => {
                setSent(false);
                setEmail("");
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 underline"
            >
              Usa un&apos;altra email
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Accedi al portale
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Inserisci la tua email per ricevere un link di accesso.
            </p>

            {error && (
              <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="la-tua@email.com"
                  required
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Invio in corso..." : "Ricevi link di accesso"}
              </button>
            </form>
          </>
        )}
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        Accesso riservato ai pazienti invitati dal proprio nutrizionista.
      </p>
    </div>
  );
}
