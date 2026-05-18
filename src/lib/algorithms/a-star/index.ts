import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface AStarCell {
  state: "empty" | "wall" | "start" | "end" | "frontier" | "visited" | "path";
  g: number | null;
  h: number | null;
  f: number | null;
}

export interface AStarState {
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

export interface AStarInput {
  rows: number;
  cols: number;
  start: [number, number];
  end: [number, number];
  walls: [number, number][];
}

// ─── Default demo grid (6×8) ──────────────────────────────────────────────────
// Walls form two barriers that force the path to curve around them

const DEFAULT_INPUT: AStarInput = {
  rows: 6,
  cols: 8,
  start: [0, 0],
  end: [5, 7],
  walls: [
    // Vertical barrier on column 2, rows 1-4
    [1, 2], [2, 2], [3, 2], [4, 2],
    // Horizontal barrier on row 2, cols 4-6
    [2, 4], [2, 5], [2, 6],
    // Small blocker near the goal
    [4, 5], [4, 6],
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cellKey(r: number, c: number): string {
  return `${r},${c}`;
}

function manhattan(r1: number, c1: number, r2: number, c2: number): number {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2);
}

const DIRS: [number, number][] = [
  [0, 1],   // right
  [1, 0],   // down
  [0, -1],  // left
  [-1, 0],  // up
];

function buildGrid(
  input: AStarInput,
  gMap: Map<string, number>,
  hMap: Map<string, number>,
  closedSet: Set<string>,
  openKeys: Set<string>,
  pathSet: Set<string>,
  current: [number, number] | null
): AStarCell[][] {
  const wallSet = new Set(input.walls.map(([r, c]) => cellKey(r, c)));
  const startKey = cellKey(input.start[0], input.start[1]);
  const endKey = cellKey(input.end[0], input.end[1]);

  return Array.from({ length: input.rows }, (_, r) =>
    Array.from({ length: input.cols }, (_, c): AStarCell => {
      const k = cellKey(r, c);
      const g = gMap.has(k) ? gMap.get(k)! : null;
      const h = hMap.has(k) ? hMap.get(k)! : null;
      const f = g !== null && h !== null ? g + h : null;

      let state: AStarCell["state"];
      if (wallSet.has(k)) {
        state = "wall";
      } else if (k === startKey) {
        state = "start";
      } else if (k === endKey) {
        state = "end";
      } else if (pathSet.has(k)) {
        state = "path";
      } else if (current && cellKey(current[0], current[1]) === k) {
        state = "visited";
      } else if (closedSet.has(k)) {
        state = "visited";
      } else if (openKeys.has(k)) {
        state = "frontier";
      } else {
        state = "empty";
      }

      return { state, g, h, f };
    })
  );
}

// ─── Step generator ───────────────────────────────────────────────────────────

function generateSteps(input: AStarInput): AlgorithmStep<AStarState>[] {
  const { rows, cols, start, end, walls } = input;
  const wallSet = new Set(walls.map(([r, c]) => cellKey(r, c)));
  const steps: AlgorithmStep<AStarState>[] = [];

  // g[node] = cost from start; parent[node] = predecessor
  const gMap = new Map<string, number>();
  const hMap = new Map<string, number>();
  const parent = new Map<string, [number, number] | null>();
  const closedSet = new Set<string>();

  const startKey = cellKey(start[0], start[1]);
  const endKey = cellKey(end[0], end[1]);

  const hStart = manhattan(start[0], start[1], end[0], end[1]);
  gMap.set(startKey, 0);
  hMap.set(startKey, hStart);
  parent.set(startKey, null);

  // Open set: sorted array used as a priority queue (min-heap by f)
  let openList: Array<{ pos: [number, number]; f: number }> = [
    { pos: [start[0], start[1]], f: hStart },
  ];
  const openKeys = new Set<string>([startKey]);

  const snapshot = (
    current: [number, number] | null,
    description: string,
    path: [number, number][] = [],
    phase: "searching" | "done" = "searching",
    found = false,
    variables?: Record<string, string | number | boolean>
  ): AlgorithmStep<AStarState> => {
    const pathSet = new Set(path.map(([r, c]) => cellKey(r, c)));
    return {
      description,
      state: {
        grid: buildGrid(input, gMap, hMap, closedSet, openKeys, pathSet, current),
        rows,
        cols,
        start: [start[0], start[1]],
        end: [end[0], end[1]],
        current,
        openSet: openList.map(e => ({ pos: [e.pos[0], e.pos[1]] as [number, number], f: e.f })),
        path: path.map(p => [p[0], p[1]] as [number, number]),
        phase,
        found,
      },
      highlights: {},
      variables,
    };
  };

  // Initial step
  steps.push(
    snapshot(
      null,
      `Initialize A*. Start=(${start[0]},${start[1]}), End=(${end[0]},${end[1]}). ` +
        `h(start)=${hStart}. Push start to open set with f=${hStart}.`,
      [],
      "searching",
      false,
      { "open set size": 1, g_start: 0, h_start: hStart }
    )
  );

  while (openList.length > 0) {
    // Pop node with lowest f
    openList.sort((a, b) => a.f - b.f);
    const { pos: current } = openList.shift()!;
    const [cr, cc] = current;
    const ck = cellKey(cr, cc);
    openKeys.delete(ck);

    // Goal reached
    if (ck === endKey) {
      // Reconstruct path
      const path: [number, number][] = [];
      let cur: [number, number] | null = [cr, cc];
      while (cur !== null) {
        path.unshift([cur[0], cur[1]]);
        const k = cellKey(cur[0], cur[1]);
        cur = parent.get(k) ?? null;
      }

      steps.push(
        snapshot(
          current,
          `Reached goal (${cr},${cc})! g=${gMap.get(ck)}. Reconstructing path — ${path.length - 1} step(s).`,
          path,
          "done",
          true,
          { "path length": path.length - 1, "nodes explored": closedSet.size }
        )
      );
      return steps;
    }

    closedSet.add(ck);
    const gCurrent = gMap.get(ck) ?? 0;

    steps.push(
      snapshot(
        current,
        `Expand (${cr},${cc}). g=${gCurrent}, h=${hMap.get(ck)}, f=${gMap.get(ck)! + (hMap.get(ck) ?? 0)}. Move to closed set.`,
        [],
        "searching",
        false,
        { current: `(${cr},${cc})`, "g(current)": gCurrent, "open size": openList.length, closed: closedSet.size }
      )
    );

    for (const [dr, dc] of DIRS) {
      const nr = cr + dr;
      const nc = cc + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      const nk = cellKey(nr, nc);
      if (wallSet.has(nk) || closedSet.has(nk)) continue;

      const tentativeG = gCurrent + 1;
      const existingG = gMap.get(nk);

      if (existingG === undefined || tentativeG < existingG) {
        const h = manhattan(nr, nc, end[0], end[1]);
        const f = tentativeG + h;
        gMap.set(nk, tentativeG);
        hMap.set(nk, h);
        parent.set(nk, [cr, cc]);

        if (!openKeys.has(nk)) {
          openList.push({ pos: [nr, nc], f });
          openKeys.add(nk);
        } else {
          // Update f in open list
          const idx = openList.findIndex(e => cellKey(e.pos[0], e.pos[1]) === nk);
          if (idx !== -1) openList[idx] = { pos: [nr, nc], f };
        }

        steps.push(
          snapshot(
            current,
            `Neighbor (${nr},${nc}): g=${tentativeG}, h=${h}, f=${f}.` +
              (existingG !== undefined ? ` Updated (was g=${existingG}).` : " Added to open set."),
            [],
            "searching",
            false,
            { neighbor: `(${nr},${nc})`, "g(n)": tentativeG, "h(n)": h, "f(n)": f }
          )
        );
      }
    }
  }

  // Exhausted open set — no path
  steps.push(
    snapshot(
      null,
      `Open set is empty — no path exists from (${start[0]},${start[1]}) to (${end[0]},${end[1]}).`,
      [],
      "done",
      false,
      { found: false, "nodes explored": closedSet.size }
    )
  );

  return steps;
}

// ─── Algorithm definition ─────────────────────────────────────────────────────

export const aStar: AlgorithmDefinition<AStarInput, AStarState> = {
  slug: "a-star",
  name: "A* Search",
  category: "graph",
  difficulty: "advanced",
  tags: ["graph", "shortest-path", "heuristic", "informed", "pathfinding"],
  summary: "Dijkstra + a heuristic to guide search toward the goal — finds optimal paths faster by prioritizing promising directions.",

  description: `A* (pronounced "A-star") is an **informed search algorithm** that finds the shortest path between two nodes in a weighted graph. Unlike Dijkstra's algorithm, which expands nodes in all directions based solely on their distance from the source, A* uses a **heuristic function h(n)** to estimate the remaining cost to the goal. At each step it picks the node that minimises **f(n) = g(n) + h(n)**, where g(n) is the actual cost from the start and h(n) is the heuristic estimate to the goal.

On a grid with Manhattan distance as the heuristic, A* focuses its search toward the goal and typically visits far fewer nodes than Dijkstra. The algorithm is **admissible** (guaranteed to find the optimal path) as long as the heuristic never overestimates the true cost — a condition the Manhattan distance satisfies on a grid where movement is restricted to four directions.

The key insight is the **open set** (priority queue ordered by f) and the **closed set** (already-expanded nodes). When a node is popped from the open set, it has the lowest tentative total cost; its neighbours are relaxed if a shorter path is found. Once the goal is popped, the shortest path is reconstructed by following parent pointers back to the start. The trade-off versus Dijkstra is that A* requires a good heuristic — a poor or inadmissible one can produce sub-optimal paths.`,

  realWorldUsage: [
    {
      system: "Google Maps / Apple Maps navigation",
      useCase: "Real-time turn-by-turn route planning",
      why: "Road networks are huge weighted graphs. A* with a geographic distance heuristic focuses the search toward the destination, making route computation fast enough to run on a phone. Bidirectional A* and preprocessing techniques like contraction hierarchies extend this to continent-scale maps.",
    },
    {
      system: "Game AI pathfinding (Unity, Unreal Engine)",
      useCase: "NPC movement on tile maps and NavMeshes",
      why: "A* is the de-facto standard for game pathfinding. Unity's NavMesh agent and most tile-based game engines ship A* as the built-in path planner. The heuristic is tunable: tie-breaking and weighted variants let designers balance optimality against compute budget per frame.",
    },
    {
      system: "Robotics motion planning (ROS)",
      useCase: "Collision-free path planning in 2D/3D occupancy grids",
      why: "The ROS navigation stack uses A* (or Dijkstra as a fallback) on a costmap to find paths for wheeled robots. Obstacle inflation and terrain cost layers make the heuristic inadmissible in practice, so the implementation often uses weighted A* to trade slight sub-optimality for speed.",
    },
  ],

  complexity: {
    time: { best: "O(E)", average: "O(b^d)", worst: "O(b^d)" },
    space: "O(b^d)",
  },

  related: ["dijkstra", "bfs"],
  implemented: true,
  defaultInput: DEFAULT_INPUT,
  generateSteps,

  code: {
    typescript: `// A* on a grid with Manhattan distance heuristic
type Pos = [number, number];

function aStar(
  grid: string[][],   // "." = passable, "#" = wall
  start: Pos,
  end: Pos
): Pos[] | null {
  const rows = grid.length;
  const cols = grid[0].length;

  const key  = ([r, c]: Pos) => \`\${r},\${c}\`;
  const h    = ([r, c]: Pos) => Math.abs(r - end[0]) + Math.abs(c - end[1]);
  const DIRS: Pos[] = [[0,1],[1,0],[0,-1],[-1,0]];

  const g      = new Map<string, number>([[key(start), 0]]);
  const parent = new Map<string, Pos | null>([[key(start), null]]);
  // Open set as sorted array — swap for a real min-heap in production
  let open: Array<{ pos: Pos; f: number }> = [{ pos: start, f: h(start) }];
  const closed = new Set<string>();

  while (open.length > 0) {
    open.sort((a, b) => a.f - b.f);
    const { pos: cur } = open.shift()!;
    const ck = key(cur);

    if (ck === key(end)) {
      // Reconstruct path
      const path: Pos[] = [];
      let c: Pos | null = end;
      while (c) { path.unshift(c); c = parent.get(key(c)) ?? null; }
      return path;
    }

    closed.add(ck);
    const gc = g.get(ck)!;

    for (const [dr, dc] of DIRS) {
      const nb: Pos = [cur[0] + dr, cur[1] + dc];
      const [nr, nc] = nb;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (grid[nr][nc] === "#") continue;
      const nk = key(nb);
      if (closed.has(nk)) continue;

      const tg = gc + 1;
      if (!g.has(nk) || tg < g.get(nk)!) {
        g.set(nk, tg);
        parent.set(nk, cur);
        const f = tg + h(nb);
        const idx = open.findIndex(e => key(e.pos) === nk);
        if (idx === -1) open.push({ pos: nb, f });
        else open[idx] = { pos: nb, f };
      }
    }
  }

  return null; // no path
}`,

    go: `package main

import (
	"container/heap"
	"fmt"
	"math"
)

type Pos struct{ r, c int }

type Item struct {
	pos Pos
	f   int
	idx int
}

type PQ []*Item

func (pq PQ) Len() int            { return len(pq) }
func (pq PQ) Less(i, j int) bool  { return pq[i].f < pq[j].f }
func (pq PQ) Swap(i, j int)       { pq[i], pq[j] = pq[j], pq[i]; pq[i].idx = i; pq[j].idx = j }
func (pq *PQ) Push(x any)         { item := x.(*Item); item.idx = len(*pq); *pq = append(*pq, item) }
func (pq *PQ) Pop() any           { old := *pq; n := len(old); x := old[n-1]; *pq = old[:n-1]; return x }

var dirs = []Pos{{0,1},{1,0},{0,-1},{-1,0}}

func astar(grid []string, start, end Pos) []Pos {
	rows, cols := len(grid), len(grid[0])
	key := func(p Pos) int { return p.r*cols + p.c }
	h   := func(p Pos) int { return int(math.Abs(float64(p.r-end.r)) + math.Abs(float64(p.c-end.c))) }

	g      := map[int]int{key(start): 0}
	parent := map[int]int{key(start): -1}
	closed := map[int]bool{}

	pq := &PQ{{pos: start, f: h(start)}}
	heap.Init(pq)

	for pq.Len() > 0 {
		cur := heap.Pop(pq).(*Item).pos
		ck  := key(cur)
		if closed[ck] { continue }
		closed[ck] = true

		if cur == end {
			path := []Pos{}
			for k := key(end); k != -1; k = parent[k] {
				path = append([]Pos{{k / cols, k % cols}}, path...)
			}
			return path
		}

		gc := g[ck]
		for _, d := range dirs {
			nb := Pos{cur.r + d.r, cur.c + d.c}
			if nb.r < 0 || nb.r >= rows || nb.c < 0 || nb.c >= cols { continue }
			if grid[nb.r][nb.c] == '#' { continue }
			nk := key(nb)
			if closed[nk] { continue }
			tg := gc + 1
			if prev, ok := g[nk]; !ok || tg < prev {
				g[nk]      = tg
				parent[nk] = ck
				heap.Push(pq, &Item{pos: nb, f: tg + h(nb)})
			}
		}
	}
	return nil
}

func main() {
	grid := []string{
		"........",
		"..#.....",
		"..#.###.",
		"..#.....",
		".....##.",
		".......*",
	}
	path := astar(grid, Pos{0,0}, Pos{5,7})
	fmt.Println("Path length:", len(path)-1)
}`,

    rust: `use std::cmp::Reverse;
use std::collections::{BinaryHeap, HashMap, HashSet};

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
struct Pos { r: i32, c: i32 }

fn astar(grid: &[&str], start: Pos, end: Pos) -> Option<Vec<Pos>> {
    let rows = grid.len() as i32;
    let cols = grid[0].len() as i32;
    let h = |p: Pos| -> i32 { (p.r - end.r).abs() + (p.c - end.c).abs() };
    let dirs = [(0,1),(1,0),(0,-1),(-1,0)];

    let mut g: HashMap<Pos, i32> = HashMap::from([(start, 0)]);
    let mut parent: HashMap<Pos, Option<Pos>> = HashMap::from([(start, None)]);
    let mut closed: HashSet<Pos> = HashSet::new();
    // (Reverse(f), pos)
    let mut open: BinaryHeap<(Reverse<i32>, i32, i32)> = BinaryHeap::new();
    open.push((Reverse(h(start)), start.r, start.c));

    while let Some((_, r, c)) = open.pop() {
        let cur = Pos { r, c };
        if !closed.insert(cur) { continue; } // already expanded

        if cur == end {
            let mut path = vec![];
            let mut node = Some(end);
            while let Some(n) = node {
                path.push(n);
                node = *parent.get(&n).unwrap();
            }
            path.reverse();
            return Some(path);
        }

        let gc = g[&cur];
        for (dr, dc) in &dirs {
            let nb = Pos { r: r + dr, c: c + dc };
            if nb.r < 0 || nb.r >= rows || nb.c < 0 || nb.c >= cols { continue; }
            let ch = grid[nb.r as usize].as_bytes()[nb.c as usize];
            if ch == b'#' || closed.contains(&nb) { continue; }
            let tg = gc + 1;
            if tg < *g.get(&nb).unwrap_or(&i32::MAX) {
                g.insert(nb, tg);
                parent.insert(nb, Some(cur));
                open.push((Reverse(tg + h(nb)), nb.r, nb.c));
            }
        }
    }
    None
}

fn main() {
    let grid = &["........","..#.....","..#.###.","..#.....","......##",".......*"];
    let path = astar(grid, Pos{r:0,c:0}, Pos{r:5,c:7});
    println!("{:?}", path.map(|p| p.len() - 1));
}`,
  },
};
