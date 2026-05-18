"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface HTBucket {
  key: number | null;
  value: number | null;
  chain: Array<{ key: number; value: number }>;
  state: "empty" | "occupied" | "deleted" | "active" | "found" | "collision";
}

interface HashTableState {
  buckets: HTBucket[];
  size: number;
  currentKey: number | null;
  currentHash: number | null;
  operation: "insert" | "search" | "delete" | null;
  probeSequence: number[];
  phase: "hashing" | "probing" | "done";
  loadFactor: number;
}

export function HashTableVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { buckets, currentKey, currentHash, operation, probeSequence, phase, loadFactor } =
    step.state as unknown as HashTableState;

  const getBucketClass = (i: number, bucket: HTBucket) => {
    if (bucket.state === "active")
      return "bg-amber-500/40 border-amber-500 text-amber-200 scale-105";
    if (bucket.state === "found")
      return "bg-emerald-500/40 border-emerald-500 text-emerald-200";
    if (bucket.state === "collision")
      return "bg-rose-500/30 border-rose-500 text-rose-200";
    if (probeSequence.includes(i))
      return "bg-indigo-500/20 border-indigo-600 text-indigo-300";
    if (bucket.state === "occupied")
      return "bg-zinc-700 border-zinc-600 text-zinc-200";
    if (bucket.state === "deleted")
      return "bg-zinc-900/60 border-dashed border-zinc-700 text-zinc-600";
    return "bg-zinc-900 border-zinc-800 text-zinc-700";
  };

  const filledCount = buckets.filter((b) => b.state === "occupied").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
        {operation && currentKey !== null && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Op:</span>
            <span className={`px-2.5 py-1 rounded-full border ${
              operation === "insert" ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" :
              operation === "search" ? "bg-amber-500/20 border-amber-500/40 text-amber-300" :
                                       "bg-rose-500/20 border-rose-500/40 text-rose-300"
            }`}>{operation}({currentKey})</span>
          </div>
        )}
        {currentHash !== null && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">hash({currentKey}) =</span>
            <span className="text-amber-300 font-semibold">{currentHash}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">load</span>
          <span className="text-zinc-300">{filledCount}/{buckets.length} = {(loadFactor * 100).toFixed(0)}%</span>
        </div>
      </div>

      {/* Buckets grid */}
      <div className="flex flex-wrap gap-1.5">
        {buckets.map((bucket, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div className={`w-11 min-h-10 flex flex-col items-center justify-center rounded-lg border px-1 py-1 font-mono text-xs font-semibold transition-all duration-200 ${getBucketClass(i, bucket)}`}>
              {bucket.key !== null ? (
                <>
                  <span className="text-[9px] opacity-70">k:{bucket.key}</span>
                  <span>{bucket.value}</span>
                </>
              ) : bucket.state === "deleted" ? (
                <span className="text-[9px]">del</span>
              ) : (
                <span className="text-[9px] opacity-40">—</span>
              )}
              {/* Chaining */}
              {bucket.chain && bucket.chain.length > 1 && (
                <span className="text-[8px] opacity-60">+{bucket.chain.length - 1}</span>
              )}
            </div>
            <span className="text-[8px] text-zinc-700 font-mono">{i}</span>
          </div>
        ))}
      </div>

      {/* Probe sequence */}
      {probeSequence.length > 0 && phase === "probing" && (
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-500">Probing:</span>
          {probeSequence.map((idx, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-zinc-700">→</span>}
              <span className="px-1.5 py-0.5 rounded bg-indigo-600/20 border border-indigo-500/40 text-indigo-300">{idx}</span>
            </span>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Active slot",   cls: "bg-amber-500/40 border-amber-500" },
          { label: "Found",         cls: "bg-emerald-500/40 border-emerald-500" },
          { label: "Collision",     cls: "bg-rose-500/30 border-rose-500" },
          { label: "Probe path",    cls: "bg-indigo-500/20 border-indigo-600" },
          { label: "Occupied",      cls: "bg-zinc-700 border-zinc-600" },
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
