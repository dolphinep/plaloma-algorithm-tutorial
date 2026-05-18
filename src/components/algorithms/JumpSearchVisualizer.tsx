"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface JumpSearchState {
  array: number[];
  target: number;
  blockSize: number;
  blockStart: number;
  blockEnd: number;
  current: number | null;
  found: number | null;
  phase: "jumping" | "linear" | "done";
}

export function JumpSearchVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { array, target, blockSize, blockStart, blockEnd, current, found, phase } =
    step.state as unknown as JumpSearchState;

  const getClass = (i: number) => {
    if (found !== null && i === found)
      return "bg-emerald-500/40 border-emerald-500 text-emerald-200 scale-110";
    if (i === current)
      return "bg-amber-500/40 border-amber-500 text-amber-200 scale-110";
    if (phase === "linear" && i >= blockStart && i <= blockEnd)
      return "bg-violet-500/20 border-violet-600 text-violet-300";
    if (i >= blockStart && i <= blockEnd)
      return "bg-indigo-500/20 border-indigo-600 text-indigo-300";
    return "bg-zinc-800 border-zinc-700 text-zinc-400";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Info row */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Target</span>
          <span className="px-3 py-1 rounded-full bg-amber-600/20 border border-amber-500/40 text-amber-300 font-mono font-semibold text-sm">{target}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Block size</span>
          <span className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-mono text-sm">√{array.length} ≈ {blockSize}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Phase</span>
          <span className={`px-3 py-1 rounded-full border font-mono text-xs ${
            phase === "jumping" ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" :
            phase === "linear"  ? "bg-violet-500/20 border-violet-500/40 text-violet-300" :
                                  "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
          }`}>{phase}</span>
        </div>
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

      {/* Block range indicator */}
      <div className="flex items-center gap-3 text-xs font-mono">
        <span className="text-zinc-500">Block:</span>
        <span className="text-indigo-400">[{blockStart}..{Math.min(blockEnd, array.length - 1)}]</span>
        <span className="text-zinc-600">— values</span>
        <span className="text-indigo-300">[{array[blockStart]}..{array[Math.min(blockEnd, array.length - 1)]}]</span>
      </div>

      {/* Result */}
      {found !== null && (
        <div className="rounded-xl border border-emerald-800 bg-emerald-900/20 px-4 py-3 text-sm font-mono text-emerald-300">
          Found <span className="font-bold">{target}</span> at index <span className="font-bold text-emerald-200">{found}</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Current",      cls: "bg-amber-500/40 border-amber-500" },
          { label: "Jump block",   cls: "bg-indigo-500/20 border-indigo-600" },
          { label: "Linear scan",  cls: "bg-violet-500/20 border-violet-600" },
          { label: "Found",        cls: "bg-emerald-500/40 border-emerald-500" },
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
