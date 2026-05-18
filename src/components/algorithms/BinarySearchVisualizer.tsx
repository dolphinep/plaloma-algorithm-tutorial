"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

const HIGHLIGHT_COLORS: Record<string, string> = {
  active: "bg-indigo-500/30 border-indigo-500 text-indigo-300",
  compare: "bg-amber-500/30 border-amber-500 text-amber-200 scale-110",
  found: "bg-emerald-500/30 border-emerald-500 text-emerald-200 scale-110",
  sorted: "bg-zinc-700/50 border-zinc-600 text-zinc-400 opacity-50",
};

export function BinarySearchVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];

  if (!step) return null;

  const { array, left, right, mid, target } = step.state as {
    array: number[];
    target: number;
    left: number;
    right: number;
    mid: number | null;
    found: number | null;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Target badge */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Target</span>
        <span className="px-3 py-1 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-sm font-mono font-semibold">
          {target}
        </span>
      </div>

      {/* Array visualization */}
      <div className="flex items-end gap-1.5 flex-wrap">
        {array.map((val, i) => {
          const highlight = step.highlights[i];
          const colorClass = highlight ? HIGHLIGHT_COLORS[highlight] : "bg-zinc-800 border-zinc-700 text-zinc-300";
          const isLeft = i === left;
          const isRight = i === right;
          const isMid = i === mid;

          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              {/* Pointer labels */}
              <div className="flex gap-0.5 h-5 text-[10px] font-mono">
                {isLeft && <span className="text-indigo-400 font-bold">L</span>}
                {isMid && <span className="text-amber-400 font-bold">M</span>}
                {isRight && <span className="text-indigo-400 font-bold">R</span>}
              </div>

              {/* Cell */}
              <div
                className={`
                  w-10 h-10 flex items-center justify-center
                  rounded-lg border font-mono text-sm font-semibold
                  transition-all duration-300
                  ${colorClass}
                `}
              >
                {val}
              </div>

              {/* Index */}
              <span className="text-[10px] text-zinc-600 font-mono">{i}</span>
            </div>
          );
        })}
      </div>

      {/* Variables table */}
      {step.variables && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(step.variables).map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5 text-xs font-mono">
              <span className="text-zinc-500">{k}</span>
              <span className="text-zinc-200">=</span>
              <span className="text-amber-300">{String(v)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Search bounds", color: "bg-indigo-500/30 border-indigo-500" },
          { label: "Mid (comparing)", color: "bg-amber-500/30 border-amber-500" },
          { label: "Found", color: "bg-emerald-500/30 border-emerald-500" },
          { label: "Eliminated", color: "bg-zinc-700/50 border-zinc-600 opacity-50" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <div className={`w-3 h-3 rounded border ${color}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
