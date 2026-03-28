"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpenText,
  Database,
  FileSpreadsheet,
  LayoutDashboard,
  Pill,
  Search,
  Settings2,
  Stethoscope,
  Users,
  UtensilsCrossed,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

const OPEN_COMMAND_PALETTE_EVENT = "nutriplan:open-command-palette";

type NavigationItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  searchTerms: string;
};

type PatientResult = {
  id: string;
  name: string;
  lastVisitDate: string | null;
};

type FoodResult = {
  id: string;
  name: string;
  category: string | null;
};

type RecipeResult = {
  id: string;
  name: string;
  kcalPerPortion: number | null;
};

const navigationItems: NavigationItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    searchTerms: "dashboard home",
  },
  {
    href: "/patients",
    label: "Pazienti",
    icon: Users,
    searchTerms: "pazienti clienti anagrafica",
  },
  {
    href: "/recipes",
    label: "Ricette",
    icon: BookOpenText,
    searchTerms: "ricette preparazioni",
  },
  {
    href: "/foods",
    label: "Alimenti",
    icon: Database,
    searchTerms: "alimenti database ingredienti",
  },
  {
    href: "/supplements",
    label: "Integratori",
    icon: Pill,
    searchTerms: "integratori supplementi",
  },
  {
    href: "/instructions",
    label: "Istruzioni",
    icon: Stethoscope,
    searchTerms: "istruzioni note indicazioni",
  },
  {
    href: "/import",
    label: "Import Excel",
    icon: FileSpreadsheet,
    searchTerms: "import excel csv",
  },
  {
    href: "/settings",
    label: "Impostazioni",
    icon: Settings2,
    searchTerms: "impostazioni profilo studio",
  },
];

type SearchResults = {
  patients: PatientResult[];
  foods: FoodResult[];
  recipes: RecipeResult[];
};

const emptyResults: SearchResults = {
  patients: [],
  foods: [],
  recipes: [],
};

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select"
  );
}

function formatDate(dateValue: string | null) {
  if (!dateValue) {
    return "Nessuna visita";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Nessuna visita";
  }

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatKcal(kcalPerPortion: number | null) {
  if (kcalPerPortion == null) {
    return "kcal non disponibili";
  }

  return `${Math.round(kcalPerPortion)} kcal/porzione`;
}

function formatFoodCategory(category: string | null) {
  if (!category) {
    return "Alimento";
  }

  return category
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function SearchResultRow({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof LayoutDashboard;
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <span className="flex size-9 items-center justify-center rounded-xl bg-muted/70 text-foreground">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {subtitle}
        </span>
      </span>
      <CommandShortcut>Enter</CommandShortcut>
    </>
  );
}

export function CommandPaletteTrigger({
  className,
}: {
  className?: string;
}) {
  function openPalette() {
    window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT));
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "hidden w-full max-w-md justify-start gap-3 px-4 text-left lg:inline-flex",
        className
      )}
      onClick={openPalette}
      aria-label="Cerca globale"
    >
      <Search className="size-4 text-muted-foreground" />
      <span className="flex-1 truncate text-sm font-normal text-muted-foreground">
        Cerca...
      </span>
      <span className="rounded-lg bg-muted/80 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Cmd+K
      </span>
    </Button>
  );
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function openPalette() {
      setOpen(true);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) {
        return;
      }

      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      event.preventDefault();
      setOpen(true);
    }

    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, openPalette);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, openPalette);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    const term = query.trim();

    if (term.length < 2) {
      setLoading(false);
      setResults(emptyResults);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setResults(emptyResults);

      try {
        const [foodsResponse, patientsResponse, recipesResponse] =
          await Promise.all([
            fetch(`/api/foods?q=${encodeURIComponent(term)}`, {
              signal: controller.signal,
            }),
            fetch(`/api/patients/search?q=${encodeURIComponent(term)}`, {
              signal: controller.signal,
            }),
            fetch(`/api/recipes/search?q=${encodeURIComponent(term)}`, {
              signal: controller.signal,
            }),
          ]);

        if (!foodsResponse.ok || !patientsResponse.ok || !recipesResponse.ok) {
          throw new Error("Failed to fetch command palette results");
        }

        const [foodsData, patientsData, recipesData] = (await Promise.all([
          foodsResponse.json(),
          patientsResponse.json(),
          recipesResponse.json(),
        ])) as [FoodResult[], PatientResult[], RecipeResult[]];

        if (!controller.signal.aborted) {
          setResults({
            foods: foodsData.slice(0, 5),
            patients: patientsData,
            recipes: recipesData,
          });
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults(emptyResults);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  const filteredNavigationItems = navigationItems.filter((item) => {
    const term = query.trim().toLowerCase();

    if (!term) {
      return true;
    }

    return `${item.label} ${item.searchTerms}`.toLowerCase().includes(term);
  });

  const hasDynamicResults =
    results.patients.length > 0 ||
    results.foods.length > 0 ||
    results.recipes.length > 0;

  const dynamicSearchEnabled = query.trim().length >= 2;

  return (
    <CommandDialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) {
          setQuery("");
          setResults(emptyResults);
          setLoading(false);
        }
      }}
      title="Cerca in NutriPlan"
      description="Cerca pazienti, alimenti, ricette e pagine di navigazione."
      className="sm:max-w-2xl"
      showCloseButton={false}
    >
      <div className="rounded-xl border border-border/50 bg-background shadow-[0_28px_70px_rgba(15,23,42,0.18)]">
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder="Cerca pazienti, alimenti, ricette o una pagina..."
          autoFocus
        />
        <CommandList className="max-h-[60vh] px-1 pb-1">
          {loading ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              Cerco in pazienti, alimenti e ricette...
            </div>
          ) : null}
          {!loading && (
            <CommandEmpty>
              {dynamicSearchEnabled
                ? `Nessun risultato per "${query.trim()}".`
                : "Nessun risultato disponibile."}
            </CommandEmpty>
          )}

          {filteredNavigationItems.length > 0 ? (
            <CommandGroup heading="Navigazione">
              {filteredNavigationItems.map((item) => {
                const Icon = item.icon;

                return (
                  <CommandItem
                    key={item.href}
                    value={`${item.label} ${item.searchTerms}`}
                    onSelect={() => {
                      setOpen(false);
                      router.push(item.href);
                    }}
                  >
                    <SearchResultRow
                      icon={Icon}
                      title={item.label}
                      subtitle={item.href === "/" ? "Dashboard principale" : item.href}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : null}

          {dynamicSearchEnabled ? (
            <>
              <CommandGroup heading="Pazienti">
                {results.patients.map((patient) => (
                  <CommandItem
                    key={patient.id}
                    value={patient.name}
                    onSelect={() => {
                      setOpen(false);
                      router.push(`/patients/${patient.id}`);
                    }}
                  >
                    <SearchResultRow
                      icon={Users}
                      title={patient.name}
                      subtitle={`Paziente - Ultima visita ${formatDate(
                        patient.lastVisitDate
                      )}`}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandGroup heading="Alimenti">
                {results.foods.map((food) => (
                  <CommandItem
                    key={food.id}
                    value={food.name}
                    onSelect={() => {
                      setOpen(false);
                      router.push(`/foods/${food.id}/edit`);
                    }}
                  >
                    <SearchResultRow
                      icon={UtensilsCrossed}
                      title={food.name}
                      subtitle={`Alimento - ${formatFoodCategory(food.category)}`}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>

              <CommandGroup heading="Ricette">
                {results.recipes.map((recipe) => (
                  <CommandItem
                    key={recipe.id}
                    value={recipe.name}
                    onSelect={() => {
                      setOpen(false);
                      router.push(`/recipes/${recipe.id}/edit`);
                    }}
                  >
                    <SearchResultRow
                      icon={BookOpenText}
                      title={recipe.name}
                      subtitle={`Ricetta - ${formatKcal(recipe.kcalPerPortion)}`}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}

          {!loading && dynamicSearchEnabled && !hasDynamicResults ? (
            <div className="px-3 pb-3 text-xs text-muted-foreground">
              Prova con un termine piu&apos; specifico per vedere risultati in pazienti,
              alimenti e ricette.
            </div>
          ) : null}
        </CommandList>
      </div>
    </CommandDialog>
  );
}
