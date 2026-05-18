"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface LLNode {
  value: number;
  next: number | null; // index of next node, null = end
}

interface LinkedListState {
  nodes: LLNode[];
  slow: number | null;
  fast: number | null;
  meetPoint: number | null;
  cycleStart: number | null;
  cycleEdge: number | null; // tail node that points back into cycle
  phase: "detecting" | "locating" | "done";
  hasCycle: boolean;
}

export function LinkedListVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { nodes, slow, fast, meetPoint, cycleStart, cycleEdge, phase, hasCycle } =
    step.state as unknown as LinkedListState;

  const getNodeClass = (i: number) => {
    if (i === cycleStart && phase === "done")
      return "bg-rose-500/40 border-rose-500 text-rose-200";
    if (i === meetPoint)
      return "bg-violet-500/40 border-violet-500 text-violet-200";
    if (i === slow && i === fast)
      return "bg-emerald-500/40 border-emerald-500 text-emerald-200";
    if (i === slow)
      return "bg-indigo-500/40 border-indigo-500 text-indigo-200";
    if (i === fast)
      return "bg-amber-500/40 border-amber-500 text-amber-200";
    if (cycleStart !== null && cycleEdge !== null) {
      let cur: number | null = cycleStart;
      while (cur !== null && cur !== cycleEdge) {
        if (cur === i) return "bg-rose-900/30 border-rose-800 text-rose-400";
        cur = nodes[cur].next;
      }
      if (cur === i) return "bg-rose-900/30 border-rose-800 text-rose-400";
    }
    return "bg-zinc-800 border-zinc-700 text-zinc-400";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Pointer legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
        {slow !== null && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-indigo-300">slow = {slow}</span>
          </div>
        )}
        {fast !== null && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-amber-300">fast = {fast}</span>
          </div>
        )}
        {meetPoint !== null && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-violet-500" />
            <span className="text-violet-300">meet = {meetPoint}</span>
          </div>
        )}
        {cycleStart !== null && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="text-rose-300">cycle start = {cycleStart}</span>
          </div>
        )}
      </div>

      {/* Node list */}
      <div className="flex items-center gap-2 flex-wrap">
        {nodes.map((node, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-12 h-10 flex items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-all duration-200 ${getNodeClass(i)}`}>
                {node.value}
              </div>
              <span className="text-[9px] text-zinc-600 font-mono">[{i}]</span>
            </div>
            {/* Arrow */}
            {node.next !== null ? (
              node.next === i + 1 ? (
                <span className="text-zinc-600 font-mono text-lg">→</span>
              ) : (
                <span className="text-rose-600 font-mono text-xs">↩{node.next}</span>
              )
            ) : (
              <span className="text-zinc-700 font-mono text-sm">✕</span>
            )}
          </div>
        ))}
      </div>

      {/* Phase indicator */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-zinc-500 uppercase tracking-wider">Phase:</span>
        <span className={`px-2.5 py-1 rounded-full border font-mono ${
          phase === "detecting" ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300" :
          phase === "locating"  ? "bg-violet-500/20 border-violet-500/40 text-violet-300" :
                                  hasCycle
                                  ? "bg-rose-500/20 border-rose-500/40 text-rose-300"
                                  : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
        }`}>{phase}</span>
      </div>

      {/* Result */}
      {phase === "done" && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-mono ${
          hasCycle
            ? "border-rose-800 bg-rose-900/20 text-rose-300"
            : "border-emerald-800 bg-emerald-900/20 text-emerald-300"
        }`}>
          {hasCycle
            ? <>Cycle detected! Starts at node <span className="font-bold">{cycleStart}</span> (value: {nodes[cycleStart!]?.value})</>
            : "No cycle detected. List is acyclic."}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Slow ptr",     cls: "bg-indigo-500/40 border-indigo-500" },
          { label: "Fast ptr",     cls: "bg-amber-500/40 border-amber-500" },
          { label: "Meet point",   cls: "bg-violet-500/40 border-violet-500" },
          { label: "Cycle node",   cls: "bg-rose-900/30 border-rose-800" },
          { label: "Cycle start",  cls: "bg-rose-500/40 border-rose-500" },
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
