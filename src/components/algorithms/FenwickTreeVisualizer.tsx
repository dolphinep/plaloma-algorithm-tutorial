"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface FenwickTreeState {
  original: number[];
  fenwick: number[];        // BIT array (1-indexed internally, 0-indexed in state)
  prefixSums: number[];     // prefix sums for verification
  current: number | null;   // index being updated/queried
  affected: number[];       // indices in BIT being read/updated
  operation: "build" | "update" | "query" | null;
  operationArg: { index?: number; delta?: number; range?: [number, number] } | null;
  queryResult: number | null;
  phase: "processing" | "done";
}

export function FenwickTreeVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { original, fenwick, current, affected, operation, operationArg, queryResult, phase } =
    step.state as unknown as FenwickTreeState;

  const getOrigClass = (i: number) =>
    i === current
      ? "bg-amber-500/40 border-amber-500 text-amber-200 scale-110"
      : "bg-zinc-800 border-zinc-700 text-zinc-400";

  const getFenwickClass = (i: number) => {
    if (affected.includes(i))
      return "bg-indigo-500/40 border-indigo-500 text-indigo-200 scale-105";
    if (fenwick[i] !== 0)
      return "bg-emerald-900/40 border-emerald-800 text-emerald-300";
    return "bg-zinc-900 border-zinc-800 text-zinc-700";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Op info */}
      <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
        {operation && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Operation:</span>
            <span className="px-2.5 py-1 rounded-full border bg-amber-500/20 border-amber-500/40 text-amber-300">
              {operation === "update" && operationArg
                ? `update(${operationArg.index}, +${operationArg.delta})`
                : operation === "query" && operationArg?.range
                ? `query(${operationArg.range[0]}, ${operationArg.range[1]})`
                : operation}
            </span>
          </div>
        )}
        {queryResult !== null && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Result:</span>
            <span className="text-emerald-300 font-semibold">{queryResult}</span>
          </div>
        )}
      </div>

      {/* Original array */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Original array</span>
        <div className="flex gap-1.5 flex-wrap">
          {original.map((val, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className={`w-9 h-9 flex items-center justify-center rounded border font-mono text-sm font-semibold transition-all duration-200 ${getOrigClass(i)}`}>
                {val}
              </div>
              <span className="text-[8px] text-zinc-600 font-mono">{i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* BIT array */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Fenwick tree (BIT) — 1-indexed</span>
        <div className="flex gap-1.5 flex-wrap">
          {fenwick.map((val, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className={`w-9 h-9 flex items-center justify-center rounded border font-mono text-sm font-semibold transition-all duration-200 ${getFenwickClass(i)}`}>
                {val || "—"}
              </div>
              <span className="text-[8px] text-zinc-600 font-mono">{i + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Affected path */}
      {affected.length > 0 && (
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-zinc-500">{operation === "query" ? "Query path:" : "Update path:"}</span>
          {affected.map((idx, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-zinc-700">{operation === "query" ? "←" : "→"}</span>}
              <span className="px-1.5 py-0.5 rounded bg-indigo-600/20 border border-indigo-500/40 text-indigo-300">
                bit[{idx + 1}]={fenwick[idx]}
              </span>
            </span>
          ))}
        </div>
      )}

      {phase === "done" && queryResult !== null && (
        <div className="rounded-xl border border-emerald-800 bg-emerald-900/20 px-4 py-3 text-sm font-mono text-emerald-300">
          Prefix sum result = <span className="font-bold text-emerald-200 text-lg">{queryResult}</span>
        </div>
      )}
    </div>
  );
}
