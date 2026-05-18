import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface DPTableState {
  table: (number | null)[][];
  rows: number;
  cols: number;
  activeCell: [number, number] | null;
  highlightedCells: [number, number][];
  phase: "init" | "filling" | "done";
  auxiliaryData?: Record<string, unknown>;
}

export interface FloydWarshallInput {
  nodeCount: number;
  edges: Array<{ from: number; to: number; weight: number }>;
}

// ─── Default demo graph (5 nodes, directed, weighted) ────────────────────────
//
//  0 ──4──> 1 ──3──> 2
//  |        |        ^
//  8        2        |
//  v        v        1
//  3 <──1── 4 ───────┘
//
//  (plus 0→2 direct weight 10, 3→4 weight 5)

const DEFAULT_INPUT: FloydWarshallInput = {
  nodeCount: 5,
  edges: [
    { from: 0, to: 1, weight: 4 },
    { from: 0, to: 2, weight: 10 },
    { from: 0, to: 3, weight: 8 },
    { from: 1, to: 2, weight: 3 },
    { from: 1, to: 4, weight: 2 },
    { from: 2, to: 4, weight: 1 },
    { from: 3, to: 4, weight: 5 },
    { from: 4, to: 2, weight: 1 },
    { from: 4, to: 3, weight: 1 },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INF = Infinity;

function toTable(dist: number[][]): (number | null)[][] {
  return dist.map((row) =>
    row.map((v) => (v === INF ? null : v))
  );
}

function cloneTable(dist: number[][]): number[][] {
  return dist.map((row) => [...row]);
}

// ─── Step generator ───────────────────────────────────────────────────────────

function generateSteps(
  input: FloydWarshallInput
): AlgorithmStep<DPTableState>[] {
  const { nodeCount, edges } = input;
  const n = nodeCount;
  const steps: AlgorithmStep<DPTableState>[] = [];

  // Initialize dist matrix
  const dist: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : INF))
  );

  for (const { from, to, weight } of edges) {
    dist[from][to] = weight;
  }

  const nodeLabels = Array.from({ length: n }, (_, i) => String(i));

  // ── Step 0: Initial state ──────────────────────────────────────────────────
  steps.push({
    description:
      "Initialize the distance matrix. Set dist[i][i] = 0 for all i, dist[i][j] = edge weight if a direct edge exists, and dist[i][j] = ∞ otherwise.",
    state: {
      table: toTable(cloneTable(dist)),
      rows: n,
      cols: n,
      activeCell: null,
      highlightedCells: [],
      phase: "init",
      auxiliaryData: { nodeLabels, k: null, i: null, j: null },
    },
    highlights: {},
    variables: { phase: "init", k: "—", i: "—", j: "—" },
  });

  // ── Main triple loop ───────────────────────────────────────────────────────
  for (let k = 0; k < n; k++) {
    // Announce new intermediate vertex
    steps.push({
      description: `Consider vertex ${k} as intermediate. For every pair (i, j), test whether routing through ${k} gives a shorter path.`,
      state: {
        table: toTable(cloneTable(dist)),
        rows: n,
        cols: n,
        activeCell: null,
        highlightedCells: Array.from({ length: n }, (_, i) => [
          i,
          k,
        ] as [number, number]).concat(
          Array.from({ length: n }, (_, j) => [k, j] as [number, number])
        ),
        phase: "filling",
        auxiliaryData: { nodeLabels, k, i: null, j: null },
      },
      highlights: {},
      variables: { k, phase: "filling" },
    });

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) continue;
        // Skip if there is no path through k (either leg is Infinity)
        if (dist[i][k] === INF || dist[k][j] === INF) continue;

        const via = dist[i][k] + dist[k][j];
        const current = dist[i][j];
        const improved = via < current;

        const currentLabel = current === INF ? "∞" : String(current);
        const viaLabel = String(via);

        if (improved) {
          dist[i][j] = via;
          steps.push({
            description: `k=${k}, i=${i}, j=${j}: dist[${i}][${k}] + dist[${k}][${j}] = ${dist[i][k]} + ${dist[k][j]} = ${viaLabel} < ${currentLabel}. Update dist[${i}][${j}] = ${viaLabel}.`,
            state: {
              table: toTable(cloneTable(dist)),
              rows: n,
              cols: n,
              activeCell: [i, j],
              highlightedCells: [
                [i, k],
                [k, j],
                [i, j],
              ],
              phase: "filling",
              auxiliaryData: { nodeLabels, k, i, j, via, previous: current },
            },
            highlights: {},
            variables: {
              k,
              i,
              j,
              [`dist[${i}][${k}]`]: dist[i][k],
              [`dist[${k}][${j}]`]: dist[k][j],
              [`dist[${i}][${j}]`]: via,
              improved: true,
            },
          });
        } else {
          steps.push({
            description: `k=${k}, i=${i}, j=${j}: dist[${i}][${k}] + dist[${k}][${j}] = ${dist[i][k]} + ${dist[k][j]} = ${viaLabel} ≥ ${currentLabel}. No update.`,
            state: {
              table: toTable(cloneTable(dist)),
              rows: n,
              cols: n,
              activeCell: [i, j],
              highlightedCells: [
                [i, k],
                [k, j],
                [i, j],
              ],
              phase: "filling",
              auxiliaryData: { nodeLabels, k, i, j, via, previous: current },
            },
            highlights: {},
            variables: {
              k,
              i,
              j,
              [`dist[${i}][${j}]`]: current === INF ? "∞" : current,
              improved: false,
            },
          });
        }
      }
    }
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  steps.push({
    description:
      "Floyd-Warshall complete. The table now contains the shortest path distance between every pair of vertices. A null (∞) entry means no path exists.",
    state: {
      table: toTable(cloneTable(dist)),
      rows: n,
      cols: n,
      activeCell: null,
      highlightedCells: [],
      phase: "done",
      auxiliaryData: { nodeLabels, k: null, i: null, j: null },
    },
    highlights: {},
    variables: { phase: "done" },
  });

  return steps;
}

// ─── Algorithm definition ─────────────────────────────────────────────────────

export const floydWarshall: AlgorithmDefinition<
  FloydWarshallInput,
  DPTableState
> = {
  slug: "floyd-warshall",
  name: "Floyd-Warshall",
  category: "dynamic-programming",
  difficulty: "intermediate",
  tags: ["graph", "all-pairs-shortest-path", "dynamic-programming", "directed", "weighted"],
  summary:
    "Compute shortest paths between all pairs of vertices in a weighted directed graph using dynamic programming.",

  description: `Floyd-Warshall solves the **all-pairs shortest path** problem: for every pair of vertices (i, j) it finds the minimum-cost path, considering any sequence of intermediate vertices. The algorithm builds the solution incrementally using dynamic programming.

The key insight is a 3D recurrence: \`dist[k][i][j] = min(dist[k-1][i][j], dist[k-1][i][k] + dist[k-1][k][j])\`. In words: the cheapest path from i to j that may only route through vertices {0..k} is either the cheapest path that avoids k entirely, or the concatenation of the cheapest i→k path and the cheapest k→j path. Because each row only depends on the previous one, the matrix can be updated **in-place**, reducing space from O(V³) to O(V²).

The triple nested loop gives O(V³) time — much slower than running Dijkstra from every source (O(V(V+E) log V) for sparse graphs), but Floyd-Warshall handles **negative edge weights** (though not negative cycles), requires no priority queue, and is trivial to implement. A post-pass checking whether any diagonal entry dist[i][i] < 0 detects negative cycles.`,

  realWorldUsage: [
    {
      system: "Network routing tables",
      useCase: "Pre-computing full mesh reachability and latency matrices",
      why: "Small autonomous systems with dense topologies use Floyd-Warshall to build complete distance tables offline; the resulting matrix is then used to answer any-pair shortest-path queries in O(1) at runtime.",
    },
    {
      system: "Game AI / navigation meshes",
      useCase: "Pre-baking shortest paths between all waypoints in a level",
      why: "Game maps often have a fixed set of waypoints. Running Floyd-Warshall once at load time stores the full path matrix so that any NPC can look up the next move toward any target in constant time during gameplay.",
    },
    {
      system: "Transitive closure (reachability)",
      useCase: "Determining which nodes can reach which others in a directed graph",
      why: "Setting all edge weights to 1 and treating null (∞) as unreachable gives Boolean reachability — the Warshall variant. Used in compilers (type hierarchy checks), databases (foreign-key closure), and dependency solvers.",
    },
  ],

  complexity: {
    time: { best: "O(V³)", average: "O(V³)", worst: "O(V³)" },
    space: "O(V²)",
  },

  related: ["dijkstra", "bellman-ford", "a-star"],
  implemented: true,
  defaultInput: DEFAULT_INPUT,
  generateSteps,

  code: {
    typescript: `function floydWarshall(n: number, edges: {from:number; to:number; weight:number}[]): (number|null)[][] {
  const INF = Infinity;
  const dist: number[][] = Array.from({length: n}, (_, i) =>
    Array.from({length: n}, (_, j) => (i === j ? 0 : INF))
  );

  for (const {from, to, weight} of edges) {
    dist[from][to] = weight;
  }

  for (let k = 0; k < n; k++) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (dist[i][k] === INF || dist[k][j] === INF) continue;
        const via = dist[i][k] + dist[k][j];
        if (via < dist[i][j]) dist[i][j] = via;
      }
    }
  }

  // Return null for unreachable pairs
  return dist.map(row => row.map(v => v === INF ? null : v));
}`,

    go: `package main

import "fmt"

const INF = 1<<62

func floydWarshall(n int, edges [][3]int) [][]int {
	dist := make([][]int, n)
	for i := range dist {
		dist[i] = make([]int, n)
		for j := range dist[i] {
			if i == j { dist[i][j] = 0 } else { dist[i][j] = INF }
		}
	}
	for _, e := range edges {
		dist[e[0]][e[1]] = e[2]
	}
	for k := 0; k < n; k++ {
		for i := 0; i < n; i++ {
			for j := 0; j < n; j++ {
				if dist[i][k] == INF || dist[k][j] == INF { continue }
				if v := dist[i][k] + dist[k][j]; v < dist[i][j] {
					dist[i][j] = v
				}
			}
		}
	}
	return dist
}

func main() {
	edges := [][3]int{{0,1,4},{0,2,10},{1,2,3},{1,4,2},{2,4,1},{4,3,1}}
	dist := floydWarshall(5, edges)
	fmt.Println(dist[0][3]) // shortest 0→3
}`,

    rust: `fn floyd_warshall(n: usize, edges: &[(usize, usize, i64)]) -> Vec<Vec<Option<i64>>> {
    let mut dist = vec![vec![i64::MAX; n]; n];
    for i in 0..n { dist[i][i] = 0; }
    for &(from, to, w) in edges { dist[from][to] = w; }

    for k in 0..n {
        for i in 0..n {
            for j in 0..n {
                if dist[i][k] == i64::MAX || dist[k][j] == i64::MAX { continue; }
                let via = dist[i][k] + dist[k][j];
                if via < dist[i][j] { dist[i][j] = via; }
            }
        }
    }

    dist.into_iter()
        .map(|row| row.into_iter().map(|v| if v == i64::MAX { None } else { Some(v) }).collect())
        .collect()
}`,
  },
};
