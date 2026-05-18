"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface LinearSearchState {
  array: number[];
  target: number;
  current: number | null;
  found: number | null;
}

export function LinearSearchVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { array, target, current, found } = step.state as unknown as LinearSearchState;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Target</span>
        <span className="px-3 py-1 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-sm font-mono font-semibold">
          {target}
        </span>
      </div>

      <div className="flex items-end gap-1.5 flex-wrap">
        {array.map((val, i) => {
          const isCurrent = i === current && found === null;
          const isFound   = i === found;
          const isPast    = current !== null && i < current && found === null;

          const cellClass = isFound
            ? "bg-emerald-500/30 border-emerald-500 text-emerald-200 scale-110"
            : isCurrent
            ? "bg-amber-500/30 border-amber-500 text-amber-200 scale-110"
            : isPast
            ? "bg-zinc-800/50 border-zinc-700 text-zinc-500 opacity-60"
            : "bg-zinc-800 border-zinc-700 text-zinc-300";

          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="h-4 text-[10px] font-mono text-zinc-600">
                {isCurrent && "▼"}
              </div>
              <div className={`w-10 h-10 flex items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-all duration-200 ${cellClass}`}>
                {val}
              </div>
              <span className="text-[10px] text-zinc-600 font-mono">{i}</span>
            </div>
          );
        })}
      </div>

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

      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Current check", cls: "bg-amber-500/30 border-amber-500" },
          { label: "Found",         cls: "bg-emerald-500/30 border-emerald-500" },
          { label: "Checked",       cls: "bg-zinc-800/50 border-zinc-700 opacity-60" },
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
