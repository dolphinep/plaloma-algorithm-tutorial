"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface LISState {
  array: number[];
  index: number | null;
  dp: number[];
  tails: number[];
  best: number[];
  result: number | null;
  phase: "filling" | "done";
}

export function LISVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { array, index, dp, tails, best, result, phase } =
    step.state as unknown as LISState;

  const getClass = (i: number) => {
    if (i === index)
      return "bg-amber-500/40 border-amber-500 text-amber-200 scale-110";
    if (best && best.includes(i))
      return "bg-emerald-500/30 border-emerald-500 text-emerald-200";
    return "bg-zinc-800 border-zinc-700 text-zinc-400";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Array with dp values */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Input array</span>
        <div className="flex gap-1.5 flex-wrap">
          {array.map((val, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className={`w-10 h-10 flex items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-all duration-200 ${getClass(i)}`}>
                {val}
              </div>
              {dp[i] !== undefined && (
                <span className={`text-[9px] font-mono font-semibold ${
                  i === index ? "text-amber-400" : dp[i] > 1 ? "text-indigo-400" : "text-zinc-600"
                }`}>
                  dp={dp[i]}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Patience sorting tails */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Patience sorting piles (tails)</span>
        {tails.length === 0 ? (
          <span className="text-xs text-zinc-600 italic">empty</span>
        ) : (
          <div className="flex gap-1.5 flex-wrap items-end">
            {tails.map((val, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 flex items-center justify-center rounded-lg border bg-indigo-900/40 border-indigo-700 font-mono text-sm font-semibold text-indigo-300">
                  {val}
                </div>
                <span className="text-[9px] text-zinc-600 font-mono">{i + 1}</span>
              </div>
            ))}
            <span className="text-xs text-zinc-600 font-mono ml-2">← LIS length = {tails.length}</span>
          </div>
        )}
      </div>

      {/* Current operation */}
      {index !== null && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs font-mono text-zinc-400">
          Processing array[<span className="text-amber-300">{index}</span>] = <span className="text-amber-300">{array[index]}</span>
          {tails.length > 0 && (
            <> — tails: [<span className="text-indigo-300">{tails.join(", ")}</span>]</>
          )}
        </div>
      )}

      {/* Result */}
      {result !== null && phase === "done" && (
        <div className="rounded-xl border border-emerald-800 bg-emerald-900/20 px-4 py-3 text-sm font-mono text-emerald-300">
          LIS length = <span className="font-bold text-emerald-200 text-lg">{result}</span>
          <span className="text-zinc-500 ml-2">— Tails: [{tails.join(", ")}]</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Current element", cls: "bg-amber-500/40 border-amber-500" },
          { label: "In best LIS",     cls: "bg-emerald-500/30 border-emerald-500" },
          { label: "Patience pile",   cls: "bg-indigo-900/40 border-indigo-700" },
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
