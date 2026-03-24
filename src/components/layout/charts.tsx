import { cn } from "@/lib/utils";

interface BarDatum {
  label: string;
  value: number;
}

interface TrendDatum {
  label: string;
  primary: number | null;
  secondary?: number | null;
}

export function SparkBarChart({
  data,
  className,
}: {
  data: BarDatum[];
  className?: string;
}) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex h-36 items-end gap-3">
        {data.map((item) => {
          const height = Math.max(12, Math.round((item.value / max) * 100));

          return (
            <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-28 w-full items-end">
                <div
                  className="w-full rounded-t-[1rem] bg-[linear-gradient(180deg,rgba(16,185,129,0.9),rgba(11,122,85,0.65))]"
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function TrendLineChart({
  data,
  className,
}: {
  data: TrendDatum[];
  className?: string;
}) {
  const values = data.flatMap((item) =>
    [item.primary, item.secondary].filter(
      (value): value is number => value !== null && value !== undefined
    )
  );
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;
  const range = max - min || 1;
  const width = 720;
  const height = 180;
  const step = data.length > 1 ? width / (data.length - 1) : width;

  const getY = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return null;
    }

    return height - ((value - min) / range) * (height - 24) - 12;
  };

  const buildPoints = (key: "primary" | "secondary") =>
    data
      .map((item, index) => {
        const y = getY(item[key]);

        return y === null ? null : `${Math.round(index * step)},${Math.round(y)}`;
      })
      .filter(Boolean)
      .join(" ");

  const primaryPoints = buildPoints("primary");
  const secondaryPoints = buildPoints("secondary");

  return (
    <div className={cn("space-y-4", className)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full">
        {[0, 1, 2, 3].map((line) => {
          const y = 18 + line * 42;

          return (
            <line
              key={line}
              x1="0"
              x2={width}
              y1={y}
              y2={y}
              stroke="rgba(108,122,113,0.15)"
              strokeDasharray="4 8"
            />
          );
        })}
        {secondaryPoints ? (
          <polyline
            fill="none"
            points={secondaryPoints}
            stroke="rgba(59,130,246,0.9)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {primaryPoints ? (
          <polyline
            fill="none"
            points={primaryPoints}
            stroke="rgba(11,122,85,0.95)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {data.map((item, index) => {
          const x = Math.round(index * step);
          const y = getY(item.primary);

          if (y === null) {
            return null;
          }

          return (
            <circle
              key={`${item.label}-${index}`}
              cx={x}
              cy={y}
              r="4.5"
              fill="white"
              stroke="rgba(11,122,85,0.95)"
              strokeWidth="2"
            />
          );
        })}
      </svg>
      <div className="grid grid-cols-6 gap-2 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {data.map((item) => (
          <span key={item.label}>{item.label}</span>
        ))}
      </div>
    </div>
  );
}
