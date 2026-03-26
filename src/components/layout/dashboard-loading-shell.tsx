import { cn } from "@/lib/utils";

function SkeletonBlock({
  className,
  decorative = false,
}: {
  className?: string;
  decorative?: boolean;
}) {
  return (
    <div
      aria-hidden={decorative ? "true" : undefined}
      className={cn("skeleton-block rounded-[inherit]", className)}
    />
  );
}

export function DashboardLoadingShell() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Caricamento della pagina in corso</span>

      <section className="flex flex-col gap-4 rounded-[2rem] bg-white/[0.7] px-6 py-6 shadow-[var(--shadow-soft)] ring-1 ring-black/5 backdrop-blur-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full space-y-3">
          <SkeletonBlock className="h-3 w-28 rounded-full" decorative />
          <SkeletonBlock className="h-11 max-w-[26rem] rounded-2xl" decorative />
          <SkeletonBlock className="h-4 max-w-3xl rounded-full" decorative />
          <SkeletonBlock className="h-4 max-w-2xl rounded-full" decorative />
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <SkeletonBlock className="h-10 w-36 rounded-2xl" decorative />
          <SkeletonBlock className="h-10 w-40 rounded-2xl" decorative />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-[1.75rem] bg-white/[0.74] px-5 py-5 shadow-[var(--shadow-soft)] ring-1 ring-black/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="w-full space-y-3">
                <SkeletonBlock className="h-3 w-24 rounded-full" decorative />
                <SkeletonBlock className="h-9 w-28 rounded-2xl" decorative />
              </div>
              <SkeletonBlock className="size-10 rounded-2xl" decorative />
            </div>
            <SkeletonBlock className="mt-5 h-4 w-40 rounded-full" decorative />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_360px]">
        <div className="rounded-[1.75rem] bg-white/[0.78] shadow-[var(--shadow-soft)] ring-1 ring-black/5">
          <div className="border-b border-border/40 px-6 pb-4 pt-6">
            <div className="flex items-center justify-between gap-3">
              <div className="w-full space-y-3">
                <SkeletonBlock className="h-6 w-44 rounded-full" decorative />
                <SkeletonBlock className="h-4 w-72 rounded-full" decorative />
              </div>
              <SkeletonBlock className="h-9 w-28 rounded-2xl" decorative />
            </div>
          </div>
          <div className="space-y-3 px-6 py-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="grid gap-3 rounded-[1.45rem] bg-[var(--surface-low)] px-4 py-4 sm:grid-cols-[minmax(0,1.2fr)_120px_140px]"
              >
                <div className="space-y-2">
                  <SkeletonBlock className="h-5 w-40 rounded-full" decorative />
                  <SkeletonBlock className="h-4 w-24 rounded-full" decorative />
                </div>
                <SkeletonBlock className="h-4 w-24 rounded-full self-center" decorative />
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <SkeletonBlock className="h-4 w-20 rounded-full" decorative />
                  <SkeletonBlock className="size-4 rounded-full" decorative />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[1.75rem] bg-white/[0.72] px-6 py-6 shadow-[var(--shadow-soft)] ring-1 ring-black/5">
            <div className="space-y-3">
              <SkeletonBlock className="h-6 w-40 rounded-full" decorative />
              <SkeletonBlock className="h-4 w-52 rounded-full" decorative />
            </div>
            <div className="mt-6 flex h-40 items-end gap-3">
              {["h-12", "h-16", "h-20", "h-24", "h-28", "h-32"].map((height) => (
                <SkeletonBlock
                  key={height}
                  className={cn("w-full rounded-[1rem]", height)}
                  decorative
                />
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] bg-[linear-gradient(135deg,rgba(25,28,30,0.92),rgba(44,49,51,0.96))] px-5 py-5 shadow-[var(--shadow-soft)] ring-1 ring-black/5">
            <SkeletonBlock className="h-3 w-24 rounded-full bg-white/12" decorative />
            <SkeletonBlock className="mt-3 h-10 w-16 rounded-2xl bg-white/16" decorative />
            <SkeletonBlock className="mt-5 h-4 w-44 rounded-full bg-white/12" decorative />
          </div>
        </div>
      </div>
    </div>
  );
}
