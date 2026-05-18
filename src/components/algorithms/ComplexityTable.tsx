import type { ComplexityInfo } from "@/types/algorithm";

interface Props {
  complexity: ComplexityInfo;
}

const complexityColor = (val: string) => {
  if (val.includes("1")) return "text-emerald-400";
  if (val.includes("log")) return "text-green-400";
  if (val.includes("n log") || val.includes("n²") === false && val.includes("n")) return "text-yellow-400";
  if (val.includes("n²") || val.includes("n³")) return "text-red-400";
  return "text-zinc-300";
};

export function ComplexityTable({ complexity }: Props) {
  const badges: { label: string; show: boolean }[] = [
    { label: "Stable", show: !!complexity.stable },
    { label: "In-place", show: !!complexity.inPlace },
    { label: "Online", show: !!complexity.online },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Best case", value: complexity.time.best },
          { label: "Average case", value: complexity.time.average },
          { label: "Worst case", value: complexity.time.worst },
          { label: "Space", value: complexity.space },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
            <div className="text-xs text-zinc-500 mb-1">{label}</div>
            <div className={`font-mono text-base font-semibold ${complexityColor(value)}`}>{value}</div>
          </div>
        ))}
      </div>

      {badges.some((b) => b.show) && (
        <div className="flex gap-2 flex-wrap">
          {badges
            .filter((b) => b.show)
            .map(({ label }) => (
              <span
                key={label}
                className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300"
              >
                {label}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
