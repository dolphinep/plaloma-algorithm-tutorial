import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ─── Domain types (mirroring DijkstraState shape) ────────────────────────────

interface WGNode { id: string; x: number; y: number; }
interface WGEdge { from: string; to: string; weight: number; }

interface PrimInput {
  nodes: WGNode[];
  edges: WGEdge[];    // treated as UNDIRECTED (both directions added internally)
  start: string;
  end: string;        // unused by Prim, required for shared input shape
}

interface PrimState {
  nodes: WGNode[];
  edges: WGEdge[];
  distances: Record<string, number>;              // key[] values — cheapest edge into each node
  visitedArr: string[];                           // nodes already added to MST
  frontier: Array<{ id: string; dist: number }>; // nodes not yet in MST with current key
  current: string | null;
  path: string[];                                 // MST edges as "parent-child" strings
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

const DEFAULT_INPUT: PrimInput = {
  start: "A",
  end: "G",
  nodes: DEFAULT_NODES,
  edges: DEFAULT_EDGES,
};

// ─── Step generator ──────────────────────────────────────────────────────────

function generateSteps(input: PrimInput): AlgorithmStep<PrimState>[] {
  const { nodes, edges, start } = input;
  const steps: AlgorithmStep<PrimState>[] = [];

  const n = nodes.length;

  // Build undirected adjacency list
  const adj = new Map<string, Array<{ to: string; weight: number }>>();
  for (const node of nodes) adj.set(node.id, []);
  for (const e of edges) {
    adj.get(e.from)!.push({ to: e.to,   weight: e.weight });
    adj.get(e.to)!.push(  { to: e.from, weight: e.weight });
  }

  // State
  const key: Record<string, number>            = {};
  const parent: Record<string, string | null>  = {};
  const inMST = new Set<string>();
  const mstEdges: string[] = [];
  const visitedArr: string[] = [];

  for (const node of nodes) {
    key[node.id]    = 1e9;
    parent[node.id] = null;
  }
  key[start] = 0;

  const frontier = () =>
    nodes
      .filter(node => !inMST.has(node.id))
      .map(node => ({ id: node.id, dist: key[node.id] }));

  const snapshot = (
    current: string | null,
    description: string,
    path: string[] = [],
    variables?: Record<string, string | number | boolean>
  ): AlgorithmStep<PrimState> => ({
    description,
    state: {
      nodes,
      edges,
      distances: { ...key },
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
      `Initialize. Key[${start}]=0, all others=∞. Pick minimum key node.`,
      [],
      { "key[start]": 0, "nodes remaining": n }
    )
  );

  // ── Main loop: n iterations ───────────────────────────────────────────────
  for (let iter = 0; iter < n; iter++) {
    // Pick node not in MST with minimum key
    let u: string | null = null;
    let minKey = Infinity;
    for (const node of nodes) {
      if (!inMST.has(node.id) && key[node.id] < minKey) {
        minKey = key[node.id];
        u = node.id;
      }
    }

    if (u === null) break; // disconnected graph — no reachable node left

    // Add u to MST
    inMST.add(u);
    visitedArr.push(u);

    const keyDisplay = key[u] === 1e9 ? "∞" : key[u];
    steps.push(
      snapshot(
        u,
        `Add node ${u} (key=${keyDisplay}) to MST.`,
        [...mstEdges],
        { added: u, "MST size": inMST.size, "nodes remaining": n - inMST.size }
      )
    );

    // Record MST edge (all except the start node which has no parent)
    if (parent[u] !== null) {
      const mstEdge = `${parent[u]}-${u}`;
      mstEdges.push(mstEdge);
      steps.push(
        snapshot(
          u,
          `MST edge: ${parent[u]}—${u} (weight=${key[u]}).`,
          [...mstEdges],
          { "MST edge": mstEdge, weight: key[u] }
        )
      );
    }

    // Update keys of neighbors
    for (const { to: v, weight: w } of adj.get(u) ?? []) {
      if (!inMST.has(v) && w < key[v]) {
        const oldKey = key[v] === 1e9 ? "∞" : key[v];
        key[v]    = w;
        parent[v] = u;
        steps.push(
          snapshot(
            u,
            `Update key[${v}]: ${oldKey} → ${w} via ${u}.`,
            [...mstEdges],
            { [`key[${v}]`]: w, "via": u }
          )
        );
      }
    }
  }

  // ── Final step ────────────────────────────────────────────────────────────
  const totalWeight = mstEdges.reduce((sum, edgeStr) => {
    const [p, c] = edgeStr.split("-");
    // key[c] holds the weight of the edge used to connect c
    return sum + (key[c] ?? 0);
  }, 0);

  steps.push(
    snapshot(
      null,
      `MST complete. Total weight: ${totalWeight}. Edges: ${mstEdges.join(", ")}.`,
      [...mstEdges],
      { "total weight": totalWeight, "MST edges": mstEdges.length }
    )
  );

  return steps;
}

// ─── Algorithm definition ────────────────────────────────────────────────────

export const primMST: AlgorithmDefinition<PrimInput, PrimState> = {
  slug: "prim-mst",
  name: "Prim's MST Algorithm",
  category: "graph",
  difficulty: "intermediate",
  tags: ["graph", "minimum-spanning-tree", "greedy", "priority-queue"],
  summary: "Grow a Minimum Spanning Tree from a start node by repeatedly adding the cheapest edge that connects the tree to a new vertex.",

  description: `Prim's algorithm constructs a **Minimum Spanning Tree (MST)** — a subset of edges that connects all vertices with the minimum total weight and no cycles. It works greedily: starting from any node, it repeatedly picks the cheapest edge that crosses the cut between nodes already in the MST and those not yet included. This greedy choice is provably optimal by the **cut property** of matroids: the minimum-weight crossing edge of any cut is always safe to add to an MST.

The algorithm maintains a **key array** where key[v] is the minimum edge weight needed to connect v to the current MST. When a node u is added to the MST, all its neighbors v are checked — if the edge u–v is cheaper than the current key[v], the key is updated. This is structurally similar to Dijkstra's algorithm, but the priority is the edge weight directly rather than the cumulative path distance from the source.

Prim's algorithm is particularly efficient on **dense graphs** — with a Fibonacci heap it achieves O(E + V log V), which is faster than Kruskal's O(E log E) when E >> V. However, for sparse graphs both are comparable. The MST produced by Prim is unique when all edge weights are distinct, and represents the globally cheapest way to connect all nodes in the network.`,

  realWorldUsage: [
    {
      system: "Network infrastructure planning",
      useCase: "Laying minimum-cost fiber cable to connect all buildings",
      why: "A campus or city network must physically connect every building (node) with fiber (edges). The MST gives the cheapest wiring plan — no unnecessary loops, every building reachable. Prim's algorithm is run on the graph of possible cable routes weighted by installation cost.",
    },
    {
      system: "Cluster computing — job scheduling",
      useCase: "Connecting compute nodes with minimum inter-node bandwidth cost",
      why: "High-performance clusters model inter-node communication cost as a weighted graph. An MST identifies the spanning topology with minimum total bandwidth overhead, used when configuring collective communication trees (e.g. MPI_Bcast) to reduce latency and network congestion.",
    },
    {
      system: "VLSI circuit design",
      useCase: "Minimizing wire length when routing connections between chip components",
      why: "Routing wires between components on a chip is modeled as a Steiner tree or MST problem on the layout grid. Prim's algorithm (or variants) finds connections with minimum total wire length, directly reducing signal propagation delay and power consumption — critical in modern processor design.",
    },
  ],

  complexity: {
    time: { best: "O((V+E) log V)", average: "O((V+E) log V)", worst: "O((V+E) log V)" },
    space: "O(V)",
  },

  related: ["kruskal", "dijkstra"],
  implemented: true,
  defaultInput: DEFAULT_INPUT,
  generateSteps,

  code: {
    typescript: `function primMST(
  nodes: string[],
  edges: { from: string; to: string; weight: number }[]
): { totalWeight: number; mstEdges: [string, string, number][] } {
  const INF = Infinity;
  const key: Record<string, number>          = Object.fromEntries(nodes.map(n => [n, INF]));
  const parent: Record<string, string | null> = Object.fromEntries(nodes.map(n => [n, null]));
  const inMST = new Set<string>();

  // Undirected adjacency list
  const adj = new Map<string, Array<{ to: string; w: number }>>();
  for (const n of nodes) adj.set(n, []);
  for (const { from, to, weight } of edges) {
    adj.get(from)!.push({ to, w: weight });
    adj.get(to)!.push({ to: from, w: weight });
  }

  key[nodes[0]] = 0;

  const mstEdges: [string, string, number][] = [];

  for (let i = 0; i < nodes.length; i++) {
    // Pick min-key node not in MST (O(V) scan; use a heap for O(log V))
    let u: string | null = null;
    let minKey = INF;
    for (const n of nodes) {
      if (!inMST.has(n) && key[n] < minKey) { minKey = key[n]; u = n; }
    }
    if (u === null) break;

    inMST.add(u);
    if (parent[u] !== null) {
      mstEdges.push([parent[u]!, u, key[u]]);
    }

    for (const { to: v, w } of adj.get(u)!) {
      if (!inMST.has(v) && w < key[v]) {
        key[v]    = w;
        parent[v] = u;
      }
    }
  }

  const totalWeight = mstEdges.reduce((s, [,, w]) => s + w, 0);
  return { totalWeight, mstEdges };
}`,

    go: `package main

import (
	"fmt"
	"math"
)

type Edge struct{ to, weight int }

func primMST(n int, graph [][]Edge) (int, [][3]int) {
	const INF = math.MaxInt64
	key    := make([]int, n)
	parent := make([]int, n)
	inMST  := make([]bool, n)

	for i := range key { key[i] = INF; parent[i] = -1 }
	key[0] = 0

	var mstEdges [][3]int
	totalWeight := 0

	for i := 0; i < n; i++ {
		// Pick min-key vertex not in MST
		u, minKey := -1, INF
		for v := 0; v < n; v++ {
			if !inMST[v] && key[v] < minKey {
				minKey = key[v]
				u = v
			}
		}
		if u == -1 { break }

		inMST[u] = true
		if parent[u] != -1 {
			mstEdges    = append(mstEdges, [3]int{parent[u], u, key[u]})
			totalWeight += key[u]
		}

		for _, e := range graph[u] {
			if !inMST[e.to] && e.weight < key[e.to] {
				key[e.to]    = e.weight
				parent[e.to] = u
			}
		}
	}

	return totalWeight, mstEdges
}

func main() {
	// 7-node demo (0=A … 6=G), undirected
	graph := make([][]Edge, 7)
	add := func(u, v, w int) {
		graph[u] = append(graph[u], Edge{v, w})
		graph[v] = append(graph[v], Edge{u, w})
	}
	add(0,1,4); add(0,2,2); add(1,2,1); add(1,3,5)
	add(2,4,10); add(3,4,2); add(3,5,2); add(4,5,3); add(5,6,1)

	total, edges := primMST(7, graph)
	fmt.Println("total weight:", total)
	for _, e := range edges {
		fmt.Printf("  %d — %d  (w=%d)\\n", e[0], e[1], e[2])
	}
}`,

    rust: `fn prim_mst(n: usize, graph: &Vec<Vec<(usize, u64)>>) -> (u64, Vec<(usize, usize, u64)>) {
    const INF: u64 = u64::MAX;
    let mut key    = vec![INF; n];
    let mut parent = vec![usize::MAX; n];
    let mut in_mst = vec![false; n];
    key[0] = 0;

    let mut mst_edges: Vec<(usize, usize, u64)> = vec![];
    let mut total_weight = 0u64;

    for _ in 0..n {
        // Pick min-key vertex not yet in MST
        let u = (0..n)
            .filter(|&v| !in_mst[v])
            .min_by_key(|&v| key[v]);
        let Some(u) = u else { break };

        in_mst[u] = true;
        if parent[u] != usize::MAX {
            mst_edges.push((parent[u], u, key[u]));
            total_weight += key[u];
        }

        for &(v, w) in &graph[u] {
            if !in_mst[v] && w < key[v] {
                key[v]    = w;
                parent[v] = u;
            }
        }
    }

    (total_weight, mst_edges)
}

fn main() {
    // 7-node demo (0=A … 6=G), undirected
    let mut graph = vec![vec![]; 7];
    let mut add = |u: usize, v: usize, w: u64| {
        graph[u].push((v, w));
        graph[v].push((u, w));
    };
    add(0,1,4); add(0,2,2); add(1,2,1); add(1,3,5);
    add(2,4,10); add(3,4,2); add(3,5,2); add(4,5,3); add(5,6,1);

    let (total, edges) = prim_mst(7, &graph);
    println!("total weight: {total}");
    for (u, v, w) in edges {
        println!("  {u} — {v}  (w={w})");
    }
}`,
  },
};
