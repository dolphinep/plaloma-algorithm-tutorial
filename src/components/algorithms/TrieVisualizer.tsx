"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface TrieNode {
  id: number;
  char: string;
  isEnd: boolean;
  children: number[];
  x: number;
  y: number;
  state: "default" | "active" | "found" | "inserted" | "searching";
}

interface TrieState {
  nodes: TrieNode[];
  currentPath: number[];
  operation: "insert" | "search" | null;
  word: string | null;
  matchedSoFar: string;
  found: boolean | null;
  insertedWords: string[];
  phase: "traversing" | "done";
}

const NODE_COLORS: Record<TrieNode["state"], { fill: string; stroke: string; text: string }> = {
  default:    { fill: "rgba(63,63,70,0.4)",   stroke: "#52525b", text: "#a1a1aa" },
  active:     { fill: "rgba(245,158,11,0.3)", stroke: "#f59e0b", text: "#fde68a" },
  found:      { fill: "rgba(16,185,129,0.3)", stroke: "#10b981", text: "#6ee7b7" },
  inserted:   { fill: "rgba(99,102,241,0.3)", stroke: "#6366f1", text: "#a5b4fc" },
  searching:  { fill: "rgba(139,92,246,0.3)", stroke: "#8b5cf6", text: "#c4b5fd" },
};

export function TrieVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { nodes, currentPath, operation, word, matchedSoFar, found, insertedWords } =
    step.state as unknown as TrieState;

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="flex flex-col gap-5">
      {/* Info */}
      <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
        {operation && word && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Op:</span>
            <span className={`px-2.5 py-1 rounded-full border ${
              operation === "insert"
                ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                : "bg-violet-500/20 border-violet-500/40 text-violet-300"
            }`}>{operation}("{word}")</span>
          </div>
        )}
        {matchedSoFar && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Matched:</span>
            <span className="text-amber-300">"{matchedSoFar}"</span>
          </div>
        )}
        {insertedWords.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-zinc-500">Words:</span>
            {insertedWords.map((w) => (
              <span key={w} className="px-1.5 py-0.5 rounded bg-emerald-900/30 border border-emerald-800 text-emerald-400">"{w}"</span>
            ))}
          </div>
        )}
      </div>

      {/* Trie SVG */}
      <div className="w-full overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/20">
        <svg width={620} height={280} viewBox="0 0 620 280" className="block">
          {/* Edges */}
          {nodes.map((node) =>
            node.children.map((childId) => {
              const child = nodeMap[childId];
              if (!child) return null;
              const isOnPath = currentPath.includes(node.id) && currentPath.includes(childId);
              return (
                <line key={`${node.id}-${childId}`}
                  x1={node.x} y1={node.y} x2={child.x} y2={child.y}
                  stroke={isOnPath ? "#f59e0b" : "#3f3f46"}
                  strokeWidth={isOnPath ? 2 : 1.5}
                />
              );
            })
          )}
          {/* Nodes */}
          {nodes.map((node) => {
            const colors = NODE_COLORS[node.state] ?? NODE_COLORS.default;
            const isOnPath = currentPath.includes(node.id);
            return (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                <circle r={node.id === 0 ? 14 : 16}
                  fill={isOnPath && node.state === "default" ? "rgba(245,158,11,0.15)" : colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={node.isEnd ? 3 : 1.5}
                  strokeDasharray={node.isEnd ? "none" : "none"}
                />
                {node.isEnd && (
                  <circle r={node.id === 0 ? 18 : 20} fill="none" stroke={colors.stroke} strokeWidth={1} opacity={0.4} />
                )}
                <text textAnchor="middle" dominantBaseline="middle"
                  fill={colors.text} fontSize={11} fontFamily="monospace" fontWeight="bold">
                  {node.id === 0 ? "·" : node.char}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Result */}
      {found !== null && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-mono ${
          found
            ? "border-emerald-800 bg-emerald-900/20 text-emerald-300"
            : "border-zinc-700 bg-zinc-900/20 text-zinc-400"
        }`}>
          {found
            ? `"${word}" found in trie`
            : `"${word}" not found in trie`}
        </div>
      )}
    </div>
  );
}
