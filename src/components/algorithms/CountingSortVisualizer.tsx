"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface CountingSortState {
  input: number[];
  countArray: number[];
  output: (number | null)[];
  phase: "counting" | "accumulating" | "placing" | "done";
  activeInput: number | null;
  activeCount: number | null;
  activeOutput: number | null;
}

const PHASE_LABELS: Record<CountingSortState["phase"], string> = {
  counting:     "Phase 1 — Counting",
  accumulating: "Phase 2 — Prefix sums",
  placing:      "Phase 3 — Placing",
  done:         "Complete",
};

export function CountingSortVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { input, countArray, output, phase, activeInput, activeCount, activeOutput } =
    step.state as unknown as CountingSortState;

  return (
    <div className="flex flex-col gap-6">
      {/* Phase badge */}
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
          phase === "done"
            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
            : "bg-indigo-500/15 text-indigo-400 border-indigo-500/30"
        }`}>
          {PHASE_LABELS[phase]}
        </span>
      </div>

      {/* Input array */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Input array</span>
        <div className="flex gap-1.5 flex-wrap">
          {input.map((val, i) => {
            const isActive = i === activeInput;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 flex items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-amber-500/30 border-amber-500 text-amber-200 scale-110"
                    : "bg-zinc-800 border-zinc-700 text-zinc-300"
                }`}>{val}</div>
                <span className="text-[9px] text-zinc-600 font-mono">{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Count array */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">
          Count array {phase === "accumulating" ? "(prefix sums)" : ""}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {countArray.map((val, i) => {
            const isActive = i === activeCount;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 flex items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-violet-500/30 border-violet-500 text-violet-200 scale-110"
                    : val > 0
                    ? "bg-indigo-900/50 border-indigo-800 text-indigo-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-600"
                }`}>{val}</div>
                <span className="text-[9px] text-zinc-600 font-mono">{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Output array */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Output array</span>
        <div className="flex gap-1.5 flex-wrap">
          {output.map((val, i) => {
            const isActive = i === activeOutput;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 flex items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-500/30 border-emerald-500 text-emerald-200 scale-110"
                    : val !== null
                    ? "bg-emerald-900/40 border-emerald-800 text-emerald-300"
                    : "bg-zinc-900 border-zinc-800 text-zinc-700"
                }`}>{val !== null ? val : "·"}</div>
                <span className="text-[9px] text-zinc-600 font-mono">{i}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
