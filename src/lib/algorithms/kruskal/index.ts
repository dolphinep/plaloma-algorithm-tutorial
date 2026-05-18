import type { AlgorithmDefinition, AlgorithmStep } from "@/types/algorithm";

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface WGNode {
  id: number;
  label: string;
  x: number;
  y: number;
}

export interface WGEdge {
  from: number;
  to: number;
  weight: number;
  state: "default" | "active" | "mst" | "rejected";
}

export interface WeightedGraphState {
  nodes: WGNode[];
  edges: WGEdge[];
  distances: (number | null)[];
  visited: boolean[];
  current: number | null;
  previous: (number | null)[];
  phase: "init" | "processing" | "done";
  mstWeight?: number;
}

export interface KruskalInput {
  nodes: WGNode[];
  edges: Array<{ from: number; to: number; weight: number }>;
}

// ─── Default demo graph (6 nodes, 9 edges, undirected) ───────────────────────
//
//       0(A)
//      /    \
//    4        2
//    /          \
//  1(B)----3----2(C)
//    \          /
//     6        5
//      \      /
//       3(D)-1-4(E)
//              \
//               8
//                \
//               5(F)

const DEFAULT_INPUT: KruskalInput = {
  nodes: [
    { id: 0, label: "A", x: 300, y: 60  },
    { id: 1, label: "B", x: 100, y: 200 },
    { id: 2, label: "C", x: 500, y: 200 },
    { id: 3, label: "D", x: 150, y: 360 },
    { id: 4, label: "E", x: 420, y: 360 },
    { id: 5, label: "F", x: 540, y: 460 },
  ],
  edges: [
    { from: 0, to: 1, weight: 4 },
    { from: 0, to: 2, weight: 2 },
    { from: 1, to: 2, weight: 3 },
    { from: 1, to: 3, weight: 6 },
    { from: 2, to: 4, weight: 5 },
    { from: 3, to: 4, weight: 1 },
    { from: 3, to: 5, weight: 7 },
    { from: 4, to: 5, weight: 8 },
    { from: 2, to: 3, weight: 9 },
  ],
};

// ─── Union-Find ───────────────────────────────────────────────────────────────

function makeUF(n: number): { parent: number[]; rank: number[] } {
  return {
    parent: Array.from({ length: n }, (_, i) => i),
    rank: new Array(n).fill(0),
  };
}

function find(uf: { parent: number[] }, x: number): number {
  while (uf.parent[x] !== x) {
    uf.parent[x] = uf.parent[uf.parent[x]]; // path compression
    x = uf.parent[x];
  }
  return x;
}

function union(
  uf: { parent: number[]; rank: number[] },
  a: number,
  b: number
): boolean {
  const ra = find(uf, a);
  const rb = find(uf, b);
  if (ra === rb) return false; // already connected

  // Union by rank
  if (uf.rank[ra] < uf.rank[rb]) {
    uf.parent[ra] = rb;
  } else if (uf.rank[ra] > uf.rank[rb]) {
    uf.parent[rb] = ra;
  } else {
    uf.parent[rb] = ra;
    uf.rank[ra]++;
  }
  return true;
}

// ─── Step generator ───────────────────────────────────────────────────────────

function generateSteps(input: KruskalInput): AlgorithmStep<WeightedGraphState>[] {
  const { nodes } = input;
  const n = nodes.length;
  const steps: AlgorithmStep<WeightedGraphState>[] = [];

  // Working copy of edges with state tracking
  const edges: WGEdge[] = input.edges.map((e) => ({ ...e, state: "default" as const }));

  // Sort edges by weight ascending
  const sortedIndices = edges
    .map((_, idx) => idx)
    .sort((a, b) => edges[a].weight - edges[b].weight);

  const uf = makeUF(n);

  // distances[i] = smallest MST-edge weight incident to node i (informational)
  const distances: (number | null)[] = new Array(n).fill(null);
  const visited: boolean[] = new Array(n).fill(false);
  const previous: (number | null)[] = new Array(n).fill(null);

  let mstWeight = 0;
  let mstEdgeCount = 0;

  const snapshot = (
    current: number | null,
    description: string,
    phase: "init" | "processing" | "done",
    variables?: Record<string, string | number | boolean>
  ): AlgorithmStep<WeightedGraphState> => ({
    description,
    state: {
      nodes,
      edges: edges.map((e) => ({ ...e })),
      distances: [...distances],
      visited: [...visited],
      current,
      previous: [...previous],
      phase,
      mstWeight,
    },
    highlights: {},
    variables,
  });

  // ── Step 0: Sort ───────────────────────────────────────────────────────────
  const sortedWeights = sortedIndices.map((i) => edges[i].weight).join(", ");
  steps.push(
    snapshot(
      null,
      `Sort all ${edges.length} edges by weight ascending: [${sortedWeights}]. Initialize Union-Find with ${n} disjoint components.`,
      "init",
      { "edge count": edges.length, "node count": n, "MST weight": 0, "MST edges": 0 }
    )
  );

  // ── Process each edge in sorted order ─────────────────────────────────────
  for (const idx of sortedIndices) {
    const edge = edges[idx];
    const { from, to, weight } = edge;

    // Mark edge as active (being considered)
    edges[idx].state = "active";

    const rootFrom = find(uf, from);
    const rootTo = find(uf, to);
    const sameComponent = rootFrom === rootTo;

    if (!sameComponent) {
      // Accept: add to MST
      steps.push(
        snapshot(
          from,
          `Consider edge ${nodes[from].label}–${nodes[to].label} (weight ${weight}). Components differ (root ${rootFrom} ≠ root ${rootTo}). Add to MST.`,
          "processing",
          {
            from: nodes[from].label,
            to: nodes[to].label,
            weight,
            action: "added",
            "MST weight": mstWeight + weight,
            "MST edges": mstEdgeCount + 1,
          }
        )
      );

      union(uf, from, to);
      edges[idx].state = "mst";
      mstWeight += weight;
      mstEdgeCount++;

      // Update visited / previous / distances (informational display state)
      visited[from] = true;
      visited[to] = true;
      if (distances[from] === null || weight < (distances[from] ?? Infinity)) {
        distances[from] = weight;
      }
      if (distances[to] === null || weight < (distances[to] ?? Infinity)) {
        distances[to] = weight;
      }
      previous[to] = from;
    } else {
      // Reject: would form a cycle
      steps.push(
        snapshot(
          from,
          `Consider edge ${nodes[from].label}–${nodes[to].label} (weight ${weight}). Both endpoints in the same component (root ${rootFrom}). Reject — adding this edge would create a cycle.`,
          "processing",
          {
            from: nodes[from].label,
            to: nodes[to].label,
            weight,
            action: "rejected",
            "MST weight": mstWeight,
            "MST edges": mstEdgeCount,
          }
        )
      );

      edges[idx].state = "rejected";
    }

    // Early exit once MST is complete (n-1 edges)
    if (mstEdgeCount === n - 1) break;
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  steps.push(
    snapshot(
      null,
      `Kruskal's algorithm complete. MST contains ${mstEdgeCount} edges with total weight ${mstWeight}. All ${n} nodes are connected.`,
      "done",
      { "MST weight": mstWeight, "MST edges": mstEdgeCount }
    )
  );

  return steps;
}

// ─── Algorithm definition ─────────────────────────────────────────────────────

export const kruskal: AlgorithmDefinition<KruskalInput, WeightedGraphState> = {
  slug: "kruskal",
  name: "Kruskal's Algorithm",
  category: "greedy",
  difficulty: "intermediate",
  tags: ["graph", "mst", "minimum-spanning-tree", "greedy", "union-find", "weighted"],
  summary:
    "Build a minimum spanning tree by greedily adding the cheapest edge that doesn't create a cycle, tracked with Union-Find.",

  description: `Kruskal's algorithm finds a **Minimum Spanning Tree (MST)** of a connected, undirected, weighted graph — the subset of edges that connects all vertices with the lowest possible total weight and no cycles.

The algorithm is purely **greedy**: sort all edges by weight, then iterate through them. For each edge (u, v), add it to the MST if u and v are not already connected; otherwise skip it. The **Union-Find** (disjoint-set) data structure makes "are u and v connected?" queries and the subsequent merge nearly O(1) (amortised O(α(n)) with path compression and union by rank).

Because edges are processed in non-decreasing weight order, the first time two components are bridged, the cheapest possible bridge is used — the classic greedy exchange argument proves this is always optimal. The algorithm stops as soon as n−1 edges have been added (a spanning tree on n nodes has exactly n−1 edges).

Compared to Prim's algorithm, Kruskal is generally preferred for **sparse graphs** where E is much smaller than V², because sorting dominates at O(E log E), whereas Prim with a binary heap runs in O((V + E) log V). For dense graphs, Prim with an adjacency matrix can be faster.`,

  realWorldUsage: [
    {
      system: "Network infrastructure design",
      useCase: "Laying the minimum length of cable to connect all offices or data centers",
      why: "Physical network design is an MST problem: each potential link has a cost (cable length, leased-line price) and the goal is full connectivity at minimum total cost. Kruskal is natural here because the edge list is sparse and can be sorted offline.",
    },
    {
      system: "Cluster analysis (single-linkage hierarchical clustering)",
      useCase: "Building dendrograms and cutting them at a threshold to form clusters",
      why: "Single-linkage clustering is equivalent to building an MST on the distance matrix and cutting edges above a threshold. Kruskal's sorted-edge pass computes this MST in O(E log E), enabling efficient hierarchical clustering of large point sets.",
    },
    {
      system: "Power grid and circuit board routing",
      useCase: "Connecting components or substations with minimum total wire length",
      why: "Both problems reduce to finding an MST on a complete graph whose edge weights are Euclidean distances. Kruskal with a pre-sorted edge list (or computed only for nearby pairs via Delaunay triangulation) is the standard baseline approach.",
    },
  ],

  complexity: {
    time: { best: "O(E log E)", average: "O(E log E)", worst: "O(E log E)" },
    space: "O(V + E)",
  },

  related: ["prim", "dijkstra", "boruvka"],
  implemented: true,
  defaultInput: DEFAULT_INPUT,
  generateSteps,

  code: {
    typescript: `// Union-Find helpers
function makeUF(n: number) {
  return { parent: Array.from({length: n}, (_, i) => i), rank: new Array(n).fill(0) };
}
function find(uf: {parent: number[]}, x: number): number {
  while (uf.parent[x] !== x) { uf.parent[x] = uf.parent[uf.parent[x]]; x = uf.parent[x]; }
  return x;
}
function union(uf: {parent: number[]; rank: number[]}, a: number, b: number): boolean {
  const ra = find(uf, a), rb = find(uf, b);
  if (ra === rb) return false;
  if (uf.rank[ra] < uf.rank[rb]) uf.parent[ra] = rb;
  else if (uf.rank[ra] > uf.rank[rb]) uf.parent[rb] = ra;
  else { uf.parent[rb] = ra; uf.rank[ra]++; }
  return true;
}

function kruskal(
  n: number,
  edges: {from: number; to: number; weight: number}[]
): {edges: typeof edges; totalWeight: number} {
  const sorted = [...edges].sort((a, b) => a.weight - b.weight);
  const uf = makeUF(n);
  const mst: typeof edges = [];
  let totalWeight = 0;

  for (const e of sorted) {
    if (union(uf, e.from, e.to)) {
      mst.push(e);
      totalWeight += e.weight;
      if (mst.length === n - 1) break;
    }
  }
  return { edges: mst, totalWeight };
}`,

    go: `package main

import "fmt"
import "sort"

type Edge struct{ u, v, w int }

type UF struct{ parent, rank []int }

func newUF(n int) *UF {
	uf := &UF{make([]int, n), make([]int, n)}
	for i := range uf.parent { uf.parent[i] = i }
	return uf
}

func (uf *UF) find(x int) int {
	for uf.parent[x] != x { uf.parent[x] = uf.parent[uf.parent[x]]; x = uf.parent[x] }
	return x
}

func (uf *UF) union(a, b int) bool {
	ra, rb := uf.find(a), uf.find(b)
	if ra == rb { return false }
	if uf.rank[ra] < uf.rank[rb] { ra, rb = rb, ra }
	uf.parent[rb] = ra
	if uf.rank[ra] == uf.rank[rb] { uf.rank[ra]++ }
	return true
}

func kruskal(n int, edges []Edge) ([]Edge, int) {
	sort.Slice(edges, func(i, j int) bool { return edges[i].w < edges[j].w })
	uf := newUF(n)
	var mst []Edge
	total := 0
	for _, e := range edges {
		if uf.union(e.u, e.v) {
			mst = append(mst, e)
			total += e.w
			if len(mst) == n-1 { break }
		}
	}
	return mst, total
}

func main() {
	edges := []Edge{{0,1,4},{0,2,2},{1,2,3},{1,3,6},{2,4,5},{3,4,1},{3,5,7},{4,5,8}}
	mst, w := kruskal(6, edges)
	fmt.Println("MST weight:", w, "edges:", mst)
}`,

    rust: `fn find(parent: &mut Vec<usize>, x: usize) -> usize {
    if parent[x] != x { parent[x] = find(parent, parent[x]); }
    parent[x]
}

fn union(parent: &mut Vec<usize>, rank: &mut Vec<usize>, a: usize, b: usize) -> bool {
    let ra = find(parent, a);
    let rb = find(parent, b);
    if ra == rb { return false; }
    match rank[ra].cmp(&rank[rb]) {
        std::cmp::Ordering::Less    => parent[ra] = rb,
        std::cmp::Ordering::Greater => parent[rb] = ra,
        std::cmp::Ordering::Equal   => { parent[rb] = ra; rank[ra] += 1; }
    }
    true
}

fn kruskal(n: usize, mut edges: Vec<(usize, usize, u64)>) -> (Vec<(usize, usize, u64)>, u64) {
    edges.sort_by_key(|&(_, _, w)| w);
    let mut parent: Vec<usize> = (0..n).collect();
    let mut rank = vec![0usize; n];
    let mut mst = vec![];
    let mut total = 0u64;

    for (u, v, w) in edges {
        if union(&mut parent, &mut rank, u, v) {
            mst.push((u, v, w));
            total += w;
            if mst.len() == n - 1 { break; }
        }
    }
    (mst, total)
}`,
  },
};
