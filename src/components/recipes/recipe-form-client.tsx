"use client";

import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecipeFormProps } from "@/components/recipes/recipe-form";

const RecipeForm = dynamic(
  () => import("@/components/recipes/recipe-form").then((mod) => mod.RecipeForm),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle>Caricamento ricetta</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Sto preparando l&apos;editor della ricetta.
          </p>
        </CardContent>
      </Card>
    ),
  }
);

export function RecipeFormClient(props: RecipeFormProps) {
  return <RecipeForm {...props} />;
}
