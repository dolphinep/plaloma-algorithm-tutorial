"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface TwoSumState {
  array: number[];
  target: number;
  hashMap: Record<number, number>;
  current: number | null;
  complement: number | null;
  foundIndices: [number, number] | null;
}

export function TwoSumVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { array, target, hashMap, current, complement, foundIndices } =
    step.state as unknown as TwoSumState;

  const getClass = (i: number) => {
    if (foundIndices && (i === foundIndices[0] || i === foundIndices[1]))
      return "bg-emerald-500/30 border-emerald-500 text-emerald-200 scale-110";
    if (i === current)
      return "bg-amber-500/30 border-amber-500 text-amber-200 scale-110";
    if (i in hashMap && Object.values(hashMap).includes(i))
      return "bg-indigo-900/40 border-indigo-700 text-indigo-300";
    return "bg-zinc-800 border-zinc-700 text-zinc-400";
  };

  const hashEntries = Object.entries(hashMap).map(([val, idx]) => ({ val: Number(val), idx }));

  return (
    <div className="flex flex-col gap-6">
      {/* Target */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Target</span>
        <span className="px-3 py-1 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-mono font-semibold text-sm">{target}</span>
        {current !== null && complement !== null && foundIndices === null && (
          <span className="text-xs text-zinc-500">Looking for complement: <span className="text-amber-300 font-mono">{complement}</span></span>
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

      {/* Hash map */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Hash map (value → index)</span>
        {hashEntries.length === 0 ? (
          <span className="text-xs text-zinc-600 italic">empty</span>
        ) : (
          <div className="flex flex-wrap gap-2">
            {hashEntries.map(({ val, idx }) => {
              const isComplement = val === complement;
              return (
                <div key={val} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border font-mono text-xs transition-all duration-200 ${
                  isComplement
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                    : "bg-zinc-800 border-zinc-700 text-zinc-400"
                }`}>
                  <span className="font-semibold">{val}</span>
                  <span className="text-zinc-600">→</span>
                  <span>idx {idx}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Result */}
      {foundIndices && (
        <div className="rounded-xl border border-emerald-800 bg-emerald-900/20 px-4 py-3 text-sm font-mono text-emerald-300">
          Found! array[<span className="font-bold">{foundIndices[0]}</span>] + array[<span className="font-bold">{foundIndices[1]}</span>] = {array[foundIndices[0]]} + {array[foundIndices[1]]} = <span className="font-bold text-emerald-200">{target}</span>
        </div>
      )}
    </div>
  );
}
