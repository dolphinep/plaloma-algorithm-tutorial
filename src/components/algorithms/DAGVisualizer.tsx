"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface DAGNode { id: string; x: number; y: number; }
interface DAGEdge { from: string; to: string; }

interface TopoState {
  nodes: DAGNode[];
  edges: DAGEdge[];
  inDegree: Record<string, number>;
  queue: string[];
  result: string[];
  current: string | null;
  phase: "init" | "processing" | "done";
}

export function DAGVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { nodes, edges, inDegree, queue, result, current, phase } =
    step.state as unknown as TopoState;

  const getNodeFill = (id: string) => {
    if (id === current) return { fill: "rgba(245,158,11,0.3)", stroke: "#f59e0b", text: "#fde68a" };
    if (result.includes(id)) return { fill: "rgba(16,185,129,0.2)", stroke: "#10b981", text: "#6ee7b7" };
    if (queue.includes(id)) return { fill: "rgba(99,102,241,0.25)", stroke: "#6366f1", text: "#a5b4fc" };
    return { fill: "rgba(63,63,70,0.4)", stroke: "#52525b", text: "#a1a1aa" };
  };

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="flex flex-col gap-5">
      {/* SVG graph */}
      <div className="w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/20">
        <svg width="600" height="280" viewBox="0 0 600 280" className="block">
          <defs>
            <marker id="topo-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#52525b" />
            </marker>
            <marker id="topo-arrow-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#f59e0b" />
            </marker>
          </defs>
          {/* Edges */}
          {edges.map((e, i) => {
            const a = nodeMap[e.from];
            const b = nodeMap[e.to];
            if (!a || !b) return null;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const nx = dx / len;
            const ny = dy / len;
            const r = 20;
            const x1 = a.x + nx * r;
            const y1 = a.y + ny * r;
            const x2 = b.x - nx * (r + 2);
            const y2 = b.y - ny * (r + 2);
            const isActive = e.from === current;
            return (
              <line key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isActive ? "#f59e0b" : "#3f3f46"}
                strokeWidth={isActive ? 2 : 1.5}
                markerEnd={isActive ? "url(#topo-arrow-active)" : "url(#topo-arrow)"}
              />
            );
          })}
          {/* Nodes */}
          {nodes.map((n) => {
            const { fill, stroke, text } = getNodeFill(n.id);
            return (
              <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
                <circle r={20} fill={fill} stroke={stroke} strokeWidth={2} />
                <text textAnchor="middle" dominantBaseline="middle" fill={text} fontSize={14} fontFamily="monospace" fontWeight="bold">
                  {n.id}
                </text>
                {inDegree[n.id] !== undefined && (
                  <text x={18} y={-16} textAnchor="middle" fill="#6b7280" fontSize={9} fontFamily="monospace">
                    in:{inDegree[n.id]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Queue + result */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-indigo-800 bg-indigo-900/20 p-3">
          <div className="text-xs text-zinc-500 mb-2">Queue (zero in-degree)</div>
          <div className="flex gap-1.5 flex-wrap min-h-6">
            {queue.length === 0
              ? <span className="text-xs text-zinc-600 italic">empty</span>
              : queue.map((id) => (
                <span key={id} className="px-2 py-0.5 rounded bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-mono text-xs">{id}</span>
              ))}
          </div>
        </div>
        <div className="rounded-lg border border-emerald-800 bg-emerald-900/20 p-3">
          <div className="text-xs text-zinc-500 mb-2">Topological order</div>
          <div className="flex gap-1.5 flex-wrap min-h-6">
            {result.length === 0
              ? <span className="text-xs text-zinc-600 italic">—</span>
              : result.map((id, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="text-zinc-700 text-xs">→</span>}
                  <span className="px-2 py-0.5 rounded bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs">{id}</span>
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Done */}
      {phase === "done" && result.length > 0 && (
        <div className="rounded-xl border border-emerald-800 bg-emerald-900/20 px-4 py-3 text-sm font-mono text-emerald-300">
          Topological order: <span className="font-bold text-emerald-200">{result.join(" → ")}</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Processing", cls: "bg-amber-500/30 border-amber-500" },
          { label: "In queue",   cls: "bg-indigo-500/25 border-indigo-500" },
          { label: "Done",       cls: "bg-emerald-500/20 border-emerald-500" },
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
