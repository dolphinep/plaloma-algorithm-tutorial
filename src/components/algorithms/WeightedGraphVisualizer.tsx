"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface WGNode { id: string; x: number; y: number; }
interface WGEdge { from: string; to: string; weight: number; }
interface DijkstraState {
  nodes: WGNode[];
  edges: WGEdge[];
  distances: Record<string, number>;
  visitedArr: string[];
  frontier: Array<{ id: string; dist: number }>;
  current: string | null;
  path: string[];
  parent: Record<string, string | null>;
}

const INF = 1e9;

function edgeInPath(path: string[], from: string, to: string) {
  for (let i = 0; i < path.length - 1; i++) {
    if ((path[i] === from && path[i + 1] === to) || (path[i] === to && path[i + 1] === from)) return true;
  }
  return false;
}

export function WeightedGraphVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const state = step.state as unknown as DijkstraState;
  const { nodes, edges, distances, visitedArr, frontier, current, path } = state;

  const nodeState = (id: string): "start" | "end" | "current" | "visited" | "frontier" | "default" => {
    const isStart = id === nodes[0]?.id;
    const isEnd   = id === nodes[nodes.length - 1]?.id;
    if (isStart) return "start";
    if (isEnd)   return "end";
    if (id === current) return "current";
    if (visitedArr.includes(id)) return "visited";
    if (frontier.some(f => f.id === id)) return "frontier";
    return "default";
  };

  const NODE_COLORS: Record<string, string> = {
    start:    "fill-emerald-500 stroke-emerald-300",
    end:      "fill-rose-500 stroke-rose-300",
    current:  "fill-amber-400 stroke-amber-200",
    visited:  "fill-indigo-600 stroke-indigo-400",
    frontier: "fill-amber-600/60 stroke-amber-500",
    default:  "fill-zinc-700 stroke-zinc-500",
  };

  const NODE_TEXT: Record<string, string> = {
    start: "fill-white", end: "fill-white", current: "fill-zinc-900",
    visited: "fill-white", frontier: "fill-white", default: "fill-zinc-200",
  };

  return (
    <div className="flex flex-col gap-5">
      {/* SVG graph */}
      <div className="overflow-x-auto">
        <svg viewBox="0 0 720 300" className="w-full max-w-2xl" style={{ minWidth: 420 }}>
          {/* Edges */}
          {edges.map((e, i) => {
            const from = nodes.find(n => n.id === e.from)!;
            const to   = nodes.find(n => n.id === e.to)!;
            if (!from || !to) return null;
            const inPath    = edgeInPath(path, e.from, e.to);
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            return (
              <g key={i}>
                <line
                  x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                  className={`stroke-2 transition-all duration-200 ${inPath ? "stroke-emerald-400" : "stroke-zinc-600"}`}
                  strokeWidth={inPath ? 3 : 1.5}
                />
                <rect x={midX - 12} y={midY - 10} width={24} height={18} rx={4}
                  className="fill-zinc-900" />
                <text x={midX} y={midY + 4} textAnchor="middle"
                  className={`text-[11px] font-mono font-semibold ${inPath ? "fill-emerald-400" : "fill-zinc-400"}`}
                  fontSize={11}>
                  {e.weight}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const ns   = nodeState(node.id);
            const dist = distances[node.id];
            const distLabel = dist === undefined || dist >= INF ? "∞" : String(dist);
            return (
              <g key={node.id} className="transition-all duration-200">
                <circle cx={node.x} cy={node.y} r={22}
                  className={`${NODE_COLORS[ns]} stroke-2 transition-all duration-200`}
                  strokeWidth={ns === "current" ? 3 : 2}
                />
                <text x={node.x} y={node.y + 5} textAnchor="middle"
                  className={`text-sm font-bold ${NODE_TEXT[ns]}`} fontSize={14}>
                  {node.id}
                </text>
                {/* Distance badge */}
                <rect x={node.x + 12} y={node.y - 32} width={30} height={16} rx={4}
                  className="fill-zinc-800 stroke-zinc-700" strokeWidth={1} />
                <text x={node.x + 27} y={node.y - 21} textAnchor="middle"
                  className="fill-zinc-300 font-mono" fontSize={10}>
                  {distLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Distance table */}
      <div className="flex flex-wrap gap-2">
        {nodes.map(n => {
          const dist = distances[n.id];
          const ns   = nodeState(n.id);
          return (
            <div key={n.id} className={`flex flex-col items-center px-3 py-2 rounded-lg border text-xs font-mono transition-all duration-200 ${
              ns === "current"  ? "bg-amber-500/20 border-amber-500 text-amber-200" :
              ns === "visited"  ? "bg-indigo-900/40 border-indigo-700 text-indigo-300" :
              path.includes(n.id) ? "bg-emerald-900/40 border-emerald-700 text-emerald-300" :
              "bg-zinc-900 border-zinc-800 text-zinc-400"
            }`}>
              <span className="font-semibold">{n.id}</span>
              <span>{dist === undefined || dist >= INF ? "∞" : dist}</span>
            </div>
          );
        })}
      </div>

      {/* Priority queue */}
      {frontier.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Priority queue (min-dist first)</span>
          <div className="flex flex-wrap gap-1.5">
            {[...frontier].sort((a, b) => a.dist - b.dist).slice(0, 8).map((f, i) => (
              <span key={i} className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300">
                {f.id}={f.dist >= INF ? "∞" : f.dist}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Path result */}
      {path.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">Shortest path</span>
          {path.map((n, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="font-mono text-sm font-semibold text-emerald-400">{n}</span>
              {i < path.length - 1 && <span className="text-zinc-600 text-xs">→</span>}
            </span>
          ))}
          <span className="text-xs text-zinc-500 ml-1">
            (dist: {distances[path[path.length - 1]] ?? "?"})
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Start",    cls: "bg-emerald-500" },
          { label: "End",      cls: "bg-rose-500" },
          { label: "Current",  cls: "bg-amber-400" },
          { label: "Visited",  cls: "bg-indigo-600" },
          { label: "Frontier", cls: "bg-amber-600/60" },
          { label: "Path",     cls: "bg-emerald-400" },
        ].map(({ label, cls }) => (
          <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <div className={`w-3 h-3 rounded-full ${cls}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}
