"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface SegTreeNode {
  id: number;
  lo: number;
  hi: number;
  value: number | null;
  x: number;
  y: number;
  state: "default" | "active" | "found" | "updating" | "querying";
}

interface SegmentTreeState {
  nodes: SegTreeNode[];
  original: number[];
  current: number | null;
  queryRange: [number, number] | null;
  updateIndex: number | null;
  operation: "build" | "query" | "update" | null;
  result: number | null;
  phase: "processing" | "done";
}

const NODE_COLORS: Record<SegTreeNode["state"], { fill: string; stroke: string; text: string }> = {
  default:  { fill: "rgba(63,63,70,0.4)",   stroke: "#52525b", text: "#a1a1aa" },
  active:   { fill: "rgba(245,158,11,0.3)", stroke: "#f59e0b", text: "#fde68a" },
  found:    { fill: "rgba(16,185,129,0.3)", stroke: "#10b981", text: "#6ee7b7" },
  updating: { fill: "rgba(99,102,241,0.3)", stroke: "#6366f1", text: "#a5b4fc" },
  querying: { fill: "rgba(139,92,246,0.3)", stroke: "#8b5cf6", text: "#c4b5fd" },
};

export function SegmentTreeVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { nodes, original, queryRange, operation, result, phase } =
    step.state as unknown as SegmentTreeState;

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const getParentId = (id: number) => Math.floor((id - 1) / 2);

  return (
    <div className="flex flex-col gap-5">
      {/* Op info */}
      <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
        {operation && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Operation:</span>
            <span className="px-2.5 py-1 rounded-full border bg-violet-500/20 border-violet-500/40 text-violet-300">
              {operation === "query" && queryRange
                ? `query(${queryRange[0]}, ${queryRange[1]})`
                : operation}
            </span>
          </div>
        )}
        {result !== null && phase === "done" && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Result:</span>
            <span className="text-emerald-300 font-semibold">{result}</span>
          </div>
        )}
      </div>

      {/* Original array */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Input array</span>
        <div className="flex gap-1.5 flex-wrap">
          {original.map((val, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className={`w-9 h-9 flex items-center justify-center rounded border font-mono text-sm font-semibold ${
                queryRange && i >= queryRange[0] && i <= queryRange[1]
                  ? "bg-violet-500/30 border-violet-500 text-violet-200"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400"
              }`}>{val}</div>
              <span className="text-[8px] text-zinc-600 font-mono">{i}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Segment tree */}
      <div className="w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/20">
        <svg width={620} height={220} viewBox="0 0 620 220" className="block">
          {/* Edges */}
          {nodes.map((node) => {
            if (node.id === 0) return null;
            const parent = nodeMap[getParentId(node.id)];
            if (!parent) return null;
            return (
              <line key={node.id}
                x1={parent.x} y1={parent.y} x2={node.x} y2={node.y}
                stroke="#3f3f46" strokeWidth={1.5}
              />
            );
          })}
          {/* Nodes */}
          {nodes.map((node) => {
            const colors = NODE_COLORS[node.state] ?? NODE_COLORS.default;
            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                <rect x={-22} y={-14} width={44} height={28} rx={6}
                  fill={colors.fill} stroke={colors.stroke} strokeWidth={1.5} />
                <text textAnchor="middle" y={-3} fill={colors.text} fontSize={10} fontFamily="monospace" fontWeight="bold">
                  {node.value ?? "?"}
                </text>
                <text textAnchor="middle" y={9} fill="#6b7280" fontSize={7} fontFamily="monospace">
                  [{node.lo},{node.hi}]
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {phase === "done" && result !== null && (
        <div className="rounded-xl border border-emerald-800 bg-emerald-900/20 px-4 py-3 text-sm font-mono text-emerald-300">
          {operation === "query"
            ? <>Range sum [{queryRange?.[0]}, {queryRange?.[1]}] = <span className="font-bold text-emerald-200">{result}</span></>
            : "Operation complete."}
        </div>
      )}
    </div>
  );
}
