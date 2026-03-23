"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ImportResult {
  foods: number;
  patients: number;
  measurements: number;
  recipes: number;
  instructions: number;
  errors: string[];
}

export default function ImportPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Errore ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore sconosciuto");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Import Excel</h1>
      <p className="text-muted-foreground">
        Importa dati dal foglio Excel del nutrizionista (formato .xlsx).
        Verranno importati: alimenti, paziente con misure, ricette e istruzioni
        dietetiche.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Carica File</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">File Excel (.xlsx)</Label>
              <Input
                id="file"
                name="file"
                type="file"
                accept=".xlsx,.xls"
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Importazione in corso...
                </span>
              ) : (
                "Importa"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Risultato Importazione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Alimenti</span>
              <span className="font-medium">{result.foods}</span>
              <span className="text-muted-foreground">Pazienti</span>
              <span className="font-medium">{result.patients}</span>
              <span className="text-muted-foreground">Misure</span>
              <span className="font-medium">{result.measurements}</span>
              <span className="text-muted-foreground">Ricette</span>
              <span className="font-medium">{result.recipes}</span>
              <span className="text-muted-foreground">Istruzioni</span>
              <span className="font-medium">{result.instructions}</span>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  Errori ({result.errors.length}):
                </p>
                <ul className="max-h-40 overflow-auto text-xs text-muted-foreground">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
