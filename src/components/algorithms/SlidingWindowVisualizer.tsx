"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface SlidingWindowMaxState {
  array: number[];
  k: number;
  deque: number[];
  windowStart: number;
  windowEnd: number;
  result: number[];
  current: number | null;
  phase: "processing" | "done";
}

export function SlidingWindowVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { array, k, deque, windowStart, windowEnd, result, current, phase } =
    step.state as unknown as SlidingWindowMaxState;

  const getClass = (i: number) => {
    if (i === current)
      return "bg-amber-500/40 border-amber-500 text-amber-200 scale-110";
    if (deque.length > 0 && i === deque[0])
      return "bg-emerald-500/30 border-emerald-500 text-emerald-200";
    if (deque.includes(i))
      return "bg-indigo-500/30 border-indigo-500 text-indigo-200";
    if (i >= windowStart && i <= windowEnd)
      return "bg-zinc-700/60 border-zinc-600 text-zinc-300";
    return "bg-zinc-800 border-zinc-700 text-zinc-500";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Info */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Window size k</span>
          <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono font-semibold text-sm">{k}</span>
        </div>
        {windowEnd >= 0 && windowEnd >= windowStart && (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-500">Window:</span>
            <span className="text-indigo-300">[{windowStart}..{windowEnd}]</span>
          </div>
        )}
      </div>

      {/* Array */}
      <div className="flex gap-1.5 flex-wrap">
        {array.map((val, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={`w-10 h-10 flex items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-all duration-200 ${getClass(i)}`}>
              {val}
            </div>
            <span className="text-[9px] text-zinc-600 font-mono">{i}</span>
          </div>
        ))}
      </div>

      {/* Deque */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Monotonic deque (indices → values)</span>
        {deque.length === 0 ? (
          <span className="text-xs text-zinc-600 italic">empty</span>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-600 text-xs font-mono">front →</span>
            {deque.map((idx, pos) => (
              <div key={pos} className={`flex flex-col items-center px-2.5 py-1.5 rounded-lg border font-mono text-xs transition-all duration-200 ${
                pos === 0
                  ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                  : "bg-indigo-900/30 border-indigo-700 text-indigo-300"
              }`}>
                <span className="text-[9px] text-zinc-500">idx {idx}</span>
                <span className="font-semibold">{array[idx]}</span>
              </div>
            ))}
            <span className="text-zinc-600 text-xs font-mono">← back</span>
          </div>
        )}
      </div>

      {/* Result */}
      {result.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Window maximums</span>
          <div className="flex gap-1.5 flex-wrap">
            {result.map((val, i) => (
              <div key={i} className="w-10 h-10 flex items-center justify-center rounded-lg border bg-emerald-900/30 border-emerald-700 font-mono text-sm font-semibold text-emerald-300">
                {val}
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="rounded-xl border border-emerald-800 bg-emerald-900/20 px-4 py-3 text-sm font-mono text-emerald-300">
          Result: [<span className="font-bold text-emerald-200">{result.join(", ")}</span>]
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Processing",    cls: "bg-amber-500/40 border-amber-500" },
          { label: "Deque front",   cls: "bg-emerald-500/30 border-emerald-500" },
          { label: "In deque",      cls: "bg-indigo-500/30 border-indigo-500" },
          { label: "In window",     cls: "bg-zinc-700/60 border-zinc-600" },
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
