"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface StringMatchState {
  text: string;
  pattern: string;
  textIndex: number;
  patternIndex: number;
  matches: number[];          // starting indices of found matches
  mismatch: boolean;
  extra?: Record<string, unknown>; // algo-specific (failure function, hash, z-array)
  phase: "searching" | "done";
}

export function StringMatchVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { text, pattern, textIndex, patternIndex, matches, mismatch, phase } =
    step.state as unknown as StringMatchState;

  const alignOffset = textIndex - patternIndex;

  const getTextClass = (i: number) => {
    if (matches.some((m) => i >= m && i < m + pattern.length))
      return "bg-emerald-500/40 border-emerald-500 text-emerald-200";
    const pi = i - alignOffset;
    if (pi >= 0 && pi < pattern.length) {
      if (pi < patternIndex) return "bg-indigo-500/30 border-indigo-600 text-indigo-200";
      if (pi === patternIndex)
        return mismatch
          ? "bg-rose-500/30 border-rose-500 text-rose-200"
          : "bg-amber-500/40 border-amber-500 text-amber-200";
    }
    return "bg-zinc-800 border-zinc-700 text-zinc-500";
  };

  const getPatternClass = (pi: number) => {
    if (pi < patternIndex) return "bg-indigo-500/30 border-indigo-600 text-indigo-200";
    if (pi === patternIndex)
      return mismatch
        ? "bg-rose-500/30 border-rose-500 text-rose-200"
        : "bg-amber-500/40 border-amber-500 text-amber-200";
    return "bg-zinc-800/60 border-zinc-700 text-zinc-500";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Text index</span>
          <span className="text-amber-300 font-semibold">{textIndex}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Pattern index</span>
          <span className="text-indigo-300 font-semibold">{patternIndex}</span>
        </div>
        {matches.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Matches at</span>
            <span className="text-emerald-300 font-semibold">[{matches.join(", ")}]</span>
          </div>
        )}
      </div>

      {/* Text row */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Text</span>
        <div className="flex gap-1 flex-wrap">
          {text.split("").map((ch, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className={`w-8 h-8 flex items-center justify-center rounded border font-mono text-sm font-semibold transition-all duration-200 ${getTextClass(i)}`}>
                {ch}
              </div>
              <span className="text-[8px] text-zinc-700 font-mono">{i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pattern row — aligned under text */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Pattern (aligned at offset {alignOffset})</span>
        <div className="flex gap-1 items-start">
          {alignOffset > 0 && (
            <div style={{ width: alignOffset * 36 }} />
          )}
          {pattern.split("").map((ch, pi) => (
            <div key={pi} className="flex flex-col items-center gap-0.5">
              <div className={`w-8 h-8 flex items-center justify-center rounded border font-mono text-sm font-semibold transition-all duration-200 ${getPatternClass(pi)}`}>
                {ch}
              </div>
              <span className="text-[8px] text-zinc-700 font-mono">{pi}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Extra state (failure function / hash / z-array) */}
      {step.state && (step.state as unknown as { extra?: Record<string, unknown> }).extra && (
        <div className="flex flex-wrap gap-3">
          {Object.entries((step.state as unknown as { extra: Record<string, unknown> }).extra).map(([key, val]) => (
            <div key={key} className="flex items-center gap-2 text-xs font-mono">
              <span className="text-zinc-500">{key}:</span>
              <span className="text-zinc-300">
                {Array.isArray(val) ? `[${(val as number[]).join(", ")}]` : String(val)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Done */}
      {phase === "done" && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-mono ${
          matches.length > 0
            ? "border-emerald-800 bg-emerald-900/20 text-emerald-300"
            : "border-zinc-700 bg-zinc-900/20 text-zinc-400"
        }`}>
          {matches.length > 0
            ? <>Pattern found at {matches.length} position{matches.length > 1 ? "s" : ""}: [<span className="font-bold text-emerald-200">{matches.join(", ")}</span>]</>
            : "Pattern not found in text."
          }
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Comparing",  cls: "bg-amber-500/40 border-amber-500" },
          { label: "Matched so far", cls: "bg-indigo-500/30 border-indigo-600" },
          { label: "Mismatch",   cls: "bg-rose-500/30 border-rose-500" },
          { label: "Match found", cls: "bg-emerald-500/40 border-emerald-500" },
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
