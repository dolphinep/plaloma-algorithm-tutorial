"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface SieveState {
  limit: number;
  isPrime: boolean[];
  currentPrime: number | null;
  currentMultiple: number | null;
  primes: number[];
}

export function SieveVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { limit, isPrime, currentPrime, currentMultiple, primes } =
    step.state as unknown as SieveState;

  // Numbers 2..limit
  const numbers = Array.from({ length: limit - 1 }, (_, i) => i + 2);

  return (
    <div className="flex flex-col gap-5">
      {/* Current prime indicator */}
      {currentPrime !== null && (
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-500">Eliminating multiples of</span>
          <span className="px-3 py-1 rounded-full bg-violet-600/20 border border-violet-500/40 text-violet-300 font-mono font-semibold">
            {currentPrime}
          </span>
        </div>
      )}

      {/* Number grid */}
      <div className="flex flex-wrap gap-1.5">
        {numbers.map((num) => {
          const isCurrentPrime   = num === currentPrime;
          const isCurrentMultiple = num === currentMultiple;
          const isConfirmedPrime  = isPrime[num] && num !== currentPrime;
          const isEliminated      = !isPrime[num];

          const cellClass = isCurrentPrime
            ? "bg-violet-500/30 border-violet-500 text-violet-200 scale-110"
            : isCurrentMultiple
            ? "bg-rose-500/30 border-rose-500 text-rose-300 scale-105"
            : isConfirmedPrime
            ? "bg-emerald-900/40 border-emerald-800 text-emerald-300"
            : isEliminated
            ? "bg-zinc-900/80 border-zinc-800 text-zinc-600 line-through opacity-50"
            : "bg-zinc-800 border-zinc-700 text-zinc-300";

          return (
            <div
              key={num}
              className={`w-10 h-10 flex items-center justify-center rounded-lg border font-mono text-xs font-medium transition-all duration-150 ${cellClass}`}
            >
              {num}
            </div>
          );
        })}
      </div>

      {/* Confirmed primes */}
      {primes.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">
            Primes found so far ({primes.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {primes.map((p) => (
              <span
                key={p}
                className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-900/30 border border-emerald-800 text-emerald-400"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Current prime",    cls: "bg-violet-500/30 border-violet-500" },
          { label: "Being eliminated", cls: "bg-rose-500/30 border-rose-500" },
          { label: "Confirmed prime",  cls: "bg-emerald-900/40 border-emerald-800" },
          { label: "Composite",        cls: "bg-zinc-900/80 border-zinc-800 opacity-50" },
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
