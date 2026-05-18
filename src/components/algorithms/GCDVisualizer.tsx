"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface GCDStep {
  a: number;
  b: number;
  quotient: number;
  remainder: number;
}

interface GCDState {
  a: number;
  b: number;
  steps: GCDStep[];
  currentStep: number;
  result: number | null;
}

export function GCDVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { a, b, steps: gcdSteps, currentStep, result } =
    step.state as unknown as GCDState;

  return (
    <div className="flex flex-col gap-6">
      {/* Current state */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-zinc-500">a</span>
          <div className="w-16 h-16 flex items-center justify-center rounded-xl border-2 border-amber-500 bg-amber-500/20 text-amber-200 font-mono text-xl font-bold">
            {a}
          </div>
        </div>
        <div className="text-zinc-600 text-2xl font-mono mt-4">mod</div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-zinc-500">b</span>
          <div className="w-16 h-16 flex items-center justify-center rounded-xl border-2 border-indigo-500 bg-indigo-500/20 text-indigo-200 font-mono text-xl font-bold">
            {b}
          </div>
        </div>
        <div className="text-zinc-600 text-2xl font-mono mt-4">=</div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-zinc-500">remainder</span>
          <div className={`w-16 h-16 flex items-center justify-center rounded-xl border-2 font-mono text-xl font-bold ${
            result !== null ? "border-emerald-500 bg-emerald-500/20 text-emerald-200" : "border-zinc-600 bg-zinc-800 text-zinc-300"
          }`}>
            {a % b === 0 && b !== 0 ? 0 : a % b}
          </div>
        </div>
      </div>

      {/* Step history */}
      {gcdSteps.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Steps</span>
          <div className="flex flex-col gap-1.5">
            {gcdSteps.map((s, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-mono text-xs transition-all duration-200 ${
                  i === currentStep
                    ? "border-amber-700 bg-amber-900/20 text-amber-200"
                    : i < currentStep
                    ? "border-zinc-800 bg-zinc-900/30 text-zinc-500"
                    : "border-zinc-800 bg-zinc-900/10 text-zinc-600"
                }`}
              >
                <span className="text-zinc-600 w-4 text-right">{i + 1}.</span>
                <span>{s.a}</span>
                <span className="text-zinc-600">=</span>
                <span>{s.quotient}</span>
                <span className="text-zinc-600">×</span>
                <span>{s.b}</span>
                <span className="text-zinc-600">+</span>
                <span className={s.remainder === 0 ? "text-emerald-400 font-bold" : ""}>{s.remainder}</span>
                <span className="text-zinc-600 ml-auto">→ ({s.b}, {s.remainder})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result !== null && (
        <div className="rounded-xl border border-emerald-800 bg-emerald-900/20 px-4 py-3 text-sm font-mono text-emerald-300">
          gcd({step.variables?.["original a"] ?? a}, {step.variables?.["original b"] ?? b}) = <span className="font-bold text-emerald-200 text-lg">{result}</span>
        </div>
      )}
    </div>
  );
}
