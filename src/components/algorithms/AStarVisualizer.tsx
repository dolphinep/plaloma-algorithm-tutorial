"use client";
import { useVisualizerStore } from "@/lib/store/visualizer";

type CellState = "empty" | "wall" | "start" | "end" | "frontier" | "visited" | "path";

interface AStarCell {
  state: CellState;
  g: number | null;
  h: number | null;
  f: number | null;
}

interface AStarState {
  grid: AStarCell[][];
  rows: number;
  cols: number;
  start: [number, number];
  end: [number, number];
  current: [number, number] | null;
  openSet: Array<{ pos: [number, number]; f: number }>;
  path: [number, number][];
  phase: "searching" | "done";
  found: boolean;
}

const CELL_STYLES: Record<CellState, string> = {
  empty:    "bg-zinc-900 border-zinc-800 text-zinc-700",
  wall:     "bg-zinc-700 border-zinc-600",
  start:    "bg-emerald-600/50 border-emerald-500 text-emerald-200",
  end:      "bg-rose-600/50 border-rose-500 text-rose-200",
  frontier: "bg-indigo-500/40 border-indigo-500 text-indigo-200",
  visited:  "bg-zinc-800 border-zinc-700 text-zinc-500",
  path:     "bg-amber-500/50 border-amber-400 text-amber-100",
};

export function AStarVisualizer() {
  const { steps, currentIndex } = useVisualizerStore();
  const step = steps[currentIndex];
  if (!step) return null;

  const { grid, current, openSet, path, phase, found, start, end } =
    step.state as unknown as AStarState;

  if (!grid || grid.length === 0) return null;

  return (
    <div className="flex flex-col gap-5">
      {/* Stats */}
      <div className="flex items-center gap-4 flex-wrap text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500">Open set:</span>
          <span className="text-indigo-300">{openSet.length} nodes</span>
        </div>
        {current && (
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Current:</span>
            <span className="text-amber-300">({current[0]}, {current[1]})</span>
            {grid[current[0]]?.[current[1]]?.f !== null && (
              <span className="text-zinc-500">f={grid[current[0]][current[1]].f}</span>
            )}
          </div>
        )}
        {phase === "done" && (
          <span className={`px-2.5 py-1 rounded-full border font-mono text-xs ${
            found
              ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
              : "bg-rose-500/20 border-rose-500/40 text-rose-300"
          }`}>{found ? `Path found (${path.length} steps)` : "No path found"}</span>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div
          className="inline-grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${grid[0]?.length ?? 0}, minmax(0, 1fr))` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isCurrent = current?.[0] === r && current?.[1] === c;
              const isPath = path.some(([pr, pc]) => pr === r && pc === c);
              const displayState: CellState = isPath && cell.state !== "start" && cell.state !== "end"
                ? "path"
                : cell.state;
              return (
                <div key={`${r}-${c}`}
                  className={`w-12 h-12 flex flex-col items-center justify-center rounded border text-[8px] font-mono transition-all duration-100 ${CELL_STYLES[displayState]} ${isCurrent ? "ring-1 ring-amber-400 scale-105" : ""}`}
                >
                  {cell.state !== "wall" && cell.f !== null ? (
                    <>
                      <span className="font-bold text-[9px]">{cell.f}</span>
                      <span className="opacity-60">{cell.g}+{cell.h}</span>
                    </>
                  ) : cell.state === "start" ? (
                    <span className="font-bold text-xs">S</span>
                  ) : cell.state === "end" ? (
                    <span className="font-bold text-xs">E</span>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cost legend */}
      <div className="text-xs font-mono text-zinc-500">
        Cell shows: <span className="text-zinc-300">f</span> = total cost, <span className="text-zinc-400">g</span> = cost from start, <span className="text-zinc-400">h</span> = heuristic to end
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
        {[
          { label: "Current",  cls: "ring-1 ring-amber-400 bg-zinc-900 border-zinc-800" },
          { label: "Open set", cls: "bg-indigo-500/40 border-indigo-500" },
          { label: "Visited",  cls: "bg-zinc-800 border-zinc-700" },
          { label: "Path",     cls: "bg-amber-500/50 border-amber-400" },
          { label: "Start",    cls: "bg-emerald-600/50 border-emerald-500" },
          { label: "End",      cls: "bg-rose-600/50 border-rose-500" },
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
