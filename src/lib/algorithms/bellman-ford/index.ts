import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ─── Domain types (mirroring DijkstraState shape) ────────────────────────────

interface WGNode { id: string; x: number; y: number; }
interface WGEdge { from: string; to: string; weight: number; }

interface BellmanFordInput {
  nodes: WGNode[];
  edges: WGEdge[];    // treated as DIRECTED (A→B only)
  start: string;
  end: string;
}

interface BellmanFordState {
  nodes: WGNode[];
  edges: WGEdge[];
  distances: Record<string, number>;              // Infinity represented as 1e9
  visitedArr: string[];                           // nodes whose distance is finalized/converged
  frontier: Array<{ id: string; dist: number }>; // current distance table as queue panel
  current: string | null;
  path: string[];                                 // reconstructed shortest path
  parent: Record<string, string | null>;
}

// ─── Default demo graph ──────────────────────────────────────────────────────

const DEFAULT_NODES: WGNode[] = [
  { id: "A", x: 60,  y: 150 },
  { id: "B", x: 200, y: 70  },
  { id: "C", x: 200, y: 230 },
  { id: "D", x: 370, y: 70  },
  { id: "E", x: 370, y: 230 },
  { id: "F", x: 520, y: 150 },
  { id: "G", x: 650, y: 150 },
];

const DEFAULT_EDGES: WGEdge[] = [
  { from: "A", to: "B", weight: 4 },
  { from: "A", to: "C", weight: 2 },
  { from: "B", to: "C", weight: 1 },
  { from: "B", to: "D", weight: 5 },
  { from: "C", to: "E", weight: 10 },
  { from: "D", to: "E", weight: 2 },
  { from: "D", to: "F", weight: 2 },
  { from: "E", to: "F", weight: 3 },
  { from: "F", to: "G", weight: 1 },
];

const DEFAULT_INPUT: BellmanFordInput = {
  start: "A",
  end: "G",
  nodes: DEFAULT_NODES,
  edges: DEFAULT_EDGES,
};

// ─── Step generator ──────────────────────────────────────────────────────────

function generateSteps(input: BellmanFordInput): AlgorithmStep<BellmanFordState>[] {
  const { nodes, edges, start, end } = input;
  const steps: AlgorithmStep<BellmanFordState>[] = [];

  const n = nodes.length;
  const m = edges.length;

  // State
  const dist: Record<string, number> = {};
  const parent: Record<string, string | null> = {};

  for (const node of nodes) {
    dist[node.id] = 1e9;
    parent[node.id] = null;
  }
  dist[start] = 0;

  // Track which nodes converged (didn't change) in last pass
  const converged = new Set<string>();
  const visitedArr: string[] = [];

  const frontier = () => nodes.map(node => ({ id: node.id, dist: dist[node.id] }));

  const snapshot = (
    current: string | null,
    description: string,
    path: string[] = [],
    variables?: Record<string, string | number | boolean>
  ): AlgorithmStep<BellmanFordState> => ({
    description,
    state: {
      nodes,
      edges,
      distances: { ...dist },
      visitedArr: [...visitedArr],
      frontier: frontier(),
      current,
      path: [...path],
      parent: { ...parent },
    },
    highlights: {},
    variables,
  });

  // ── Step 1: Init ──────────────────────────────────────────────────────────
  steps.push(
    snapshot(
      null,
      `Initialize distances. dist[${start}]=0, all others=∞.`,
      [],
      { "dist[start]": 0, passes: n - 1, edges: m }
    )
  );

  // ── Main loop: n-1 passes ─────────────────────────────────────────────────
  for (let pass = 1; pass <= n - 1; pass++) {
    const prevDist = { ...dist };

    steps.push(
      snapshot(
        null,
        `Pass ${pass}/${n - 1}: Relaxing all ${m} edges.`,
        [],
        { pass, totalPasses: n - 1, edges: m }
      )
    );

    for (const edge of edges) {
      const u = edge.from;
      const v = edge.to;
      const w = edge.weight;

      const uDist = dist[u];
      const vDist = dist[v];
      const vDistDisplay = vDist === 1e9 ? "∞" : vDist;
      const uDistDisplay = uDist === 1e9 ? "∞" : uDist;

      if (uDist !== 1e9 && uDist + w < vDist) {
        const newDist = uDist + w;
        const oldDist = vDist === 1e9 ? "∞" : vDist;
        dist[v] = newDist;
        parent[v] = u;

        steps.push(
          snapshot(
            u,
            `Relax edge ${u}→${v} (w=${w}): dist[${u}]=${uDistDisplay} + ${w} = ${newDist} < ${oldDist}. Update dist[${v}].`,
            [],
            { [`dist[${v}]`]: newDist, improved: true }
          )
        );
      } else if (pass === 1) {
        const sum = uDist === 1e9 ? "∞" : uDist + w;
        steps.push(
          snapshot(
            u,
            `Edge ${u}→${v}: dist[${u}]=${uDistDisplay} + ${w} = ${sum} ≥ ${vDistDisplay}. No improvement.`,
            [],
            { [`dist[${v}]`]: vDist === 1e9 ? "∞" : vDist, improved: false }
          )
        );
      }
    }

    // After pass: find nodes whose distance didn't change — mark as converged
    for (const node of nodes) {
      if (!converged.has(node.id) && dist[node.id] === prevDist[node.id]) {
        converged.add(node.id);
        if (!visitedArr.includes(node.id)) {
          visitedArr.push(node.id);
        }
      }
    }

    const changedNodes = nodes.filter(node => dist[node.id] !== prevDist[node.id]);
    steps.push(
      snapshot(
        null,
        `Pass ${pass} complete. ${changedNodes.length === 0 ? "No distances changed — early convergence possible." : `Updated: ${changedNodes.map(n => `dist[${n.id}]=${dist[n.id]}`).join(", ")}.`}`,
        [],
        { pass, converged: converged.size, remaining: n - converged.size }
      )
    );
  }

  // ── Ensure all nodes are in visitedArr at end ─────────────────────────────
  for (const node of nodes) {
    if (!visitedArr.includes(node.id)) {
      visitedArr.push(node.id);
    }
  }

  // ── Reconstruct path ──────────────────────────────────────────────────────
  const path: string[] = [];
  let cur: string | null = end;
  while (cur !== null && path.length <= n) {
    path.unshift(cur);
    cur = parent[cur];
  }

  const finalDist = dist[end] === 1e9 ? "∞" : dist[end];
  const pathStr = dist[end] === 1e9 ? "none" : path.join(" → ");

  steps.push(
    snapshot(
      null,
      `Bellman-Ford complete. Shortest path: ${pathStr}. Distance: ${finalDist}.`,
      dist[end] === 1e9 ? [] : path,
      { "total distance": finalDist, "path length": path.length - 1 }
    )
  );

  return steps;
}

// ─── Algorithm definition ────────────────────────────────────────────────────

export const bellmanFord: AlgorithmDefinition<BellmanFordInput, BellmanFordState> = {
  slug: "bellman-ford",
  name: "Bellman-Ford Algorithm",
  category: "graph",
  difficulty: "intermediate",
  tags: ["graph", "shortest-path", "negative-weights", "dynamic-programming"],
  summary: "Find the shortest path from a source node by relaxing all edges repeatedly, supporting negative edge weights.",

  description: `The Bellman-Ford algorithm finds the shortest path from a single source to all other nodes in a weighted, directed graph, and crucially handles **negative edge weights** that would break Dijkstra's greedy approach. It works by performing **V−1 passes over all edges**, relaxing each one — if the path through edge u→v is cheaper than the current known distance to v, that distance is updated. After V−1 passes, the shortest distances are guaranteed to be correct for any graph without negative cycles.

Unlike Dijkstra's algorithm, which processes nodes in order of distance using a priority queue, Bellman-Ford processes every edge on every pass regardless of order. This brute-force style makes it slower — O(VE) versus Dijkstra's O((V+E) log V) — but it's the correct choice whenever negative weights are present. It also has the ability to **detect negative-weight cycles**: if any distance still improves on an extra (V-th) pass, a negative cycle exists.

The algorithm is a classic example of **dynamic programming on graphs**: the invariant after pass k is that dist[v] holds the shortest path to v using at most k edges. Each pass extends this guarantee by one hop, and since any simple path has at most V−1 edges, V−1 passes suffice for correctness.`,

  realWorldUsage: [
    {
      system: "RIP (Routing Information Protocol)",
      useCase: "Distance-vector routing in network routers handles negative metrics",
      why: "RIP uses a Bellman-Ford variant distributed across routers where each node exchanges distance vectors with neighbors. Unlike link-state protocols (which run Dijkstra centrally), each router independently relaxes routes hop-by-hop, making Bellman-Ford a natural fit for the decentralized update model.",
    },
    {
      system: "Currency arbitrage detection",
      useCase: "Detecting negative cycles in currency exchange rate graphs",
      why: "By taking the negative logarithm of exchange rates as edge weights, a negative cycle in the graph represents an arbitrage opportunity — a sequence of trades that yields profit. Bellman-Ford's ability to detect negative cycles makes it the standard algorithm for this problem in quantitative finance.",
    },
    {
      system: "Traffic engineering with penalties",
      useCase: "Road networks with toll credits (negative weights)",
      why: "Some routing systems model road segments with variable costs that include credits, subsidies, or incentives — effectively creating negative-weight edges. Bellman-Ford correctly handles such models, finding the truly cheapest route even when some segments have negative net cost.",
    },
  ],

  complexity: {
    time: { best: "O(VE)", average: "O(VE)", worst: "O(VE)" },
    space: "O(V)",
  },

  related: ["dijkstra", "floyd-warshall"],
  implemented: true,
  defaultInput: DEFAULT_INPUT,
  generateSteps,

  code: {
    typescript: `function bellmanFord(
  nodes: string[],
  edges: { from: string; to: string; weight: number }[],
  start: string,
  end: string
): { dist: number; path: string[] } | null {
  const INF = Infinity;
  const dist: Record<string, number>          = Object.fromEntries(nodes.map(n => [n, INF]));
  const parent: Record<string, string | null> = Object.fromEntries(nodes.map(n => [n, null]));
  dist[start] = 0;

  const n = nodes.length;

  // V-1 relaxation passes
  for (let pass = 0; pass < n - 1; pass++) {
    let updated = false;
    for (const { from: u, to: v, weight: w } of edges) {
      if (dist[u] !== INF && dist[u] + w < dist[v]) {
        dist[v]   = dist[u] + w;
        parent[v] = u;
        updated   = true;
      }
    }
    if (!updated) break; // early exit if no changes
  }

  // Check for negative cycles (optional V-th pass)
  for (const { from: u, to: v, weight: w } of edges) {
    if (dist[u] !== INF && dist[u] + w < dist[v]) {
      throw new Error("Graph contains a negative-weight cycle");
    }
  }

  if (dist[end] === INF) return null;

  // Reconstruct path
  const path: string[] = [];
  for (let cur: string | null = end; cur !== null; cur = parent[cur]) {
    path.unshift(cur);
  }
  return { dist: dist[end], path };
}`,

    go: `package main

import (
	"errors"
	"fmt"
	"math"
)

type Edge struct{ from, to, weight int }

func bellmanFord(n int, edges []Edge, src, dst int) (int, []int, error) {
	const INF = math.MaxInt64 / 2
	dist   := make([]int, n)
	parent := make([]int, n)
	for i := range dist { dist[i] = INF; parent[i] = -1 }
	dist[src] = 0

	for pass := 0; pass < n-1; pass++ {
		updated := false
		for _, e := range edges {
			if dist[e.from] != INF && dist[e.from]+e.weight < dist[e.to] {
				dist[e.to]   = dist[e.from] + e.weight
				parent[e.to] = e.from
				updated      = true
			}
		}
		if !updated { break } // early convergence
	}

	// Detect negative cycle
	for _, e := range edges {
		if dist[e.from] != INF && dist[e.from]+e.weight < dist[e.to] {
			return 0, nil, errors.New("negative-weight cycle detected")
		}
	}

	if dist[dst] == INF { return -1, nil, nil }

	path := []int{}
	for cur := dst; cur != -1; cur = parent[cur] {
		path = append([]int{cur}, path...)
	}
	return dist[dst], path, nil
}

func main() {
	// 7-node demo (0=A … 6=G)
	edges := []Edge{
		{0, 1, 4}, {0, 2, 2}, {1, 2, 1}, {1, 3, 5},
		{2, 4, 10}, {3, 4, 2}, {3, 5, 2}, {4, 5, 3}, {5, 6, 1},
	}
	d, path, err := bellmanFord(7, edges, 0, 6)
	if err != nil { fmt.Println("error:", err); return }
	fmt.Println("dist:", d, "path:", path)
}`,

    rust: `fn bellman_ford(
    n: usize,
    edges: &[(usize, usize, i64)], // (from, to, weight)
    src: usize,
    dst: usize,
) -> Result<Option<(i64, Vec<usize>)>, &'static str> {
    const INF: i64 = i64::MAX / 2;
    let mut dist   = vec![INF; n];
    let mut parent = vec![usize::MAX; n];
    dist[src] = 0;

    for _ in 0..n - 1 {
        let mut updated = false;
        for &(u, v, w) in edges {
            if dist[u] != INF && dist[u] + w < dist[v] {
                dist[v]   = dist[u] + w;
                parent[v] = u;
                updated   = true;
            }
        }
        if !updated { break; } // early convergence
    }

    // Detect negative cycle
    for &(u, v, w) in edges {
        if dist[u] != INF && dist[u] + w < dist[v] {
            return Err("negative-weight cycle detected");
        }
    }

    if dist[dst] == INF {
        return Ok(None);
    }

    // Reconstruct path
    let mut path = vec![];
    let mut cur = dst;
    while cur != usize::MAX {
        path.push(cur);
        cur = parent[cur];
    }
    path.reverse();

    Ok(Some((dist[dst], path)))
}

fn main() {
    // 7-node demo (0=A … 6=G)
    let edges = vec![
        (0, 1, 4), (0, 2, 2), (1, 2, 1), (1, 3, 5),
        (2, 4, 10), (3, 4, 2), (3, 5, 2), (4, 5, 3), (5, 6, 1),
    ];
    match bellman_ford(7, &edges, 0, 6) {
        Ok(Some((d, path))) => println!("dist={d}  path={path:?}"),
        Ok(None)            => println!("no path"),
        Err(e)              => println!("error: {e}"),
    }
}`,
  },
};
