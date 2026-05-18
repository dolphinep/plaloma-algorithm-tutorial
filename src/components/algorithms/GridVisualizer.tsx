"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";
import type { CellState, GridState } from "@/lib/algorithms/grid-utils";

const CELL_STYLES: Record<CellState, string> = {
  unvisited:  "bg-zinc-900 border-zinc-800",
  wall:       "bg-zinc-700 border-zinc-600",
  start:      "bg-emerald-500 border-emerald-400 text-white",
  end:        "bg-rose-500 border-rose-400 text-white",
  visited:    "bg-indigo-900/60 border-indigo-800",
  frontier:   "bg-amber-500/40 border-amber-500",
  current:    "bg-amber-400 border-amber-300 scale-110 z-10",
  path:       "bg-emerald-400/80 border-emerald-300",
};

const LEGEND = [
  { state: "start",    label: "Start" },
  { state: "end",      label: "End" },
  { state: "current",  label: "Current" },
  { state: "frontier", label: "Queue / Stack" },
  { state: "visited",  label: "Visited" },
  { state: "path",     label: "Path" },
  { state: "wall",     label: "Wall" },
] as const;

export function GridVisualizer({ algorithmType }: { algorithmType: "bfs" | "dfs" }) {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];

  if (!step) return null;

  const state = step.state as unknown as GridState;
  const { cells, frontier, current, targetFound, pathLength } = state;

  return (
    <div className="flex flex-col gap-5">
      {/* Data structure label */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">
          {algorithmType === "bfs" ? "Queue (FIFO)" : "Stack (LIFO)"}
        </span>
        {targetFound && pathLength !== null && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            Path found — {pathLength} step{pathLength !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Grid */}
      <div
        className="inline-grid gap-1"
        style={{ gridTemplateColumns: `repeat(${cells[0]?.length ?? 1}, minmax(0, 1fr))` }}
      >
        {cells.map((row, r) =>
          row.map((cell, c) => {
            const isCurrent = current?.[0] === r && current?.[1] === c;
            const effectiveCell = isCurrent && cell !== "start" && cell !== "end" ? "current" : cell;

            return (
              <div
                key={`${r}-${c}`}
                title={`(${r},${c}) — ${effectiveCell}`}
                className={`
                  w-9 h-9 sm:w-10 sm:h-10 rounded border flex items-center justify-center
                  text-[10px] font-mono transition-all duration-200 relative
                  ${CELL_STYLES[effectiveCell]}
                `}
              >
                {cell === "start" && <span className="text-[9px] font-bold">S</span>}
                {cell === "end"   && <span className="text-[9px] font-bold">E</span>}
              </div>
            );
          })
        )}
      </div>

      {/* Frontier list */}
      {frontier.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">
            {algorithmType === "bfs" ? "Queue contents (front → back)" : "Stack contents (top → bottom)"}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {frontier.slice(0, 12).map(([fr, fc], i) => (
              <span
                key={`${fr}-${fc}-${i}`}
                className="font-mono text-[11px] px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300"
              >
                ({fr},{fc})
              </span>
            ))}
            {frontier.length > 12 && (
              <span className="text-xs text-zinc-600 self-center">+{frontier.length - 12} more</span>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-zinc-800">
        {LEGEND.map(({ state, label }) => (
          <div key={state} className="flex items-center gap-1.5 text-xs text-zinc-400">
            <div className={`w-4 h-4 rounded border shrink-0 ${CELL_STYLES[state]}`} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BFSVisualizer() {
  return <GridVisualizer algorithmType="bfs" />;
}

export function DFSVisualizer() {
  return <GridVisualizer algorithmType="dfs" />;
}
