"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface BSTNode {
  id: number;
  value: number;
  left: number | null;
  right: number | null;
  x: number;
  y: number;
  state: "default" | "active" | "found" | "inserted" | "comparing";
}

interface BSTState {
  nodes: BSTNode[];
  root: number | null;
  current: number | null;
  path: number[];
  operation: "insert" | "search" | null;
  target: number | null;
  phase: "traversing" | "done";
}

const STATE_COLORS: Record<BSTNode["state"], { fill: string; stroke: string; text: string }> = {
  default:   { fill: "rgba(63,63,70,0.4)",   stroke: "#52525b", text: "#a1a1aa" },
  active:    { fill: "rgba(245,158,11,0.3)", stroke: "#f59e0b", text: "#fde68a" },
  found:     { fill: "rgba(16,185,129,0.3)", stroke: "#10b981", text: "#6ee7b7" },
  inserted:  { fill: "rgba(99,102,241,0.3)", stroke: "#6366f1", text: "#a5b4fc" },
  comparing: { fill: "rgba(239,68,68,0.2)",  stroke: "#ef4444", text: "#fca5a5" },
};

export function BSTVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { nodes, current, path, operation, target } =
    step.state as unknown as BSTState;

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const svgW = 620;
  const svgH = 300;

  return (
    <div className="flex flex-col gap-5">
      {/* Info */}
      <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
        {operation && target !== null && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Operation:</span>
            <span className={`px-2.5 py-1 rounded-full border ${
              operation === "insert"
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                : "bg-amber-500/20 border-amber-500/40 text-amber-300"
            }`}>{operation}({target})</span>
          </div>
        )}
        {path.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Path:</span>
            <span className="text-zinc-300">{path.map((id) => nodeMap[id]?.value).filter(Boolean).join(" → ")}</span>
          </div>
        )}
      </div>

      {/* Tree SVG */}
      <div className="w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/20">
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="block">
          {/* Edges */}
          {nodes.map((node) => {
            const edges = [];
            if (node.left !== null) {
              const child = nodeMap[node.left];
              if (child)
                edges.push(
                  <line key={`${node.id}-l`}
                    x1={node.x} y1={node.y} x2={child.x} y2={child.y}
                    stroke="#3f3f46" strokeWidth={1.5} />
                );
            }
            if (node.right !== null) {
              const child = nodeMap[node.right];
              if (child)
                edges.push(
                  <line key={`${node.id}-r`}
                    x1={node.x} y1={node.y} x2={child.x} y2={child.y}
                    stroke="#3f3f46" strokeWidth={1.5} />
                );
            }
            return edges;
          })}
          {/* Nodes */}
          {nodes.map((node) => {
            const colors = STATE_COLORS[node.state] ?? STATE_COLORS.default;
            const isOnPath = path.includes(node.id);
            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                <circle r={18}
                  fill={isOnPath && node.state === "default" ? "rgba(99,102,241,0.15)" : colors.fill}
                  stroke={isOnPath && node.state === "default" ? "#4f46e5" : colors.stroke}
                  strokeWidth={node.id === current ? 2.5 : 1.5}
                />
                <text textAnchor="middle" dominantBaseline="middle"
                  fill={colors.text} fontSize={12} fontFamily="monospace" fontWeight="bold">
                  {node.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Comparing",  fill: "rgba(245,158,11,0.3)", stroke: "#f59e0b" },
          { label: "Found",      fill: "rgba(16,185,129,0.3)", stroke: "#10b981" },
          { label: "Inserted",   fill: "rgba(99,102,241,0.3)", stroke: "#6366f1" },
          { label: "Path",       fill: "rgba(99,102,241,0.15)", stroke: "#4f46e5" },
        ].map(({ label, fill, stroke }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <svg width={12} height={12}>
              <circle cx={6} cy={6} r={5} fill={fill} stroke={stroke} strokeWidth={1.5} />
            </svg>
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
