"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAuthenticatedUser, setIsAuthenticatedUser] = useState(false);
  const autoCompleteAttemptedRef = useRef(false);
  const router = useRouter();

  async function createProfessionalProfile(payload: {
    name: string;
    email: string;
    accessToken?: string;
  }) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(payload.accessToken
          ? { Authorization: `Bearer ${payload.accessToken}` }
          : {}),
      },
      body: JSON.stringify({
        name: payload.name,
        email: payload.email,
      }),
    });

    if (!res.ok) {
      const fallbackMessage =
        "Errore durante la creazione del profilo professionale";
      let errorMessage = fallbackMessage;

      try {
        const data = (await res.json()) as { error?: string };
        errorMessage = data.error || fallbackMessage;
      } catch {}

      throw new Error(errorMessage);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function restorePendingRegistration() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      const userName =
        typeof user.user_metadata?.name === "string"
          ? user.user_metadata.name
          : "";
      const userEmail = user.email ?? "";

      setIsAuthenticatedUser(true);
      setName((current) => current || userName);
      setEmail((current) => current || userEmail);

      if (autoCompleteAttemptedRef.current) return;
      autoCompleteAttemptedRef.current = true;

      setLoading(true);
      setError("");
      setMessage("Completo il profilo professionale...");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        await createProfessionalProfile({
          name: userName,
          email: userEmail,
          accessToken: session?.access_token,
        });

        if (cancelled) return;

        router.replace("/");
        router.refresh();
      } catch (err) {
        if (cancelled) return;

        setLoading(false);
        setMessage("");
        setError(
          err instanceof Error
            ? err.message
            : "Errore durante la creazione del profilo professionale"
        );
      }
    }

    void restorePendingRegistration();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    let accessToken: string | undefined;
    let resolvedName = name;
    let resolvedEmail = email;

    if (!isAuthenticatedUser) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, accountType: "professional" } },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      resolvedName =
        name ||
        (typeof data.user?.user_metadata?.name === "string"
          ? data.user.user_metadata.name
          : "") ||
        "Professionista";
      resolvedEmail = email || data.user?.email || "";
      accessToken = data.session?.access_token;

      if (!accessToken) {
        setMessage(
          "Account creato. Conferma l'email e accedi: il profilo professionale verra completato automaticamente."
        );
        setLoading(false);
        return;
      }
    } else {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      accessToken = session?.access_token;
    }

    try {
      await createProfessionalProfile({
        name: resolvedName,
        email: resolvedEmail,
        accessToken,
      });

      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Errore durante la creazione del profilo professionale"
      );
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mb-2 text-3xl">💚</div>
        <CardTitle className="text-2xl">NutriPlan</CardTitle>
        <CardDescription>Crea il tuo account professionale</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {message && (
            <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
              {message}
            </div>
          )}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dott.ssa Maria Rossi"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {!isAuthenticatedUser && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? isAuthenticatedUser
                ? "Completo profilo..."
                : "Registrazione..."
              : isAuthenticatedUser
                ? "Completa registrazione"
                : "Registrati"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Hai già un account?{" "}
            <Link href="/login" className="underline hover:text-primary">
              Accedi
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
