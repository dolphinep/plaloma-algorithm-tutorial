"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface CoinChangeState {
  coins: number[];
  amount: number;
  dp: (number | null)[];
  current: number | null;
  checkingCoin: number | null;
  phase: "filling" | "done";
}

export function CoinChangeVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { coins, amount, dp, current, checkingCoin, phase } =
    step.state as unknown as CoinChangeState;

  return (
    <div className="flex flex-col gap-6">
      {/* Coins */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Coins</span>
        {coins.map((c) => (
          <div key={c} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-mono text-sm font-semibold transition-all duration-200 ${
            c === checkingCoin
              ? "bg-amber-500/30 border-amber-400 text-amber-200 scale-110"
              : "bg-zinc-800 border-zinc-600 text-zinc-300"
          }`}>{c}</div>
        ))}
      </div>

      {/* DP array */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">dp[0..{amount}] — min coins needed</span>
        <div className="flex gap-1.5 flex-wrap">
          {dp.map((val, i) => {
            const isCurrent  = i === current;
            const isComplement = checkingCoin !== null && current !== null && i === current - checkingCoin;
            const isImpossible = val === -1;
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-11 h-11 flex items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-all duration-200 ${
                  isCurrent   ? "bg-indigo-500/40 border-indigo-400 text-indigo-100 scale-110" :
                  isComplement? "bg-amber-500/30 border-amber-500 text-amber-200" :
                  isImpossible? "bg-rose-900/30 border-rose-800 text-rose-500" :
                  val !== null? "bg-emerald-900/40 border-emerald-800 text-emerald-300" :
                                "bg-zinc-900 border-zinc-800 text-zinc-700"
                }`}>
                  {val === null ? "" : val === -1 ? "×" : val}
                </div>
                <span className="text-[9px] text-zinc-600 font-mono">{i}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase badge */}
      {phase === "done" && dp[amount] !== null && (
        <div className="rounded-xl border border-emerald-800 bg-emerald-900/20 px-4 py-3 text-sm font-mono text-emerald-300">
          dp[{amount}] = <span className="font-bold text-emerald-200">{dp[amount] === -1 ? "impossible" : dp[amount]}</span>
          {dp[amount] !== -1 && dp[amount] !== null && ` — need ${dp[amount]} coin${dp[amount] !== 1 ? "s" : ""} to make ${amount}`}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Computing",   cls: "bg-indigo-500/40 border-indigo-400" },
          { label: "Complement",  cls: "bg-amber-500/30 border-amber-500" },
          { label: "Filled",      cls: "bg-emerald-900/40 border-emerald-800" },
          { label: "Impossible",  cls: "bg-rose-900/30 border-rose-800" },
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
