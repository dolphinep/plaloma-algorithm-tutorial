"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface BloomFilterState {
  bits: boolean[];
  size: number;
  hashFunctions: number;
  currentItem: string | null;
  currentHashes: number[];    // bit positions being set/checked
  operation: "insert" | "query" | null;
  queryResult: "definitely_not" | "probably_yes" | null;
  insertedItems: string[];
  falsePositiveDemo: boolean;
  phase: "hashing" | "setting" | "checking" | "done";
}

export function BloomFilterVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { bits, currentItem, currentHashes, operation, queryResult, insertedItems, phase } =
    step.state as unknown as BloomFilterState;

  const getBitClass = (i: number) => {
    if (currentHashes.includes(i)) {
      if (phase === "checking")
        return bits[i]
          ? "bg-amber-500/60 border-amber-400 text-amber-100"
          : "bg-rose-500/60 border-rose-400 text-rose-100";
      return "bg-indigo-500/60 border-indigo-400 text-white";
    }
    if (bits[i]) return "bg-emerald-900/50 border-emerald-700 text-emerald-400";
    return "bg-zinc-900 border-zinc-800 text-zinc-700";
  };

  const BITS_PER_ROW = 16;
  const rows: boolean[][] = [];
  for (let i = 0; i < bits.length; i += BITS_PER_ROW) {
    rows.push(bits.slice(i, i + BITS_PER_ROW));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Operation info */}
      <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
        {operation && currentItem && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Op:</span>
            <span className={`px-2.5 py-1 rounded-full border ${
              operation === "insert"
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                : "bg-amber-500/20 border-amber-500/40 text-amber-300"
            }`}>{operation}("{currentItem}")</span>
          </div>
        )}
        {currentHashes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Hash positions:</span>
            <span className="text-zinc-300">[{currentHashes.join(", ")}]</span>
          </div>
        )}
      </div>

      {/* Bit array */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Bit array ({bits.length} bits)</span>
        <div className="flex flex-col gap-1">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-0.5 items-center">
              <span className="text-[9px] text-zinc-700 font-mono w-8 text-right pr-1">{rowIdx * BITS_PER_ROW}</span>
              {row.map((bit, colIdx) => {
                const globalIdx = rowIdx * BITS_PER_ROW + colIdx;
                return (
                  <div key={colIdx} className={`w-7 h-7 flex items-center justify-center rounded border font-mono text-xs font-bold transition-all duration-150 ${getBitClass(globalIdx)}`}>
                    {bit ? "1" : "0"}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Inserted items */}
      {insertedItems.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-zinc-500 uppercase tracking-wider">Inserted:</span>
          {insertedItems.map((item) => (
            <span key={item} className="px-2 py-0.5 rounded bg-emerald-900/30 border border-emerald-800 text-emerald-400 font-mono">"{item}"</span>
          ))}
        </div>
      )}

      {/* Query result */}
      {queryResult && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-mono ${
          queryResult === "definitely_not"
            ? "border-zinc-700 bg-zinc-900/20 text-zinc-400"
            : "border-amber-700 bg-amber-900/20 text-amber-300"
        }`}>
          {queryResult === "definitely_not"
            ? `"${currentItem}" is DEFINITELY NOT in the set (at least one bit = 0)`
            : `"${currentItem}" is PROBABLY in the set (all bits = 1) — may be false positive`}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Setting (insert)", cls: "bg-indigo-500/60 border-indigo-400" },
          { label: "Checking (match)", cls: "bg-amber-500/60 border-amber-400" },
          { label: "Checking (miss)",  cls: "bg-rose-500/60 border-rose-400" },
          { label: "Set bit",          cls: "bg-emerald-900/50 border-emerald-700" },
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
