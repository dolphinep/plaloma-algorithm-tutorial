// Shared types and maze used by BFS, DFS, A*, Dijkstra (grid variants)

export type CellState =
  | "unvisited"
  | "wall"
  | "start"
  | "end"
  | "visited"
  | "frontier"
  | "current"
  | "path";

export interface GridState {
  cells: CellState[][];
  frontier: [number, number][];
  current: [number, number] | null;
  targetFound: boolean;
  pathLength: number | null;
}

export interface GridInput {
  rows: number;
  cols: number;
  start: [number, number];
  end: [number, number];
  walls: [number, number][];
}

// Default demo maze — designed so BFS finds a short path and DFS visibly backtracks
export const DEFAULT_GRID: GridInput = {
  rows: 7,
  cols: 10,
  start: [0, 0],
  end: [6, 9],
  walls: [
    // Column barrier left side
    [1, 2], [2, 2], [3, 2],
    // Mid barrier
    [0, 4], [1, 4], [2, 4], [3, 4],
    // Right barrier forcing detour
    [3, 6], [4, 6], [5, 6],
    // Small blockers
    [5, 1], [5, 2],
    [1, 7], [2, 7],
    [4, 3], [4, 4],
  ],
};

export const DIRS: [number, number][] = [
  [0, 1],   // right
  [1, 0],   // down
  [0, -1],  // left
  [-1, 0],  // up
];

export function cellKey(r: number, c: number) {
  return `${r},${c}`;
}

export function buildGrid(
  input: GridInput,
  visited: Set<string>,
  overrides: Partial<Record<string, CellState>>
): CellState[][] {
  const wallSet = new Set(input.walls.map(([r, c]) => cellKey(r, c)));
  const startKey = cellKey(input.start[0], input.start[1]);
  const endKey = cellKey(input.end[0], input.end[1]);

  return Array.from({ length: input.rows }, (_, r) =>
    Array.from({ length: input.cols }, (_, c) => {
      const k = cellKey(r, c);
      if (overrides[k]) return overrides[k]!;
      if (wallSet.has(k)) return "wall";
      if (k === startKey) return "start";
      if (k === endKey) return "end";
      if (visited.has(k)) return "visited";
      return "unvisited";
    })
  );
}

export function reconstructPath(
  parent: Map<string, [number, number] | null>,
  start: [number, number],
  end: [number, number]
): [number, number][] {
  const path: [number, number][] = [];
  let cur: [number, number] | null = end;
  while (cur) {
    path.unshift(cur);
    const key = cellKey(cur[0], cur[1]);
    cur = parent.get(key) ?? null;
  }
  return path;
}
