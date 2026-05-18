"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";
import type { BarState, SortingState } from "@/lib/algorithms/sorting-utils";

const BAR_COLORS: Record<BarState, string> = {
  default:   "bg-zinc-700 border-zinc-600",
  comparing: "bg-amber-500 border-amber-400",
  swapping:  "bg-rose-500 border-rose-400",
  sorted:    "bg-emerald-600 border-emerald-500",
  pivot:     "bg-violet-500 border-violet-400",
  active:    "bg-sky-500 border-sky-400",
  range:     "bg-indigo-800/60 border-indigo-700",
  left:      "bg-blue-500 border-blue-400",
  right:     "bg-orange-500 border-orange-400",
};

const LEGEND: { state: BarState; label: string }[] = [
  { state: "comparing", label: "Comparing" },
  { state: "swapping",  label: "Swapping"  },
  { state: "sorted",    label: "Sorted"    },
  { state: "pivot",     label: "Pivot"     },
  { state: "active",    label: "Active"    },
  { state: "left",      label: "Left half" },
  { state: "right",     label: "Right half"},
];

const MAX_BAR_HEIGHT = 160;

export function SortingVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const state = step.state as unknown as SortingState;
  const { array, states, comparisons, swaps, pass } = state;

  const maxVal = Math.max(...array, 1);

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="flex gap-6 text-sm">
        {[
          { label: "Comparisons", value: comparisons },
          { label: "Swaps",       value: swaps },
          ...(pass !== undefined ? [{ label: "Pass", value: pass }] : []),
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5">
            <span className="text-xs text-zinc-500">{label}</span>
            <span className="text-lg font-mono font-semibold text-zinc-100 tabular-nums">{value}</span>
          </div>
        ))}
      </div>

      {/* Bars */}
      <div className="flex items-end gap-2">
        {array.map((val, i) => {
          const height = Math.max(Math.round((val / maxVal) * MAX_BAR_HEIGHT), 12);
          const color = BAR_COLORS[states[i] ?? "default"];
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[10px] text-zinc-500 font-mono tabular-nums">{val}</span>
              <div
                className={`w-full rounded-t border transition-all duration-200 ${color}`}
                style={{ height: `${height}px` }}
              />
              <span className="text-[9px] text-zinc-700 font-mono">{i}</span>
            </div>
          );
        })}
      </div>

      {/* Legend — only show states that appear in this step */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-zinc-800">
        {LEGEND.filter(({ state }) => states.includes(state)).map(({ state, label }) => (
          <div key={state} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <div className={`w-3 h-3 rounded border ${BAR_COLORS[state]}`} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <div className={`w-3 h-3 rounded border ${BAR_COLORS.sorted}`} />
          Sorted
        </div>
      </div>
    </div>
  );
}
