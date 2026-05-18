"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface KadaneState {
  array: number[];
  index: number | null;
  currentStart: number;
  currentEnd: number;
  currentSum: number;
  bestStart: number;
  bestEnd: number;
  bestSum: number;
}

export function KadaneVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { array, index, currentStart, currentEnd, currentSum, bestStart, bestEnd, bestSum } =
    step.state as unknown as KadaneState;

  const getClass = (i: number) => {
    const isCurrent    = i === index;
    const inCurrent    = i >= currentStart && i <= currentEnd;
    const inBest       = i >= bestStart && i <= bestEnd;

    if (isCurrent)
      return "bg-amber-500/40 border-amber-500 text-amber-200 scale-110";
    if (inCurrent && inBest)
      return "bg-emerald-500/40 border-emerald-500 text-emerald-200";
    if (inCurrent)
      return "bg-indigo-500/30 border-indigo-500 text-indigo-200";
    if (inBest)
      return "bg-emerald-900/40 border-emerald-700 text-emerald-400";
    return "bg-zinc-800 border-zinc-700 text-zinc-400";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-indigo-800 bg-indigo-900/20 p-3">
          <div className="text-xs text-zinc-500 mb-1">Current window</div>
          <div className="font-mono text-sm text-indigo-300">
            [{currentStart}..{currentEnd}] = <span className="font-semibold text-indigo-200">{currentSum}</span>
          </div>
        </div>
        <div className="rounded-lg border border-emerald-800 bg-emerald-900/20 p-3">
          <div className="text-xs text-zinc-500 mb-1">Best so far</div>
          <div className="font-mono text-sm text-emerald-300">
            [{bestStart}..{bestEnd}] = <span className="font-semibold text-emerald-200">{bestSum}</span>
          </div>
        </div>
      </div>

      {/* Array */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {array.map((val, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={`w-10 h-10 flex items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-all duration-200 ${getClass(i)}`}>
              {val}
            </div>
            <span className="text-[9px] text-zinc-600 font-mono">{i}</span>
          </div>
        ))}
      </div>

      {/* Visual subarray brackets */}
      {currentEnd >= currentStart && (
        <div className="flex flex-col gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border bg-indigo-500/30 border-indigo-500 shrink-0" />
            <span className="text-zinc-400">Current: </span>
            <span className="text-indigo-300">[{array.slice(currentStart, currentEnd + 1).join(", ")}] = {currentSum}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border bg-emerald-900/40 border-emerald-700 shrink-0" />
            <span className="text-zinc-400">Best: </span>
            <span className="text-emerald-300">[{array.slice(bestStart, bestEnd + 1).join(", ")}] = {bestSum}</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Current index", cls: "bg-amber-500/40 border-amber-500" },
          { label: "Current window", cls: "bg-indigo-500/30 border-indigo-500" },
          { label: "Best subarray", cls: "bg-emerald-900/40 border-emerald-700" },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <div className={`w-3 h-3 rounded border ${cls}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
