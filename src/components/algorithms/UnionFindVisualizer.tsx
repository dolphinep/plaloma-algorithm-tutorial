"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

interface UnionFindState {
  elements: number[];
  parent: number[];
  rank: number[];
  components: number;
  currentOp: { type: "union" | "find"; a: number; b?: number } | null;
  activeNodes: number[];
  rootNodes: number[];
  phase: "init" | "operating" | "done";
}

const PALETTE = [
  { bg: "bg-indigo-900/50", border: "border-indigo-600", text: "text-indigo-200" },
  { bg: "bg-amber-900/40",  border: "border-amber-600",  text: "text-amber-200"  },
  { bg: "bg-rose-900/40",   border: "border-rose-600",   text: "text-rose-200"   },
  { bg: "bg-violet-900/40", border: "border-violet-600", text: "text-violet-200" },
  { bg: "bg-teal-900/40",   border: "border-teal-600",   text: "text-teal-200"   },
  { bg: "bg-orange-900/40", border: "border-orange-600", text: "text-orange-200" },
];

export function UnionFindVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { elements, parent, rank, components, currentOp, activeNodes, rootNodes } =
    step.state as unknown as UnionFindState;

  // Find root of each element (following parent chain)
  const findRoot = (i: number): number => {
    let x = i;
    while (parent[x] !== x) x = parent[x];
    return x;
  };

  // Group elements by root
  const groups: Record<number, number[]> = {};
  elements.forEach((el) => {
    const root = findRoot(el);
    if (!groups[root]) groups[root] = [];
    groups[root].push(el);
  });

  const rootList = Object.keys(groups).map(Number).sort((a, b) => a - b);

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="flex items-center gap-4 text-xs font-mono flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 uppercase tracking-wider">Components</span>
          <span className="px-3 py-1 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 font-semibold">{components}</span>
        </div>
        {currentOp && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Operation:</span>
            <span className={`px-2.5 py-1 rounded-full border ${
              currentOp.type === "union"
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                : "bg-violet-500/20 border-violet-500/40 text-violet-300"
            }`}>
              {currentOp.type === "union"
                ? `union(${currentOp.a}, ${currentOp.b})`
                : `find(${currentOp.a})`}
            </span>
          </div>
        )}
      </div>

      {/* Component groups */}
      <div className="flex flex-wrap gap-3">
        {rootList.map((root, groupIdx) => {
          const color = PALETTE[groupIdx % PALETTE.length];
          const members = groups[root];
          return (
            <div key={root} className={`flex flex-col gap-2 p-3 rounded-xl border ${color.border} ${color.bg}`}>
              <span className={`text-[10px] font-mono ${color.text} opacity-70`}>root: {root}</span>
              <div className="flex gap-1.5 flex-wrap">
                {members.map((el) => {
                  const isActive = activeNodes.includes(el);
                  const isRoot = el === root;
                  return (
                    <div key={el} className={`flex flex-col items-center gap-0.5`}>
                      <div className={`w-9 h-9 flex items-center justify-center rounded-lg border-2 font-mono text-sm font-bold transition-all duration-200 ${
                        isActive
                          ? "bg-amber-500/50 border-amber-400 text-amber-100 scale-110"
                          : isRoot
                          ? `border-2 ${color.border} ${color.bg} ${color.text} ring-1 ring-white/20`
                          : `border ${color.border} bg-zinc-900/40 ${color.text}`
                      }`}>
                        {el}
                      </div>
                      <span className={`text-[8px] font-mono ${isRoot ? color.text : "text-zinc-600"}`}>
                        {isRoot ? "root" : `p:${parent[el]}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Parent array */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">Parent array</span>
        <div className="flex gap-1.5 flex-wrap">
          {elements.map((el) => (
            <div key={el} className="flex flex-col items-center gap-0.5">
              <div className={`w-9 h-9 flex items-center justify-center rounded border font-mono text-xs font-semibold ${
                activeNodes.includes(el)
                  ? "bg-amber-500/30 border-amber-500 text-amber-200"
                  : rootNodes.includes(el)
                  ? "bg-zinc-700 border-zinc-600 text-zinc-200"
                  : "bg-zinc-800 border-zinc-700 text-zinc-400"
              }`}>
                {parent[el]}
              </div>
              <span className="text-[8px] text-zinc-600 font-mono">{el}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
