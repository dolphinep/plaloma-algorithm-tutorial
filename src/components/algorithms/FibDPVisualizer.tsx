"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface FibDPState {
  n: number;
  table: (number | null)[];
  current: number | null;
  dep1: number | null;
  dep2: number | null;
}

export function FibDPVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { n, table, current, dep1, dep2 } = step.state as unknown as FibDPState;

  return (
    <div className="flex flex-col gap-6">
      {/* Table label */}
      <div className="text-xs text-zinc-500 uppercase tracking-wider">DP Table — F(0) to F({n})</div>

      {/* Index row */}
      <div className="flex flex-col gap-2 overflow-x-auto">
        <div className="flex gap-1.5">
          {table.map((_, i) => (
            <div key={i} className="w-12 shrink-0 text-center text-[10px] text-zinc-600 font-mono">
              F({i})
            </div>
          ))}
        </div>

        {/* Value cells */}
        <div className="flex gap-1.5">
          {table.map((val, i) => {
            const isCurrent = i === current;
            const isDep     = i === dep1 || i === dep2;
            const isFilled  = val !== null;

            const cellClass = isCurrent
              ? "bg-indigo-500/30 border-indigo-500 text-indigo-200"
              : isDep
              ? "bg-amber-500/30 border-amber-500 text-amber-200"
              : isFilled
              ? "bg-emerald-900/40 border-emerald-800 text-emerald-300"
              : "bg-zinc-900 border-zinc-800 text-zinc-700";

            return (
              <div
                key={i}
                className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-all duration-200 ${cellClass}`}
              >
                {val !== null ? val : "?"}
              </div>
            );
          })}
        </div>

        {/* Dependency arrows */}
        {current !== null && dep1 !== null && dep2 !== null && (
          <div className="relative h-6">
            {[dep1, dep2].map((d) => {
              const cellWidth = 48 + 6; // w-12 + gap-1.5
              const arrowX = d * cellWidth + 24; // center of cell
              return (
                <div
                  key={d}
                  className="absolute top-0 flex flex-col items-center"
                  style={{ left: `${arrowX}px`, transform: "translateX(-50%)" }}
                >
                  <div className="w-px h-3 bg-amber-500/60" />
                  <div className="text-amber-400 text-[10px]">▲</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Formula */}
      {current !== null && current >= 2 && dep1 !== null && dep2 !== null && (
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="text-indigo-400">F({current})</span>
          <span className="text-zinc-500">=</span>
          <span className="text-amber-400">F({dep1})</span>
          <span className="text-zinc-500">+</span>
          <span className="text-amber-400">F({dep2})</span>
          {table[dep1] !== null && table[dep2] !== null && (
            <>
              <span className="text-zinc-500">=</span>
              <span className="text-amber-300">{table[dep1]}</span>
              <span className="text-zinc-500">+</span>
              <span className="text-amber-300">{table[dep2]}</span>
              <span className="text-zinc-500">=</span>
              <span className="text-emerald-400 font-bold">{(table[dep1] ?? 0) + (table[dep2] ?? 0)}</span>
            </>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Computing",    cls: "bg-indigo-500/30 border-indigo-500" },
          { label: "Dependencies", cls: "bg-amber-500/30 border-amber-500" },
          { label: "Computed",     cls: "bg-emerald-900/40 border-emerald-800" },
          { label: "Unknown",      cls: "bg-zinc-900 border-zinc-800" },
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
